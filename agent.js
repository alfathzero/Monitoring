/**
 * 🛰️ SATELLITE VPS TELEMETRY SENDER AGENT
 * This script runs on any remote node, VPS, or Pterodactyl container.
 * It sends hardware utilization data (CPU, RAM, Disk, Uptime) back to your primary dashboard.
 * 
 * Usage:
 *   node agent.js --nodeId="MyNodeName" --remoteUrl="https://your-dashboard.run.app" --secret="satellite-vps-secret"
 *   
 * Or via Environment Variables:
 *   NODE_ID="MyNodeName" REMOTE_URL="https://your-dashboard.run.app" node agent.js
 */

const os = require('os');
const { exec } = require('child_process');
const http = require('http');
const https = require('https');

// Parse CLI Arguments
function parseArgs() {
  const args = {};
  process.argv.forEach((val) => {
    if (val.startsWith('--')) {
      const parts = val.substring(2).split('=');
      if (parts.length === 2) {
        args[parts[0]] = parts[1];
      }
    }
  });
  return args;
}

const args = parseArgs();

function sanitize(val) {
  if (!val) return "";
  let str = String(val).trim();
  while ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

function normalizeRemoteUrl(inputUrl) {
  if (!inputUrl) return "";
  let urlStr = inputUrl.trim();
  
  // Add protocol prefix if missing (default to http:// for IP:PORT setup)
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = "http://" + urlStr;
  }
  
  try {
    const parsed = new URL(urlStr);
    // Automatically append /api/remote-stats if path is missing or incomplete
    if (parsed.pathname === "/" || parsed.pathname === "") {
      parsed.pathname = "/api/remote-stats";
    } else if (!parsed.pathname.endsWith("/api/remote-stats") && !parsed.pathname.endsWith("/api/remote-stats/")) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "") + "/api/remote-stats";
    }
    return parsed.toString();
  } catch (e) {
    return urlStr;
  }
}

// Configuration Priority: CLI Args > Env Vars > Defaults
const rawRemoteUrl = sanitize(args.remoteUrl || process.env.REMOTE_URL || "");
const CONFIG = {
  nodeId: sanitize(args.nodeId || process.env.NODE_ID || "VPS-Node-Satellite"),
  secret: sanitize(args.secret || process.env.SECRET || "satellite-vps-secret"),
  remoteUrl: normalizeRemoteUrl(rawRemoteUrl),
  syncIntervalMs: parseInt(args.interval || process.env.INTERVAL || "5000", 10)
};

console.log("\n==================================================");
console.log("🛰️   SATELLITE TELEMETRY SENDER AGENT DAEMON        ");
console.log("==================================================");
console.log(`NODE ID     : ${CONFIG.nodeId}`);
console.log(`RECEIVER URL: ${CONFIG.remoteUrl || "⚠️ BELUM DIATUR! Gunakan parameter --remoteUrl"}`);
console.log(`INTERVAL    : ${CONFIG.syncIntervalMs}ms`);
console.log("==================================================\n");

if (!CONFIG.remoteUrl) {
  console.error("❌ ERROR: URL Web Dashboard Penerima (remoteUrl) harus ditentukan.");
  console.error("Silakan jalankan script dengan argumen:");
  console.error("  node agent.js --nodeId=\"NamaNode\" --remoteUrl=\"https://url-dashboard-anda.com\"\n");
  process.exit(1);
}

// Track previous CPU ticks to calculate precise load percentage
function cpuAverage() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return { idle: 0, total: 100 };
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

let lastCpu = cpuAverage();

// Calculate Disk space usage
function getDiskUsage() {
  return new Promise((resolve) => {
    exec("df -Pk /", (err, stdout) => {
      if (err) {
        return resolve({ used: 0, total: 1, percent: 0 });
      }
      const lines = stdout.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].replace(/\s+/g, ' ').split(' ');
        if (parts.length > 4) {
          const totalKB = parseInt(parts[1], 10);
          const usedKB = parseInt(parts[2], 10);
          const percent = parseInt(parts[4].replace('%', ''), 10);
          return resolve({
            used: totalKB > 0 ? (usedKB / 1024 / 1024) : 0,
            total: totalKB > 0 ? (totalKB / 1024 / 1024) : 1,
            percent: isNaN(percent) ? 0 : percent
          });
        }
      }
      resolve({ used: 0, total: 1, percent: 0 });
    });
  });
}

// === GEOLOCATION AUTO-DETECT (berdasarkan IP publik, dengan cache) ===
let geoCache = null;

function fetchJson(urlStr, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === "https:" ? https : http;
      const req = client.get({ hostname: u.hostname, path: u.pathname + (u.search || ""), port: u.port || (u.protocol === "https:" ? 443 : 80), timeout: timeoutMs }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      });
      req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
      req.on("error", reject);
    } catch (e) { reject(e); }
  });
}

async function getGeoLocation() {
  if (geoCache) return geoCache;
  // Coba beberapa provider gratis, fallback ke null jika semua gagal
  const providers = [
    { url: "http://ip-api.com/json/?fields=status,country,countryCode,city,query", parse: (d) => d.status === "success" ? { country: d.country, countryCode: d.countryCode, city: d.city, ip: d.query } : null },
    { url: "https://ipapi.co/json/", parse: (d) => d.country_name ? { country: d.country_name, countryCode: d.country_code, city: d.city, ip: d.ip } : null },
    { url: "https://ipwho.is/", parse: (d) => d.success !== false && d.country ? { country: d.country, countryCode: d.country_code, city: d.city, ip: d.ip } : null }
  ];
  for (const p of providers) {
    try {
      const parsed = p.parse(await fetchJson(p.url));
      if (parsed && parsed.countryCode) {
        geoCache = parsed;
        return geoCache;
      }
    } catch (e) { /* lanjut provider berikutnya */ }
  }
  return null; // Jangan pernah fallback ke lokasi ngasal
}

// Main Telemetry loop function
async function sendTelemetry() {
  try {
    const endCpu = cpuAverage();
    const idleDiff = endCpu.idle - lastCpu.idle;
    const totalDiff = endCpu.total - lastCpu.total;
    const cpuLoad = totalDiff > 0 ? Math.round(100 - (100 * idleDiff / totalDiff)) : 0;
    lastCpu = endCpu;

    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedRam = totalRam - freeRam;
    const ramPercent = totalRam > 0 ? Math.round((usedRam / totalRam) * 100) : 0;

    const disk = await getDiskUsage();
    const geo = await getGeoLocation();

    const payload = JSON.stringify({
      nodeId: CONFIG.nodeId,
      secret: CONFIG.secret,
      stats: {
        cpu: Math.max(0, Math.min(100, cpuLoad)),
        ram: {
          used: usedRam / 1024 / 1024 / 1024,
          total: totalRam / 1024 / 1024 / 1024,
          percent: ramPercent
        },
        disk: {
          used: disk.used,
          total: disk.total,
          percent: disk.percent
        },
        uptime: os.uptime(),
        os: `${os.type()} ${os.release()} (${os.arch()})`,
        cores: os.cpus().length,
        cpuModel: os.cpus().length > 0 ? os.cpus()[0].model : "Intel/AMD Processor",
        geo: geo
      }
    });

    const url = new URL(CONFIG.remoteUrl);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ""),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[${new Date().toLocaleTimeString()}] 🟢 Sinyal telemetry berhasil terkirim ke receiver utama.`);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Server merespon dengan status: ${res.statusCode}`);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[${new Date().toLocaleTimeString()}] 🔴 Gangguan jaringan: ${err.message}`);
    });

    req.write(payload);
    req.end();

  } catch (err) {
    console.error("Gagal mengumpulkan data atau mengirim telemetry: " + err.message);
  }
}

// Begin Interval reporting
setInterval(sendTelemetry, CONFIG.syncIntervalMs);
sendTelemetry();
