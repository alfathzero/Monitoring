import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import http from "http";
import https from "https";
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
  pterodactylDomain?: string;
  pterodactylApiKey?: string;
  pterodactylActive?: boolean;
}

let botConfig: BotConfig = {
  token: "",
  chatId: "",
  alertCpuThreshold: 80,
  alertRamThreshold: 90,
  alertDiskThreshold: 85,
  alertIntervalMinutes: 5,
  isActive: false,
  pterodactylDomain: "",
  pterodactylApiKey: "",
  pterodactylActive: false,
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

// System Alert & Event Logs Configuration
const LOGS_FILE = path.join(process.cwd(), "alert_logs.json");
interface AlertLog {
  id: string;
  timestamp: string;
  type: "cpu" | "ram" | "disk" | "system" | "remote";
  level: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
}

let alertLogs: AlertLog[] = [];

if (fs.existsSync(LOGS_FILE)) {
  try {
    const raw = fs.readFileSync(LOGS_FILE, "utf-8");
    alertLogs = JSON.parse(raw);
  } catch (err) {
    console.error("Error reading alert_logs.json", err);
  }
}

function writeLogs() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(alertLogs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving alert_logs.json", err);
  }
}

function logEvent(type: "cpu" | "ram" | "disk" | "system" | "remote", level: "info" | "warning" | "danger" | "success", title: string, message: string) {
  const newLog: AlertLog = {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    type,
    level,
    title,
    message,
  };
  alertLogs.unshift(newLog);
  if (alertLogs.length > 100) {
    alertLogs = alertLogs.slice(0, 100);
  }
  writeLogs();
}

// Custom Telegram Keyboard markup to enrich interactions
const defaultReplyMarkup = {
  keyboard: [
    [{ text: "📊 /status" }, { text: "⏱️ /ping" }],
    [{ text: "🖥️ /cpu" }, { text: "📟 /ram" }, { text: "💾 /disk" }],
    [{ text: "🌍 /remote" }, { text: "ℹ️ /help" }]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

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

    logEvent("system", "success", "Bot Aktif", "Polling telegram bot berhasil dinyalakan di server sandbox.");

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
      
      botInstance?.sendMessage(chatId, welcomeMessage, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup 
      });
    });

    botInstance.onText(/\/ping/, async (msg) => {
      const chatId = msg.chat.id;
      const startTime = Date.now();
      const msgTimeMs = msg.date * 1000;
      const serverLatency = startTime - msgTimeMs;

      // Mengambil rincian spesifikasi VPS
      const cpus = os.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown Processor";
      const cpuCores = cpus.length;
      const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0;
      
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ramPercent = Math.round((usedMem / totalMem) * 100);
      const totalRamGb = (totalMem / 1024 / 1024 / 1024).toFixed(2);
      const usedRamGb = (usedMem / 1024 / 1024 / 1024).toFixed(2);
      const freeRamGb = (freeMem / 1024 / 1024 / 1024).toFixed(2);

      const disk = await getDiskUsage();
      const uptimeSec = os.uptime();
      const days = Math.floor(uptimeSec / (3600 * 24));
      const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const uptimeStr = `${days} hari, ${hours} jam, ${minutes} menit`;

      // mengukur real-time CPU usage
      const cpuVal = await getCPUUsage();

      const response = `🏓 *PONG! BOT AKTIF & RESPONSIF*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⏱️ *Latency:* \`${serverLatency} ms\`\n` +
        `🚀 *Status Server:* \`ONLINE\`\n\n` +
        `💻 *INFORMASI SPESIFIKASI VPS (LENGKAP)*\n` +
        `• *Platform OS:* \`${os.platform()} (${os.arch()})\`\n` +
        `• *OS Kernel / Release:* \`${os.release()}\`\n` +
        `• *Model CPU:* \`${cpuModel}\`\n` +
        `• *CPU Thread / Core:* \`${cpuCores} Threads @ ${cpuSpeed} MHz\`\n` +
        `• *Beban CPU Saat Ini:* \`${cpuVal}%\`\n` +
        `• *Load Average (5s/10s/15s):* \`[${os.loadavg().map(v => v.toFixed(2)).join(", ")}]\`\n` +
        `• *Kapasitas RAM:* \`${totalRamGb} GB\` (Free: ${freeRamGb} GB)\n` +
        `• *RAM Terpakai:* \`${usedRamGb} GB\` (${ramPercent}% Used)\n` +
        `• *Disk Storage:* \`${disk.total} GB\` (Free: ${disk.free} GB, ${disk.usagePercent}% Used)\n` +
        `• *Uptime Server:* \`${uptimeStr}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Pengukuran dikirim langsung dari layanan pemantauan VPS._`;

      botInstance?.sendMessage(chatId, response, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
    });

    botInstance.onText(/\/help/, (msg) => {
      const helpText = `*Panduan Perintah VPS Monitor Bot:*\n\n` +
        `/status - Menampilkan visual bar CPU, RAM, dan Disk\n` +
        `/cpu - Info clock, core detail, dan average load\n` +
        `/ram - Info kapasitas RAM total, gratis, dan terpakai\n` +
        `/disk - Info partisi penyimpanan server\n` +
        `/remote - Daftar node Pterodactyl luar yang menyetor telemetry\n` +
        `/ping - Merespon pesan tanda bot hidup`;
      botInstance?.sendMessage(msg.chat.id, helpText, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
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

      botInstance?.sendMessage(chatId, statusMsg, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
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
      botInstance?.sendMessage(msg.chat.id, response, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
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
      botInstance?.sendMessage(msg.chat.id, response, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
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
      botInstance?.sendMessage(msg.chat.id, response, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
    });

    botInstance.onText(/\/remote/, (msg) => {
      if (remoteServers.size === 0) {
        botInstance?.sendMessage(msg.chat.id, "🌍 *Node Remote:* Belum ada node Pterodactyl remote yang aktif atau menyambung saat ini.", { 
          parse_mode: "Markdown",
          reply_markup: defaultReplyMarkup
        });
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
      
      botInstance?.sendMessage(msg.chat.id, response, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
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
          logEvent("cpu", "danger", "Limit CPU Terlampaui", `CPU lokal terdeteksi overload mencapai ${cpu}% (Threshold: ${botConfig.alertCpuThreshold}%).`);
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
          logEvent("ram", "danger", "Memory RAM Penuh", `Beban Memory VPS overload di angka ${ramPercent}% (Threshold: ${botConfig.alertRamThreshold}%).`);
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
          logEvent("disk", "danger", "Penyimpanan Disk Penuh", `Sisa kapasitas disk menipis dengan beban ${disk.usagePercent}% (Threshold: ${botConfig.alertDiskThreshold}%).`);
        }
      }
    }, 20000); // Check every 20 seconds, but throttle telegram msgs via threshold and intervalMs

  } catch (error: any) {
    console.error("Failed to start telegram bot:", error);
    currentBotStatus = `Error Inisialisasi: ${error.message}`;
    logEvent("system", "danger", "Inisialisasi Gagal", `Bot gagal menyala karena error: ${error.message}`);
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

    logEvent("system", isActive ? "success" : "info", "Konfigurasi Diubah", `Sistem mendeteksi pembaruan konfigurasi. Bot berstatus: ${isActive ? "AKTIF" : "NONAKTIF"}.`);

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
    logEvent("system", "success", "Pesan Tes Sukses", `Pesan simulasi status terkirim dengan sukses ke Chat ID: ${testChatId}`);
    res.json({ success: true, message: "Pesan tes berhasil dikirim ke Telegram!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Force restart Telegram Bot polling
app.post("/api/restart-bot", (req, res) => {
  try {
    initializeTelegramBot();
    logEvent("system", "info", "Bot Direstart", "Melakukan reboot koneksi polling Telegram Bot secara manual.");
    res.json({
      success: true,
      message: "Proses polling bot Telegram berhasil dinyalakan ulang!",
      status: currentBotStatus,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get alert logs historical data
app.get("/api/alert-logs", (req, res) => {
  res.json({
    success: true,
    data: alertLogs,
  });
});

// API: Clear alert logs historical data
app.post("/api/clear-logs", (req, res) => {
  try {
    alertLogs = [];
    writeLogs();
    logEvent("system", "info", "Log Dibersihkan", "Seluruh riwayat peringatan server telah dikosongkan.");
    res.json({
      success: true,
      message: "Seluruh riwayat logs berhasil dibersihkan!",
      data: alertLogs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Pterodactyl API Direct Request (Support Http/Https and Bypass Self-Signed SSL Cert error)
function pterodactylFetch(url: string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === "https:";
      const lib = isHttps ? https : http;
      
      const options: any = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...headers
        },
        timeout: 10000 // 10s timeout
      };

      if (isHttps) {
        options.rejectUnauthorized = false; // Bypass self-signed SSL certificate issues
      }

      const req = lib.request(options, (res) => {
        let data = "";
        res.on("data", (chunk: any) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error("Response dari panel bukan JSON valid (Ada kemungkinan diblokir oleh proteksi DDoS/Cloudflare)"));
            }
          } else {
            let errorMsg = `Server merespon dengan status ${res.statusCode}`;
            if (res.statusCode === 401) {
              errorMsg = "Unauthorized (401): API Key (PTLA) tidak valid atau salah. Pastikan menggunakan Client API Key dengan awalan ptla_.";
            } else if (res.statusCode === 403) {
              errorMsg = "Forbidden (403): Akses ditolak. Panel Pterodactyl Anda mungkin diproteksi oleh Cloudflare WAF / sistem anti-bot. Pastikan domain panel diizinkan diakses publik.";
            } else if (res.statusCode === 404) {
              errorMsg = "Not Found (404): Halaman tidak ditemukan. Periksa apakah penulisan domain sudah benar.";
            } else if (res.statusCode >= 500) {
              errorMsg = `Server Error (${res.statusCode}): Panel Pterodactyl sedang tidak merespon atau terjadi kegagalan sistem internal pada panel.`;
            }
            reject(new Error(errorMsg));
          }
        });
      });

      req.on("error", (err: any) => {
        let errorMsg = err.message;
        if (err.code === "ENOTFOUND") {
          errorMsg = `Domain tidak dapat ditemukan/diselesaikan (ENOTFOUND). Periksa kembali domain panel Anda.`;
        } else if (err.code === "ECONNREFUSED") {
          errorMsg = `Koneksi ditolak (ECONNREFUSED). Periksa apakah server panel aktif pada port tersebut.`;
        } else if (err.code === "ETIMEDOUT") {
          errorMsg = `Waktu koneksi habis (ETIMEDOUT).`;
        }
        reject(new Error(errorMsg));
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Koneksi ke Pterodactyl timeout (10 detik)"));
      });

      req.end();
    } catch (error: any) {
      reject(error);
    }
  });
}

// API: Get Pterodactyl configuration
app.get("/api/pterodactyl-config", (req, res) => {
  res.json({
    success: true,
    data: {
      pterodactylDomain: botConfig.pterodactylDomain || "",
      pterodactylApiKey: botConfig.pterodactylApiKey || "",
      pterodactylActive: !!botConfig.pterodactylActive
    }
  });
});

// API: Save Pterodactyl configuration
app.post("/api/pterodactyl-config", (req, res) => {
  try {
    const { pterodactylDomain, pterodactylApiKey, pterodactylActive } = req.body;
    
    botConfig.pterodactylDomain = pterodactylDomain || "";
    botConfig.pterodactylApiKey = pterodactylApiKey || "";
    botConfig.pterodactylActive = !!pterodactylActive;

    saveConfig();

    logEvent("system", "success", "Konfigurasi Pterodactyl Diubah", `Sistem mendeteksi pembaruan konfigurasi panel Pterodactyl. Status pemantauan: ${botConfig.pterodactylActive ? "AKTIF" : "NONAKTIF"}.`);

    res.json({
      success: true,
      message: "Konfigurasi Pterodactyl berhasil disimpan!",
      data: {
        pterodactylDomain: botConfig.pterodactylDomain,
        pterodactylApiKey: botConfig.pterodactylApiKey,
        pterodactylActive: botConfig.pterodactylActive
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Diagnose Pterodactyl Connection
app.post("/api/pterodactyl-diagnose", async (req, res) => {
  try {
    const { domain, apiKey } = req.body;
    
    if (!domain) {
      return res.status(400).json({ success: false, error: "Domain harus diisi untuk diagnosa." });
    }

    const steps: { title: string; status: "success" | "warning" | "danger" | "pending"; message: string; details?: string }[] = [];
    
    // Step 1: Format Check
    let cleanDomain = domain.trim();
    if (!cleanDomain.startsWith("http://") && !cleanDomain.startsWith("https://")) {
      cleanDomain = "https://" + cleanDomain;
    }
    cleanDomain = cleanDomain.replace(/\/+$/, "");
    cleanDomain = cleanDomain.replace(/\/api\/client$/, "");
    cleanDomain = cleanDomain.replace(/\/api\/application$/, "");
    cleanDomain = cleanDomain.replace(/\/api$/, "");

    steps.push({
      title: "Normalisasi Format Domain",
      status: "success",
      message: `Domain berhasil dinormalisasi menjadi: ${cleanDomain}`
    });

    // Step 2: DNS Resolution
    let hostname = "";
    try {
      const parsed = new URL(cleanDomain);
      hostname = parsed.hostname;
    } catch {
      steps.push({
        title: "Ekstraksi Hostname",
        status: "danger",
        message: "Format domain tidak valid, tidak bisa mengekstrak hostname."
      });
      return res.json({ success: true, steps });
    }

    try {
      const dnsPromises = require("dns").promises;
      const ips = await dnsPromises.resolve(hostname).catch(async () => {
        // Fallback to dns lookup
        const lookup = await dnsPromises.lookup(hostname);
        return [lookup.address];
      });
      steps.push({
        title: "Resolusi DNS Selesai",
        status: "success",
        message: `Hostname ${hostname} berhasil dipecahkan ke IP: ${ips.join(", ")}`
      });
    } catch (dnsErr: any) {
      steps.push({
        title: "Resolusi DNS Gagal",
        status: "danger",
        message: `Tidak dapat memecahkan domain ${hostname} ke IP address.`,
        details: dnsErr.message + ". Pastikan penulisan domain benar dan terdaftar di internet."
      });
      return res.json({ success: true, steps });
    }

    // Step 3: Test Web Port & Check Cloudflare
    let isCloudflare = false;
    let serverHeader = "";
    let cloudflareDetected = false;
    let rootResponseStatus = 0;

    try {
      const testReq = await new Promise<{ statusCode: number; headers: any; bodySnippet: string }>((resolve, reject) => {
        const parsedUrl = new URL(cleanDomain);
        const isHttps = parsedUrl.protocol === "https:";
        const lib = isHttps ? https : http;
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: "/",
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9"
          },
          rejectUnauthorized: false,
          timeout: 5000
        };

        const r = lib.request(options, (response) => {
          let b = "";
          response.on("data", (chunk) => { b += chunk; });
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode || 0,
              headers: response.headers || {},
              bodySnippet: b.substring(0, 1000)
            });
          });
        });
        r.on("error", (e) => reject(e));
        r.on("timeout", () => { r.destroy(); reject(new Error("Timeout")); });
        r.end();
      });

      rootResponseStatus = testReq.statusCode;
      serverHeader = String(testReq.headers["server"] || "").toLowerCase();
      
      if (serverHeader.includes("cloudflare") || testReq.headers["cf-ray"] || testReq.bodySnippet.includes("cf-challenge") || testReq.bodySnippet.includes("cloudflare")) {
        cloudflareDetected = true;
      }

      steps.push({
        title: "Uji Port/Web Server",
        status: cloudflareDetected ? "warning" : "success",
        message: `Web server merespon dengan status HTTP ${testReq.statusCode}.` + (cloudflareDetected ? " Terdeteksi proteksi Cloudflare WAF." : ""),
        details: `Server Header: ${testReq.headers["server"] || "tidak ada"}.` + (cloudflareDetected ? " Peringatan: Cloudflare sering memblokir bot/server-side-request dari IP public cloud provider. Jika setelah ini koneksi gagal, nonaktifkan proxy (Orange Cloud) Cloudflare Anda." : "")
      });
    } catch (webErr: any) {
      steps.push({
        title: "Koneksi Web Server Gagal",
        status: "danger",
        message: `Gagal menghubungi port HTTP/HTTPS pada ${cleanDomain}.`,
        details: webErr.message
      });
      return res.json({ success: true, steps });
    }

    // Step 4: Test API Client with API Key
    if (!apiKey) {
      steps.push({
        title: "Uji API Key Pterodactyl",
        status: "warning",
        message: "API Key kosong, uji API dilewatkan.",
        details: "Lengkapi API Key jika ingin menguji autentikasi."
      });
    } else {
      try {
        const testApiReq = await new Promise<{ statusCode: number; headers: any; body: string }>((resolve, reject) => {
          const parsedUrl = new URL(`${cleanDomain}/api/client`);
          const isHttps = parsedUrl.protocol === "https:";
          const lib = isHttps ? https : http;
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            rejectUnauthorized: false,
            timeout: 5000
          };

          const r = lib.request(options, (response) => {
            let b = "";
            response.on("data", (chunk) => { b += chunk; });
            response.on("end", () => {
              resolve({
                statusCode: response.statusCode || 0,
                headers: response.headers || {},
                body: b
              });
            });
          });
          r.on("error", (e) => reject(e));
          r.on("timeout", () => { r.destroy(); reject(new Error("Timeout")); });
          r.end();
        });

        const status = testApiReq.statusCode;
        if (status === 200) {
          try {
            const parsedJson = JSON.parse(testApiReq.body);
            if (parsedJson && parsedJson.data) {
              steps.push({
                title: "Uji API Key Pterodactyl",
                status: "success",
                message: "Autentikasi BERHASIL! API Key valid dan server membalas dengan list server.",
                details: `Ditemukan ${parsedJson.data.length} server yang bisa diakses oleh Client API Key ini.`
              });
            } else {
              steps.push({
                title: "Uji API Key Pterodactyl",
                status: "warning",
                message: "Format JSON sukses, tetapi tidak ada list server.",
                details: `Respon: ${testApiReq.body.substring(0, 300)}`
              });
            }
          } catch {
            steps.push({
              title: "Uji API Key Pterodactyl",
              status: "danger",
              message: "Autentikasi respon HTTP 200 tetapi respon tidak bisa diparse sebagai JSON.",
              details: `Respon body: ${testApiReq.body.substring(0, 300)}`
            });
          }
        } else if (status === 401) {
          steps.push({
            title: "Uji API Key Pterodactyl",
            status: "danger",
            message: "Unauthorized (HTTP 401) - API Key Salah atau Tidak Valid.",
            details: "Pastikan Anda menyalin seluruh teks Client API Key dari halaman Profile > API Keys di dalam panel Pterodactyl Anda (diawali dengan 'ptla_'). Jangan gunakan Application API Key admin."
          });
        } else if (status === 403) {
          steps.push({
            title: "Uji API Key Pterodactyl",
            status: "danger",
            message: "Forbidden (HTTP 403) - Akses Ditolak (WAF / Cloudflare Block).",
            details: "IP server monitoring ini diblokir oleh Cloudflare WAF, IP Firewall, atau sistem keamanan bot di panel Anda. Solusi: Daftarkan IP outbound server ini di whitelist atau nonaktifkan proxy Cloudflare (gunakan mode DNS Only / Grey Cloud) untuk domain panel Pterodactyl Anda."
          });
        } else if (status === 404) {
          steps.push({
            title: "Uji API Key Pterodactyl",
            status: "danger",
            message: "Not Found (HTTP 404) - Endpoint API Client Tidak Ditemukan.",
            details: `Endpoint ${cleanDomain}/api/client memberikan respon 404. Berarti Pterodactyl tidak terinstall di path ini atau ada kesalahan domain.`
          });
        } else {
          steps.push({
            title: "Uji API Key Pterodactyl",
            status: "danger",
            message: `Gagal dengan Kode Status HTTP ${status}`,
            details: `Respon payload: ${testApiReq.body.substring(0, 300)}`
          });
        }
      } catch (apiErr: any) {
        steps.push({
          title: "Uji API Key Pterodactyl Gagal",
          status: "danger",
          message: `Terjadi error koneksi saat fetch API: ${apiErr.message}`,
          details: "Koneksi terputus atau ditutup paksa oleh server Pterodactyl Anda."
        });
      }
    }

    res.json({
      success: true,
      steps
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get Pterodactyl servers with metrics and overload detection
app.get("/api/pterodactyl-servers", async (req, res) => {
  const domain = botConfig.pterodactylDomain;
  const apiKey = botConfig.pterodactylApiKey;

  if (!domain || !apiKey) {
    return res.json({
      success: false,
      error: "Konfigurasi domain dan API key Pterodactyl kosong. Silakan atur di Dashboard.",
      data: []
    });
  }

  // Sanitize trailing slash in domain and normalize typical errors
  let cleanDomain = domain.trim();
  if (!cleanDomain.startsWith("http://") && !cleanDomain.startsWith("https://")) {
    cleanDomain = "https://" + cleanDomain;
  }
  cleanDomain = cleanDomain.replace(/\/+$/, "");
  cleanDomain = cleanDomain.replace(/\/api\/client$/, "");
  cleanDomain = cleanDomain.replace(/\/api\/application$/, "");
  cleanDomain = cleanDomain.replace(/\/api$/, "");

  try {
    const serversListUrl = `${cleanDomain}/api/client`;
    const serversResponse = await pterodactylFetch(serversListUrl, {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json"
    });

    if (!serversResponse || !serversResponse.data) {
      throw new Error("Gagal mengambil data list server. Pastikan API key Anda valid dan tipe Client API Key.");
    }

    const servers = serversResponse.data;
    const resultServers: any[] = [];

    // Fetch resources for each server
    const fetchPromises = servers.map(async (srvNode: any) => {
      const srvAttr = srvNode.attributes;
      const srvId = srvAttr.identifier;
      const limits = srvAttr.limits;

      let srvMetrics = {
        state: "unknown",
        is_suspended: false,
        resources: {
          cpu_absolute: 0,
          memory_bytes: 0,
          disk_bytes: 0
        }
      };

      try {
        const metricsUrl = `${cleanDomain}/api/client/servers/${srvId}/resources`;
        const metricsRes = await pterodactylFetch(metricsUrl, {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        });
        if (metricsRes && metricsRes.attributes) {
          srvMetrics.state = metricsRes.attributes.current_state || "unknown";
          srvMetrics.is_suspended = metricsRes.attributes.is_suspended || false;
          srvMetrics.resources = metricsRes.attributes.resources || srvMetrics.resources;
        }
      } catch (err: any) {
        console.error(`Gagal mengambil resource metrics untuk server ${srvId}:`, err.message);
        srvMetrics.state = "offline";
      }

      // Calculations
      const ramUsedMb = srvMetrics.resources.memory_bytes / 1024 / 1024;
      const ramLimitMb = limits.memory; // MB
      const ramPercent = ramLimitMb > 0 ? (ramUsedMb / ramLimitMb) * 100 : 0;
      const ramOverload = (ramLimitMb > 0) && (ramPercent >= 90) && (srvMetrics.state !== "offline");

      const diskUsedMb = srvMetrics.resources.disk_bytes / 1024 / 1024;
      const diskLimitMb = limits.disk; // MB
      const diskPercent = diskLimitMb > 0 ? (diskUsedMb / diskLimitMb) * 100 : 0;
      const diskOverload = (diskLimitMb > 0) && (diskPercent >= 90) && (srvMetrics.state !== "offline");

      const cpuUsedPercent = srvMetrics.resources.cpu_absolute;
      const cpuLimitPercent = limits.cpu; // Total percentage
      const cpuPercentOfLimit = cpuLimitPercent > 0 ? (cpuUsedPercent / cpuLimitPercent) * 100 : 0;
      const cpuOverload = (cpuLimitPercent > 0 ? (cpuPercentOfLimit >= 90) : (cpuUsedPercent >= 95)) && (srvMetrics.state !== "offline");

      const overloadDetails = [];
      if (cpuOverload) overloadDetails.push("CPU");
      if (ramOverload) overloadDetails.push("RAM");
      if (diskOverload) overloadDetails.push("Disk");

      resultServers.push({
        id: srvId,
        uuid: srvAttr.uuid,
        name: srvAttr.name,
        node: srvAttr.node,
        limits: {
          memory: ramLimitMb, // MB
          disk: diskLimitMb, // MB
          cpu: cpuLimitPercent // %
        },
        status: srvMetrics.state,
        isSuspended: srvMetrics.is_suspended,
        resources: {
          cpu: cpuUsedPercent, // original % of thread
          memory: ramUsedMb, // MB
          disk: diskUsedMb, // MB
          rawMemory: srvMetrics.resources.memory_bytes,
          rawDisk: srvMetrics.resources.disk_bytes
        },
        alertFlags: {
          cpuOverload,
          ramOverload,
          diskOverload,
          isOverloaded: cpuOverload || ramOverload || diskOverload,
          details: overloadDetails,
          cpuPercent: cpuLimitPercent > 0 ? +cpuPercentOfLimit.toFixed(1) : +cpuUsedPercent.toFixed(1),
          ramPercent: +ramPercent.toFixed(1),
          diskPercent: +diskPercent.toFixed(1)
        }
      });
    });

    await Promise.all(fetchPromises);

    res.json({
      success: true,
      data: resultServers
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Gagal menghubungi panel Pterodactyl"
    });
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
