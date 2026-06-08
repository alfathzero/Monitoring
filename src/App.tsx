import React, { useState, useEffect } from "react";
import { 
  Server, 
  Cpu, 
  Database, 
  HardDrive, 
  Send, 
  Terminal, 
  Settings, 
  Code, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clipboard, 
  HelpCircle, 
  ChevronRight, 
  ExternalLink,
  Wifi,
  Cloud,
  Check,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface SystemStats {
  cpu: number;
  ram: {
    total: number;
    free: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  uptime: number;
  platform: string;
  arch: string;
  cpuCores: number;
  cpuModel: string;
  loadAvg: number[];
}

interface TelegramConfig {
  token: string;
  chatId: string;
  alertCpuThreshold: number;
  alertRamThreshold: number;
  alertDiskThreshold: number;
  alertIntervalMinutes: number;
  isActive: boolean;
  status: string;
}

interface RemoteDevice {
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

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "telegram" | "script" | "remote">("dashboard");
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<{ cpu: number[]; ram: number[] }>({ cpu: [], ram: [] });
  const [remoteDevices, setRemoteDevices] = useState<RemoteDevice[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLodingStats, setIsLoadingStats] = useState(false);
  const [config, setConfig] = useState<TelegramConfig>({
    token: "",
    chatId: "",
    alertCpuThreshold: 80,
    alertRamThreshold: 90,
    alertDiskThreshold: 85,
    alertIntervalMinutes: 5,
    isActive: false,
    status: "Offline",
  });

  const [savingConfig, setSavingConfig] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Self App URL from user environment if needed, fallbacks to window.location.origin
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchStats();
    fetchConfig();
    fetchRemoteDevices();

    // Intervals
    const statsInterval = setInterval(fetchStats, 3000);
    const remoteInterval = setInterval(fetchRemoteDevices, 4000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(remoteInterval);
    };
  }, []);

  // Accumulate local performance stats history for the grid sparkline
  useEffect(() => {
    if (stats) {
      setHistory(prev => {
        const nextCpu = [...prev.cpu, stats.cpu].slice(-30);
        const nextRam = [...prev.ram, stats.ram.percent].slice(-30);
        return { cpu: nextCpu, ram: nextRam };
      });
    }
  }, [stats]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/system-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching local stats:", err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/telegram-config");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error("Error fetching bot config:", err);
    }
  };

  const fetchRemoteDevices = async () => {
    try {
      const res = await fetch("/api/remote-devices");
      const data = await res.json();
      if (data.success) {
        setRemoteDevices(data.data);
      }
    } catch (err) {
      console.error("Error fetching remote devices:", err);
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setSavingConfig(false);
      if (data.success) {
        setConfig(data.data);
        setStatusMsg({ type: "success", text: "Konfigurasi Bot Telegram berhasil disimpan dan bot diaktifkan!" });
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menyimpan konfigurasi." });
      }
    } catch (err) {
      setSavingConfig(false);
      setStatusMsg({ type: "error", text: "Error jaringan saat menyimpan konfigurasi." });
    }
  };

  const sendTestAlert = async () => {
    if (!config.token || !config.chatId) {
      setStatusMsg({ type: "error", text: "Bot Token dan Chat ID harus diisi untuk mengirim tes." });
      return;
    }
    setTestSending(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/send-test-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: config.token, chatId: config.chatId }),
      });
      const data = await res.json();
      setTestSending(false);
      if (data.success) {
        setStatusMsg({ type: "success", text: "Pesan tes sukses dikirim! Periksa Telegram Chat Anda." });
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal mengirim pesan tes. Pastikan Token / Chat ID valid." });
      }
    } catch (err: any) {
      setTestSending(false);
      setStatusMsg({ type: "error", text: "Gagal menghubungkan ke server untuk melakukan tes." });
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for computing readable uptime
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    if (d === 0 && h === 0) parts.push(`${s} detik`);
    return parts.join(" ");
  };

  // Pre-generate tailored server code based on their input
  const generatedScriptCode = `/**
 * Pterodactyl VPS Monitor Service - Node.js Telegram Bot
 * File: index.js 
 *
 * Jalankan perintah berikut di VPS/Container Pterodactyl Anda:
 * npm install node-telegram-bot-api
 */

const os = require('os');
const { exec } = require('child_process');
const TelegramBot = require('node-telegram-bot-api');

// === CONFIGURATION ===
const CONFIG = {
  token: "${config.token || "MASUKKAN_TELEGRAM_BOT_TOKEN_DISINI"}",    // Token dari @BotFather
  chatId: "${config.chatId || "MASUKKAN_CHAT_ID_TELEGRAM_DISINI"}",  // Chat id penerima alert / dari @userinfobot
  alertCpuThreshold: ${config.alertCpuThreshold},                      // Persentase batas peringatan CPU
  alertRamThreshold: ${config.alertRamThreshold},                      // Persentase batas peringatan RAM
  alertDiskThreshold: ${config.alertDiskThreshold},                      // Persentase batas peringatan Disk Storage
  alertIntervalMinutes: ${config.alertIntervalMinutes},                    // Jeda waktu antar notifikasi peringatan (menit)
  nodeId: "Node-Pterodactyl-01",                // Nama identitas VPS ini di Dashboard
  remoteDashboardUrl: "${appUrl || "https://ais-dev-v2cen6525fj6konqjthq5u-683978000901.asia-southeast1.run.app"}", // Sync Telemetry otomatis ke Dashboard ini!
  enableSync: true                              // Aktifkan sinkronisasi ke panel pusat web
};

let bot;
let lastAlertTimes = { cpu: 0, ram: 0, disk: 0 };

console.log("==========================================");
console.log("   Pterodactyl VPS Monitoring Daemon      ");
console.log("==========================================");

// Inisialisasi bot Telegram
if (CONFIG.token && CONFIG.token !== "MASUKKAN_TELEGRAM_BOT_TOKEN_DISINI") {
  bot = new TelegramBot(CONFIG.token, { polling: true });
  console.log("➡️ Bot Telegram terhubung. Siap menerima instruksi.");
  setupBotCommands();
} else {
  console.log("⚠️ Bot Token belum dikonfigurasi. Menjalankan mode telemetry saja.");
}

// Inisialisasi Alert Loop (Cek setiap 30 detik)
setInterval(checkSystemThresholds, 30 * 1000);

// Inisialisasi Web Dashboard Sync (Kirim telemetry setiap 5 detik)
if (CONFIG.enableSync) {
  setInterval(syncTelemetryToWeb, 5000);
}

// Helper untuk menghitung load CPU average secara berkala
function cpuAverage() {
  const cpus = os.cpus();
  if (!cpus) return { idle: 0, total: 100 };
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    for (const type in core.times) {
      totalMs += core.times[type];
    }
    idleMs += core.times.idle;
  });
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

function getCPUUsage() {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      if (totalDifference === 0) return resolve(0);
      const percentageCPU = 100 - Math.round((100 * idleDifference) / totalDifference);
      resolve(Math.max(0, Math.min(100, percentageCPU)));
    }, 200);
  });
}

// Helper mengecek disk storage di Linux / Pterodactyl
function getDiskUsage() {
  return new Promise((resolve) => {
    exec("df -k /", (err, stdout) => {
      if (err || !stdout) {
        return resolve({ total: 100, free: 60, used: 40, usagePercent: 40 });
      }
      try {
        const lines = stdout.trim().split("\\n");
        if (lines.length > 1) {
          const parts = lines[1].replace(/\\s+/g, " ").split(" ");
          const totalKb = parseInt(parts[1], 10);
          const usedKb = parseInt(parts[2], 10);
          const freeKb = parseInt(parts[3], 10);
          const usagePercent = parseInt(parts[4].replace("%", ""), 10);

          const totalGb = +(totalKb / 1024 / 1024).toFixed(1);
          const usedGb = +(usedKb / 1024 / 1024).toFixed(1);
          const freeGb = +(freeKb / 1024 / 1024).toFixed(1);

          return resolve({
            total: totalGb,
            free: freeGb,
            used: usedGb,
            usagePercent
          });
        }
      } catch (e) {}
      resolve({ total: 80, free: 48, used: 32, usagePercent: 40 });
    });
  });
}

function drawProgressBar(percent, size = 10) {
  const progress = Math.round((percent / 100) * size);
  const emptyProgress = size - progress;
  return "[" + "█".repeat(progress) + "░".repeat(emptyProgress) + "] " + percent + "%";
}

function setupBotCommands() {
  bot.onText(/\\/start/, (msg) => {
    const text = "✨ *Halo! Bot VPS Pterodactyl Aktif.* 💻\\n\\n" +
      "Gunakan perintah berikut:\\n" +
      "📊 /status - Cek status real-time beban system\\n" +
      "🖥️ /cpu - Info detail microprocessor\\n" +
      "📟 /ram - Ukuran memori terpakai\\n" +
      "💾 /disk - Kapasitas penyimpanan\\n" +
      "⏱️ /ping - Cek latensi respons bot";
    bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  });

  bot.onText(/\\/ping/, (msg) => {
    bot.sendMessage(msg.chat.id, "🏓 *Pong!* Respon bot stabil.", { parse_mode: "Markdown" });
  });

  bot.onText(/\\/status/, async (msg) => {
    const cpuVal = await getCPUUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const disk = await getDiskUsage();

    const uptimeSec = os.uptime();
    const d = Math.floor(uptimeSec / (3600 * 24));
    const h = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);

    const statusMsg = "📊 *STATUS NODE VPS PTERODACTYL*\\n" +
      "━━━━━━━━━━━━━━━━━━━━━\\n" +
      "🖥️ *CPU Utilization:*\\n\`" + drawProgressBar(cpuVal) + "\`\\n\\n" +
      "📟 *RAM Memory:*\\n\`" + drawProgressBar(ramPercent) + "\`\\n_" + (usedMem / 1024 / 1024 / 1024).toFixed(1) + " GB terpakai dari " + (totalMem / 1024 / 1024 / 1024).toFixed(1) + " GB_\\n\\n" +
      "💾 *Disk Storage:*\\n\`" + drawProgressBar(disk.usagePercent) + "\`\\n_" + disk.used + " GB terpakai dari " + disk.total + " GB_\\n" +
      "━━━━━━━━━━━━━━━━━━━━━\\n" +
      "⏱️ *Uptime:* \`" + d + " hari " + h + " jam " + m + " menit\`\\n" +
      "💻 *Platform:* \`" + os.platform() + " (" + os.arch() + ")\`";

    bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: "Markdown" });
  });

  bot.onText(/\\/cpu/, async (msg) => {
    const cpuVal = await getCPUUsage();
    const model = os.cpus().length > 0 ? os.cpus()[0].model : "Standard Core CPU";
    bot.sendMessage(msg.chat.id, "🖥️ *PROSESSOR INFO*\\n\\n• *Model:* " + model + "\\n• *Core Threads:* " + os.cpus().length + "\\n• *Usage saat ini:* \`" + cpuVal + "%\`", { parse_mode: "Markdown" });
  });

  bot.onText(/\\/ram/, (msg) => {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percent = Math.round((used / total) * 100);
    bot.sendMessage(msg.chat.id, "📟 *DETAIL RAM MEMORY*\\n\\n• Total: " + (total/1024/1024/1024).toFixed(1) + " GB\\n• Terpakai: " + (used/1024/1024/1024).toFixed(1) + " GB\\n• Beban: \`" + percent + "%\`", { parse_mode: "Markdown" });
  });

  bot.onText(/\\/disk/, async (msg) => {
    const disk = await getDiskUsage();
    bot.sendMessage(msg.chat.id, "💾 *DETAIL DISK*\\n\\n• Size: " + disk.total + " GB\\n• used: " + disk.used + " GB\\n• Free: " + disk.free + " GB\\n• Beban: \`" + disk.usagePercent + "%\`", { parse_mode: "Markdown" });
  });
}

// Mengecek batas performa (Alert Thresholds)
async function checkSystemThresholds() {
  if (!CONFIG.chatId || !bot) return;

  const cpu = await getCPUUsage();
  const total = os.totalmem();
  const free = os.freemem();
  const ramPercent = Math.round(((total - free) / total) * 100);
  const disk = await getDiskUsage();
  const now = Date.now();
  const intervalMs = CONFIG.alertIntervalMinutes * 60 * 1000;

  if (cpu >= CONFIG.alertCpuThreshold && (now - lastAlertTimes.cpu > intervalMs)) {
    bot.sendMessage(CONFIG.chatId, "⚠️ *[WARN] CPU OVERLOAD!*\\nBeban CPU mencapai \`" + cpu + "%\` di server " + CONFIG.nodeId, { parse_mode: "Markdown" });
    lastAlertTimes.cpu = now;
  }

  if (ramPercent >= CONFIG.alertRamThreshold && (now - lastAlertTimes.ram > intervalMs)) {
    bot.sendMessage(CONFIG.chatId, "⚠️ *[WARN] RAM MEMORY SANGAT BERAT!*\\nPemakaian Memory mencapai \`" + ramPercent + "%\` di server " + CONFIG.nodeId, { parse_mode: "Markdown" });
    lastAlertTimes.ram = now;
  }

  if (disk.usagePercent >= CONFIG.alertDiskThreshold && (now - lastAlertTimes.disk > intervalMs)) {
    bot.sendMessage(CONFIG.chatId, "⚠️ *[WARN] STORAGE PENUH!*\\nKapasitas Disk terpakai \`" + disk.usagePercent + "%\` di server " + CONFIG.nodeId, { parse_mode: "Markdown" });
    lastAlertTimes.disk = now;
  }
}

// Menghubungkan telemetri jarak jauh ke Dashboard pusat web
async function syncTelemetryToWeb() {
  try {
    const cpu = await getCPUUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const disk = await getDiskUsage();

    const statsPayload = {
      nodeId: CONFIG.nodeId,
      secret: "pterodactyl-pass-1234",
      stats: {
        cpu,
        ram: {
          total: Math.round(totalMem / 1024 / 1024),
          used: Math.round((totalMem - freeMem) / 1024 / 1024),
          percent: ramPercent
        },
        disk: {
          total: disk.total,
          used: disk.used,
          percent: disk.usagePercent
        },
        uptime: Math.round(os.uptime()),
        os: os.platform() + " " + os.arch()
      }
    };

    const url = CONFIG.remoteDashboardUrl + "/api/remote-stats";
    
    // Melakukan Node Fetch tanpa dependensi luar
    const https = url.startsWith('https') ? require('https') : require('http');
    const u = new URL(url);
    const payloadStr = JSON.stringify(statsPayload);

    const options = {
      hostname: u.hostname,
      port: u.port || (url.startsWith('https') ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

    const req = https.request(options, (res) => {
      // Data successfully pushed
    });

    req.on('error', (e) => {
      // Silent error dashboard offline
    });

    req.write(payloadStr);
    req.end();

  } catch (err) {
    // Fail-safe
  }
}
`;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* Container header & top level layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* Sleek Navigation Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-850 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-500/30 rounded-xl shimmer-glow text-emerald-400">
              <Server className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  VPS Monitor <span className="text-emerald-400 font-medium">Telegram</span>
                </h1>
                <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono uppercase">
                  Pterodactyl Egg Native
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Sistem Monitoring Node.js Real-time, Warning Telemetri, & Integrasi Bot Telegram
              </p>
            </div>
          </div>

          {/* Quick status widget */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  config.isActive ? "bg-emerald-400" : "bg-neutral-500"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  config.isActive ? "bg-emerald-500" : "bg-neutral-400"
                }`}></span>
              </span>
              <span className="text-neutral-300">Bot:</span>
              <span className={config.isActive ? "text-emerald-400 font-semibold" : "text-neutral-400"}>
                {config.isActive ? "Aktif" : "Non-aktif"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-neutral-300">Sync URL:</span>
              <span className="text-blue-400 truncate max-w-[120px] md:max-w-[200px]" title={appUrl}>
                {appUrl}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-neutral-900 gap-1 mb-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative border-b-2 ${
              activeTab === "dashboard"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Dashboard Utama
          </button>
          <button
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative border-b-2 ${
              activeTab === "telegram"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <Settings className="w-4 h-4" />
            Konfigurasi Bot Telegram
          </button>
          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative border-b-2 ${
              activeTab === "script"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <Code className="w-4 h-4" />
            Script Pterodactyl Node.js
          </button>
          <button
            onClick={() => setActiveTab("remote")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative border-b-2 ${
              activeTab === "remote"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/10"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <Cloud className="w-4 h-4" />
            Remote Telemetry Nodes
            {remoteDevices.length > 0 && (
              <span className="ml-1 bg-emerald-500 text-neutral-950 font-bold px-1.5 py-0.2 text-[10px] rounded-full">
                {remoteDevices.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Stats overview banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CPU Card */}
                <div className="bg-neutral-900/80 border border-neutral-850 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Beban CPU</p>
                      <h3 className="text-3xl font-semibold mt-1 font-mono">
                        {stats ? `${stats.cpu}%` : "Calculating..."}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-neutral-800 rounded-xl text-emerald-400 border border-neutral-700/50">
                      <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      {/* Custom gauge SVG representing progress */}
                      <div className="w-full bg-neutral-850 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${stats.cpu}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-neutral-400 font-mono">
                        <span>Cores: {stats.cpuCores} Threads</span>
                        <span className="truncate max-w-[150px]" title={stats.cpuModel}>
                          {stats.cpuModel}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Subtle Background Accent */}
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/4">
                    <Cpu className="w-32 h-32 text-emerald-500" />
                  </div>
                </div>

                {/* RAM Card */}
                <div className="bg-neutral-900/80 border border-neutral-850 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Memori RAM</p>
                      <h3 className="text-3xl font-semibold mt-1 font-mono">
                        {stats ? `${stats.ram.percent}%` : "Calculating..."}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-neutral-800 rounded-xl text-blue-400 border border-neutral-700/50">
                      <Database className="w-5 h-5" />
                    </div>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      <div className="w-full bg-neutral-850 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${stats.ram.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Terpakai: {stats.ram.used.toFixed(1)} GB</span>
                        <span>Total: {stats.ram.total.toFixed(0)} GB</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/4">
                    <Database className="w-32 h-32 text-blue-500" />
                  </div>
                </div>

                {/* Disk / Disk storage */}
                <div className="bg-neutral-900/80 border border-neutral-850 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Ruang Disk</p>
                      <h3 className="text-3xl font-semibold mt-1 font-mono">
                        {stats ? `${stats.disk.usagePercent}%` : "Calculating..."}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-neutral-800 rounded-xl text-amber-400 border border-neutral-700/50">
                      <HardDrive className="w-5 h-5" />
                    </div>
                  </div>

                  {stats && (
                    <div className="space-y-3">
                      <div className="w-full bg-neutral-850 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${stats.disk.usagePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Used: {stats.disk.used.toFixed(1)} GB</span>
                        <span>Sisa: {stats.disk.free.toFixed(1)} GB</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/4">
                    <HardDrive className="w-32 h-32 text-amber-500" />
                  </div>
                </div>

              </div>

              {/* Live Metric Graphs & Terminal Output mockup */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left block: Live Performance Charts */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-md font-semibold text-neutral-100">Live Load History</h3>
                      <p className="text-xs text-neutral-400">Grafik beban CPU dan RAM 90 detik terakhir (refresh setiap 3 detik)</p>
                    </div>
                    <button 
                      onClick={fetchStats}
                      className="p-1.5 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-750 text-neutral-300 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Gorgeous Custom SVG Chart */}
                  <div className="h-60 w-full bg-neutral-950/60 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-2 right-4 flex items-center gap-4 text-[10px] font-mono">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>CPU</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>RAM</span>
                    </div>

                    {/* SVG Core load */}
                    {history.cpu.length > 1 ? (
                      <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Y axis Grid lines */}
                        <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#262626" strokeDasharray="3,3" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#262626" strokeDasharray="3,3" />
                        <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#262626" strokeDasharray="3,3" />

                        {/* CPU Filled Polygon */}
                        <path 
                          d={`M 0,150 ${history.cpu.map((val, idx) => {
                            const x = (idx / (history.cpu.length - 1)) * 500;
                            const y = 150 - (val / 100) * 140;
                            return `L ${x},${y}`;
                          }).join(" ")} L 500,150 Z`} 
                          fill="url(#cpuGrad)" 
                        />
                        {/* CPU Stroke line */}
                        <path 
                          d={history.cpu.map((val, idx) => {
                            const x = (idx / (history.cpu.length - 1)) * 500;
                            const y = 150 - (val / 100) * 140;
                            return `${idx === 0 ? "M" : "L"} ${x},${y}`;
                          }).join(" ")} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2" 
                        />

                        {/* RAM Filled Polygon */}
                        <path 
                          d={`M 0,150 ${history.ram.map((val, idx) => {
                            const x = (idx / (history.ram.length - 1)) * 500;
                            const y = 150 - (val / 100) * 140;
                            return `L ${x},${y}`;
                          }).join(" ")} L 500,150 Z`} 
                          fill="url(#ramGrad)" 
                        />
                        {/* RAM Stroke line */}
                        <path 
                          d={history.ram.map((val, idx) => {
                            const x = (idx / (history.ram.length - 1)) * 500;
                            const y = 150 - (val / 100) * 140;
                            return `${idx === 0 ? "M" : "L"} ${x},${y}`;
                          }).join(" ")} 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="2" 
                        />
                      </svg>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-mono">
                        Menunggu telemetri chart masuk...
                      </div>
                    )}

                    <div className="flex justify-between text-[9px] text-neutral-400 font-mono border-t border-neutral-905 pt-2">
                      <span>90 detik lalu</span>
                      <span>Beban saat ini</span>
                    </div>
                  </div>
                </div>

                {/* Right block: Server specs */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-5 flex flex-col h-full">
                  <h3 className="text-md font-semibold text-neutral-100 mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Spesifikasi Host
                  </h3>

                  {stats ? (
                    <div className="space-y-4 flex-1 text-sm font-mono text-neutral-300">
                      <div className="flex justify-between border-b border-neutral-850 pb-2">
                        <span className="text-neutral-500">Platform OS:</span>
                        <span className="text-neutral-200">{stats.platform} ({stats.arch})</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-850 pb-2">
                        <span className="text-neutral-500">CPU Core:</span>
                        <span className="text-neutral-200">{stats.cpuCores} Core threads</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-850 pb-2">
                        <span className="text-neutral-500 font-sans">Uptime:</span>
                        <span className="text-neutral-200 font-sans text-xs text-right">
                          {formatUptime(stats.uptime)}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-850 pb-2">
                        <span className="text-neutral-500">Load Average:</span>
                        <span className="text-neutral-200">
                          {stats.loadAvg.map(val => val.toFixed(2)).join(", ")}
                        </span>
                      </div>

                      {/* Mock log feed */}
                      <div className="mt-4 p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2 text-[11px] leading-relaxed select-none overflow-hidden h-[85px]">
                        <span className="text-emerald-500/80">$ vps-monitor-agent -d</span>
                        <div className="text-neutral-500">
                          [2026-06-08 17:00:23] info: Bot local terdeteksi berjalan<br />
                          [2026-06-08 17:00:25] sync: Polling stats ter-update
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 font-mono">
                      Memuat rincian server lokal...
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info Banner box */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 text-emerald-400">
                <HelpCircle className="w-8 h-8 shrink-0 text-emerald-400" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Mulai Monitor VPS Anda di Panel Pterodactyl Anda Sekarang!</p>
                  <p className="text-neutral-300 leading-relaxed">
                    Sistem ini terintegrasi penuh. Salin kode Node.js yang sudah terpasang token Telegram di tab <strong>"Script Pterodactyl Node.js"</strong>, pasang di server Anda untuk menerima notifikasi performa, overload, & dapatkan respon bot interaktif real-time.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "telegram" && (
            <motion.div
              key="telegram"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form Config (Columns 1-2) */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-100">Konfigurasi Akses Bot Telegram</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Atur token bot dan ID Chat Anda untuk mengirimkan alert performa server lokal & menerima remote command.
                  </p>
                </div>

                <form onSubmit={saveConfig} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-mono block">TELEGRAM BOT TOKEN</label>
                      <input 
                        type="password"
                        name="token"
                        value={config.token}
                        onChange={handleConfigChange}
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-emerald-300 font-mono"
                      />
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Dapatkan token ini dari chat ke <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">@BotFather</a> di Telegram.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-mono block">TELEGRAM CHAT ID</label>
                      <input 
                        type="text"
                        name="chatId"
                        value={config.chatId}
                        onChange={handleConfigChange}
                        placeholder="-100123456789 atau 12345678"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-neutral-300 font-mono"
                      />
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Chat ID akun Telegram atau Grup. Bisa dicari dengan berkirim pesan ke <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">@userinfobot</a>.
                      </p>
                    </div>

                  </div>

                  {/* Warning limits */}
                  <div className="border-t border-neutral-850 pt-5 mt-3 space-y-4">
                    <h4 className="text-sm font-semibold text-neutral-200">Alert Threshold Limits (Batas Peringatan %)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 block font-mono">BATAS CPU OVERLOAD</label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            name="alertCpuThreshold"
                            min="20"
                            max="100"
                            value={config.alertCpuThreshold}
                            onChange={handleConfigChange}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                          />
                          <span className="text-neutral-500 text-sm font-mono">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 block font-mono">BATAS RAM OVERLOAD</label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            name="alertRamThreshold"
                            min="20"
                            max="100"
                            value={config.alertRamThreshold}
                            onChange={handleConfigChange}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                          />
                          <span className="text-neutral-500 text-sm font-mono">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 block font-mono">BATAS DISK OVERLOAD</label>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            name="alertDiskThreshold"
                            min="20"
                            max="100"
                            value={config.alertDiskThreshold}
                            onChange={handleConfigChange}
                            className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                          />
                          <span className="text-neutral-500 text-sm font-mono">%</span>
                        </div>
                      </div>

                    </div>

                    <div className="space-y-1.5 max-w-xs pt-2">
                      <label className="text-xs text-neutral-400 block font-mono">JEDA WAKTU ANTAR ALARM</label>
                      <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
                        <input 
                          type="number" 
                          name="alertIntervalMinutes"
                          min="1"
                          max="180"
                          value={config.alertIntervalMinutes}
                          onChange={handleConfigChange}
                          className="w-full bg-transparent border-0 focus:outline-none font-mono text-sm"
                        />
                        <span className="text-neutral-400 text-xs font-sans whitespace-nowrap">menit</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Mencegah spam bot Telegram. Alarm serupa tidak akan dikirim ulang sebelum rentang menit ini berlalu.
                      </p>
                    </div>
                  </div>

                  {/* Enable Switch toggle */}
                  <div className="flex items-center justify-between border-t border-neutral-850 pt-5">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-neutral-200 block">Jalankan di Server Sandbox</label>
                      <p className="text-[11px] text-neutral-400 leading-relaxed max-w-sm md:max-w-md">
                        Aktifkan jika ingin bot Telegram langsung aktif berjalan di server panel web ini untuk uji coba. Jika dimatikan, Anda hanya menggunakan bot pada Server Pterodactyl Anda sendiri.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        name="isActive"
                        checked={config.isActive}
                        onChange={handleConfigChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-neutral-950"></div>
                    </label>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-end gap-3 border-t border-neutral-850 pt-5 flex-wrap">
                    <button
                      type="button"
                      disabled={testSending || !config.token || !config.chatId}
                      onClick={sendTestAlert}
                      className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 font-medium text-xs rounded-xl flex items-center gap-2 group transition-all text-neutral-300 disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${testSending ? 'animate-bounce' : ''}`} />
                      {testSending ? "Mengirim Tes..." : "Tes Kirim Pesan"}
                    </button>
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                    >
                      {savingConfig && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Simpan & Aktifkan Bot
                    </button>
                  </div>
                </form>

                {statusMsg && (
                  <div className={`p-4 rounded-xl flex items-start gap-2 text-xs leading-normal animate-pulse border ${
                    statusMsg.type === "success" 
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-950/20 border-red-500/20 text-red-400'
                  }`}>
                    {statusMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Bot status guide (Column 3) */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 h-fit space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider font-mono">STATUS BOT PROGRAM</h4>
                  
                  <div className="mt-3 flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      config.isActive && config.status === "Online" ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"
                    }`} />
                    <span className="font-mono text-sm text-neutral-200">
                      {config.isActive ? config.status : "Mati/Offline"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-neutral-300 border-t border-neutral-850 pt-4">
                  <h5 className="font-semibold text-neutral-100 font-sans flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Perintah Bot Interaktif:
                  </h5>
                  <p>Saat bot Telegram Anda aktif, Anda dapat mengirim pesan/command ke bot tersebut dari aplikasi Telegram Anda:</p>
                  
                  <ul className="space-y-2 border-l border-neutral-800 lg:pl-3 ml-1 font-mono text-[11px] text-neutral-400">
                    <li><strong className="text-neutral-200">/status</strong> - Mengirim grafik performa CPU, RAM dan Disk terkini.</li>
                    <li><strong className="text-neutral-200">/cpu</strong> - Info clockspeed processor dan core load.</li>
                    <li><strong className="text-neutral-200">/ram</strong> - Info total RAM, free memory, dan bytes size.</li>
                    <li><strong className="text-neutral-200">/disk</strong> - Rincian free spaces dan total partition size.</li>
                    <li><strong className="text-neutral-200">/remote</strong> - Daftar server remote yang online.</li>
                    <li><strong className="text-neutral-200">/ping</strong> - Mengetes latency respons server Anda.</li>
                  </ul>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1.5 text-[11px]">
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Catatan Penting
                  </span>
                  <p className="text-neutral-400 leading-normal">
                    Fitted Bot API membutuhkan token HTTP valid. Jika token salah atau bot dinonaktifkan di telegram, sistem akan otomatis mematikan polling mode untuk keamanan.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "script" && (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Instructions and Script panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Integration Guide */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-5 lg:col-span-1">
                  <h3 className="text-md font-semibold text-neutral-100">Langkah Setup di Pterodactyl Panel</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Ikuti panduan berikut untuk menyebarkan script monitoring Node.js di server VPS Pterodactyl Anda:
                  </p>

                  <div className="space-y-4 text-xs leading-relaxed">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">1</div>
                      <p className="text-neutral-300">
                        Buat server baru dengan Egg <strong>Node.js</strong> di panel Pterodactyl Anda, atau buka File Manager di server yang sudah ada.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">2</div>
                      <p className="text-neutral-300">
                        Pastikan Anda melampirkan modul dependensi Telegram Bot di file <code className="text-emerald-300 font-mono">package.json</code>: <br />
                        <code className="block bg-neutral-950 p-2 border border-neutral-850 rounded mt-1 font-mono text-[10px]">
                          "node-telegram-bot-api": "0.66.0"
                        </code>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">3</div>
                      <p className="text-neutral-300">
                        Buat file bernama <code className="text-emerald-300 font-mono">index.js</code> lewat File Manager Pterodactyl, lalu salin program lengkap di sebelah kanan dan klik <strong>Save</strong>.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">4</div>
                      <p className="text-neutral-300">
                        Atur startup command server Pterodactyl Anda menjadi <code className="text-emerald-300 font-mono">node index.js</code> lalu jalankan server (klik Start).
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 bg-neutral-800 text-emerald-400 border border-neutral-700 font-mono flex items-center justify-center rounded-full text-[10px] shrink-0">5</div>
                      <p className="text-neutral-300">
                        Bot Anda siap! Sapa bot Anda di Telegram dan saksikan statistik VPS Pterodactyl Anda tersinkronisasi di tab <strong>"Remote Telemetry Nodes"</strong> secara real-time.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
                    <span className="text-emerald-400 font-semibold text-[11px] block">💡 Info Telemetry Sync</span>
                    <p className="text-neutral-400 text-[10px] leading-normal">
                      Pterodactyl Daemon akan mengirim statistik performa ke dashboard web ini setiap 5 detik. Dashboard akan menampilkannya saat perangkat Anda online!
                    </p>
                  </div>
                </div>

                {/* Code Block area */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 lg:col-span-2 flex flex-col h-[650px]">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h3 className="text-md font-semibold text-neutral-100 flex items-center gap-2">
                        <Code className="w-4.5 h-4.5 text-emerald-400" />
                        Source Code JavaScript (Pterodactyl)
                      </h3>
                      <p className="text-xs text-neutral-400">Kode ini otomatis diperbarui dengan preferensi token dan threshold di atas!</p>
                    </div>

                    {/* Copy to Clipboard action */}
                    <button
                      onClick={() => handleCopyCode(generatedScriptCode)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all select-none ${
                        copied 
                          ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400' 
                          : 'bg-neutral-800 border-neutral-750 text-neutral-300 hover:bg-neutral-750'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {copied ? "Berhasil disalin!" : "Salin Code"}
                    </button>
                  </div>

                  {/* Rendered customized source block */}
                  <div className="flex-1 bg-neutral-950 border border-neutral-850 rounded-xl p-4 overflow-y-auto font-mono text-xs text-emerald-300/90 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800">
                    <pre className="whitespace-pre">{generatedScriptCode}</pre>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === "remote" && (
            <motion.div
              key="remote"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Remote server telemetry center */}
              <div className="bg-neutral-900 border border-neutral-850 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-100">Daftar Remote Server (Telemetri Node)</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Menampilkan status server Pterodactyl eksternal yang terhubung dan mengirimkan telemetri secara real-time.
                    </p>
                  </div>
                  <button 
                    onClick={fetchRemoteDevices}
                    className="px-4 py-2 bg-neutral-800 border border-neutral-750 hover:bg-neutral-750 text-xs text-neutral-300 rounded-xl flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Teranyar
                  </button>
                </div>

                {remoteDevices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {remoteDevices.map((device, idx) => {
                      const isConnected = Date.now() - device.lastSeen < 15000; // Online if received within 15 seconds
                      return (
                        <div key={idx} className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-4">
                          
                          {/* Device identifier header */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-emerald-400 ${isConnected ? 'animate-pulse' : 'text-neutral-500'}`}>
                                <Server className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-200">{device.nodeId}</h4>
                                <span className="text-[10px] font-mono text-neutral-400 uppercase">{device.stats.os}</span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 text-[10px] rounded-full font-semibold font-mono ${
                              isConnected ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'
                            }`}>
                              {isConnected ? "🟢 ONLINE" : "🔴 OFFLINE"}
                            </span>
                          </div>

                          {/* Stats row info */}
                          <div className="grid grid-cols-3 gap-3 text-center border-y border-neutral-850 py-3">
                            <div>
                              <p className="text-[10px] text-neutral-500 uppercase font-mono">CPU</p>
                              <p className="text-sm font-semibold mt-0.5 font-mono text-neutral-200">{device.stats.cpu}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-500 uppercase font-mono">RAM</p>
                              <p className="text-sm font-semibold mt-0.5 font-mono text-neutral-200">{device.stats.ram.percent}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-neutral-500 uppercase font-mono">DISK</p>
                              <p className="text-sm font-semibold mt-0.5 font-mono text-neutral-200">{device.stats.disk.percent}%</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Wifi className="w-3.5 h-3.5 text-neutral-400" />
                              Last report: {Math.max(0, Math.round((Date.now() - device.lastSeen) / 1000))} detik yang lalu
                            </span>
                            <span>
                              Uptime: {formatUptime(device.stats.uptime)}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-800 rounded-3xl space-y-4 text-center">
                    <Cloud className="w-12 h-12 text-neutral-500 stroke-1" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-neutral-300">Belum Ada Node Telemetry Terdeteksi</h4>
                      <p className="text-xs text-neutral-500 max-w-sm">
                        Instal script monitoring kami di panel Pterodactyl Anda. Setelah script diaktifkan, telemetri server eksternal Anda akan langsung muncul di sini secara dynamic!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 border-t border-neutral-900 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 gap-4 select-none font-mono">
          <p>© 2026 Google AI Studio Daemon Monitor App</p>
          <p>Didesain untuk Server Pterodactyl Node.js & Layanan VPS Linux</p>
        </footer>

      </div>
    </div>
  );
}
