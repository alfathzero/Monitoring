import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";

const app = express();
const PORT = 3000;
const CONFIG_FILE = path.join(process.cwd(), "config.json");

app.use(express.json());

// Load / Save Config
interface BotConfig {
  token: string;
  chatId: string;
  alertCpuThreshold: number;
  alertRamThreshold: number;
  alertDiskThreshold: number;
  alertIntervalMinutes: number;
  isActive: boolean;
}

let botConfig: BotConfig = {
  token: "",
  chatId: "",
  alertCpuThreshold: 80,
  alertRamThreshold: 90,
  alertDiskThreshold: 85,
  alertIntervalMinutes: 5,
  isActive: false,
};

// Safe config load
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    botConfig = { ...botConfig, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Error reading config.json", err);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving config.json", err);
  }
}

// In-memory remote servers telemetry cache
interface RemoteTelemetry {
  nodeId: string;
  secret: string;
  stats: {
    cpu: number;
    ram: { used: number; total: number; percent: number };
    disk: { used: number; total: number; percent: number };
    uptime: number;
    os: string;
  };
  lastSeen: number;
}

const remoteServers = new Map<string, RemoteTelemetry>();

// Helper for local CPU calculation
function cpuAverage() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return { idle: 0, total: 100 };
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    for (const type in core.times) {
      totalMs += (core.times as any)[type];
    }
    idleMs += core.times.idle;
  });
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      if (totalDifference === 0) return resolve(0);
      const percentageCPU = 100 - Math.round((100 * idleDifference) / totalDifference);
      resolve(Math.max(0, Math.min(100, percentageCPU)));
    }, 150);
  });
}

// Helper to get Disk usage
function getDiskUsage(): Promise<{ total: number; free: number; used: number; usagePercent: number }> {
  return new Promise((resolve) => {
    exec("df -k /", (err, stdout) => {
      if (err || !stdout) {
        // Fallback for non-linux or containers without df
        return resolve({ total: 50, free: 30, used: 20, usagePercent: 40 });
      }
      try {
        const lines = stdout.trim().split("\n");
        if (lines.length > 1) {
          const parts = lines[1].replace(/\s+/g, " ").split(" ");
          const totalKb = parseInt(parts[1], 10);
          const usedKb = parseInt(parts[2], 10);
          const freeKb = parseInt(parts[3], 10);
          const usagePercent = parseInt(parts[4].replace("%", ""), 10);

          const totalGb = +(totalKb / 1024 / 1024).toFixed(1);
          const usedGb = +(usedKb / 1024 / 1024).toFixed(1);
          const freeGb = +(freeKb / 1024 / 1024).toFixed(1);

          return resolve({
            total: isNaN(totalGb) ? 50 : totalGb,
            free: isNaN(freeGb) ? 30 : freeGb,
            used: isNaN(usedGb) ? 20 : usedGb,
            usagePercent: isNaN(usagePercent) ? 40 : usagePercent,
          });
        }
      } catch (e) {
        // Fallback
      }
      resolve({ total: 100, free: 60, used: 40, usagePercent: 40 });
    });
  });
}

// Telegram Bot Global Instance
let botInstance: TelegramBot | null = null;
let alertIntervalTimer: NodeJS.Timeout | null = null;
let lastAlertTimes = { cpu: 0, ram: 0, disk: 0 };
let currentBotStatus = "Offline";

function drawProgressBar(percent: number, size = 10) {
  const progress = Math.round((percent / 100) * size);
  const emptyProgress = size - progress;
  const progressText = "█".repeat(progress);
  const emptyProgressText = "░".repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${percent}%`;
}

function initializeTelegramBot() {
  // Stop existing bot
  if (botInstance) {
    try {
      botInstance.stopPolling();
    } catch (e) {
      console.error("Error stopping bot polling:", e);
    }
    botInstance = null;
  }

  if (alertIntervalTimer) {
    clearInterval(alertIntervalTimer);
    alertIntervalTimer = null;
  }

  if (!botConfig.isActive || !botConfig.token) {
    currentBotStatus = "Offline";
    return;
  }

  try {
    currentBotStatus = "Menghubungkan...";
    // Create new Bot
    botInstance = new TelegramBot(botConfig.token, { polling: true });

    botInstance.on("polling_error", (err) => {
      console.error("Telegram Bot Polling Error:", err.message);
      currentBotStatus = `Error Polling: ${err.message}`;
    });

    // Handle messages / commands
    botInstance.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `✨ *Halo! Saya Bot VPS Monitor Anda.* 🤖\n\n` +
        `Saya siap memantau performa VPS / Server Pterodactyl Anda secara realtime.\n\n` +
        `*Daftar Perintah:*\n` +
        `📊 /status - Cek status performa saat ini keseluruhan\n` +
        `🖥️ /cpu - Detail spesifikasi dan beban CPU\n` +
        `📟 /ram - Detail penggunaan RAM (Memory)\n` +
        `💾 /disk - Detail penggunaan ruang penyimpanan\n` +
        `🌍 /remote - Ringkasan server remote yang terhubung\n` +
        `⏱️ /ping - Tes latency bot\n` +
        `ℹ️ /help - Bantuan perintah`;
      
      botInstance?.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/ping/, (msg) => {
      botInstance?.sendMessage(msg.chat.id, "🏓 *Pong!* Bot aktif dan berjalan.", { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/help/, (msg) => {
      const helpText = `*Panduan Perintah VPS Monitor Bot:*\n\n` +
        `/status - Menampilkan visual bar CPU, RAM, dan Disk\n` +
        `/cpu - Info clock, core detail, dan average load\n` +
        `/ram - Info kapasitas RAM total, gratis, dan terpakai\n` +
        `/disk - Info partisi penyimpanan server\n` +
        `/remote - Daftar node Pterodactyl luar yang menyetor telemetry\n` +
        `/ping - Merespon pesan tanda bot hidup`;
      botInstance?.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const cpuVal = await getCPUUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ramPercent = Math.round((usedMem / totalMem) * 100);
      const disk = await getDiskUsage();

      const totalMemGb = +(totalMem / 1024 / 1024 / 1024).toFixed(2);
      const usedMemGb = +(usedMem / 1024 / 1024 / 1024).toFixed(2);
      const uptimeSec = os.uptime();
      
      const days = Math.floor(uptimeSec / (3600 * 24));
      const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const uptimeStr = `${days} hari, ${hours} jam, ${minutes} menit`;

      const statusMsg = `📊 *ID SERVER: LOCAL DASHBOARD*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🖥️ *CPU Usage:* \n\`${drawProgressBar(cpuVal)}\`\n\n` +
        `📟 *RAM Usage:* \n\`${drawProgressBar(ramPercent)}\` \n_${usedMemGb} GB dari ${totalMemGb} GB_\n\n` +
        `💾 *Disk Storage:* \n\`${drawProgressBar(disk.usagePercent)}\` \n_${disk.used} GB dari ${disk.total} GB_\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⏱️ *Uptime:* \`${uptimeStr}\`\n` +
        `🐧 *OS:* \`${os.platform()} (${os.release()})\`\n` +
        `⚙️ *Load Avg:* \`[${os.loadavg().map(v => v.toFixed(2)).join(", ")}]\`\n\n` +
        `_Dikirim via Dashboard Monitoring VPS_`;

      botInstance?.sendMessage(chatId, statusMsg, { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/cpu/, async (msg) => {
      const cpus = os.cpus();
      const usage = await getCPUUsage();
      const cores = cpus.length;
      const model = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
      const speed = cpus.length > 0 ? cpus[0].speed : 0;

      const response = `🖥️ *INFORMASI CPU SERVER*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Model:* ${model}\n` +
        `• *Core:* ${cores} CPU thread\n` +
        `• *Clock Speed:* ${speed} MHz\n` +
        `• *Beban Saat Ini:* \`${usage}%\`\n` +
        `• *Load Average (5/10/15m):* \n\`[${os.loadavg().map(v => v.toFixed(2)).join(", ")}]\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━`;
      botInstance?.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/ram/, (msg) => {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ramPercent = Math.round((usedMem / totalMem) * 100);

      const totalMb = Math.round(totalMem / 1024 / 1024);
      const usedMb = Math.round(usedMem / 1024 / 1024);
      const freeMb = Math.round(freeMem / 1024 / 1024);

      const response = `📟 *INFORMASI RAM (MEMORY)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Total:* \`${(totalMb / 1024).toFixed(2)} GB\` (${totalMb} MB)\n` +
        `• *Used:* \`${(usedMb / 1024).toFixed(2)} GB\` (${usedMb} MB)\n` +
        `• *Free:* \`${(freeMb / 1024).toFixed(2)} GB\` (${freeMb} MB)\n` +
        `• *Persentase:* \`${ramPercent}%\`\n` +
        `• *Visual Grafis:* \n\`${drawProgressBar(ramPercent)}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━`;
      botInstance?.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/disk/, async (msg) => {
      const disk = await getDiskUsage();
      const response = `💾 *INFORMASI PENYIMPANAN DISK*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Kapasitas:* \`${disk.total} GB\`\n` +
        `• *Terpakai:* \`${disk.used} GB\`\n` +
        `• *Sisa Ruang:* \`${disk.free} GB\`\n` +
        `• *Persentase:* \`${disk.usagePercent}%\`\n` +
        `• *Visual Grafis:* \n\`${drawProgressBar(disk.usagePercent)}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━`;
      botInstance?.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
    });

    botInstance.onText(/\/remote/, (msg) => {
      if (remoteServers.size === 0) {
        botInstance?.sendMessage(msg.chat.id, "🌍 *Node Remote:* Belum ada node Pterodactyl remote yang aktif atau menyambung saat ini.", { parse_mode: "Markdown" });
        return;
      }

      let response = `🌍 *DAFTAR REMOTE NODE TELEMETRY*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n`;
      
      const now = Date.now();
      remoteServers.forEach((node, id) => {
        const isOnline = now - node.lastSeen < 30000; // 30s timeout
        const statusIcon = isOnline ? "🟢" : "🔴";
        response += `${statusIcon} *${node.nodeId}* (${node.stats.os})\n` +
          ` ├ CPU: \`${node.stats.cpu}%\`\n` +
          ` ├ RAM: \`${node.stats.ram.percent}%\` (${(node.stats.ram.used / 1024).toFixed(1)}GB/${(node.stats.ram.total / 1024).toFixed(1)}GB)\n` +
          ` └ Seen: \`${Math.round((now - node.lastSeen)/1000)}s ago\`\n\n`;
      });
      
      botInstance?.sendMessage(msg.chat.id, response, { parse_mode: "Markdown" });
    });

    currentBotStatus = "Online";
    console.log("Telegram Bot successfully initialized!");

    // Start Realtime Alert Loop
    const intervalMs = botConfig.alertIntervalMinutes * 60 * 1000;
    alertIntervalTimer = setInterval(async () => {
      if (!botConfig.chatId || !botInstance) return;

      const cpu = await getCPUUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const ramPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
      const disk = await getDiskUsage();

      const now = Date.now();

      // Check CPU
      if (cpu >= botConfig.alertCpuThreshold) {
        if (now - lastAlertTimes.cpu > intervalMs) {
          botInstance.sendMessage(
            botConfig.chatId,
            `⚠️ *PERINGATAN: PENGGUNAAN CPU TINGGI!*\n` +
              `Status CPU mencapai \`${cpu}%\` (Batas limit: ${botConfig.alertCpuThreshold}%).\n` +
              `Silakan periksa proses server Anda segera!`,
            { parse_mode: "Markdown" }
          );
          lastAlertTimes.cpu = now;
        }
      }

      // Check RAM
      if (ramPercent >= botConfig.alertRamThreshold) {
        if (now - lastAlertTimes.ram > intervalMs) {
          botInstance.sendMessage(
            botConfig.chatId,
            `⚠️ *PERINGATAN: OVERLOAD RAM / MEMORY!*\n` +
              `Status RAM mencapai \`${ramPercent}%\` (Batas limit: ${botConfig.alertRamThreshold}%).\n` +
              `Kapasitas tersisa sangat rendah!`,
            { parse_mode: "Markdown" }
          );
          lastAlertTimes.ram = now;
        }
      }

      // Check Disk
      if (disk.usagePercent >= botConfig.alertDiskThreshold) {
        if (now - lastAlertTimes.disk > intervalMs) {
          botInstance.sendMessage(
            botConfig.chatId,
            `⚠️ *PERINGATAN: KAPASITAS DISK HAMPIR HABIS!*\n` +
              `Status Penyimpanan mencapai \`${disk.usagePercent}%\` (Batas limit: ${botConfig.alertDiskThreshold}%).\n` +
              `Sisa kapasitas: \`${disk.free} GB\`.`,
            { parse_mode: "Markdown" }
          );
          lastAlertTimes.disk = now;
        }
      }
    }, 20000); // Check every 20 seconds, but throttle telegram msgs via threshold and intervalMs

  } catch (error: any) {
    console.error("Failed to start telegram bot:", error);
    currentBotStatus = `Error Inisialisasi: ${error.message}`;
  }
}

// Initial Boot of Telegram bot
if (botConfig.isActive && botConfig.token) {
  initializeTelegramBot();
}

// API: Get current metrics of local dashboard
app.get("/api/system-stats", async (req, res) => {
  try {
    const cpu = await getCPUUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const disk = await getDiskUsage();
    
    res.json({
      success: true,
      data: {
        cpu,
        ram: {
          total: +(totalMem / 1024 / 1024 / 1024).toFixed(2),
          free: +(freeMem / 1024 / 1024 / 1024).toFixed(2),
          used: +((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2),
          percent: Math.round(((totalMem - freeMem) / totalMem) * 100),
        },
        disk,
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        cpuModel: os.cpus().length > 0 ? os.cpus()[0].model : "Intel/AMD Processor",
        loadAvg: os.loadavg(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: get bot settings
app.get("/api/telegram-config", (req, res) => {
  res.json({
    success: true,
    data: {
      ...botConfig,
      status: currentBotStatus,
    },
  });
});

// API: save bot settings
app.post("/api/telegram-config", (req, res) => {
  try {
    const { token, chatId, alertCpuThreshold, alertRamThreshold, alertDiskThreshold, alertIntervalMinutes, isActive } = req.body;
    
    botConfig.token = token || "";
    botConfig.chatId = chatId || "";
    botConfig.alertCpuThreshold = Number(alertCpuThreshold) || 80;
    botConfig.alertRamThreshold = Number(alertRamThreshold) || 90;
    botConfig.alertDiskThreshold = Number(alertDiskThreshold) || 85;
    botConfig.alertIntervalMinutes = Number(alertIntervalMinutes) || 5;
    botConfig.isActive = !!isActive;

    saveConfig();
    initializeTelegramBot();

    res.json({
      success: true,
      message: "Konfigurasi bot Telegram berhasil diperbarui!",
      data: {
        ...botConfig,
        status: currentBotStatus,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Send Test Alert
app.post("/api/send-test-alert", async (req, res) => {
  try {
    const { token, chatId } = req.body;
    const testToken = token || botConfig.token;
    const testChatId = chatId || botConfig.chatId;

    if (!testToken || !testChatId) {
      return res.status(400).json({ success: false, error: "Bot Token dan Chat ID wajib diisi." });
    }

    const testBot = new TelegramBot(testToken);
    
    const text = `🔔 *TES NOTIFIKASI VPS MONITOR* 🔔\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `Koneksi Telegram Bot Anda berhasil dikonfigurasi!\n\n` +
      `🖥️ CPU Simulator: \`Normal\`\n` +
      `📟 RAM Simulator: \`Normal\`\n` +
      `💾 Storage Simulator: \`Normal\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Pesan dikirim langsung dari Dashboard Web._`;

    await testBot.sendMessage(testChatId, text, { parse_mode: "Markdown" });
    res.json({ success: true, message: "Pesan tes berhasil dikirim ke Telegram!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Remote node telemetry reporting
app.post("/api/remote-stats", (req, res) => {
  try {
    const { nodeId, secret, stats } = req.body;
    if (!nodeId) {
      return res.status(400).json({ success: false, error: "nodeId harus dilampirkan." });
    }

    remoteServers.set(nodeId, {
      nodeId,
      secret: secret || "default-secret",
      stats: stats || { cpu: 0, ram: { used: 0, total: 1, percent: 0 }, disk: { used: 0, total: 1, percent: 0 }, uptime: 0, os: "linux" },
      lastSeen: Date.now(),
    });

    // Optionally forward alert to active bot
    if (botInstance && botConfig.chatId) {
      const safetyMinutes = botConfig.alertIntervalMinutes;
      // Filter or throttle remote server alerts if needed, here we keep it as general log
    }

    res.json({ success: true, message: "Data telemetry remote berhasil diterima!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get remote devices lists
app.get("/api/remote-devices", (req, res) => {
  const devicesList: RemoteTelemetry[] = [];
  const now = Date.now();
  
  remoteServers.forEach((device, key) => {
    devicesList.push(device);
  });

  res.json({
    success: true,
    data: devicesList,
  });
});

// Webhook / clean up stale servers every 5 minutes
setInterval(() => {
  const now = Date.now();
  remoteServers.forEach((device, key) => {
    // If not seen for 15 minutes, remove from active list
    if (now - device.lastSeen > 15 * 60 * 1000) {
      remoteServers.delete(key);
    }
  });
}, 60 * 1000);


// Integrate Vite as Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on port ${PORT}`);
  });
}

startServer();
