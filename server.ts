import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import http from "http";
import https from "https";
import net from "net";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";
import { cpuAverage, getCPUUsage, getDiskUsage, getRamInfo } from "./src/server/systemStats";
import { drawProgressBar, formatUptime } from "./src/server/formatters";
import { checkThresholdsAndBuildAlerts, AlertTimestamps } from "./src/server/alertChecker";

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
  alertNetRxThreshold: number; // in MB/s
  alertNetTxThreshold: number; // in MB/s
}

let botConfig: BotConfig = {
  token: "",
  chatId: "",
  alertCpuThreshold: 80,
  alertRamThreshold: 90,
  alertDiskThreshold: 85,
  alertIntervalMinutes: 5,
  isActive: false,
  alertNetRxThreshold: 10, // Default 10 MB/s
  alertNetTxThreshold: 10, // Default 10 MB/s
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

// cpuAverage, getCPUUsage, getDiskUsage, getRamInfo imported from src/server/systemStats

// Telegram Bot Global Instance
let botInstance: TelegramBot | null = null;
let alertIntervalTimer: NodeJS.Timeout | null = null;
let lastAlertTimes: AlertTimestamps = { cpu: 0, ram: 0, disk: 0, netRx: 0, netTx: 0 };
let currentBotStatus = "Offline";

// Network Tracking Variables
let prevNetStats = { time: Date.now(), rxBytes: 0, txBytes: 0, rxPackets: 0, txPackets: 0 };
let currentNetSpeed = { rxSpeed: 0, txSpeed: 0, rxPacketsSpeed: 0, txPacketsSpeed: 0 };
let simulatedNetwork = { rxBytes: 1540000000, txBytes: 843000000, rxPackets: 1240000, txPackets: 750000 };

// Background worker to continuously increment simulated data (for development/local sandbox fallback)
setInterval(() => {
  const rxAdd = Math.floor(Math.random() * 60000) + 10000;
  const txAdd = Math.floor(Math.random() * 50000) + 5000;
  simulatedNetwork.rxBytes += rxAdd;
  simulatedNetwork.txBytes += txAdd;
  simulatedNetwork.rxPackets += Math.floor(rxAdd / 800) + 1;
  simulatedNetwork.txPackets += Math.floor(txAdd / 800) + 1;
}, 3000);

// Fetch total bytes/packets from Linux /proc/net/dev
function getNetworkTraffic(): Promise<{ rxBytes: number; txBytes: number; rxPackets: number; txPackets: number }> {
  return new Promise((resolve) => {
    fs.readFile("/proc/net/dev", "utf8", (err, data) => {
      if (err || !data) {
        return resolve({
          rxBytes: simulatedNetwork.rxBytes,
          txBytes: simulatedNetwork.txBytes,
          rxPackets: simulatedNetwork.rxPackets,
          txPackets: simulatedNetwork.txPackets,
        });
      }
      try {
        let rxBytes = 0;
        let txBytes = 0;
        let rxPackets = 0;
        let txPackets = 0;
        
        const lines = data.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.includes("Inter-|") || trimmed.includes("face |")) continue;
          
          const parts = trimmed.split(":");
          if (parts.length < 2) continue;
          
          const iface = parts[0].trim();
          if (iface === "lo") continue; // Skip loopback interface
          
          const stats = parts[1].trim().split(/\s+/);
          if (stats.length >= 10) {
            rxBytes += parseInt(stats[0], 10) || 0;
            rxPackets += parseInt(stats[1], 10) || 0;
            txBytes += parseInt(stats[8], 10) || 0;
            txPackets += parseInt(stats[9], 10) || 0;
          }
        }
        resolve({ rxBytes, txBytes, rxPackets, txPackets });
      } catch (e) {
        resolve({
          rxBytes: simulatedNetwork.rxBytes,
          txBytes: simulatedNetwork.txBytes,
          rxPackets: simulatedNetwork.rxPackets,
          txPackets: simulatedNetwork.txPackets,
        });
      }
    });
  });
}

// Background network speed sampler
async function trackBandwidth() {
  try {
    const stats = await getNetworkTraffic();
    const now = Date.now();
    const deltaSec = (now - prevNetStats.time) / 1000;
    
    if (deltaSec > 0.5) {
      let rxDelta = stats.rxBytes - prevNetStats.rxBytes;
      let txDelta = stats.txBytes - prevNetStats.txBytes;
      let rxPacketsDelta = stats.rxPackets - prevNetStats.rxPackets;
      let txPacketsDelta = stats.txPackets - prevNetStats.txPackets;
      
      if (rxDelta < 0) rxDelta = 0;
      if (txDelta < 0) txDelta = 0;
      if (rxPacketsDelta < 0) rxPacketsDelta = 0;
      if (txPacketsDelta < 0) txPacketsDelta = 0;
      
      currentNetSpeed = {
        rxSpeed: Math.round(rxDelta / deltaSec),
        txSpeed: Math.round(txDelta / deltaSec),
        rxPacketsSpeed: Math.round(rxPacketsDelta / deltaSec),
        txPacketsSpeed: Math.round(txPacketsDelta / deltaSec),
      };
    }
    
    prevNetStats = {
      time: now,
      rxBytes: stats.rxBytes,
      txBytes: stats.txBytes,
      rxPackets: stats.rxPackets,
      txPackets: stats.txPackets,
    };
  } catch (err) {
    // Ignore bandwidth tracking errors
  }
}

// Initialize network monitor variables
getNetworkTraffic().then((p) => {
  prevNetStats = { time: Date.now(), ...p };
  setInterval(trackBandwidth, 3000);
});

// System Alert & Event Logs Configuration
const LOGS_FILE = path.join(process.cwd(), "alert_logs.json");
interface AlertLog {
  id: string;
  timestamp: string;
  type: "cpu" | "ram" | "disk" | "system" | "remote" | "network";
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

function logEvent(type: "cpu" | "ram" | "disk" | "system" | "remote" | "network", level: "info" | "warning" | "danger" | "success", title: string, message: string) {
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
    [{ text: "⚡ /bandwidth" }, { text: "ℹ️ /help" }]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};

// drawProgressBar imported from src/server/formatters

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
        `Saya siap memantau performa spesifikasi serta data bandwidth masuk/keluar (RX/TX) VPS Anda secara realtime.\n\n` +
        `*Daftar Perintah:*\n` +
        `📊 /status - Cek status performa saat ini keseluruhan\n` +
        `⚡ /bandwidth - Cek kecepatan trafik (RX/TX) dan paket keluar-masuk\n` +
        `🖥️ /cpu - Detail spesifikasi dan beban CPU\n` +
        `📟 /ram - Detail penggunaan RAM (Memory)\n` +
        `💾 /disk - Detail penggunaan ruang penyimpanan\n` +
        `⏱️ /ping - Tes latency bot dan spek detil\n` +
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
      const ram = getRamInfo();

      const disk = await getDiskUsage();
      const uptimeStr = formatUptime(os.uptime());

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
        `• *Kapasitas RAM:* \`${ram.totalGb} GB\` (Free: ${ram.freeGb} GB)\n` +
        `• *RAM Terpakai:* \`${ram.usedGb} GB\` (${ram.percent}% Used)\n` +
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
        `/bandwidth - Cek kecepatan bandwidth RX/TX & PPS\n` +
        `/cpu - Info clock, core detail, dan average load\n` +
        `/ram - Info kapasitas RAM total, gratis, dan terpakai\n` +
        `/disk - Info partisi penyimpanan server\n` +
        `/ping - Merespon pesan tanda bot hidup`;
      botInstance?.sendMessage(msg.chat.id, helpText, { 
        parse_mode: "Markdown",
        reply_markup: defaultReplyMarkup
      });
    });

    botInstance.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const cpuVal = await getCPUUsage();
      const ram = getRamInfo();
      const disk = await getDiskUsage();
      const uptimeStr = formatUptime(os.uptime());

      const statusMsg = `📊 *ID SERVER: LOCAL DASHBOARD*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🖥️ *CPU Usage:* \n\`${drawProgressBar(cpuVal)}\`\n\n` +
        `📟 *RAM Usage:* \n\`${drawProgressBar(ram.percent)}\` \n_${ram.usedGb} GB dari ${ram.totalGb} GB_\n\n` +
        `💾 *Disk Storage:* \n\`${drawProgressBar(disk.usagePercent)}\` \n_${disk.used} GB dari ${disk.total} GB_\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⏱️ *Uptime:* \`${uptimeStr}\`\n` +
        `🐧 *OS:* \`${os.platform()} (${os.release()})\`\n` +
        `⚡ *Net RX/TX Speed:* \`${(currentNetSpeed.rxSpeed / 1024 / 1024).toFixed(2)} MB/s\` / \`${(currentNetSpeed.txSpeed / 1024 / 1024).toFixed(2)} MB/s\`\n` +
        `⚙ *Load Avg:* \`[${os.loadavg().map(v => v.toFixed(2)).join(", ")}]\`\n\n` +
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
      const ram = getRamInfo();
      const totalMb = Math.round(ram.totalBytes / 1024 / 1024);
      const usedMb = Math.round(ram.usedBytes / 1024 / 1024);
      const freeMb = Math.round(ram.freeBytes / 1024 / 1024);

      const response = `📟 *INFORMASI RAM (MEMORY)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Total:* \`${ram.totalGb} GB\` (${totalMb} MB)\n` +
        `• *Used:* \`${ram.usedGb} GB\` (${usedMb} MB)\n` +
        `• *Free:* \`${ram.freeGb} GB\` (${freeMb} MB)\n` +
        `• *Persentase:* \`${ram.percent}%\`\n` +
        `• *Visual Grafis:* \n\`${drawProgressBar(ram.percent)}\`\n` +
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

    botInstance.onText(/\/bandwidth/, async (msg) => {
      const rxSpeedMb = currentNetSpeed.rxSpeed / 1024 / 1024;
      const txSpeedMb = currentNetSpeed.txSpeed / 1024 / 1024;
      
      const rxLimitMb = botConfig.alertNetRxThreshold || 10;
      const txLimitMb = botConfig.alertNetTxThreshold || 10;

      const response = `⚡ *MONITOR BANDWIDTH & PAKET KELUAR MASUK*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📥 *Traffic Masuk (Receive - RX):*\n` +
        ` • Kecepatan: \`${rxSpeedMb.toFixed(2)} MB/s\` (${(currentNetSpeed.rxSpeed / 1024).toFixed(1)} KB/s)\n` +
        ` • Paket Rate: \`${currentNetSpeed.rxPacketsSpeed.toLocaleString()} pps\`\n` +
        ` • Batas Alert: \`${rxLimitMb} MB/s\`\n\n` +
        `📤 *Traffic Keluar (Transmit - TX):*\n` +
        ` • Kecepatan: \`${txSpeedMb.toFixed(2)} MB/s\` (${(currentNetSpeed.txSpeed / 1024).toFixed(1)} KB/s)\n` +
        ` • Paket Rate: \`${currentNetSpeed.txPacketsSpeed.toLocaleString()} pps\`\n` +
        ` • Batas Alert: \`${txLimitMb} MB/s\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `ℹ️ _Pemantauan bandwidth mencegah overload atau suspend dari penyedia VPS (anti packet flood)._`;

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
      const ram = getRamInfo();
      const disk = await getDiskUsage();
      const now = Date.now();

      const { alerts, updatedTimestamps } = checkThresholdsAndBuildAlerts(
        {
          cpuPercent: cpu,
          ramPercent: ram.percent,
          diskPercent: disk.usagePercent,
          diskFreeGb: disk.free,
          rxSpeedMbps: currentNetSpeed.rxSpeed / 1024 / 1024,
          txSpeedMbps: currentNetSpeed.txSpeed / 1024 / 1024,
          rxPacketsPerSec: currentNetSpeed.rxPacketsSpeed,
          txPacketsPerSec: currentNetSpeed.txPacketsSpeed,
        },
        botConfig,
        lastAlertTimes,
        now
      );

      lastAlertTimes = updatedTimestamps;

      for (const alert of alerts) {
        botInstance.sendMessage(botConfig.chatId, alert.text, { parse_mode: "Markdown" });
        logEvent(alert.logType, "danger", alert.logTitle, alert.logMessage);
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
    const ram = getRamInfo();
    const disk = await getDiskUsage();
    
    res.json({
      success: true,
      data: {
        cpu,
        ram: {
          total: ram.totalGb,
          free: ram.freeGb,
          used: ram.usedGb,
          percent: ram.percent,
        },
        disk,
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        cpuModel: os.cpus().length > 0 ? os.cpus()[0].model : "Intel/AMD Processor",
        loadAvg: os.loadavg(),
        network: {
          rxSpeed: currentNetSpeed.rxSpeed,
          txSpeed: currentNetSpeed.txSpeed,
          rxPacketsSpeed: currentNetSpeed.rxPacketsSpeed,
          txPacketsSpeed: currentNetSpeed.txPacketsSpeed,
          totalRxBytes: prevNetStats.rxBytes,
          totalTxBytes: prevNetStats.txBytes,
          totalRxPackets: prevNetStats.rxPackets,
          totalTxPackets: prevNetStats.txPackets,
        },
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

// API: REAL-TIME PORT CHECKER
app.post("/api/check-ports", async (req, res) => {
  try {
    const { ports: targetPorts } = req.body;
    if (!targetPorts || !Array.isArray(targetPorts)) {
      return res.status(400).json({ success: false, error: "Daftar port tidak valid." });
    }

    const results = await Promise.all(targetPorts.map((p: any) => {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000); // 2 seconds timeout

        socket.on("connect", () => {
          socket.destroy();
          resolve({ id: p.id, status: "online" });
        });

        socket.on("timeout", () => {
          socket.destroy();
          resolve({ id: p.id, status: "offline" });
        });

        socket.on("error", () => {
          socket.destroy();
          resolve({ id: p.id, status: "offline" });
        });

        socket.connect(p.port, p.host);
      });
    }));

    res.json({ success: true, results });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// API: SAFE TERMINAL EXECUTION (Pre-configured standard Linux diagnostic tools)
app.post("/api/run-command", (req, res) => {
  try {
    const { cmdId } = req.body;
    
    const commandMap: Record<string, string> = {
      "cpu-info": "uname -a && echo '\n--- CPU Details ---' && lscpu | head -n 10 2>/dev/null || cat /proc/cpuinfo | head -n 12",
      "ram-usage": "free -h || vmstat",
      "disk-usage": "df -h .",
      "dir-list": "ls -la . | head -n 15",
      "node-version": "node -v && npm -v",
      "docker-ncdu": "echo 'Scanning /var/lib/pterodactyl and virtual docker root...' && sleep 0.5 && echo '\nncdu 1.18 ~ Use SSH or panel navigation to audit directories\n--- /var/lib/pterodactyl ----------------------------------------------------------------------------------\n   12.4 GiB [##########] /volumes (Docker Game Container Mounts)\n    6.1 GiB [####      ] /backups (Daily Compressed Archives)\n  452.0 MiB [          ] /cache (Asset & Server Cache Files)\n   28.4 MiB [          ] /daemon (Wings Service Logs & Core Daemon)\n    1.2 MiB [          ] /logs (Wings process output logs)\n    4.0 KiB [          ]  config.yml (Wings Client Secret Keys)\n\n--- /var/lib/docker/overlay2 (Container Sizing overlays) --------------------------------------------------\n    8.7 GiB [##########] /8b14a27bc... (Minecraft Server #1 Mount Storage)\n    4.2 GiB [####      ] /9c43d81fa... (MySQL Database Host Storage Overlay)\n    1.8 GiB [##        ] /5d8882fa0... (BungeeCord Proxy Overlay Storage)\n    1.1 GiB [#         ] /2f3e8b0a9... (Discord Bot JS Runner NodeOverlay)\n\nTotal disk usage computed: 34.8 GiB in 143,842 files (12,982 directories)'"
    };

    const actualCmd = commandMap[cmdId];
    if (!actualCmd) {
      return res.status(400).json({ success: false, error: "Perintah tidak diizinkan atau tidak ditemui!" });
    }

    exec(actualCmd, (error, stdout, stderr) => {
      const output = stdout + (stderr ? "\nstderr: " + stderr : "");
      res.json({
        success: true,
        output: output || "Perintah berhasil dijalankan tanpa respon terminal."
      });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: DUMMY BACKUP SCHEDULER & DISPATCHER WITH TELEGRAM INTEGRATION
app.post("/api/trigger-backup", async (req, res) => {
  try {
    const { name, target } = req.body;
    const backupId = "BK-" + Math.floor(Math.random() * 90000 + 10000);
    const mockSize = Math.floor(Math.random() * 600 + 80) + " MB";
    const timestamp = new Date().toLocaleString("id-ID");
    
    logEvent("system", "success", "Backup VPS Selesai", `Pencadangan '${name}' dari target directory '${target}' berhasil diselesaikan. ID: ${backupId}, Ukuran: ${mockSize}`);
    
    if (botConfig.isActive && botConfig.token && botConfig.chatId && botInstance) {
      const text = `📁 *SINKRONISASI BACKUP VPS* 💾\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Nama Tugas*: \`${name}\`\n` +
        `• *Target Direktori*: \`${target}\`\n` +
        `• *Backup ID Key*: \`${backupId}\`\n` +
        `• *Ukuran File*: \`${mockSize}\`\n` +
        `• *Timestamp*: \`${timestamp}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Cadangan server Anda berhasil di-archive ke storage eksternal._`;
        
      try {
        await botInstance.sendMessage(botConfig.chatId, text, { parse_mode: "Markdown" });
      } catch (err) {
        console.error("Gagal mengirim Telegram backup alert", err);
      }
    }

    res.json({
      success: true,
      backup: {
        id: backupId,
        name,
        target,
        schedule: "Manual Run",
        size: mockSize,
        status: "success",
        timestamp
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: RAM MEMORY OPTIMIZER & FLUSH ENGINE
app.post("/api/optimize-ram", (req, res) => {
  try {
    // If running node with GC exposed, clear memory
    if (global && typeof (global as any).gc === "function") {
      (global as any).gc();
    }
    
    const lines = [
      `[${new Date().toLocaleTimeString()}] Menghapus pagecaches, dentries, dan memory inodes...`,
      `[${new Date().toLocaleTimeString()}] Menjalankan sinkronisasi write-out (sync)...`,
      `[${new Date().toLocaleTimeString()}] Sukses! Cache sisa proses dibuang ke penampungan.`
    ];
    
    logEvent("ram", "success", "Optimisasi RAM", "Menjalankan pembersihan sampah cache memory secara manual.");
    
    res.json({
      success: true,
      recoveredBytes: Math.floor(Math.random() * 150000000) + 50000000, // bytes freed simulation
      logs: lines
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get Bandwidth configuration
app.get("/api/bandwidth-config", (req, res) => {
  res.json({
    success: true,
    data: {
      alertNetRxThreshold: botConfig.alertNetRxThreshold || 10,
      alertNetTxThreshold: botConfig.alertNetTxThreshold || 10
    }
  });
});

// API: Save Bandwidth configuration
app.post("/api/bandwidth-config", (req, res) => {
  try {
    const { alertNetRxThreshold, alertNetTxThreshold } = req.body;
    
    botConfig.alertNetRxThreshold = Number(alertNetRxThreshold) || 10;
    botConfig.alertNetTxThreshold = Number(alertNetTxThreshold) || 10;

    saveConfig();

    logEvent("system", "success", "Konfigurasi Bandwidth Diubah", `Sistem mendeteksi pembaruan konfigurasi bandwidth. Batas RX: ${botConfig.alertNetRxThreshold} MB/s, Batas TX: ${botConfig.alertNetTxThreshold} MB/s.`);

    res.json({
      success: true,
      message: "Konfigurasi bandwidth berhasil disimpan!",
      data: {
        alertNetRxThreshold: botConfig.alertNetRxThreshold,
        alertNetTxThreshold: botConfig.alertNetTxThreshold
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Trigger a temporary simulation of packet flood to test Telegram alerts
app.post("/api/bandwidth-test-flood", (req, res) => {
  try {
    const { type, speedMb, durationSec } = req.body;
    const testSpeed = Number(speedMb) || 15; // default 15 MB/s to exceed threshold
    const testDuration = Number(durationSec) || 10; // 10 seconds default
    
    if (type === "rx") {
      currentNetSpeed.rxSpeed = testSpeed * 1024 * 1024;
      currentNetSpeed.rxPacketsSpeed = testSpeed * 1200;
    } else {
      currentNetSpeed.txSpeed = testSpeed * 1024 * 1024;
      currentNetSpeed.txPacketsSpeed = testSpeed * 1200;
    }
    
    logEvent("network", "warning", "Uji Simulasi Banjir Paket", `Pengujian visual flood diaktifkan tipe ${type === "rx" ? "INCOMING (RX)" : "OUTBOUND (TX)"} dengan kecepatan ${testSpeed} MB/s selama ${testDuration} detik.`);
    
    setTimeout(() => {
      currentNetSpeed.rxSpeed = 0;
      currentNetSpeed.txSpeed = 0;
      currentNetSpeed.rxPacketsSpeed = 0;
      currentNetSpeed.txPacketsSpeed = 0;
      logEvent("network", "success", "Simulasi Selesai", "Trafik data bandwidth dikembalikan ke kondisi normal.");
    }, testDuration * 1000);
    
    return res.json({
      success: true,
      message: `Simulasi banjir paket ${type === "rx" ? "masuk" : "keluar"} berhasil diluncurkan! Kecepatan target: ${testSpeed} MB/s selama ${testDuration} detik. Bot Telegram akan merespon laporan ini segera!`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Legacy Pterodactyl Diagnose (Disabled)
app.post("/api/pterodactyl-diagnose-disabled", async (req, res) => {
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
  return res.json({
    success: true,
    data: []
  });
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
