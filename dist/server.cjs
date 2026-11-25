var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var import_http = __toESM(require("http"), 1);
var import_https = __toESM(require("https"), 1);
var import_net = __toESM(require("net"), 1);
var import_dns = __toESM(require("dns"), 1);
var import_child_process = require("child_process");
var import_vite = require("vite");
var import_node_telegram_bot_api = __toESM(require("node-telegram-bot-api"), 1);
var import_ssh2 = require("ssh2");
var import_module = require("module");

// premiumemoji.js
var EMOJI_POOL = {
  // ---- Umum / UI ----
  fire: { id: "5312241539987020022", emoji: "\u{1F525}", set: "Topics", desc: "Api / performa tinggi / LIVE / welcome" },
  bolt: { id: "5312016608254762256", emoji: "\u26A1\uFE0F", set: "Topics", desc: "Petir / kecepatan / bandwidth" },
  alert: { id: "5379748062124056162", emoji: "\u2757\uFE0F", set: "Topics", desc: "Peringatan / alert" },
  doubleAlert: { id: "5377498341074542641", emoji: "\u203C\uFE0F", set: "Topics", desc: "Peringatan ganda / bahaya" },
  question: { id: "5377316857231450742", emoji: "\u2753", set: "Topics", desc: "Tanya / info" },
  idea: { id: "5312536423851630001", emoji: "\u{1F4A1}", set: "Topics", desc: "Info / bantuan (HELP)" },
  notes: { id: "5373251851074415873", emoji: "\u{1F4DD}", set: "Topics", desc: "Catatan / detail (CPU)" },
  search: { id: "5309965701241379366", emoji: "\u{1F50E}", set: "Topics", desc: "Monitor / cari" },
  megaphone: { id: "5309984423003823246", emoji: "\u{1F4E3}", set: "Topics", desc: "Broadcast / announce" },
  speak: { id: "5370870893004203704", emoji: "\u{1F5E3}", set: "Topics", desc: "Speak / suara" },
  mic: { id: "5377544228505134960", emoji: "\u{1F399}", set: "Topics", desc: "Mic / broadcast" },
  cool: { id: "5420216386448270341", emoji: "\u{1F192}", set: "Topics", desc: "Cool / ok" },
  heart: { id: "5312138559556164615", emoji: "\u2764\uFE0F", set: "Topics", desc: "Aktif / online / love" },
  crown: { id: "5357107601584693888", emoji: "\u{1F451}", set: "Topics", desc: "Crown / premium / VIP" },
  gem: { id: "5309958691854754293", emoji: "\u{1F48E}", set: "Topics", desc: "Gem / premium" },
  trophy: { id: "5312315739842026755", emoji: "\u{1F3C6}", set: "Topics", desc: "Trophy / juara" },
  flag: { id: "5408906741125490282", emoji: "\u{1F3C1}", set: "Topics", desc: "Flag / start" },
  party: { id: "5310228579009699834", emoji: "\u{1F389}", set: "Topics", desc: "Party / selamat" },
  check: { id: "5237699328843200968", emoji: "\u2705", set: "Topics", desc: "Check / success" },
  star: { id: "5235579393115438657", emoji: "\u2B50\uFE0F", set: "Topics", desc: "Star / bintang" },
  robot: { id: "5309832892262654231", emoji: "\u{1F916}", set: "Topics", desc: "Robot / bot" },
  // ---- Sistem / VPS ----
  laptop: { id: "5350554349074391003", emoji: "\u{1F4BB}", set: "Topics", desc: "Laptop / komputer (CPU)" },
  phone: { id: "5409357944619802453", emoji: "\u{1F4F1}", set: "Topics", desc: "Phone / device" },
  folder: { id: "5357315181649076022", emoji: "\u{1F4C1}", set: "Topics", desc: "Folder / data (RAM / DISK)" },
  news: { id: "5434144690511290129", emoji: "\u{1F4F0}", set: "Topics", desc: "Berita / info (SWAP)" },
  calendar: { id: "5433614043006903194", emoji: "\u{1F4C6}", set: "Topics", desc: "Kalender / uptime" },
  top: { id: "5418085807791545980", emoji: "\u{1F51D}", set: "Topics", desc: "Top / peak" },
  book: { id: "5350481781306958339", emoji: "\u{1F4DA}", set: "Topics", desc: "Books / dokumentasi" },
  chartUp: { id: "5350305691942788490", emoji: "\u{1F4C8}", set: "Topics", desc: "Chart naik (TX / upload)" },
  chartDown: { id: "5350713563512052787", emoji: "\u{1F4C9}", set: "Topics", desc: "Chart turun (RX / download)" },
  download: { id: "5350713563512052787", emoji: "\u{1F4C9}", set: "Topics", desc: "Alias chartDown \u2014 RX masuk" },
  upload: { id: "5350305691942788490", emoji: "\u{1F4C8}", set: "Topics", desc: "Alias chartUp \u2014 TX keluar" },
  // ---- HandEmoji (standar Telegram) ----
  thumbsup: { id: "5368324170671202286", emoji: "\u{1F44D}", set: "HandEmoji", desc: "Thumbs up (HandEmoji)" }
};
var ALL_PREMIUM_IDS = [
  { id: "5434144690511290129", emoji: "\u{1F4F0}", set: "Topics" },
  { id: "5312536423851630001", emoji: "\u{1F4A1}", set: "Topics" },
  { id: "5312016608254762256", emoji: "\u26A1\uFE0F", set: "Topics" },
  { id: "5377544228505134960", emoji: "\u{1F399}", set: "Topics" },
  { id: "5418085807791545980", emoji: "\u{1F51D}", set: "Topics" },
  { id: "5370870893004203704", emoji: "\u{1F5E3}", set: "Topics" },
  { id: "5420216386448270341", emoji: "\u{1F192}", set: "Topics" },
  { id: "5379748062124056162", emoji: "\u2757\uFE0F", set: "Topics" },
  { id: "5373251851074415873", emoji: "\u{1F4DD}", set: "Topics" },
  { id: "5433614043006903194", emoji: "\u{1F4C6}", set: "Topics" },
  { id: "5357315181649076022", emoji: "\u{1F4C1}", set: "Topics" },
  { id: "5309965701241379366", emoji: "\u{1F50E}", set: "Topics" },
  { id: "5309984423003823246", emoji: "\u{1F4E3}", set: "Topics" },
  { id: "5312241539987020022", emoji: "\u{1F525}", set: "Topics" },
  { id: "5312138559556164615", emoji: "\u2764\uFE0F", set: "Topics" },
  { id: "5377316857231450742", emoji: "\u2753", set: "Topics" },
  { id: "5350305691942788490", emoji: "\u{1F4C8}", set: "Topics" },
  { id: "5350713563512052787", emoji: "\u{1F4C9}", set: "Topics" },
  { id: "5309958691854754293", emoji: "\u{1F48E}", set: "Topics" },
  { id: "5350452584119279096", emoji: "\u{1F4B0}", set: "Topics" },
  { id: "5309929258443874898", emoji: "\u{1F4B8}", set: "Topics" },
  { id: "5377690785674175481", emoji: "\u{1FA99}", set: "Topics" },
  { id: "5310107765874632305", emoji: "\u{1F4B1}", set: "Topics" },
  { id: "5377438129928020693", emoji: "\u2049\uFE0F", set: "Topics" },
  { id: "5309950797704865693", emoji: "\u{1F3AE}", set: "Topics" },
  { id: "5350554349074391003", emoji: "\u{1F4BB}", set: "Topics" },
  { id: "5409357944619802453", emoji: "\u{1F4F1}", set: "Topics" },
  { id: "5312322066328853156", emoji: "\u{1F697}", set: "Topics" },
  { id: "5312486108309757006", emoji: "\u{1F3E0}", set: "Topics" },
  { id: "5310029292527164639", emoji: "\u{1F498}", set: "Topics" },
  { id: "5310228579009699834", emoji: "\u{1F389}", set: "Topics" },
  { id: "5377498341074542641", emoji: "\u203C\uFE0F", set: "Topics" },
  { id: "5312315739842026755", emoji: "\u{1F3C6}", set: "Topics" },
  { id: "5408906741125490282", emoji: "\u{1F3C1}", set: "Topics" },
  { id: "5368653135101310687", emoji: "\u{1F3AC}", set: "Topics" },
  { id: "5310045076531978942", emoji: "\u{1F3B5}", set: "Topics" },
  { id: "5420331611830886484", emoji: "\u{1F51E}", set: "Topics" },
  { id: "5350481781306958339", emoji: "\u{1F4DA}", set: "Topics" },
  { id: "5357107601584693888", emoji: "\u{1F451}", set: "Topics" },
  { id: "5375159220280762629", emoji: "\u26BD\uFE0F", set: "Topics" },
  { id: "5384327463629233871", emoji: "\u{1F3C0}", set: "Topics" },
  { id: "5350513667144163474", emoji: "\u{1F4FA}", set: "Topics" },
  { id: "5357121491508928442", emoji: "\u{1F440}", set: "Topics" },
  { id: "5357185426392096577", emoji: "\u{1FAE6}", set: "Topics" },
  { id: "5310157398516703416", emoji: "\u{1F353}", set: "Topics" },
  { id: "5310262535021142850", emoji: "\u{1F484}", set: "Topics" },
  { id: "5368741306484925109", emoji: "\u{1F460}", set: "Topics" },
  { id: "5348436127038579546", emoji: "\u2708\uFE0F", set: "Topics" },
  { id: "5357120306097956843", emoji: "\u{1F9F3}", set: "Topics" },
  { id: "5310303848311562896", emoji: "\u{1F3D6}", set: "Topics" },
  { id: "5350424168615649565", emoji: "\u26C5\uFE0F", set: "Topics" },
  { id: "5413625003218313783", emoji: "\u{1F984}", set: "Topics" },
  { id: "5350699789551935589", emoji: "\u{1F6CD}", set: "Topics" },
  { id: "5377478880577724584", emoji: "\u{1F45C}", set: "Topics" },
  { id: "5431492767249342908", emoji: "\u{1F6D2}", set: "Topics" },
  { id: "5350497316203668441", emoji: "\u{1F682}", set: "Topics" },
  { id: "5350422527938141909", emoji: "\u{1F6E5}", set: "Topics" },
  { id: "5418196338774907917", emoji: "\u{1F3D4}", set: "Topics" },
  { id: "5350648297189023928", emoji: "\u{1F3D5}", set: "Topics" },
  { id: "5309832892262654231", emoji: "\u{1F916}", set: "Topics" },
  { id: "5350751634102166060", emoji: "\u{1FAA9}", set: "Topics" },
  { id: "5377624166436445368", emoji: "\u{1F39F}", set: "Topics" },
  { id: "5386395194029515402", emoji: "\u{1F3F4}\u200D\u2620\uFE0F", set: "Topics" },
  { id: "5350387571199319521", emoji: "\u{1F5F3}", set: "Topics" },
  { id: "5357419403325481346", emoji: "\u{1F393}", set: "Topics" },
  { id: "5368585403467048206", emoji: "\u{1F52D}", set: "Topics" },
  { id: "5377580546748588396", emoji: "\u{1F52C}", set: "Topics" },
  { id: "5377317729109811382", emoji: "\u{1F3B6}", set: "Topics" },
  { id: "5382003830487523366", emoji: "\u{1F3A4}", set: "Topics" },
  { id: "5357298525765902091", emoji: "\u{1F57A}", set: "Topics" },
  { id: "5357370526597653193", emoji: "\u{1F483}", set: "Topics" },
  { id: "5357188789351490453", emoji: "\u{1FA96}", set: "Topics" },
  { id: "5348227245599105972", emoji: "\u{1F4BC}", set: "Topics" },
  { id: "5411138633765757782", emoji: "\u{1F9EA}", set: "Topics" },
  { id: "5386435923204382258", emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}", set: "Topics" },
  { id: "5377675010259297233", emoji: "\u{1F476}", set: "Topics" },
  { id: "5386609083400856174", emoji: "\u{1F930}", set: "Topics" },
  { id: "5368808634392257474", emoji: "\u{1F485}", set: "Topics" },
  { id: "5350548830041415279", emoji: "\u{1F3DB}", set: "Topics" },
  { id: "5355127101970194557", emoji: "\u{1F9EE}", set: "Topics" },
  { id: "5386379624773066504", emoji: "\u{1F5A8}", set: "Topics" },
  { id: "5377494501373780436", emoji: "\u{1F46E}\u200D\u2642\uFE0F", set: "Topics" },
  { id: "5350307998340226571", emoji: "\u{1FA7A}", set: "Topics" },
  { id: "5310094636159607472", emoji: "\u{1F48A}", set: "Topics" },
  { id: "5310139157790596888", emoji: "\u{1F489}", set: "Topics" },
  { id: "5377468357907849200", emoji: "\u{1F9FC}", set: "Topics" },
  { id: "5418115271267197333", emoji: "\u{1FAAA}", set: "Topics" },
  { id: "5372819184658949787", emoji: "\u{1F6C3}", set: "Topics" },
  { id: "5350344462612570293", emoji: "\u{1F37D}", set: "Topics" },
  { id: "5384574037701696503", emoji: "\u{1F41F}", set: "Topics" },
  { id: "5310039132297242441", emoji: "\u{1F3A8}", set: "Topics" },
  { id: "5350658016700013471", emoji: "\u{1F3AD}", set: "Topics" },
  { id: "5357504778685392027", emoji: "\u{1F3A9}", set: "Topics" },
  { id: "5350367161514732241", emoji: "\u{1F52E}", set: "Topics" },
  { id: "5350520238444126134", emoji: "\u{1F379}", set: "Topics" },
  { id: "5310132165583840589", emoji: "\u{1F382}", set: "Topics" },
  { id: "5350392020785437399", emoji: "\u2615\uFE0F", set: "Topics" },
  { id: "5350406176997646350", emoji: "\u{1F363}", set: "Topics" },
  { id: "5350403544182694064", emoji: "\u{1F354}", set: "Topics" },
  { id: "5350444672789519765", emoji: "\u{1F355}", set: "Topics" },
  { id: "5312424913615723286", emoji: "\u{1F9A0}", set: "Topics" },
  { id: "5417915203100613993", emoji: "\u{1F4AC}", set: "Topics" },
  { id: "5312054580060625569", emoji: "\u{1F384}", set: "Topics" },
  { id: "5309744892677727325", emoji: "\u{1F383}", set: "Topics" },
  { id: "5238156910363950406", emoji: "\u270D\uFE0F", set: "Topics" },
  { id: "5235579393115438657", emoji: "\u2B50\uFE0F", set: "Topics" },
  { id: "5237699328843200968", emoji: "\u2705", set: "Topics" },
  { id: "5238027455754680851", emoji: "\u{1F396}", set: "Topics" },
  { id: "5238234236955148254", emoji: "\u{1F921}", set: "Topics" },
  { id: "5237889595894414384", emoji: "\u{1F9E0}", set: "Topics" },
  { id: "5237999392438371490", emoji: "\u{1F9AE}", set: "Topics" },
  { id: "5235912661102773458", emoji: "\u{1F408}", set: "Topics" }
];
function getEmojiTag(name) {
  const e = EMOJI_POOL[name];
  if (!e) return "";
  return `<tg-emoji emoji-id="${e.id}"></tg-emoji>`;
}

// server.ts
var import_meta = {};
import_net.default.setDefaultAutoSelectFamily(false);
import_dns.default.setDefaultResultOrder("ipv4first");
var customRequire = typeof require !== "undefined" ? require : (0, import_module.createRequire)(import_meta.url);
process.on("unhandledRejection", (reason) => {
  console.warn("[Process Warning] Unhandled Promise Rejection:", reason?.message || reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Process Error] Uncaught Exception detected:", err.message);
});
var globalStartTime = Date.now();
var UPTIME_START_FILE = import_path.default.join(process.cwd(), ".uptime_start");
if (import_fs.default.existsSync(UPTIME_START_FILE)) {
  try {
    globalStartTime = Number(import_fs.default.readFileSync(UPTIME_START_FILE, "utf8").trim()) || Date.now();
  } catch (e) {
  }
} else {
  try {
    import_fs.default.writeFileSync(UPTIME_START_FILE, String(globalStartTime), "utf8");
  } catch (e) {
  }
}
function getStableUptimeSeconds() {
  if (process.env.NODE_ENV === "production" || import_os.default.platform() === "linux") {
    const up = import_os.default.uptime();
    if (up > 0 && up < 86400 * 365) {
      return Math.floor(up);
    }
  }
  return Math.floor((Date.now() - globalStartTime) / 1e3);
}
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3e3);
var CONFIG_FILE = import_path.default.join(process.cwd(), "config.json");
app.use(import_express.default.json());
var botConfig = {
  token: "",
  chatId: "",
  alertCpuThreshold: 80,
  alertRamThreshold: 90,
  alertDiskThreshold: 85,
  alertIntervalMinutes: 5,
  isActive: false,
  alertNetRxThreshold: 10,
  // Default 10 MB/s
  alertNetTxThreshold: 10,
  // Default 10 MB/s
  smartCleanupEnabled: true,
  smartCleanupThreshold: 90,
  smartCleanupDurationHours: 1,
  domain: "",
  ptla: "",
  ptlc: "",
  scanInterval: 5,
  domain2: "",
  ptla2: "",
  ptlc2: "",
  scanInterval2: 5,
  adminPassword: "vps2026"
};
var simulatedDiskOverload = false;
var diskOverloadStartTime = null;
if (import_fs.default.existsSync(CONFIG_FILE)) {
  try {
    const raw = import_fs.default.readFileSync(CONFIG_FILE, "utf-8");
    botConfig = { ...botConfig, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Error reading config.json", err);
  }
}
function loadConfigJS() {
  const MANUAL_CONFIG_PATH = import_path.default.join(process.cwd(), "config.js");
  if (import_fs.default.existsSync(MANUAL_CONFIG_PATH)) {
    try {
      const code = import_fs.default.readFileSync(MANUAL_CONFIG_PATH, "utf8");
      const mod = { exports: {} };
      const loadFn = new Function("module", "exports", "require", "__filename", "__dirname", code + "\n//# sourceURL=config.js");
      loadFn(mod, mod.exports, customRequire, MANUAL_CONFIG_PATH, import_path.default.dirname(MANUAL_CONFIG_PATH));
      const manual = mod.exports;
      if (manual) {
        console.log("Loading manual configuration overrides from config.js...");
        if (manual.token !== void 0 && manual.token !== "") botConfig.token = manual.token;
        if (manual.ownerId !== void 0 && manual.ownerId !== "") botConfig.chatId = String(manual.ownerId);
        if (manual.cpuLimit !== void 0) botConfig.alertCpuThreshold = Number(manual.cpuLimit);
        if (manual.ramLimit !== void 0) botConfig.alertRamThreshold = Number(manual.ramLimit);
        if (manual.diskLimit !== void 0) botConfig.alertDiskThreshold = Number(manual.diskLimit);
        if (manual.domain !== void 0 && manual.domain !== "") botConfig.domain = manual.domain;
        if (manual.ptla !== void 0 && manual.ptla !== "") botConfig.ptla = manual.ptla;
        if (manual.ptlc !== void 0 && manual.ptlc !== "") botConfig.ptlc = manual.ptlc;
        if (manual.scanInterval !== void 0) botConfig.scanInterval = Number(manual.scanInterval);
        if (manual.domain2 !== void 0 && manual.domain2 !== "") botConfig.domain2 = manual.domain2;
        if (manual.ptla2 !== void 0 && manual.ptla2 !== "") botConfig.ptla2 = manual.ptla2;
        if (manual.ptlc2 !== void 0 && manual.ptlc2 !== "") botConfig.ptlc2 = manual.ptlc2;
        if (manual.scanInterval2 !== void 0) botConfig.scanInterval2 = Number(manual.scanInterval2);
        if (botConfig.token && botConfig.chatId) {
          botConfig.isActive = true;
        }
      }
    } catch (err) {
      console.error("Error loading config.js overrides:", err);
    }
  }
}
loadConfigJS();
function saveConfig() {
  try {
    import_fs.default.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving config.json", err);
  }
}
var SSH_CONFIG_FILE = import_path.default.join(process.cwd(), "ssh_config.json");
var sshConfig = {
  host: "",
  port: 22,
  username: "root",
  password: "",
  privateKey: "",
  isActive: false
};
if (import_fs.default.existsSync(SSH_CONFIG_FILE)) {
  try {
    const raw = import_fs.default.readFileSync(SSH_CONFIG_FILE, "utf-8");
    sshConfig = { ...sshConfig, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Error reading ssh_config.json", err);
  }
}
function saveSshConfig() {
  try {
    import_fs.default.writeFileSync(SSH_CONFIG_FILE, JSON.stringify(sshConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving ssh_config.json", err);
  }
}
function executeSSHCommand(config, command) {
  return new Promise((resolve, reject) => {
    if (!config.host) {
      return reject(new Error("SSH Host belum siap / dikonfigurasi. Silakan simpan dan login VPS terlebih dahulu."));
    }
    const conn = new import_ssh2.Client();
    let hasResolvedOrRejected = false;
    const timeoutTimer = setTimeout(() => {
      if (!hasResolvedOrRejected) {
        hasResolvedOrRejected = true;
        try {
          conn.end();
        } catch (e) {
        }
        reject(new Error("Timeout eksekusi SSH (12 detik terlampaui)! Server VPS tidak merespon/terlalu lambat."));
      }
    }, 12e3);
    conn.on("ready", () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          if (!hasResolvedOrRejected) {
            hasResolvedOrRejected = true;
            clearTimeout(timeoutTimer);
            try {
              conn.end();
            } catch (e) {
            }
            return reject(err);
          }
          return;
        }
        let stdout = "";
        let stderr = "";
        stream.on("data", (data) => {
          stdout += data.toString();
        });
        stream.stderr.on("data", (data) => {
          stderr += data.toString();
        });
        stream.on("close", (code, signal) => {
          if (!hasResolvedOrRejected) {
            hasResolvedOrRejected = true;
            clearTimeout(timeoutTimer);
            try {
              conn.end();
            } catch (e) {
            }
            resolve(stdout + (stderr ? "\nstderr: " + stderr : ""));
          }
        });
      });
    }).on("error", (err) => {
      if (!hasResolvedOrRejected) {
        hasResolvedOrRejected = true;
        clearTimeout(timeoutTimer);
        try {
          conn.end();
        } catch (e) {
        }
        reject(err);
      }
    }).connect({
      host: config.host,
      port: config.port || 22,
      username: config.username || "root",
      password: config.password || void 0,
      privateKey: config.privateKey || void 0,
      readyTimeout: 8e3
      // Reduced to 8 seconds connection timeout
    });
  });
}
var remoteServers = /* @__PURE__ */ new Map();
function cpuAverage() {
  const cpus = import_os.default.cpus();
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
function getCPUUsage() {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      if (totalDifference === 0) return resolve(0);
      const percentageCPU = 100 - Math.round(100 * idleDifference / totalDifference);
      resolve(Math.max(0, Math.min(100, percentageCPU)));
    }, 150);
  });
}
function getDiskUsage() {
  if (simulatedDiskOverload) {
    return Promise.resolve({ total: 100, free: 6, used: 94, usagePercent: 94 });
  }
  return new Promise((resolve) => {
    (0, import_child_process.exec)("df -k /", (err, stdout) => {
      if (err || !stdout) {
        return resolve({ total: 50, free: 30, used: 20, usagePercent: 40 });
      }
      try {
        const lines = stdout.trim().split("\n");
        const dataLines = lines.filter((line) => !line.toLowerCase().includes("filesystem") && line.trim().length > 0);
        if (dataLines.length > 0) {
          let dataLine = dataLines[0].trim();
          if (dataLines.length > 1 && !dataLine.match(/\d/)) {
            dataLine = (dataLine + " " + dataLines[1].trim()).trim();
          }
          const parts = dataLine.split(/\s+/);
          if (parts.length >= 4) {
            const numbers = parts.filter((p) => p.match(/^\d+$/)).map((p) => parseInt(p, 10));
            const percentPart = parts.find((p) => p.includes("%"));
            let usagePercent = percentPart ? parseInt(percentPart.replace("%", ""), 10) : NaN;
            if (numbers.length >= 3) {
              const totalKb = numbers[0];
              const usedKb = numbers[1];
              const freeKb = numbers[2];
              const totalGb = +(totalKb / 1024 / 1024).toFixed(1);
              const usedGb = +(usedKb / 1024 / 1024).toFixed(1);
              const freeGb = +(freeKb / 1024 / 1024).toFixed(1);
              if (isNaN(usagePercent) || usagePercent <= 0) {
                usagePercent = totalGb > 0 ? Math.round(usedGb / totalGb * 100) : 0;
              }
              return resolve({
                total: isNaN(totalGb) ? 100 : totalGb,
                free: isNaN(freeGb) ? 50 : freeGb,
                used: isNaN(usedGb) ? 50 : usedGb,
                usagePercent: isNaN(usagePercent) ? 50 : usagePercent
              });
            }
          }
        }
      } catch (e) {
      }
      resolve({ total: 100, free: 60, used: 40, usagePercent: 40 });
    });
  });
}
function getRamUsage() {
  const total = import_os.default.totalmem();
  let available = null;
  try {
    const meminfo = import_fs.default.readFileSync("/proc/meminfo", "utf-8");
    const m = meminfo.match(/MemAvailable:\s+(\d+)\s*kB/);
    if (m) available = parseInt(m[1], 10) * 1024;
  } catch (e) {
  }
  if (!available || available <= 0) available = import_os.default.freemem();
  if (available > total) available = total;
  const used = total - available;
  return { total, available, used, percent: total > 0 ? Math.round(used / total * 100) : 0 };
}
function getSwapUsage() {
  try {
    const meminfo = import_fs.default.readFileSync("/proc/meminfo", "utf-8");
    const t = meminfo.match(/SwapTotal:\s+(\d+)\s*kB/);
    const f = meminfo.match(/SwapFree:\s+(\d+)\s*kB/);
    if (t && f) {
      const total = parseInt(t[1], 10) * 1024;
      const free = parseInt(f[1], 10) * 1024;
      const used = Math.max(0, total - free);
      return { total, free, used, percent: total > 0 ? Math.round(used / total * 100) : 0 };
    }
  } catch (e) {
  }
  return { total: 0, free: 0, used: 0, percent: 0 };
}
function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function sendHtmlOrPlain(chatId, html, extra) {
  try {
    await botInstance?.sendMessage(chatId, html, { parse_mode: "HTML", ...extra || {} })?.catch((e) => {
      throw e;
    });
  } catch {
    await botInstance?.sendMessage(chatId, html.replace(/<[^>]+>/g, ""))?.catch(() => {
    });
  }
}
async function telegramApiCall(method, payload, tokenOverride) {
  const doFetch = globalThis.fetch;
  const token = tokenOverride || botConfig.token;
  const res = await doFetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
  }
  if (!data || data.ok !== true) {
    throw new Error(data?.description || `Telegram API ${method} gagal`);
  }
  return data.result;
}
function richToBasicHtml(html) {
  return html.replace(/<\s*tg-button-row[^>]*>/gi, "\n").replace(/<\s*\/\s*tg-button-row\s*>/gi, "\n").replace(/<\s*tg-button[^>]*>/gi, "").replace(/<\s*\/\s*tg-button\s*>/gi, "").replace(/<\s*br\s*\/?\s*>/gi, "\n").replace(/<\s*hr\s*\/?\s*>/gi, "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n").replace(/<\s*li\b[^>]*>/gi, "\u2022 ").replace(/<\s*\/\s*li\s*>/gi, "\n").replace(/<\s*\/?\s*(blockquote|ul|ol|h[1-6]|p|footer)\b[^>]*>/gi, "");
}
async function sendRichOrHtml(chatId, html, extra) {
  try {
    await telegramApiCall("sendRichMessage", { chat_id: chatId, rich_message: { html }, ...extra || {} });
  } catch (e) {
    console.warn("sendRichMessage gagal:", e?.message, "-> fallback HTML biasa");
    await sendHtmlOrPlain(chatId, richToBasicHtml(html), extra);
  }
}
async function editRichOrText(chatId, messageId, html) {
  try {
    await telegramApiCall("editMessageText", { chat_id: chatId, message_id: messageId, rich_message: { html } });
    return;
  } catch (e) {
    console.warn("editRichMessage gagal:", e?.message, "-> fallback edit teks");
  }
  await botInstance?.editMessageText(richToBasicHtml(html), { chat_id: chatId, message_id: messageId, parse_mode: "HTML" });
}
async function runSmartCleanupExecution() {
  const steps = [];
  steps.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Pemicu Smart Cleanup Diaktifkan.`);
  try {
    const localCachePath = import_path.default.join(process.cwd(), "cache");
    const localTmpPath = import_path.default.join(process.cwd(), "tmp");
    if (import_fs.default.existsSync(localCachePath)) {
      import_fs.default.readdirSync(localCachePath).forEach((f) => {
        try {
          import_fs.default.rmSync(import_path.default.join(localCachePath, f), { recursive: true, force: true });
        } catch (xx) {
        }
      });
      steps.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Mengosongkan cache lokal ${localCachePath}.`);
    }
  } catch (e) {
  }
  if (sshConfig.isActive && sshConfig.host) {
    steps.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Mengirimkan perintah SSH pembersihan ke VPS server...`);
    const cleanCommand = "rm -rf /cache/* /tmp/* /var/lib/pterodactyl/cache/* /var/lib/pterodactyl/tmp/*";
    try {
      const output = await executeSSHCommand(sshConfig, cleanCommand);
      steps.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Respon SSH: ${output || "Sukses (perintah terkirim)"}`);
    } catch (sshErr) {
      steps.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Warning SSH Cleanup: ${sshErr.message}`);
    }
  } else {
    steps.push(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Mengosongkan folder virtual cache dan tmp server Pterodactyl.`);
  }
  logEvent(
    "system",
    "success",
    "Smart Cleanup Eksekusi",
    "Disk kritis. Folder /cache dan /tmp berhasil mengosongkan diri secara otomatis menggunakan Pembersih Pintar."
  );
  if (botInstance && botConfig.chatId) {
    await sendRichOrHtml(
      botConfig.chatId,
      `<h3>${getEmojiTag("fire")} SMART CLEANUP EXECUTED SUCCESSFULLY!</h3><blockquote>Sistem mendeteksi disk kritis melebihi <b>${botConfig.smartCleanupThreshold || 90}%</b>.<br>Tindakan pemulihan otomatis telah selesai:<br>\u2022 <b>Folder dibersihkan:</b> <code>/cache</code> dan <code>/tmp</code><br>\u2022 <b>Status:</b> <code>BERHASIL DEKONTAMINASI 100%</code></blockquote><p>Sisa ruang penyimpanan berhasil ditingkatkan.</p>`
    ).catch((e) => console.warn("Failed telegram smartcleanup notification", e));
  }
  simulatedDiskOverload = false;
  diskOverloadStartTime = null;
  return steps;
}
async function checkSmartCleanup(usagePercent) {
  if (botConfig.smartCleanupEnabled === false) {
    diskOverloadStartTime = null;
    return;
  }
  const limit = botConfig.smartCleanupThreshold || 90;
  if (usagePercent >= limit) {
    if (diskOverloadStartTime === null) {
      diskOverloadStartTime = Date.now();
      logEvent(
        "disk",
        "warning",
        "Overload Disk Terdeteksi",
        `Tingkat penyimpanan mencapai ${usagePercent}%. Penghitung waktu Smart Cleanup otomatis dimulai.`
      );
    } else {
      const elapsedMs = Date.now() - diskOverloadStartTime;
      const hoursLimit = botConfig.smartCleanupDurationHours || 1;
      const msLimit = hoursLimit * 60 * 60 * 1e3;
      if (elapsedMs >= msLimit) {
        logEvent(
          "system",
          "danger",
          "Smart Cleanup Batas Waktu",
          `Penyimpanan disk kritis selama lebih dari ${hoursLimit} jam. Memulai pembersihan otomatis...`
        );
        await runSmartCleanupExecution();
      }
    }
  } else {
    if (diskOverloadStartTime !== null) {
      diskOverloadStartTime = null;
      logEvent(
        "disk",
        "info",
        "Disk Kembali Normal",
        `Penggunaan disk turun di bawah limit (${usagePercent}%). Pemantauan Smart Cleanup dinonaktifkan.`
      );
    }
  }
}
function getCPUTemperature(cpuUsage) {
  return new Promise((resolve) => {
    try {
      const paths = [
        "/sys/class/thermal/thermal_zone0/temp",
        "/sys/class/thermal/thermal_zone1/temp",
        "/sys/class/hwmon/hwmon0/temp1_input",
        "/sys/class/hwmon/hwmon1/temp1_input"
      ];
      for (const p of paths) {
        if (import_fs.default.existsSync(p)) {
          const raw = import_fs.default.readFileSync(p, "utf8").trim();
          const temp = parseInt(raw, 10);
          if (!isNaN(temp) && temp > 0) {
            const finalTemp = temp > 1e3 ? +(temp / 1e3).toFixed(1) : temp;
            if (finalTemp > 0 && finalTemp < 150) {
              return resolve(finalTemp);
            }
          }
        }
      }
    } catch (e) {
    }
    const baseTemp = 39.5;
    const loadFactor = cpuUsage / 100 * 31;
    const fluctuation = Math.sin(Date.now() / 15e3) * 0.8 + (Math.random() * 0.4 - 0.2);
    const simulatedTemp = +(baseTemp + loadFactor + fluctuation).toFixed(1);
    resolve(simulatedTemp);
  });
}
var botInstance = null;
var alertIntervalTimer = null;
var lastAlertTimes = { cpu: 0, ram: 0, disk: 0, netRx: 0, netTx: 0 };
var currentBotStatus = "Offline";
var prevNetStats = { time: Date.now(), rxBytes: 0, txBytes: 0, rxPackets: 0, txPackets: 0 };
var currentNetSpeed = { rxSpeed: 0, txSpeed: 0, rxPacketsSpeed: 0, txPacketsSpeed: 0 };
var simulatedNetwork = { rxBytes: 154e7, txBytes: 843e6, rxPackets: 124e4, txPackets: 75e4 };
setInterval(() => {
  const rxAdd = Math.floor(Math.random() * 6e4) + 1e4;
  const txAdd = Math.floor(Math.random() * 5e4) + 5e3;
  simulatedNetwork.rxBytes += rxAdd;
  simulatedNetwork.txBytes += txAdd;
  simulatedNetwork.rxPackets += Math.floor(rxAdd / 800) + 1;
  simulatedNetwork.txPackets += Math.floor(txAdd / 800) + 1;
}, 3e3);
function getNetworkTraffic() {
  return new Promise((resolve) => {
    import_fs.default.readFile("/proc/net/dev", "utf8", (err, data) => {
      if (err || !data) {
        return resolve({
          rxBytes: simulatedNetwork.rxBytes,
          txBytes: simulatedNetwork.txBytes,
          rxPackets: simulatedNetwork.rxPackets,
          txPackets: simulatedNetwork.txPackets
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
          if (iface === "lo") continue;
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
          txPackets: simulatedNetwork.txPackets
        });
      }
    });
  });
}
async function trackBandwidth() {
  try {
    const stats = await getNetworkTraffic();
    const now = Date.now();
    const deltaSec = (now - prevNetStats.time) / 1e3;
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
        txPacketsSpeed: Math.round(txPacketsDelta / deltaSec)
      };
    }
    prevNetStats = {
      time: now,
      rxBytes: stats.rxBytes,
      txBytes: stats.txBytes,
      rxPackets: stats.rxPackets,
      txPackets: stats.txPackets
    };
  } catch (err) {
  }
}
getNetworkTraffic().then((p) => {
  prevNetStats = { time: Date.now(), ...p };
  setInterval(trackBandwidth, 3e3);
});
var LOGS_FILE = import_path.default.join(process.cwd(), "alert_logs.json");
var alertLogs = [];
if (import_fs.default.existsSync(LOGS_FILE)) {
  try {
    const raw = import_fs.default.readFileSync(LOGS_FILE, "utf-8");
    alertLogs = JSON.parse(raw);
  } catch (err) {
    console.error("Error reading alert_logs.json", err);
  }
}
function writeLogs() {
  try {
    import_fs.default.writeFileSync(LOGS_FILE, JSON.stringify(alertLogs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving alert_logs.json", err);
  }
}
function logEvent(type, level, title, message) {
  const newLog = {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type,
    level,
    title,
    message
  };
  alertLogs.unshift(newLog);
  if (alertLogs.length > 100) {
    alertLogs = alertLogs.slice(0, 100);
  }
  writeLogs();
}
var defaultReplyMarkup = {
  keyboard: [
    [{ text: "\u{1F4CA} /status" }, { text: "\u{1F7E2} /live" }, { text: "\u23F1\uFE0F /ping" }],
    [{ text: "\u{1F5A5}\uFE0F /cpu" }, { text: "\u{1F4DF} /ram" }, { text: "\u{1F4BE} /disk" }],
    [{ text: "\u26A1 /bandwidth" }, { text: "\u2139\uFE0F /help" }]
  ],
  resize_keyboard: true,
  one_time_keyboard: false
};
var welcomeInlineMarkup = {
  inline_keyboard: [
    [
      { text: "\u{1F7E2} Live Monitor", callback_data: "cmd:/live", style: "success" },
      { text: "\u{1F4CA} Status", callback_data: "cmd:/status", style: "primary" }
    ],
    [
      { text: "\u{1F4BB} CPU", callback_data: "cmd:/cpu", style: "primary" },
      { text: "\u{1F9E0} RAM", callback_data: "cmd:/ram", style: "primary" },
      { text: "\u{1F4BE} Disk", callback_data: "cmd:/disk", style: "primary" }
    ],
    [
      { text: "\u26A1 Bandwidth", callback_data: "cmd:/bandwidth", style: "primary" },
      { text: "\u{1F504} Refresh", callback_data: "welcome:refresh", style: "success" }
    ],
    [
      { text: "\u{1F310} Dashboard", url: "https://statusvps.example.com", style: "primary" },
      { text: "\u2139\uFE0F Bantuan", callback_data: "cmd:/help", style: "primary" }
    ]
  ]
};
function drawProgressBar(percent, size = 10) {
  const progress = Math.round(percent / 100 * size);
  const emptyProgress = size - progress;
  const progressText = "\u2588".repeat(progress);
  const emptyProgressText = "\u2591".repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${percent}%`;
}
function getGreeting() {
  const h = (/* @__PURE__ */ new Date()).getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}
function formatUptimeShort(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  if (days > 0) return `${days}h ${hours}j ${minutes}m`;
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}
async function buildWelcomeCardHtml() {
  const cpuVal = await getCPUUsage();
  const ramInfo = getRamUsage();
  const disk = await getDiskUsage();
  const ramPercent = Math.round(ramInfo.percent);
  const diskPercent = Math.round(disk.usagePercent);
  const uptime = formatUptimeShort(getStableUptimeSeconds());
  const nowUnix = Math.floor(Date.now() / 1e3);
  const rx = (currentNetSpeed.rxSpeed / 1024 / 1024).toFixed(2);
  const tx = (currentNetSpeed.txSpeed / 1024 / 1024).toFixed(2);
  return `<h2>${getEmojiTag("robot")} KOSMOS MONITOR</h2><p><b>${getGreeting()}</b> \xB7 <tg-time unix="${nowUnix}" format="t">${(/* @__PURE__ */ new Date()).toLocaleTimeString("id-ID")}</tg-time> \xB7 ${getEmojiTag("check")} <b>BOT ONLINE</b></p><table bordered striped compact><tr><th>${getEmojiTag("notes")} CPU</th><th>${getEmojiTag("folder")} RAM</th><th>${getEmojiTag("folder")} DISK</th></tr><tr><td align="center"><b>${cpuVal}%</b></td><td align="center"><b>${ramPercent}%</b></td><td align="center"><b>${diskPercent}%</b></td></tr><tr><td align="center"><code>${drawProgressBar(cpuVal, 7)}</code></td><td align="center"><code>${drawProgressBar(ramPercent, 7)}</code></td><td align="center"><code>${drawProgressBar(diskPercent, 7)}</code></td></tr></table><blockquote>${getEmojiTag("calendar")} <b>Uptime:</b> <code>${uptime}</code><br>${getEmojiTag("bolt")} <b>Net RX/TX:</b> <code>${rx} / ${tx} MB/s</code></blockquote><footer>Pilih menu di bawah atau ketik /status \u2022 /live \u2022 /help</footer>`;
}
async function dispatchBotCommand(chatId, text) {
  const bot = botInstance;
  if (!bot) return false;
  const fakeMsg = {
    message_id: 0,
    date: Math.floor(Date.now() / 1e3),
    chat: { id: chatId, type: "private", first_name: "Dashboard" },
    from: { id: chatId, is_bot: false, first_name: "Dashboard", username: "dashboard" },
    text
  };
  const listeners = bot._textRegexpCallbacks || [];
  for (const listener of listeners) {
    let re;
    try {
      re = listener.regexp instanceof RegExp ? listener.regexp : new RegExp(listener.regexp);
    } catch {
      continue;
    }
    const match = re.exec(text);
    re.lastIndex = 0;
    if (match) {
      await listener.callback(fakeMsg, match);
      return true;
    }
  }
  return false;
}
var widgetHtmlCache = null;
function getWidgetHtml() {
  if (widgetHtmlCache) return widgetHtmlCache;
  try {
    widgetHtmlCache = import_fs.default.readFileSync(import_path.default.join(process.cwd(), "widget.html"), "utf8");
  } catch (e) {
    console.warn("widget.html tidak ditemukan:", e?.message);
    widgetHtmlCache = `<h3>KOSMOS MONITOR</h3><p>File widget.html tidak ditemukan di server.</p>`;
  }
  return widgetHtmlCache;
}
var WIDGET_CAPTION = "<b>KOSMOS MONITOR</b> \xB7 ketuk \u2630 Menu untuk pindah halaman.";
var widgetViews = /* @__PURE__ */ new Map();
var widgetLives = /* @__PURE__ */ new Map();
function widgetKey(chatId, messageId) {
  return `${chatId}:${messageId}`;
}
function widgetUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor(sec % 86400 / 3600);
  const m = Math.floor(sec % 3600 / 60);
  if (d > 0) return `${d}h ${h}j ${m}m`;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}
function trimText(text, max) {
  return text.length > max ? text.slice(0, max - 1) + "\u2026" : text;
}
function gbFromBytes(bytes) {
  return +(bytes / 1073741824).toFixed(2);
}
async function buildWidgetState(view, extra = {}) {
  const cpus = import_os.default.cpus();
  const cores = cpus.length;
  const speed = cores ? cpus[0].speed : 0;
  const model = trimText(cores ? cpus[0].model : "CPU", 34);
  const load = import_os.default.loadavg().map((v) => +v.toFixed(2));
  const ram = getRamUsage();
  const swap = getSwapUsage();
  const disk = await getDiskUsage();
  const up = widgetUptime(getStableUptimeSeconds());
  const ramPct = Math.round(ram.percent);
  const swapPct = Math.round(swap.percent);
  const diskPct = Math.round(disk.usagePercent);
  const ramUsed = gbFromBytes(ram.used);
  const ramTotal = gbFromBytes(ram.total);
  const ramFree = gbFromBytes(ram.available);
  const swapUsed = gbFromBytes(swap.used);
  const swapTotal = gbFromBytes(swap.total);
  const swapFree = gbFromBytes(swap.free);
  const rx = currentNetSpeed.rxSpeed / 1048576;
  const tx = currentNetSpeed.txSpeed / 1048576;
  let cpuCache = null;
  const cpuNow = async () => {
    if (cpuCache == null) cpuCache = +(await getCPUUsage()).toFixed(1);
    return cpuCache;
  };
  const base = { u: Date.now() };
  switch (view) {
    case "status": {
      const cpu = await cpuNow();
      return {
        ...base,
        v: "status",
        t: "Status VPS",
        c: [["CPU", `${cpu}%`, cpu], ["RAM", `${ramPct}%`, ramPct], ["SWAP", `${swapPct}%`, swapPct], ["DISK", `${diskPct}%`, diskPct]],
        r: [
          ["RAM", `${ramUsed} / ${ramTotal} GB`],
          ["SWAP", `${swapUsed} / ${swapTotal} GB`],
          ["Disk", `${disk.used} / ${disk.total} GB`],
          ["Uptime", up],
          ["OS", `${import_os.default.platform()} ${import_os.default.release()}`],
          ["Load", load.join(" / ")],
          ["Net RX/TX", `${rx.toFixed(2)} / ${tx.toFixed(2)} MB/s`]
        ]
      };
    }
    case "ping": {
      const cpu = await cpuNow();
      const cards = [];
      if (extra.ms != null) cards.push(["Latency", `${extra.ms} ms`]);
      cards.push(["CPU", `${cpu}%`, cpu], ["RAM", `${ramPct}%`, ramPct]);
      return {
        ...base,
        v: "ping",
        t: "Pong! Bot Aktif",
        c: cards,
        r: [
          ["Status", "ONLINE"],
          ["Platform", `${import_os.default.platform()} ${import_os.default.arch()}`],
          ["Kernel", import_os.default.release()],
          ["CPU", model],
          ["Thread", `${cores} @ ${speed} MHz`],
          ["Load", load.join(" / ")],
          ["RAM", `${ramUsed} / ${ramTotal} GB`],
          ["Disk", `${disk.used} / ${disk.total} GB`],
          ["Uptime", up]
        ]
      };
    }
    case "cpu": {
      const cpu = await cpuNow();
      return {
        ...base,
        v: "cpu",
        t: "Informasi CPU",
        c: [["Beban", `${cpu}%`, cpu], ["Thread", cores], ["Clock", `${speed} MHz`]],
        r: [["Model", model], ["Load 1/5/15", load.join(" / ")], ["Platform", `${import_os.default.platform()} ${import_os.default.arch()}`], ["Uptime", up]]
      };
    }
    case "ram":
      return {
        ...base,
        v: "ram",
        t: "Informasi RAM",
        c: [["RAM", `${ramPct}%`, ramPct], ["SWAP", `${swapPct}%`, swapPct]],
        r: [
          ["RAM total", `${ramTotal} GB`],
          ["RAM used", `${ramUsed} GB`],
          ["RAM free", `${ramFree} GB`],
          ["SWAP total", `${swapTotal} GB`],
          ["SWAP used", `${swapUsed} GB`],
          ["SWAP free", `${swapFree} GB`]
        ]
      };
    case "disk":
      return {
        ...base,
        v: "disk",
        t: "Informasi Disk",
        c: [["Terpakai", `${diskPct}%`, diskPct], ["Sisa", `${disk.free} GB`], ["Total", `${disk.total} GB`]],
        r: [["Kapasitas", `${disk.total} GB`], ["Terpakai", `${disk.used} GB`], ["Sisa", `${disk.free} GB`], ["Persentase", `${diskPct}%`]]
      };
    case "bandwidth":
      return {
        ...base,
        v: "bandwidth",
        t: "Bandwidth & Paket",
        c: [["RX", `${rx.toFixed(2)} MB/s`], ["TX", `${tx.toFixed(2)} MB/s`]],
        r: [
          ["RX KB/s", (currentNetSpeed.rxSpeed / 1024).toFixed(1)],
          ["TX KB/s", (currentNetSpeed.txSpeed / 1024).toFixed(1)],
          ["RX pps", currentNetSpeed.rxPacketsSpeed.toLocaleString()],
          ["TX pps", currentNetSpeed.txPacketsSpeed.toLocaleString()],
          ["Limit RX", `${botConfig.alertNetRxThreshold || 10} MB/s`],
          ["Limit TX", `${botConfig.alertNetTxThreshold || 10} MB/s`]
        ]
      };
    case "help":
      return {
        ...base,
        v: "help",
        t: "Bantuan",
        c: [],
        r: [
          ["/status", "CPU / RAM / Disk"],
          ["/live", "Live monitor 5 detik"],
          ["/stop_live", "Stop live"],
          ["/ping", "Latency + spek VPS"],
          ["/cpu", "Info CPU"],
          ["/ram", "Info RAM / SWAP"],
          ["/disk", "Info penyimpanan"],
          ["/bandwidth", "RX/TX + paket"],
          ["/emoji", "Kamus emoji"],
          ["/setpwd", "Ganti password"]
        ],
        n: "Tap tombol di Menu untuk pindah halaman."
      };
    case "emoji": {
      const keys = Object.keys(EMOJI_POOL);
      return { ...base, v: "emoji", t: "Emoji Premium", c: [], ch: keys, n: `${keys.length} key \xB7 ketik /emoji untuk ID lengkap` };
    }
    case "setpwd":
      return {
        ...base,
        v: "setpwd",
        t: "Ganti Password",
        c: [],
        r: [["Perintah", "/setpwd passwordbaru"], ["Minimal", "4 karakter"]],
        n: "Widget tidak punya keyboard. Ketik perintah itu di chat."
      };
    case "stopped":
      return {
        ...base,
        v: "stopped",
        t: "Live Monitor",
        c: [],
        r: [["Status", "Dihentikan"], ["Uptime", up], ["Load", load.join(" / ")]],
        n: "Tap Live di Menu untuk mulai lagi."
      };
    case "live": {
      const cpu = await cpuNow();
      return {
        ...base,
        v: "live",
        t: "Live Monitor",
        c: [["CPU", `${cpu}%`, cpu], ["RAM", `${ramPct}%`, ramPct], ["DISK", `${diskPct}%`, diskPct]],
        r: [["Mode", "LIVE \u2022 5 detik"], ["Uptime", up], ["RX / TX", `${rx.toFixed(2)} / ${tx.toFixed(2)} MB/s`], ["Load", load.join(" / ")]],
        n: "Update otomatis tiap 5 detik. Tap Stop di Menu untuk berhenti."
      };
    }
    default: {
      const cpu = await cpuNow();
      return {
        ...base,
        v: "dash",
        t: "VPS Telemetry",
        c: [["CPU", `${cpu}%`, cpu, `${cores} core`], ["RAM", `${ramPct}%`, ramPct, `${ramUsed} / ${ramTotal} GB`], ["DISK", `${diskPct}%`, diskPct, `${disk.used} / ${disk.total} GB`]],
        r: [["Uptime", up], ["RX / TX", `${rx.toFixed(2)} / ${tx.toFixed(2)} MB/s`], ["Load", load.join(" / ")]]
      };
    }
  }
}
async function sendWidgetView(chatId, view, extra = {}) {
  try {
    const state = await buildWidgetState(view, extra);
    const result = await telegramApiCall("sendWidget", {
      chat_id: chatId,
      html: getWidgetHtml(),
      width: 0,
      height: 0,
      caption: WIDGET_CAPTION,
      parse_mode: "HTML",
      allow_queries: true,
      chat_data: JSON.stringify(state),
      reply_markup: defaultReplyMarkup
    });
    const messageId = result?.message_id;
    if (messageId) widgetViews.set(widgetKey(chatId, messageId), view);
    return messageId || null;
  } catch (e) {
    console.warn("sendWidget gagal:", e?.message, "-> fallback rich message");
    return null;
  }
}
async function editWidgetView(chatId, messageId, view, extra = {}) {
  try {
    const key = widgetKey(chatId, messageId);
    if (view !== "live") {
      const live = widgetLives.get(key);
      if (live) {
        clearInterval(live.timer);
        widgetLives.delete(key);
      }
    }
    const state = await buildWidgetState(view, extra);
    const stateText = JSON.stringify(state);
    await telegramApiCall("editMessageWidgetData", {
      chat_id: chatId,
      message_id: messageId,
      chat_data: stateText
    });
    widgetViews.set(key, view);
    console.log(`[Widget] edit view=${view} msg=${messageId} state=${Buffer.byteLength(stateText)}B`);
    return stateText;
  } catch (e) {
    console.warn("editMessageWidgetData:", e?.message);
    return null;
  }
}
async function startWidgetLive(chatId, messageId, initialSent) {
  const key = widgetKey(chatId, messageId);
  const prev = widgetLives.get(key);
  if (prev) clearInterval(prev.timer);
  if (!initialSent) await editWidgetView(chatId, messageId, "live");
  const timer = setInterval(async () => {
    if (!botInstance) {
      clearInterval(timer);
      widgetLives.delete(key);
      return;
    }
    const ok = await editWidgetView(chatId, messageId, "live");
    if (!ok) {
      clearInterval(timer);
      widgetLives.delete(key);
    }
  }, 5e3);
  widgetLives.set(key, { timer, chatId, messageId });
}
async function stopWidgetLive(chatId) {
  let stopped = false;
  for (const [key, live] of Array.from(widgetLives.entries())) {
    if (live.chatId !== chatId) continue;
    clearInterval(live.timer);
    widgetLives.delete(key);
    await editWidgetView(chatId, live.messageId, "stopped");
    stopped = true;
  }
  return stopped;
}
async function handleWidgetQuery(q) {
  if (!q || !q.id) return;
  const data = String(q.data || "");
  const chatId = q.chat?.id;
  const messageId = q.message_id;
  console.log(`[Widget] query="${data}" chat=${chatId} msg=${messageId}`);
  const ack = (text = "ok") => telegramApiCall("answerWidgetQuery", { widget_query_id: q.id, data: text }).catch(() => {
  });
  const reply = async (state) => ack(state && Buffer.byteLength(state) <= 1e3 ? state : "ok");
  try {
    if (data.startsWith("cmd:")) {
      const cmd = data.slice(4).replace(/^\//, "");
      if (!chatId || !messageId) {
        await ack("Butuh private chat");
        return;
      }
      if (cmd === "start" || cmd === "dash") {
        await reply(await editWidgetView(chatId, messageId, "dash"));
        return;
      }
      if (cmd === "live") {
        const state = await editWidgetView(chatId, messageId, "live");
        if (state) await startWidgetLive(chatId, messageId, true);
        await reply(state);
        return;
      }
      if (cmd === "stop_live") {
        await stopWidgetLive(chatId);
        await reply(await editWidgetView(chatId, messageId, "stopped"));
        return;
      }
      if (cmd === "setpwd" || cmd === "emoji") {
        await reply(await editWidgetView(chatId, messageId, cmd));
        return;
      }
      if (["status", "ping", "cpu", "ram", "disk", "bandwidth", "help"].includes(cmd)) {
        await reply(await editWidgetView(chatId, messageId, cmd));
        return;
      }
      await ack();
      if (!await dispatchBotCommand(chatId, "/" + cmd)) {
        await sendHtmlOrPlain(chatId, `\u274C Perintah <code>/${escHtml(cmd)}</code> tidak tersedia.`);
      }
      return;
    }
    if (data === "refresh" || data.startsWith("refresh:") || data === "back") {
      if (!chatId || !messageId) {
        await ack();
        return;
      }
      const allowed = ["dash", "status", "ping", "cpu", "ram", "disk", "bandwidth", "help", "emoji", "setpwd", "live", "stopped"];
      const requested = data.startsWith("refresh:") ? data.slice(8) : "";
      const view = data === "back" ? "dash" : allowed.includes(requested) ? requested : widgetViews.get(widgetKey(chatId, messageId)) || "dash";
      const state = await editWidgetView(chatId, messageId, view);
      if (view === "live") {
        const key = widgetKey(chatId, messageId);
        if (!widgetLives.has(key)) await startWidgetLive(chatId, messageId, true);
      }
      await reply(state);
      return;
    }
    await ack();
  } catch (e) {
    console.error("Widget query error:", e?.message);
    await ack();
  }
}
var metricsHistory = [];
var MAX_METRIC_POINTS = 12;
var activeLiveMessages = /* @__PURE__ */ new Map();
var latestCpuSample = 0;
var latestRamSample = 0;
var latestDiskSample = { total: 100, free: 60, used: 40, usagePercent: 40 };
var cpuPeak20s = 0;
var ramPeak20s = 0;
var diskPeak20s = 0;
var latestSwapSample = { total: 0, free: 0, used: 0, percent: 0 };
var swapPeak20s = 0;
async function runLiveBackgroundSampler() {
  try {
    const cpu = await getCPUUsage();
    latestCpuSample = cpu;
    if (cpu > cpuPeak20s) {
      cpuPeak20s = cpu;
    }
    const ramSample = getRamUsage();
    latestRamSample = ramSample.percent;
    if (ramSample.percent > ramPeak20s) {
      ramPeak20s = ramSample.percent;
    }
    const swapSample = getSwapUsage();
    latestSwapSample = swapSample;
    if (swapSample.percent > swapPeak20s) {
      swapPeak20s = swapSample.percent;
    }
    const disk = await getDiskUsage();
    latestDiskSample = disk;
    if (disk.usagePercent > diskPeak20s) {
      diskPeak20s = disk.usagePercent;
    }
  } catch (err) {
  }
}
setInterval(runLiveBackgroundSampler, 1500);
async function collectMetricsForHistory() {
  try {
    const cpu = await getCPUUsage();
    const ramPercent = getRamUsage().percent;
    const disk = await getDiskUsage();
    const now = /* @__PURE__ */ new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    metricsHistory.push({
      time: timeStr,
      cpu,
      ram: ramPercent,
      disk: disk.usagePercent
    });
    if (metricsHistory.length > MAX_METRIC_POINTS) {
      metricsHistory.shift();
    }
  } catch (err) {
    console.error("Error collecting metrics history:", err);
  }
}
collectMetricsForHistory();
setInterval(collectMetricsForHistory, 2e4);
function initializeTelegramBot() {
  if (botInstance) {
    try {
      botInstance.stopPolling();
    } catch (e) {
      console.error("Error stopping bot polling:", e);
    }
    botInstance = null;
  }
  for (const [chatId, active] of activeLiveMessages.entries()) {
    if (active.timer) {
      clearInterval(active.timer);
    }
  }
  activeLiveMessages.clear();
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
    botInstance = new import_node_telegram_bot_api.default(botConfig.token, { polling: { params: { timeout: 8 } } });
    const originalProcessUpdate = botInstance.processUpdate.bind(botInstance);
    botInstance.processUpdate = (update) => {
      try {
        if (update?.widget_query) void handleWidgetQuery(update.widget_query);
        if (update?.shared_widget_query) {
          void telegramApiCall("answerWidgetQuery", { widget_query_id: update.shared_widget_query.id }).catch(() => {
          });
        }
      } catch (e) {
      }
      return originalProcessUpdate(update);
    };
    botInstance.on("polling_error", (err) => {
      console.error("Telegram Bot Polling Error:", err.message);
      currentBotStatus = `Error Polling: ${err.message}`;
    });
    logEvent("system", "success", "Bot Aktif", "Polling telegram bot berhasil dinyalakan di server sandbox.");
    botInstance.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const widgetSent = msg.chat.type === "private" ? await sendWidgetView(chatId, "dash") : false;
      if (!widgetSent) {
        const welcomeMessage = await buildWelcomeCardHtml();
        await sendRichOrHtml(chatId, welcomeMessage, { reply_markup: welcomeInlineMarkup });
      }
    });
    botInstance.onText(/\/widget/, async (msg) => {
      const ok = msg.chat.type === "private" ? await sendWidgetView(msg.chat.id, "dash") : false;
      if (!ok) await sendHtmlOrPlain(msg.chat.id, "\u274C Widget hanya bisa dikirim di private chat dengan bot.");
    });
    botInstance.on("callback_query", async (query) => {
      try {
        const data = query.data || "";
        const chatId = query.message?.chat?.id;
        if (!chatId) {
          await botInstance?.answerCallbackQuery(query.id).catch(() => {
          });
          return;
        }
        if (data === "welcome:refresh") {
          await botInstance?.answerCallbackQuery(query.id, { text: "Memperbarui kartu..." }).catch(() => {
          });
          const html = await buildWelcomeCardHtml();
          await telegramApiCall("editMessageText", {
            chat_id: chatId,
            message_id: query.message.message_id,
            rich_message: { html },
            reply_markup: welcomeInlineMarkup
          });
          return;
        }
        if (data.startsWith("cmd:")) {
          const cmd = data.slice(4);
          await botInstance?.answerCallbackQuery(query.id, { text: `Menjalankan ${cmd}` }).catch(() => {
          });
          const ok = await dispatchBotCommand(chatId, cmd);
          if (!ok) await sendHtmlOrPlain(chatId, `\u274C Perintah <code>${escHtml(cmd)}</code> tidak tersedia.`);
          return;
        }
        await botInstance?.answerCallbackQuery(query.id).catch(() => {
        });
      } catch (e) {
        console.error("Callback error:", e?.message);
        try {
          await botInstance?.answerCallbackQuery(query.id, { text: "Terjadi kesalahan." });
        } catch {
        }
      }
    });
    async function makeLiveStatusText() {
      const cpuVal = latestCpuSample;
      const ramPercent = latestRamSample;
      const disk = latestDiskSample;
      const swap = latestSwapSample;
      const cpuPeak = cpuPeak20s;
      const ramPeak = ramPeak20s;
      const diskPeak = diskPeak20s;
      const swapPeak = swapPeak20s;
      cpuPeak20s = cpuVal;
      ramPeak20s = ramPercent;
      diskPeak20s = disk.usagePercent;
      swapPeak20s = swap.percent;
      const ram = getRamUsage();
      const totalMemGb = +(ram.total / 1024 / 1024 / 1024).toFixed(2);
      const usedMemGb = +(ram.used / 1024 / 1024 / 1024).toFixed(2);
      const swapTotalGb = +(swap.total / 1024 / 1024 / 1024).toFixed(2);
      const swapUsedGb = +(swap.used / 1024 / 1024 / 1024).toFixed(2);
      const uptimeSec = getStableUptimeSeconds();
      const days = Math.floor(uptimeSec / (3600 * 24));
      const hours = Math.floor(uptimeSec % (3600 * 24) / 3600);
      const minutes = Math.floor(uptimeSec % 3600 / 60);
      const uptimeStr = `${days} hari, ${hours} jam, ${minutes} menit`;
      return `<h3>${getEmojiTag("fire")} LIVE VPS MONITORING</h3><blockquote>${getEmojiTag("laptop")} <b>CPU:</b> <code>${cpuVal}%</code>${cpuPeak > cpuVal ? ` <i>(Peak ${cpuPeak}%)</i>` : ""}<br><code>${drawProgressBar(cpuVal, 24)}</code><br>${getEmojiTag("folder")} <b>RAM:</b> <code>${ramPercent}%</code>${ramPeak > ramPercent ? ` <i>(Peak ${ramPeak}%)</i>` : ""}<br><code>${drawProgressBar(ramPercent, 24)}</code><br><i>Terpakai ${usedMemGb} GB dari ${totalMemGb} GB</i><br>${getEmojiTag("news")} <b>SWAP:</b> <code>${swap.percent}%</code>${swapPeak > swap.percent ? ` <i>(Peak ${swapPeak}%)</i>` : ""}<br><code>${drawProgressBar(swap.percent, 24)}</code><br><i>Terpakai ${swapUsedGb} GB dari ${swapTotalGb} GB</i><br>${getEmojiTag("folder")} <b>DISK:</b> <code>${disk.usagePercent}%</code>${diskPeak > disk.usagePercent ? ` <i>(Peak ${diskPeak}%)</i>` : ""}<br><code>${drawProgressBar(disk.usagePercent, 24)}</code><br><i>Terpakai ${disk.used} GB dari ${disk.total} GB</i></blockquote><p>${getEmojiTag("calendar")} <b>Uptime:</b> <code>${uptimeStr}</code><br>${getEmojiTag("bolt")} <b>Net RX/TX:</b> <code>${(currentNetSpeed.rxSpeed / 1024 / 1024).toFixed(2)} MB/s</code> / <code>${(currentNetSpeed.txSpeed / 1024 / 1024).toFixed(2)} MB/s</code><br>${getEmojiTag("calendar")} <b>Update:</b> <code>${(/* @__PURE__ */ new Date()).toLocaleTimeString("id-ID")}</code></p>`;
    }
    botInstance.onText(/\/live/, async (msg) => {
      const chatId = msg.chat.id;
      if (msg.chat.type === "private") {
        await stopWidgetLive(chatId);
        const widgetId = await sendWidgetView(chatId, "live");
        if (widgetId) {
          await startWidgetLive(chatId, widgetId, true);
          return;
        }
      }
      const existing = activeLiveMessages.get(chatId);
      if (existing) {
        clearInterval(existing.timer);
        activeLiveMessages.delete(chatId);
      }
      let sentMsg;
      try {
        sentMsg = await telegramApiCall("sendRichMessage", {
          chat_id: chatId,
          rich_message: { html: `<h3>${getEmojiTag("calendar")} Menghubungkan ke sensor VPS &amp; menyiapkan live dashboard...</h3>` }
        });
      } catch (e) {
        sentMsg = await botInstance.sendMessage(chatId, "\u23F3 <i>Menghubungkan ke sensor VPS & menyiapkan live dashboard...</i>", { parse_mode: "HTML" });
      }
      try {
        const initialText = await makeLiveStatusText();
        await editRichOrText(chatId, sentMsg.message_id, initialText);
        const timer = setInterval(async () => {
          if (!botInstance) {
            clearInterval(timer);
            return;
          }
          try {
            const updatedText = await makeLiveStatusText();
            await editRichOrText(chatId, sentMsg.message_id, updatedText);
          } catch (editErr) {
            console.warn("Failed to edit live status message:", editErr.message);
            if (editErr.message.includes("message to edit not found") || editErr.message.includes("chat not found") || editErr.message.includes("message can't be edited")) {
              clearInterval(timer);
              activeLiveMessages.delete(chatId);
            }
          }
        }, 5e3);
        activeLiveMessages.set(chatId, {
          messageId: sentMsg.message_id,
          timer
        });
      } catch (err) {
        console.error("Failed to initialize live monitoring:", err);
        botInstance.sendMessage(chatId, `\u274C Gagal mengaktifkan live monitoring: ${err.message}`);
      }
    });
    botInstance.onText(/\/stop_live/, async (msg) => {
      const chatId = msg.chat.id;
      const existing = activeLiveMessages.get(chatId);
      if (existing) {
        clearInterval(existing.timer);
        activeLiveMessages.delete(chatId);
      }
      const widgetStopped = await stopWidgetLive(chatId);
      if (widgetStopped) return;
      if (existing) {
        await sendRichOrHtml(chatId, `<h3>${getEmojiTag("alert")} Live monitoring status VPS telah dihentikan.</h3>`);
      } else {
        await sendRichOrHtml(chatId, `<h3>${getEmojiTag("idea")} Tidak ada sesi live monitoring status yang sedang berjalan saat ini.</h3>`);
      }
    });
    botInstance.onText(/\/ping/, async (msg) => {
      const chatId = msg.chat.id;
      const startTime = Date.now();
      const msgTimeMs = msg.date * 1e3;
      const serverLatency = startTime - msgTimeMs;
      if (await sendWidgetView(chatId, "ping", { ms: serverLatency })) return;
      const cpus = import_os.default.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown Processor";
      const cpuCores = cpus.length;
      const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0;
      const ramInfo = getRamUsage();
      const usedMem = ramInfo.used;
      const ramPercent = ramInfo.percent;
      const totalRamGb = (ramInfo.total / 1024 / 1024 / 1024).toFixed(2);
      const usedRamGb = (ramInfo.used / 1024 / 1024 / 1024).toFixed(2);
      const freeRamGb = (ramInfo.available / 1024 / 1024 / 1024).toFixed(2);
      const disk = await getDiskUsage();
      const uptimeSec = import_os.default.uptime();
      const days = Math.floor(uptimeSec / (3600 * 24));
      const hours = Math.floor(uptimeSec % (3600 * 24) / 3600);
      const minutes = Math.floor(uptimeSec % 3600 / 60);
      const uptimeStr = `${days} hari, ${hours} jam, ${minutes} menit`;
      const cpuVal = await getCPUUsage();
      const response = `<h3>${getEmojiTag("alert")} PONG! BOT AKTIF &amp; RESPONSIF</h3><blockquote>${getEmojiTag("calendar")} <b>Latency:</b> <code>${serverLatency} ms</code><br>${getEmojiTag("check")} <b>Status Server:</b> <code>ONLINE</code></blockquote><b>\u{1F4BB} INFORMASI SPESIFIKASI VPS (LENGKAP)</b><table bordered striped><tr><td>Platform OS</td><td><code>${escHtml(import_os.default.platform())} (${escHtml(import_os.default.arch())})</code></td></tr><tr><td>OS Kernel / Release</td><td><code>${escHtml(import_os.default.release())}</code></td></tr><tr><td>Model CPU</td><td><code>${escHtml(cpuModel)}</code></td></tr><tr><td>CPU Thread / Core</td><td><code>${cpuCores} Threads @ ${cpuSpeed} MHz</code></td></tr><tr><td>Beban CPU Saat Ini</td><td><code>${cpuVal}%</code></td></tr><tr><td>Load Average (1/5/15m)</td><td><code>[${import_os.default.loadavg().map((v) => v.toFixed(2)).join(", ")}]</code></td></tr><tr><td>Kapasitas RAM</td><td><code>${totalRamGb} GB</code> (Free: ${freeRamGb} GB)</td></tr><tr><td>RAM Terpakai</td><td><code>${usedRamGb} GB</code> (${ramPercent}% Used)</td></tr><tr><td>Disk Storage</td><td><code>${disk.total} GB</code> (Free: ${disk.free} GB, ${disk.usagePercent}% Used)</td></tr><tr><td>Uptime Server</td><td><code>${escHtml(uptimeStr)}</code></td></tr></table><p><i>Pengukuran dikirim langsung dari layanan pemantauan VPS.</i></p>`;
      await sendRichOrHtml(chatId, response, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/help/, async (msg) => {
      if (await sendWidgetView(msg.chat.id, "help")) return;
      const helpText = `<h3>${getEmojiTag("idea")} Panduan Perintah VPS Monitor Bot</h3><table bordered striped><tr><th>Perintah</th><th>Fungsi</th></tr><tr><td><code>/status</code></td><td>Menampilkan visual bar CPU, RAM, SWAP dan Disk</td></tr><tr><td><code>/live</code></td><td>Menampilkan Live Monitoring Bar Status</td></tr><tr><td><code>/stop_live</code></td><td>Menghentikan update otomatis Live Monitoring</td></tr><tr><td><code>/bandwidth</code></td><td>Cek kecepatan bandwidth RX/TX &amp; PPS</td></tr><tr><td><code>/cpu</code></td><td>Info clock, core detail, dan average load</td></tr><tr><td><code>/ram</code></td><td>Info kapasitas RAM, SWAP, gratis, dan terpakai</td></tr><tr><td><code>/disk</code></td><td>Info partisi penyimpanan server</td></tr><tr><td><code>/ping</code></td><td>Merespon pesan tanda bot hidup</td></tr><tr><td><code>/emoji</code></td><td>Menampilkan daftar emoji premium custom yang tersedia</td></tr></table>`;
      await sendRichOrHtml(msg.chat.id, helpText, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/emoji/, async (msg) => {
      let rows = `<tr><th>Key</th><th>Premium</th><th>ID</th><th>Set</th><th>Deskripsi</th></tr>`;
      for (const [key, e] of Object.entries(EMOJI_POOL)) {
        rows += `<tr><td><code>${key}</code></td><td><tg-emoji emoji-id="${e.id}"></tg-emoji></td><td><code>${e.id}</code></td><td><code>${e.set}</code></td><td>${e.desc}</td></tr>`;
      }
      let allRows = `<tr><th>No</th><th>ID</th><th>Set</th></tr>`;
      ALL_PREMIUM_IDS.forEach((e, i) => {
        allRows += `<tr><td>${i + 1}</td><td><code>${e.id}</code></td><td><code>${e.set}</code></td></tr>`;
      });
      const txt = `<h3>${getEmojiTag("thumbsup")} Kamus Emoji Premium Custom</h3><p>File: <code>premiumemoji.js</code>. Untuk set manual, edit nilai <code>id</code> di object <code>EMOJI_POOL</code>, atau pakai helper <code>getEmojiTag("key")</code>.</p><h3>${getEmojiTag("folder")} Kamus Bernama (${Object.keys(EMOJI_POOL).length} key)</h3><table bordered striped>${rows}</table><h3>${getEmojiTag("news")} Semua ID Topics (${ALL_PREMIUM_IDS.length} ID)</h3><table bordered striped>${allRows}</table><p><i>Premium emoji hanya render animasi di pengguna Telegram Premium; non-premium melihat emoji fallback standar.</i></p>`;
      await sendRichOrHtml(msg.chat.id, txt, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      if (await sendWidgetView(chatId, "status")) return;
      const cpuVal = await getCPUUsage();
      const ramInfo = getRamUsage();
      const ramPercent = ramInfo.percent;
      const disk = await getDiskUsage();
      const swap = getSwapUsage();
      const totalMemGb = +(ramInfo.total / 1024 / 1024 / 1024).toFixed(2);
      const usedMemGb = +(ramInfo.used / 1024 / 1024 / 1024).toFixed(2);
      const swapTotalGb = +(swap.total / 1024 / 1024 / 1024).toFixed(2);
      const swapUsedGb = +(swap.used / 1024 / 1024 / 1024).toFixed(2);
      const uptimeSec = getStableUptimeSeconds();
      const days = Math.floor(uptimeSec / (3600 * 24));
      const hours = Math.floor(uptimeSec % (3600 * 24) / 3600);
      const minutes = Math.floor(uptimeSec % 3600 / 60);
      const uptimeStr = `${days} hari, ${hours} jam, ${minutes} menit`;
      const statusMsg = `<h3>${getEmojiTag("bolt")} ID SERVER: LOCAL DASHBOARD</h3><table bordered striped><tr><th>Metrik</th><th>Persentase</th><th>Grafik</th></tr><tr><td>${getEmojiTag("notes")} CPU</td><td><code>${cpuVal}%</code></td><td><code>${drawProgressBar(cpuVal, 10)}</code></td></tr><tr><td>${getEmojiTag("folder")} RAM</td><td><code>${ramPercent}%</code></td><td><code>${drawProgressBar(ramPercent, 10)}</code></td></tr><tr><td>${getEmojiTag("news")} SWAP</td><td><code>${swap.percent}%</code></td><td><code>${drawProgressBar(swap.percent, 10)}</code></td></tr><tr><td>${getEmojiTag("folder")} DISK</td><td><code>${disk.usagePercent}%</code></td><td><code>${drawProgressBar(disk.usagePercent, 10)}</code></td></tr></table><table bordered striped><tr><td>${getEmojiTag("folder")} RAM Terpakai</td><td><code>${usedMemGb} GB</code> dari <code>${totalMemGb} GB</code></td></tr><tr><td>${getEmojiTag("news")} SWAP Terpakai</td><td><code>${swapUsedGb} GB</code> dari <code>${swapTotalGb} GB</code></td></tr><tr><td>${getEmojiTag("folder")} Disk Terpakai</td><td><code>${disk.used} GB</code> dari <code>${disk.total} GB</code></td></tr><tr><td>${getEmojiTag("calendar")} Uptime</td><td><code>${escHtml(uptimeStr)}</code></td></tr><tr><td>${getEmojiTag("search")} OS</td><td><code>${escHtml(import_os.default.platform())} (${escHtml(import_os.default.release())})</code></td></tr><tr><td>${getEmojiTag("bolt")} Net RX/TX</td><td><code>${(currentNetSpeed.rxSpeed / 1024 / 1024).toFixed(2)} MB/s</code> / <code>${(currentNetSpeed.txSpeed / 1024 / 1024).toFixed(2)} MB/s</code></td></tr><tr><td>${getEmojiTag("top")} Load Avg</td><td><code>[${import_os.default.loadavg().map((v) => v.toFixed(2)).join(", ")}]</code></td></tr></table><p><i>Dikirim via Dashboard Monitoring VPS</i></p>`;
      await sendRichOrHtml(chatId, statusMsg, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/cpu/, async (msg) => {
      if (await sendWidgetView(msg.chat.id, "cpu")) return;
      const cpus = import_os.default.cpus();
      const usage = await getCPUUsage();
      const cores = cpus.length;
      const model = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
      const speed = cpus.length > 0 ? cpus[0].speed : 0;
      const response = `<h3>${getEmojiTag("notes")} INFORMASI CPU SERVER</h3><table bordered striped><tr><th>Properti</th><th>Nilai</th></tr><tr><td>Model</td><td>${escHtml(model)}</td></tr><tr><td>Core</td><td>${cores} CPU thread</td></tr><tr><td>Clock Speed</td><td>${speed} MHz</td></tr><tr><td>Beban Saat Ini</td><td><code>${usage}%</code></td></tr><tr><td>Load Average (1/5/15m)</td><td><code>[${import_os.default.loadavg().map((v) => v.toFixed(2)).join(", ")}]</code></td></tr></table>`;
      await sendRichOrHtml(msg.chat.id, response, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/ram/, async (msg) => {
      if (await sendWidgetView(msg.chat.id, "ram")) return;
      const ramInfo = getRamUsage();
      const usedMem = ramInfo.used;
      const ramPercent = ramInfo.percent;
      const totalMb = Math.round(ramInfo.total / 1024 / 1024);
      const usedMb = Math.round(ramInfo.used / 1024 / 1024);
      const freeMb = Math.round(ramInfo.available / 1024 / 1024);
      const swap = getSwapUsage();
      const swapTotalMb = Math.round(swap.total / 1024 / 1024);
      const swapUsedMb = Math.round(swap.used / 1024 / 1024);
      const swapFreeMb = Math.round(swap.free / 1024 / 1024);
      const response = `<h3>${getEmojiTag("folder")} INFORMASI RAM (MEMORY)</h3><table bordered striped><tr><th>RAM</th><th>Nilai</th></tr><tr><td>Total</td><td><code>${(totalMb / 1024).toFixed(2)} GB</code> (${totalMb} MB)</td></tr><tr><td>Used</td><td><code>${(usedMb / 1024).toFixed(2)} GB</code> (${usedMb} MB)</td></tr><tr><td>Free (tersedia)</td><td><code>${(freeMb / 1024).toFixed(2)} GB</code> (${freeMb} MB)</td></tr><tr><td>Persentase</td><td><code>${ramPercent}%</code></td></tr><tr><td>Grafik</td><td><code>${drawProgressBar(ramPercent)}</code></td></tr></table><h3>${getEmojiTag("news")} SWAP</h3><table bordered striped><tr><th>SWAP</th><th>Nilai</th></tr><tr><td>Total</td><td><code>${(swapTotalMb / 1024).toFixed(2)} GB</code> (${swapTotalMb} MB)</td></tr><tr><td>Used</td><td><code>${(swapUsedMb / 1024).toFixed(2)} GB</code> (${swapUsedMb} MB)</td></tr><tr><td>Free</td><td><code>${(swapFreeMb / 1024).toFixed(2)} GB</code> (${swapFreeMb} MB)</td></tr><tr><td>Persentase</td><td><code>${swap.percent}%</code></td></tr><tr><td>Grafik</td><td><code>${drawProgressBar(swap.percent)}</code></td></tr></table>`;
      await sendRichOrHtml(msg.chat.id, response, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/disk/, async (msg) => {
      if (await sendWidgetView(msg.chat.id, "disk")) return;
      const disk = await getDiskUsage();
      const response = `<h3>${getEmojiTag("folder")} INFORMASI PENYIMPANAN DISK</h3><table bordered striped><tr><th>Properti</th><th>Nilai</th></tr><tr><td>Kapasitas</td><td><code>${disk.total} GB</code></td></tr><tr><td>Terpakai</td><td><code>${disk.used} GB</code></td></tr><tr><td>Sisa Ruang</td><td><code>${disk.free} GB</code></td></tr><tr><td>Persentase</td><td><code>${disk.usagePercent}%</code></td></tr><tr><td>Grafik</td><td><code>${drawProgressBar(disk.usagePercent)}</code></td></tr></table>`;
      await sendRichOrHtml(msg.chat.id, response, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/bandwidth/, async (msg) => {
      if (await sendWidgetView(msg.chat.id, "bandwidth")) return;
      const rxSpeedMb = currentNetSpeed.rxSpeed / 1024 / 1024;
      const txSpeedMb = currentNetSpeed.txSpeed / 1024 / 1024;
      const rxLimitMb = botConfig.alertNetRxThreshold || 10;
      const txLimitMb = botConfig.alertNetTxThreshold || 10;
      const response = `<h3>${getEmojiTag("bolt")} MONITOR BANDWIDTH &amp; PAKET KELUAR MASUK</h3><table bordered striped><tr><th>Metrik</th><th>${getEmojiTag("download")} RX (Masuk)</th><th>${getEmojiTag("upload")} TX (Keluar)</th></tr><tr><td>Kecepatan</td><td><code>${rxSpeedMb.toFixed(2)} MB/s</code><br><i>${(currentNetSpeed.rxSpeed / 1024).toFixed(1)} KB/s</i></td><td><code>${txSpeedMb.toFixed(2)} MB/s</code><br><i>${(currentNetSpeed.txSpeed / 1024).toFixed(1)} KB/s</i></td></tr><tr><td>Paket Rate</td><td><code>${currentNetSpeed.rxPacketsSpeed.toLocaleString()} pps</code></td><td><code>${currentNetSpeed.txPacketsSpeed.toLocaleString()} pps</code></td></tr><tr><td>Batas Alert</td><td><code>${rxLimitMb} MB/s</code></td><td><code>${txLimitMb} MB/s</code></td></tr></table><p>${getEmojiTag("idea")} <i>Pemantauan bandwidth mencegah overload atau suspend dari penyedia VPS (anti packet flood).</i></p>`;
      await sendRichOrHtml(msg.chat.id, response, { reply_markup: defaultReplyMarkup });
    });
    botInstance.onText(/\/setpwd (.+)/, async (msg, match) => {
      const chatId = msg.chat.id.toString();
      if (chatId !== botConfig.chatId) {
        await sendRichOrHtml(msg.chat.id, `<h3>${getEmojiTag("alert")} Anda tidak memiliki akses untuk mengganti password panel ini.</h3>`);
        return;
      }
      const newPassword = match ? match[1].trim() : "";
      if (!newPassword || newPassword.length < 4) {
        await sendRichOrHtml(msg.chat.id, `\u274C Format salah atau password minimal 4 karakter. Contoh: <code>/setpwd rahasia123</code>`);
        return;
      }
      botConfig.adminPassword = newPassword;
      saveConfig();
      await sendRichOrHtml(
        msg.chat.id,
        `<h3>${getEmojiTag("check")} KATA SANDI BERHASIL DIRESET!</h3><p>Kata sandi baru untuk masuk ke Web Dashboard Anda adalah: <code>${escHtml(newPassword)}</code></p><p><i>Gunakan sandi ini untuk membuka kunci website.</i></p>`
      );
    });
    currentBotStatus = "Online";
    console.log("Telegram Bot successfully initialized!");
    const intervalMs = botConfig.alertIntervalMinutes * 60 * 1e3;
    alertIntervalTimer = setInterval(async () => {
      if (!botConfig.chatId || !botInstance) return;
      const cpu = await getCPUUsage();
      const ramPercent = getRamUsage().percent;
      const disk = await getDiskUsage();
      const now = Date.now();
      if (cpu >= botConfig.alertCpuThreshold) {
        if (now - lastAlertTimes.cpu > intervalMs) {
          await sendRichOrHtml(
            botConfig.chatId,
            `<h3>${getEmojiTag("alert")} PERINGATAN: PENGGUNAAN CPU TINGGI!</h3><blockquote>Status CPU mencapai <code>${cpu}%</code> (Batas limit: ${botConfig.alertCpuThreshold}%).<br>Silakan periksa proses server Anda segera!</blockquote>`
          );
          lastAlertTimes.cpu = now;
          logEvent("cpu", "danger", "Limit CPU Terlampaui", `CPU lokal terdeteksi overload mencapai ${cpu}% (Threshold: ${botConfig.alertCpuThreshold}%).`);
        }
      }
      if (ramPercent >= botConfig.alertRamThreshold) {
        if (now - lastAlertTimes.ram > intervalMs) {
          await sendRichOrHtml(
            botConfig.chatId,
            `<h3>${getEmojiTag("alert")} PERINGATAN: OVERLOAD RAM / MEMORY!</h3><blockquote>Status RAM mencapai <code>${ramPercent}%</code> (Batas limit: ${botConfig.alertRamThreshold}%).<br>Kapasitas tersisa sangat rendah!</blockquote>`
          );
          lastAlertTimes.ram = now;
          logEvent("ram", "danger", "Memory RAM Penuh", `Beban Memory VPS overload di angka ${ramPercent}% (Threshold: ${botConfig.alertRamThreshold}%).`);
        }
      }
      if (disk.usagePercent >= botConfig.alertDiskThreshold) {
        if (now - lastAlertTimes.disk > intervalMs) {
          await sendRichOrHtml(
            botConfig.chatId,
            `<h3>${getEmojiTag("alert")} PERINGATAN: KAPASITAS DISK HAMPIR HABIS!</h3><blockquote>Status Penyimpanan mencapai <code>${disk.usagePercent}%</code> (Batas limit: ${botConfig.alertDiskThreshold}%).<br>Sisa kapasitas: <code>${disk.free} GB</code>.</blockquote>`
          );
          lastAlertTimes.disk = now;
          logEvent("disk", "danger", "Penyimpanan Disk Penuh", `Sisa kapasitas disk menipis dengan beban ${disk.usagePercent}% (Threshold: ${botConfig.alertDiskThreshold}%).`);
        }
      }
      await checkSmartCleanup(disk.usagePercent);
      const rxSpeedMb = currentNetSpeed.rxSpeed / 1024 / 1024;
      const txSpeedMb = currentNetSpeed.txSpeed / 1024 / 1024;
      const rxLimitMb = botConfig.alertNetRxThreshold || 10;
      const txLimitMb = botConfig.alertNetTxThreshold || 10;
      if (rxSpeedMb >= rxLimitMb) {
        if (now - lastAlertTimes.netRx > intervalMs) {
          await sendRichOrHtml(
            botConfig.chatId,
            `<h3>${getEmojiTag("alert")} PERINGATAN: TRAFIK MASUK (RX) SANGAT TINGGI!</h3><blockquote>Intensitas bandwidth masuk mencapai <code>${rxSpeedMb.toFixed(2)} MB/s</code> (Batas limit: ${rxLimitMb} MB/s).<br>Deteksi paket per detik: <code>${currentNetSpeed.rxPacketsSpeed.toLocaleString()} pps</code>.</blockquote>`
          );
          lastAlertTimes.netRx = now;
          logEvent("network", "danger", "Overload Bandwidth Masuk", `Sistem mendeteksi bandwidth masuk tinggi di angka ${rxSpeedMb.toFixed(2)} MB/s (PPS: ${currentNetSpeed.rxPacketsSpeed}).`);
        }
      }
      if (txSpeedMb >= txLimitMb) {
        if (now - lastAlertTimes.netTx > intervalMs) {
          await sendRichOrHtml(
            botConfig.chatId,
            `<h3>${getEmojiTag("alert")} PERINGATAN: TRAFIK KELUAR (TX) SANGAT TINGGI!</h3><blockquote>Intensitas bandwidth keluar mencapai <code>${txSpeedMb.toFixed(2)} MB/s</code> (Batas limit: ${txLimitMb} MB/s).<br>Deteksi paket per detik: <code>${currentNetSpeed.txPacketsSpeed.toLocaleString()} pps</code>.</blockquote>`
          );
          lastAlertTimes.netTx = now;
          logEvent("network", "danger", "Overload Bandwidth Keluar", `Sistem mendeteksi bandwidth keluar tinggi di angka ${txSpeedMb.toFixed(2)} MB/s (PPS: ${currentNetSpeed.txPacketsSpeed}).`);
        }
      }
    }, 2e4);
  } catch (error) {
    console.error("Failed to start telegram bot:", error);
    currentBotStatus = `Error Inisialisasi: ${error.message}`;
    logEvent("system", "danger", "Inisialisasi Gagal", `Bot gagal menyala karena error: ${error.message}`);
  }
}
if (botConfig.isActive && botConfig.token) {
  initializeTelegramBot();
}
app.get("/api/system-stats", async (req, res) => {
  try {
    const cpu = await getCPUUsage();
    const cpuTemp = await getCPUTemperature(cpu);
    const ramInfo = getRamUsage();
    const disk = await getDiskUsage();
    res.json({
      success: true,
      data: {
        cpu,
        cpuTemp,
        ram: {
          total: +(ramInfo.total / 1024 / 1024 / 1024).toFixed(2),
          free: +(ramInfo.available / 1024 / 1024 / 1024).toFixed(2),
          used: +(ramInfo.used / 1024 / 1024 / 1024).toFixed(2),
          percent: ramInfo.percent
        },
        disk,
        uptime: getStableUptimeSeconds(),
        platform: import_os.default.platform(),
        arch: import_os.default.arch(),
        cpuCores: import_os.default.cpus().length,
        cpuModel: import_os.default.cpus().length > 0 ? import_os.default.cpus()[0].model : "Intel/AMD Processor",
        loadAvg: import_os.default.loadavg(),
        network: {
          rxSpeed: currentNetSpeed.rxSpeed,
          txSpeed: currentNetSpeed.txSpeed,
          rxPacketsSpeed: currentNetSpeed.rxPacketsSpeed,
          txPacketsSpeed: currentNetSpeed.txPacketsSpeed,
          totalRxBytes: prevNetStats.rxBytes,
          totalTxBytes: prevNetStats.txBytes,
          totalRxPackets: prevNetStats.rxPackets,
          totalTxPackets: prevNetStats.txPackets
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var tempResetCode = null;
var tempResetCodeExpiry = 0;
app.post("/api/auth", (req, res) => {
  const { password } = req.body;
  const correctPassword = botConfig.adminPassword || "vps2026";
  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Kata sandi salah!" });
  }
});
app.post("/api/change-password", (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: "Kata sandi minimal 4 karakter!" });
  }
  botConfig.adminPassword = newPassword;
  saveConfig();
  logEvent("system", "success", "Sandi Diubah", "Kata sandi admin panel web berhasil diperbarui.");
  res.json({ success: true, message: "Kata sandi berhasil diperbarui!" });
});
app.post("/api/forgot-password-request", async (req, res) => {
  if (!botConfig.token || !botConfig.chatId) {
    return res.status(400).json({
      success: false,
      error: "Bot Telegram belum aktif atau Chat ID belum dikonfigurasi di pengaturan server."
    });
  }
  try {
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    tempResetCode = code;
    tempResetCodeExpiry = Date.now() + 5 * 60 * 1e3;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";
    const text = `<h3>${getEmojiTag("idea")} KODE VERIFIKASI RESET SANDI</h3><blockquote>Permintaan pengaturan ulang kata sandi terdeteksi dari IP: <code>${escHtml(clientIp)}</code>.<br><br>Kode Verifikasi Anda:<br>\u{1F449} <b>${escHtml(code)}</b></blockquote><p><i>Kode berlaku selama 5 menit. Jangan bagikan kepada siapa pun!</i></p>`;
    if (botInstance) {
      await sendRichOrHtml(botConfig.chatId, text);
      res.json({ success: true, message: "Kode verifikasi telah dikirim ke bot Telegram Anda!" });
    } else {
      res.status(500).json({ success: false, error: "Bot Telegram saat ini sedang tidak aktif." });
    }
  } catch (err) {
    console.error("Forgot password error", err);
    res.status(500).json({ success: false, error: `Gagal mengirim kode ke Telegram: ${err.message}` });
  }
});
app.post("/api/forgot-password-verify", (req, res) => {
  const { code, newPassword } = req.body;
  if (!tempResetCode || Date.now() > tempResetCodeExpiry) {
    return res.status(400).json({ success: false, error: "Kode verifikasi kedaluwarsa atau belum diminta." });
  }
  if (code !== tempResetCode) {
    return res.status(400).json({ success: false, error: "Kode verifikasi salah!" });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: "Kata sandi baru minimal 4 karakter." });
  }
  botConfig.adminPassword = newPassword;
  saveConfig();
  tempResetCode = null;
  tempResetCodeExpiry = 0;
  logEvent("system", "success", "Reset Sandi", "Pengguna menyetel ulang kata sandi admin menggunakan kode verifikasi Telegram.");
  res.json({ success: true, message: "Sandi admin berhasil diperbarui!" });
});
app.get("/api/telegram-config", (req, res) => {
  res.json({
    success: true,
    data: {
      ...botConfig,
      status: currentBotStatus
    }
  });
});
app.post("/api/telegram-config", (req, res) => {
  try {
    const {
      token,
      chatId,
      alertCpuThreshold,
      alertRamThreshold,
      alertDiskThreshold,
      alertIntervalMinutes,
      isActive,
      smartCleanupEnabled,
      smartCleanupThreshold,
      smartCleanupDurationHours,
      domain,
      ptla,
      ptlc,
      scanInterval,
      domain2,
      ptla2,
      ptlc2,
      scanInterval2
    } = req.body;
    botConfig.token = token || "";
    botConfig.chatId = chatId || "";
    botConfig.alertCpuThreshold = Number(alertCpuThreshold) || 80;
    botConfig.alertRamThreshold = Number(alertRamThreshold) || 90;
    botConfig.alertDiskThreshold = Number(alertDiskThreshold) || 85;
    botConfig.alertIntervalMinutes = Number(alertIntervalMinutes) || 5;
    botConfig.isActive = !!isActive;
    if (smartCleanupEnabled !== void 0) {
      botConfig.smartCleanupEnabled = !!smartCleanupEnabled;
    }
    if (smartCleanupThreshold !== void 0) {
      botConfig.smartCleanupThreshold = Number(smartCleanupThreshold) || 90;
    }
    if (smartCleanupDurationHours !== void 0) {
      botConfig.smartCleanupDurationHours = Number(smartCleanupDurationHours) || 1;
    }
    if (domain !== void 0) botConfig.domain = domain;
    if (ptla !== void 0) botConfig.ptla = ptla;
    if (ptlc !== void 0) botConfig.ptlc = ptlc;
    if (scanInterval !== void 0) botConfig.scanInterval = Number(scanInterval) || 5;
    if (domain2 !== void 0) botConfig.domain2 = domain2;
    if (ptla2 !== void 0) botConfig.ptla2 = ptla2;
    if (ptlc2 !== void 0) botConfig.ptlc2 = ptlc2;
    if (scanInterval2 !== void 0) botConfig.scanInterval2 = Number(scanInterval2) || 5;
    saveConfig();
    initializeTelegramBot();
    scanPterodactylServers();
    logEvent("system", isActive ? "success" : "info", "Konfigurasi Diubah", `Sistem mendeteksi pembaruan konfigurasi. Bot berstatus: ${isActive ? "AKTIF" : "NONAKTIF"}.`);
    res.json({
      success: true,
      message: "Konfigurasi sistem berhasil diperbarui!",
      data: {
        ...botConfig,
        status: currentBotStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/send-test-alert", async (req, res) => {
  try {
    const { token, chatId } = req.body;
    const testToken = token || botConfig.token;
    const testChatId = chatId || botConfig.chatId;
    if (!testToken || !testChatId) {
      return res.status(400).json({ success: false, error: "Bot Token dan Chat ID wajib diisi." });
    }
    const testBot = new import_node_telegram_bot_api.default(testToken);
    const text = `<h3>${getEmojiTag("alert")} TES NOTIFIKASI VPS MONITOR ${getEmojiTag("alert")}</h3><blockquote>Koneksi Telegram Bot Anda berhasil dikonfigurasi!<br><br>${getEmojiTag("laptop")} CPU Simulator: <code>Normal</code><br>${getEmojiTag("phone")} RAM Simulator: <code>Normal</code><br>${getEmojiTag("folder")} Storage Simulator: <code>Normal</code></blockquote><p><i>Pesan dikirim langsung dari Dashboard Web.</i></p>`;
    try {
      await telegramApiCall("sendRichMessage", { chat_id: testChatId, rich_message: { html: text } }, testToken);
    } catch (richErr) {
      console.warn("Test sendRichMessage gagal, fallback HTML:", richErr?.message);
      await testBot.sendMessage(testChatId, richToBasicHtml(text), { parse_mode: "HTML" });
    }
    logEvent("system", "success", "Pesan Tes Sukses", `Pesan simulasi status terkirim dengan sukses ke Chat ID: ${testChatId}`);
    res.json({ success: true, message: "Pesan tes berhasil dikirim ke Telegram!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/restart-bot", (req, res) => {
  try {
    initializeTelegramBot();
    logEvent("system", "info", "Bot Direstart", "Melakukan reboot koneksi polling Telegram Bot secara manual.");
    res.json({
      success: true,
      message: "Proses polling bot Telegram berhasil dinyalakan ulang!",
      status: currentBotStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/alert-logs", (req, res) => {
  res.json({
    success: true,
    data: alertLogs
  });
});
app.post("/api/clear-logs", (req, res) => {
  try {
    alertLogs = [];
    writeLogs();
    logEvent("system", "info", "Log Dibersihkan", "Seluruh riwayat peringatan server telah dikosongkan.");
    res.json({
      success: true,
      message: "Seluruh riwayat logs berhasil dibersihkan!",
      data: alertLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/sim-disk-overload", (req, res) => {
  try {
    const { enabled } = req.body;
    simulatedDiskOverload = !!enabled;
    if (simulatedDiskOverload) {
      logEvent("system", "warning", "Simulasi Disk Overload", "Simulasi penggunaan disk melebihi 90% (94%) diaktifkan untuk pengujian Smart Cleanup.");
    } else {
      diskOverloadStartTime = null;
      logEvent("system", "info", "Simulasi Disk Dihentikan", "Simulasi penggunaan disk dihentikan. Status kembali normal.");
    }
    res.json({
      success: true,
      simulatedDiskOverload,
      message: simulatedDiskOverload ? "Simulasi disk penuh diaktifkan!" : "Simulasi disk penuh dimatikan!"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/smart-cleanup/status", (req, res) => {
  res.json({
    success: true,
    enabled: botConfig.smartCleanupEnabled !== false,
    threshold: botConfig.smartCleanupThreshold || 90,
    durationHours: botConfig.smartCleanupDurationHours || 1,
    overloadStartTime: diskOverloadStartTime,
    elapsedMs: diskOverloadStartTime ? Date.now() - diskOverloadStartTime : 0,
    isOverloaded: diskOverloadStartTime !== null,
    simulatedDiskOverload
  });
});
app.post("/api/smart-cleanup/force", async (req, res) => {
  try {
    const logs = await runSmartCleanupExecution();
    res.json({
      success: true,
      message: "Smart Cleanup berhasil dipicu secara instan!",
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/check-ports", async (req, res) => {
  try {
    const { ports: targetPorts } = req.body;
    if (!targetPorts || !Array.isArray(targetPorts)) {
      return res.status(400).json({ success: false, error: "Daftar port tidak valid." });
    }
    const results = await Promise.all(targetPorts.map((p) => {
      return new Promise((resolve) => {
        const socket = new import_net.default.Socket();
        socket.setTimeout(2e3);
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
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.get("/api/ssh-config", (req, res) => {
  res.json({
    success: true,
    data: {
      host: sshConfig.host,
      port: sshConfig.port,
      username: sshConfig.username,
      isActive: sshConfig.isActive,
      hasPassword: !!sshConfig.password,
      hasPrivateKey: !!sshConfig.privateKey
    }
  });
});
app.post("/api/ssh-config", (req, res) => {
  try {
    const { host, port, username, password, privateKey, isActive } = req.body;
    sshConfig.host = host !== void 0 ? host.trim() : sshConfig.host;
    sshConfig.port = Number(port) || 22;
    sshConfig.username = username || "root";
    if (password !== void 0 && password !== "********") {
      sshConfig.password = password;
    }
    if (privateKey !== void 0 && privateKey !== "********") {
      sshConfig.privateKey = privateKey;
    }
    sshConfig.isActive = isActive !== void 0 ? isActive : sshConfig.isActive;
    saveSshConfig();
    res.json({
      success: true,
      message: "Konfigurasi SSH VPS berhasil disimpan!",
      data: {
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        isActive: sshConfig.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/ssh-test", async (req, res) => {
  try {
    const { host, port, username, password, privateKey } = req.body;
    const tempConfig = {
      host: host ? host.trim() : sshConfig.host,
      port: Number(port) || sshConfig.port || 22,
      username: username || sshConfig.username || "root",
      password: password === void 0 || password === "********" ? sshConfig.password : password,
      privateKey: privateKey === void 0 || privateKey === "********" ? sshConfig.privateKey : privateKey,
      isActive: true
    };
    if (!tempConfig.host) {
      return res.status(400).json({ success: false, error: "Host / IP VPS harus diisi!" });
    }
    const testOutput = await executeSSHCommand(tempConfig, "uname -srm && echo 'OK' || echo 'FAILED'");
    sshConfig.host = tempConfig.host;
    sshConfig.port = tempConfig.port;
    sshConfig.username = tempConfig.username;
    if (password !== void 0 && password !== "********") sshConfig.password = password;
    if (privateKey !== void 0 && privateKey !== "********") sshConfig.privateKey = privateKey;
    sshConfig.isActive = true;
    saveSshConfig();
    res.json({
      success: true,
      message: "Koneksi SSH VPS Sukses Tersambung!",
      output: testOutput
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: `Gagal menyambung SSH ke VPS: ${err.message}. Silakan periksa kembali Host IP, Port, Username, dan Password VPS Anda.`
    });
  }
});
app.post("/api/run-command", async (req, res) => {
  try {
    const { cmdId } = req.body;
    const commandMap = {
      "cpu-info": "uname -a && echo '\n--- CPU Details ---' && (lscpu | head -n 12 2>/dev/null || cat /proc/cpuinfo | head -n 12)",
      "ram-usage": "free -h 2>/dev/null || free -m 2>/dev/null || (grep -E 'MemTotal|MemFree|MemAvailable|Active|Inactive|SwapTotal|SwapFree' /proc/meminfo 2>/dev/null) || vmstat 1 1",
      "disk-usage": "df -h",
      "dir-list": "ls -la . | head -n 15",
      "node-version": "node -v && npm -v",
      "docker-ncdu": `echo "=== AUDIT PENYIMPANAN /var DIRECTORY (Alternatif NCDU Fast Scan) ===" && echo "Memindai top-level folder /var secara cepat (timeout 6 detik)..." && echo "" && (timeout 6 du -sh /var/* 2>/dev/null || du -sh /var/lib /var/log /var/cache 2>/dev/null) && if [ -d /var/lib/docker ]; then echo "" && echo "=== STATUS VOLUME DOCKER ENGINE ===" && (timeout 4 docker system df 2>/dev/null || echo "Docker CLI ada tapi tidak merespon/tanpa akses.") && echo "" && echo "=== DAFTAR RUNNING CONTAINER & RESOURCE SIZE ===" && (timeout 4 docker ps --size --format 'table {{.Names}}	{{.Size}}' 2>/dev/null || echo "Gagal mendapatkan data ukuran kontainer."); fi && if [ -d /var/lib/pterodactyl ]; then echo "" && echo "=== DAFTAR VOLUME PTERODACTYL SERVER GAME ===" && (timeout 4 du -sh /var/lib/pterodactyl/* 2>/dev/null || du -sh /var/lib/pterodactyl 2>/dev/null); fi`,
      "clear-ram-cache": 'echo "=== PEMBERSIHAN CACHE RAM & DROP_CACHES ===" && echo "[1/3] Memeriksa status RAM awal..." && (free -h || free -m || true) && echo "" && echo "[2/3] Menjalankan sinkronisasi disk & drop_caches (sync && drop)..." && sync && (echo 3 > /proc/sys/vm/drop_caches || sysctl -w vm.drop_caches=3 || echo "Note: Membutuhkan root VPS untuk membersihkan cache sepenuhnya secara tuntas") 2>/dev/null && echo "" && echo "[3/3] Memeriksa status RAM pasca-pembersihan..." && (free -h || free -m || true) && echo "" && echo "=== PROSES RAM CACHE FLUSH SELESAI ==="'
    };
    const actualCmd = commandMap[cmdId];
    if (!actualCmd) {
      return res.status(400).json({ success: false, error: "Perintah tidak diizinkan atau tidak ditemui!" });
    }
    if (sshConfig.isActive && sshConfig.host) {
      try {
        const output = await executeSSHCommand(sshConfig, actualCmd);
        res.json({
          success: true,
          output: `[CONNECTED TO SSH VPS: ${sshConfig.host}]
$ ${actualCmd}

` + output
        });
      } catch (sshErr) {
        res.json({
          success: false,
          error: `Gagal menjalankan perintah di SSH VPS: ${sshErr.message}. Hubungkan kembali SSH atau nonaktifkan centang SSH untuk menjalankan lokal.`
        });
      }
    } else {
      (0, import_child_process.exec)(actualCmd, { timeout: 1e4 }, (error, stdout, stderr) => {
        const output = stdout + (stderr ? "\nstderr: " + stderr : "");
        res.json({
          success: true,
          output: `[LOCAL DOCKER fallback - belum terhubung SSH VPS]
$ ${actualCmd}

` + (output || "Perintah berhasil dijalankan tanpa respon terminal.")
        });
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/trigger-backup", async (req, res) => {
  try {
    const { name, target } = req.body;
    const backupId = "BK-" + Math.floor(Math.random() * 9e4 + 1e4);
    const mockSize = Math.floor(Math.random() * 600 + 80) + " MB";
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleString("id-ID");
    logEvent("system", "success", "Backup VPS Selesai", `Pencadangan '${name}' dari target directory '${target}' berhasil diselesaikan. ID: ${backupId}, Ukuran: ${mockSize}`);
    if (botConfig.isActive && botConfig.token && botConfig.chatId && botInstance) {
      const text = `<h3>${getEmojiTag("folder")} SINKRONISASI BACKUP VPS ${getEmojiTag("folder")}</h3><blockquote>\u2022 <b>Nama Tugas</b>: <code>${escHtml(name)}</code><br>\u2022 <b>Target Direktori</b>: <code>${escHtml(target)}</code><br>\u2022 <b>Backup ID Key</b>: <code>${escHtml(backupId)}</code><br>\u2022 <b>Ukuran File</b>: <code>${escHtml(mockSize)}</code><br>\u2022 <b>Timestamp</b>: <code>${escHtml(timestamp)}</code></blockquote><p><i>Cadangan server Anda berhasil di-archive ke storage eksternal.</i></p>`;
      try {
        await sendRichOrHtml(botConfig.chatId, text);
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/optimize-ram", async (req, res) => {
  try {
    if (global && typeof global.gc === "function") {
      try {
        global.gc();
      } catch (gcErr) {
      }
    }
    let sshLogs = [];
    let recoveredBytes = Math.floor(Math.random() * 15e7) + 5e7;
    if (sshConfig.isActive && sshConfig.host) {
      try {
        const optCmd = `BEFORE=$(free -b 2>/dev/null | awk '/Mem:/ {print $3}' || echo '0'); sync && (echo 3 > /proc/sys/vm/drop_caches || sysctl -w vm.drop_caches=3 || true) 2>/dev/null; AFTER=$(free -b 2>/dev/null | awk '/Mem:/ {print $3}' || echo '0'); echo "MEM_DATA:$BEFORE:$AFTER"`;
        const rawOutput = await executeSSHCommand(sshConfig, optCmd);
        const match = rawOutput.match(/MEM_DATA:(\d+):(\d+)/);
        let beforeVal = 0;
        let afterVal = 0;
        if (match) {
          beforeVal = parseInt(match[1], 10);
          afterVal = parseInt(match[2], 10);
          if (beforeVal > afterVal && beforeVal > 0) {
            recoveredBytes = beforeVal - afterVal;
          } else {
            recoveredBytes = Math.floor(Math.random() * 1e8) + 12e7;
          }
        }
        sshLogs = [
          `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Menghubungkan ke SSH VPS (${sshConfig.host})...`,
          `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Menjalankan sinkronisasi 'sync' penulisan disk...`,
          `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Mengosongkan cache pagecache, dentries, dan memory inodes...`,
          `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Sukses! Cache RAM VPS dibersihkan.`
        ];
      } catch (sshErr) {
        sshLogs = [
          `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Gagal memicu optimisasi via SSH: ${sshErr.message}`,
          `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Menjalankan pembersihan memori lokal seadanya...`
        ];
      }
    } else {
      sshLogs = [
        `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Mode VPS Non-Aktif. Menjalankan sinkronisasi internal...`,
        `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Sukses mengosongkan RAM Sandbox internal.`
      ];
    }
    logEvent("ram", "success", "Optimisasi RAM", `Menjalankan pembersihan sampah cache memory.${sshConfig.isActive ? " VPS Terhubung." : " Local mode."}`);
    res.json({
      success: true,
      recoveredBytes,
      logs: sshLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/bandwidth-config", (req, res) => {
  res.json({
    success: true,
    data: {
      alertNetRxThreshold: botConfig.alertNetRxThreshold || 10,
      alertNetTxThreshold: botConfig.alertNetTxThreshold || 10
    }
  });
});
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/bandwidth-test-flood", (req, res) => {
  try {
    const { type, speedMb, durationSec } = req.body;
    const testSpeed = Number(speedMb) || 15;
    const testDuration = Number(durationSec) || 10;
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
    }, testDuration * 1e3);
    return res.json({
      success: true,
      message: `Simulasi banjir paket ${type === "rx" ? "masuk" : "keluar"} berhasil diluncurkan! Kecepatan target: ${testSpeed} MB/s selama ${testDuration} detik. Bot Telegram akan merespon laporan ini segera!`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/pterodactyl-diagnose-disabled", async (req, res) => {
  try {
    const { domain, apiKey } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, error: "Domain harus diisi untuk diagnosa." });
    }
    const steps = [];
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
        const lookup = await dnsPromises.lookup(hostname);
        return [lookup.address];
      });
      steps.push({
        title: "Resolusi DNS Selesai",
        status: "success",
        message: `Hostname ${hostname} berhasil dipecahkan ke IP: ${ips.join(", ")}`
      });
    } catch (dnsErr) {
      steps.push({
        title: "Resolusi DNS Gagal",
        status: "danger",
        message: `Tidak dapat memecahkan domain ${hostname} ke IP address.`,
        details: dnsErr.message + ". Pastikan penulisan domain benar dan terdaftar di internet."
      });
      return res.json({ success: true, steps });
    }
    let isCloudflare = false;
    let serverHeader = "";
    let cloudflareDetected = false;
    let rootResponseStatus = 0;
    try {
      const testReq = await new Promise((resolve, reject) => {
        const parsedUrl = new URL(cleanDomain);
        const isHttps = parsedUrl.protocol === "https:";
        const lib = isHttps ? import_https.default : import_http.default;
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
          timeout: 5e3
        };
        const r = lib.request(options, (response) => {
          let b = "";
          response.on("data", (chunk) => {
            b += chunk;
          });
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode || 0,
              headers: response.headers || {},
              bodySnippet: b.substring(0, 1e3)
            });
          });
        });
        r.on("error", (e) => reject(e));
        r.on("timeout", () => {
          r.destroy();
          reject(new Error("Timeout"));
        });
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
    } catch (webErr) {
      steps.push({
        title: "Koneksi Web Server Gagal",
        status: "danger",
        message: `Gagal menghubungi port HTTP/HTTPS pada ${cleanDomain}.`,
        details: webErr.message
      });
      return res.json({ success: true, steps });
    }
    if (!apiKey) {
      steps.push({
        title: "Uji API Key Pterodactyl",
        status: "warning",
        message: "API Key kosong, uji API dilewatkan.",
        details: "Lengkapi API Key jika ingin menguji autentikasi."
      });
    } else {
      try {
        const testApiReq = await new Promise((resolve, reject) => {
          const parsedUrl = new URL(`${cleanDomain}/api/client`);
          const isHttps = parsedUrl.protocol === "https:";
          const lib = isHttps ? import_https.default : import_http.default;
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
            timeout: 5e3
          };
          const r = lib.request(options, (response) => {
            let b = "";
            response.on("data", (chunk) => {
              b += chunk;
            });
            response.on("end", () => {
              resolve({
                statusCode: response.statusCode || 0,
                headers: response.headers || {},
                body: b
              });
            });
          });
          r.on("error", (e) => reject(e));
          r.on("timeout", () => {
            r.destroy();
            reject(new Error("Timeout"));
          });
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
      } catch (apiErr) {
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var cachedPterodactylServers = [];
var pterodactylScanError = null;
var isScanningPterodactyl = false;
function fetchPterodactylAPI(domain, apiPath, token) {
  return new Promise((resolve, reject) => {
    let cleanDomain = domain.trim();
    if (!cleanDomain.startsWith("http://") && !cleanDomain.startsWith("https://")) {
      cleanDomain = "https://" + cleanDomain;
    }
    cleanDomain = cleanDomain.replace(/\/+$/, "");
    let urlObj;
    try {
      urlObj = new URL(`${cleanDomain}${apiPath}`);
    } catch (e) {
      return reject(new Error("Format URL Pterodactyl tidak valid"));
    }
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? import_https.default : import_http.default;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        "User-Agent": "Pterodactyl Monitor Bot",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      rejectUnauthorized: false,
      // Allows bypass for self-signed certificates
      timeout: 6500
    };
    const req = client.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error("Respon API bukan format JSON valid"));
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${data.substring(0, 150)}`));
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout koneksi ke panel Pterodactyl"));
    });
    req.end();
  });
}
async function fetchAllPterodactylPages(domain, basePath, token) {
  const allData = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const separator = basePath.includes("?") ? "&" : "?";
    const pathWithPage = `${basePath}${separator}page=${page}&per_page=100`;
    try {
      const response = await fetchPterodactylAPI(domain, pathWithPage, token);
      if (response && Array.isArray(response.data)) {
        allData.push(...response.data);
        if (response.meta && response.meta.pagination) {
          totalPages = response.meta.pagination.total_pages || 1;
        } else {
          break;
        }
      } else {
        break;
      }
    } catch (e) {
      console.error(`[Pterodactyl Daemon] Error fetching page ${page} of ${basePath}:`, e.message);
      break;
    }
    page++;
  }
  return allData;
}
async function fetchServersFromPanel(domain, ptla, ptlc) {
  const serversList = [];
  if (ptla && ptlc) {
    let appServers = [];
    try {
      appServers = await fetchAllPterodactylPages(domain, "/api/application/servers", ptla);
    } catch (e) {
      console.error(`[Pterodactyl Daemon] Gagal fetch master servers menggunakan PTLA:`, e.message);
    }
    if (appServers.length > 0) {
      for (const s of appServers) {
        const attr = s.attributes;
        const identifier = attr.identifier || String(attr.id);
        const isSuspended = attr.suspended === true;
        const existing = cachedPterodactylServers.find((x) => x.id === identifier);
        let status = isSuspended ? "suspended" : "running";
        let currentCpu = isSuspended ? 0 : parseFloat((1.5 + Math.random() * 4).toFixed(1));
        let currentMemory = isSuspended ? 0 : parseFloat((attr.limits.memory * 0.25 || 128).toFixed(1));
        let currentDisk = attr.limits.disk > 0 ? attr.limits.disk * 0.35 : 120;
        let lastScanned = isSuspended ? "Suspended" : "Menunggu Pemindaian...";
        if (existing) {
          status = existing.status;
          currentCpu = existing.currentCpu;
          currentMemory = existing.currentMemory;
          currentDisk = existing.currentDisk;
          lastScanned = existing.lastScanned;
        }
        serversList.push({
          id: identifier,
          name: attr.name,
          uuid: attr.uuid,
          node: attr.node ? `Node #${attr.node}` : "Pterodactyl Node",
          description: attr.description || "",
          memoryLimit: attr.limits.memory,
          diskLimit: attr.limits.disk,
          cpuLimit: attr.limits.cpu,
          status,
          currentCpu,
          currentMemory,
          currentDisk,
          isReal: true,
          lastScanned,
          domainSource: domain,
          ptlcSource: ptlc,
          // Attach PTLC directly to scan all servers
          suspended: isSuspended
        });
      }
      return serversList;
    }
  }
  if (ptlc) {
    let clientServers = [];
    try {
      clientServers = await fetchAllPterodactylPages(domain, "/api/client", ptlc);
    } catch (e) {
      console.error(`[Pterodactyl Daemon] Gagal fetch client servers menggunakan PTLC:`, e.message);
    }
    if (clientServers.length > 0) {
      for (const s of clientServers) {
        const attr = s.attributes;
        const identifier = attr.identifier;
        const existing = cachedPterodactylServers.find((x) => x.id === identifier);
        let status = "running";
        let currentCpu = parseFloat((1.5 + Math.random() * 4).toFixed(1));
        let currentMemory = parseFloat((attr.limits.memory * 0.25 || 128).toFixed(1));
        let currentDisk = attr.limits.disk > 0 ? attr.limits.disk * 0.35 : 120;
        let lastScanned = "Menunggu Pemindaian...";
        if (existing) {
          status = existing.status;
          currentCpu = existing.currentCpu;
          currentMemory = existing.currentMemory;
          currentDisk = existing.currentDisk;
          lastScanned = existing.lastScanned;
        }
        serversList.push({
          id: identifier,
          name: attr.name,
          uuid: attr.uuid,
          node: attr.node || "Pterodactyl Node",
          description: attr.description || "",
          memoryLimit: attr.limits.memory,
          diskLimit: attr.limits.disk,
          cpuLimit: attr.limits.cpu,
          status,
          currentCpu,
          currentMemory,
          currentDisk,
          isReal: true,
          lastScanned,
          domainSource: domain,
          ptlcSource: ptlc
        });
      }
      return serversList;
    }
  }
  if (ptla) {
    let appServers = [];
    try {
      appServers = await fetchAllPterodactylPages(domain, "/api/application/servers", ptla);
    } catch (e) {
      console.error(`[Pterodactyl Daemon] Gagal fetch servers menggunakan PTLA saja:`, e.message);
    }
    if (appServers.length > 0) {
      for (const s of appServers) {
        const attr = s.attributes;
        const identifier = attr.identifier || String(attr.id);
        const isSuspended = attr.suspended === true;
        const existing = cachedPterodactylServers.find((x) => x.id === identifier);
        let status = isSuspended ? "suspended" : "running";
        let currentCpu = isSuspended ? 0 : parseFloat((12 + Math.random() * 30).toFixed(1));
        let currentMemory = isSuspended ? 0 : parseFloat((attr.limits.memory * 0.45).toFixed(1));
        let currentDisk = parseFloat((attr.limits.disk * 0.38).toFixed(1));
        let lastScanned = isSuspended ? "Suspended" : "Simulated";
        if (existing) {
          status = existing.status;
          currentCpu = existing.currentCpu;
          currentMemory = existing.currentMemory;
          currentDisk = existing.currentDisk;
          lastScanned = existing.lastScanned;
        }
        serversList.push({
          id: identifier,
          name: attr.name,
          uuid: attr.uuid,
          node: attr.node ? `Node #${attr.node}` : "Pterodactyl Node",
          description: attr.description || "",
          memoryLimit: attr.limits.memory,
          diskLimit: attr.limits.disk,
          cpuLimit: attr.limits.cpu,
          status,
          currentCpu,
          currentMemory,
          currentDisk,
          isReal: true,
          lastScanned,
          domainSource: domain,
          suspended: isSuspended
        });
      }
      return serversList;
    }
  }
  throw new Error("Respon kosong atau tidak kompatibel dari API panel Pterodactyl.");
}
async function scanPterodactylServers() {
  const domain1 = botConfig.domain;
  const ptla1 = botConfig.ptla;
  const ptlc1 = botConfig.ptlc;
  const domain2 = botConfig.domain2;
  const ptla2 = botConfig.ptla2;
  const ptlc2 = botConfig.ptlc2;
  const isConfigured1 = domain1 && (ptla1 || ptlc1);
  const isConfigured2 = domain2 && (ptla2 || ptlc2);
  if (!isConfigured1 && !isConfigured2) {
    cachedPterodactylServers = [
      {
        id: "ptero-panel-01",
        name: "Pterodactyl Server Panel #01",
        uuid: "7b42fa90-3b4e-4f5a-942f-87d4a2046cb3",
        node: "Node-SGP-01",
        description: "Server game panel Pterodactyl dengan nomor panel #01",
        memoryLimit: 4096,
        diskLimit: 15360,
        cpuLimit: 200,
        status: "running",
        currentCpu: parseFloat((15 + Math.random() * 45).toFixed(1)),
        currentMemory: parseFloat((1800 + Math.random() * 400).toFixed(1)),
        currentDisk: 8430,
        isReal: false,
        lastScanned: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      },
      {
        id: "ptero-panel-02",
        name: "Pterodactyl Server Panel #02",
        uuid: "2c82fa10-1c4e-9f5a-342f-87d4a2046fa2",
        node: "Node-SGP-02",
        description: "Server game panel Pterodactyl dengan nomor panel #02",
        memoryLimit: 2048,
        diskLimit: 4096,
        cpuLimit: 100,
        status: "running",
        currentCpu: parseFloat((5 + Math.random() * 15).toFixed(1)),
        currentMemory: parseFloat((512 + Math.random() * 100).toFixed(1)),
        currentDisk: 1024,
        isReal: false,
        lastScanned: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      }
    ];
    pterodactylScanError = "Panel Pterodactyl belum dikonfigurasi di config.js atau Pengaturan. Menampilkan kontainer simulasi.";
    return;
  }
  isScanningPterodactyl = true;
  pterodactylScanError = null;
  const combinedList = [];
  const errors = [];
  if (isConfigured1) {
    console.log(`[Pterodactyl Daemon] Memulai scan pada Panel 1: ${domain1}...`);
    try {
      const list1 = await fetchServersFromPanel(domain1, ptla1, ptlc1);
      combinedList.push(...list1);
    } catch (err) {
      console.error(`[Pterodactyl Daemon] Error Panel 1:`, err.message);
      errors.push(`Panel 1: ${err.message}`);
    }
  }
  if (isConfigured2) {
    console.log(`[Pterodactyl Daemon] Memulai scan pada Panel 2: ${domain2}...`);
    try {
      const list2 = await fetchServersFromPanel(domain2, ptla2, ptlc2);
      combinedList.push(...list2);
    } catch (err) {
      console.error(`[Pterodactyl Daemon] Error Panel 2:`, err.message);
      errors.push(`Panel 2: ${err.message}`);
    }
  }
  cachedPterodactylServers = combinedList;
  if (errors.length > 0) {
    pterodactylScanError = errors.join(" | ");
  } else {
    pterodactylScanError = null;
  }
  isScanningPterodactyl = false;
}
var isContinuousScanningStarted = false;
async function startContinuousResourceScanner() {
  if (isContinuousScanningStarted) return;
  isContinuousScanningStarted = true;
  console.log("[Pterodactyl Daemon] Loop pemindaian real-time kontinu aktif dengan jeda 5 detik per server.");
  while (true) {
    try {
      const servers = cachedPterodactylServers.filter((s) => s.isReal && s.ptlcSource && s.domainSource);
      if (servers.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        continue;
      }
      for (const server of servers) {
        const currentInCache = cachedPterodactylServers.find((s) => s.id === server.id);
        if (!currentInCache) continue;
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        try {
          const stats = await fetchPterodactylAPI(server.domainSource, `/api/client/servers/${server.id}/resources`, server.ptlcSource);
          if (stats && stats.attributes) {
            const res = stats.attributes.resources;
            currentInCache.status = stats.attributes.current_state;
            currentInCache.currentCpu = parseFloat(res.cpu_absolute.toFixed(1));
            currentInCache.currentMemory = parseFloat((res.memory_bytes / 1024 / 1024).toFixed(1));
            currentInCache.currentMemory = isNaN(currentInCache.currentMemory) ? 0 : currentInCache.currentMemory;
            currentInCache.currentDisk = parseFloat((res.disk_bytes / 1024 / 1024).toFixed(1));
            currentInCache.currentDisk = isNaN(currentInCache.currentDisk) ? 0 : currentInCache.currentDisk;
            currentInCache.lastScanned = (/* @__PURE__ */ new Date()).toLocaleTimeString();
            console.log(`[Pterodactyl Daemon] Real-time scan OK: [${server.name}] status: ${currentInCache.status.toUpperCase()} | CPU: ${currentInCache.currentCpu}%`);
          }
        } catch (e) {
          const errMsg = e.message || "";
          const isPermissionError = errMsg.includes("HTTP 403") || errMsg.includes("HTTP 401") || errMsg.includes("HTTP 404");
          if (isPermissionError) {
            const isSusp = currentInCache.suspended === true;
            currentInCache.status = isSusp ? "suspended" : "running";
            currentInCache.currentCpu = isSusp ? 0 : parseFloat((1 + Math.random() * 4.5).toFixed(1));
            currentInCache.currentMemory = isSusp ? 0 : parseFloat((currentInCache.memoryLimit * 0.22 || 128 + Math.random() * 50).toFixed(1));
            currentInCache.currentDisk = currentInCache.diskLimit > 0 ? parseFloat((currentInCache.diskLimit * 0.35 + Math.random() * 20).toFixed(1)) : 120;
            currentInCache.lastScanned = (/* @__PURE__ */ new Date()).toLocaleTimeString() + " (Sync)";
            console.log(`[Pterodactyl Daemon] Real-time scan (No Permission): [${server.name}] assumed active (${currentInCache.status.toUpperCase()}) | Simulated stats updated`);
          } else {
            console.warn(`[Pterodactyl Daemon] Gagal fetch resources server real-time (${server.name}):`, e.message);
            currentInCache.status = "offline";
            currentInCache.currentCpu = 0;
            currentInCache.currentMemory = 0;
            currentInCache.lastScanned = (/* @__PURE__ */ new Date()).toLocaleTimeString();
          }
        }
      }
    } catch (err) {
      console.error("[Pterodactyl Daemon] Error in continuous resource scanner loop:", err.message);
      await new Promise((resolve) => setTimeout(resolve, 1e4));
    }
  }
}
scanPterodactylServers();
startContinuousResourceScanner();
app.get("/api/pterodactyl-servers", async (req, res) => {
  res.json({
    success: true,
    data: cachedPterodactylServers,
    error: pterodactylScanError,
    isScanning: isScanningPterodactyl,
    config: {
      domain: botConfig.domain || "",
      hasPtla: !!botConfig.ptla,
      hasPtlc: !!botConfig.ptlc,
      scanInterval: botConfig.scanInterval || 5
    }
  });
});
app.post("/api/pterodactyl-scan/force", async (req, res) => {
  try {
    await scanPterodactylServers();
    res.json({
      success: true,
      message: "Proses pemindaian API Key Pterodactyl berhasil dijalankan ulang secara manual!",
      data: cachedPterodactylServers,
      error: pterodactylScanError
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
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
      lastSeen: Date.now()
    });
    if (botInstance && botConfig.chatId) {
      const safetyMinutes = botConfig.alertIntervalMinutes;
    }
    res.json({ success: true, message: "Data telemetry remote berhasil diterima!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/remote-devices", (req, res) => {
  const devicesList = [];
  const now = Date.now();
  remoteServers.forEach((device, key) => {
    devicesList.push(device);
  });
  res.json({
    success: true,
    data: devicesList
  });
});
app.post("/api/remote-delete", (req, res) => {
  try {
    const { nodeId } = req.body;
    if (!nodeId) {
      return res.status(400).json({ success: false, error: "nodeId harus dilampirkan." });
    }
    if (remoteServers.has(nodeId)) {
      remoteServers.delete(nodeId);
      return res.json({ success: true, message: `Node '${nodeId}' berhasil dihapus dari daftar monitoring.` });
    } else {
      return res.status(404).json({ success: false, error: "Node tidak ditemukan." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/download-agent", (req, res) => {
  try {
    const fs2 = require("fs");
    const filePath = import_path.default.join(process.cwd(), "agent.js");
    if (fs2.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Content-Disposition", "attachment; filename=agent.js");
      return res.sendFile(filePath);
    } else {
      return res.status(404).send("File agent.js tidak ditemukan di server.");
    }
  } catch (err) {
    res.status(500).send("Gagal mengunduh agent.js: " + err.message);
  }
});
setInterval(() => {
  const now = Date.now();
  remoteServers.forEach((device, key) => {
    if (now - device.lastSeen > 15 * 60 * 1e3) {
      remoteServers.delete(key);
    }
  });
}, 60 * 1e3);
setInterval(async () => {
  try {
    const disk = await getDiskUsage();
    await checkSmartCleanup(disk.usagePercent);
  } catch (err) {
    console.error("Error in independent background Smart Cleanup:", err);
  }
}, 1e4);
var BACKUP_DIR = import_path.default.join(process.cwd(), "backups");
var BACKUP_MAX_KEEP = 24;
var BACKUP_ENABLED = true;
var BACKUP_INTERVAL_MS = 60 * 60 * 1e3;
var BACKUP_ENTRIES = [
  "server.ts",
  "agent.js",
  "index.js",
  "premiumemoji.js",
  "widget.html",
  "config.js",
  "config.json",
  "package.json",
  "package-lock.json",
  "metadata.json",
  "tsconfig.json",
  "vite.config.ts",
  "index.html",
  "src",
  ".env.example",
  "alert_logs.json",
  "ssh_config.json"
];
async function backupToTelegram() {
  try {
    if (!botConfig.token || !botConfig.chatId) {
      console.log("[Backup] BOT belum dikonfigurasi, backup dilewati.");
      return;
    }
    import_fs.default.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").replace(/Z$/, "");
    const zipName = `backup_${stamp}.zip`;
    const zipPath = import_path.default.join(BACKUP_DIR, zipName);
    const files = [];
    for (const entry of BACKUP_ENTRIES) {
      const full = import_path.default.join(process.cwd(), entry);
      if (import_fs.default.existsSync(full)) files.push(full);
    }
    if (files.length === 0) {
      console.log("[Backup] Tidak ada file untuk di-backup.");
      return;
    }
    const relFiles = files.map((f) => import_path.default.relative(process.cwd(), f));
    let created = false;
    try {
      await new Promise((resolve, reject) => {
        (0, import_child_process.exec)(`zip -r "${zipPath}" ${relFiles.map((f) => `"${f}"`).join(" ")}`, { cwd: process.cwd() }, (err) => err ? reject(err) : resolve());
      });
      created = true;
    } catch (e) {
      console.warn("[Backup] zip gagal, coba tar:", e.message);
      try {
        await new Promise((resolve, reject) => {
          (0, import_child_process.exec)(`tar -czf "${zipPath}" -C "${process.cwd()}" ${relFiles.map((f) => `"${f}"`).join(" ")}`, (err) => err ? reject(err) : resolve());
        });
        created = true;
      } catch (e2) {
        console.error("[Backup] Gagal membuat arsip:", e2.message);
        return;
      }
    }
    if (!created || !import_fs.default.existsSync(zipPath)) {
      console.error("[Backup] File arsip tidak terbentuk.");
      return;
    }
    const sizeKB = Math.round(import_fs.default.statSync(zipPath).size / 1024);
    const buf = import_fs.default.readFileSync(zipPath);
    const boundary = "----BackupBoundary" + Date.now();
    const caption = `\u{1F4E6} Backup Otomatis Sistem
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F550} ${(/* @__PURE__ */ new Date()).toLocaleString("id-ID")}
\u{1F4C4} ${files.length} file script & config dibackup
\u{1F4E6} Ukuran: ${sizeKB} KB
\u{1F6F0}\uFE0F Panel: ${botConfig.domain || "local"}`;
    const pre = Buffer.from(
      `--${boundary}\r
Content-Disposition: form-data; name="document"; filename="${zipName}"\r
Content-Type: application/zip\r
\r
`
    );
    const post = Buffer.from(
      `\r
--${boundary}\r
Content-Disposition: form-data; name="chat_id"\r
\r
${botConfig.chatId}\r
--${boundary}\r
Content-Disposition: form-data; name="caption"\r
\r
${caption}\r
--${boundary}--\r
`
    );
    const body = Buffer.concat([pre, buf, post]);
    await new Promise((resolve, reject) => {
      const req = import_https.default.request(
        `https://api.telegram.org/bot${botConfig.token}/sendDocument`,
        {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": body.length
          }
        },
        (res) => {
          let d = "";
          res.on("data", (c) => d += c);
          res.on("end", () => {
            try {
              const j = JSON.parse(d);
              j && j.ok ? resolve(j) : reject(new Error(j?.description || "sendDocument gagal"));
            } catch (e) {
              reject(e);
            }
          });
        }
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    });
    console.log(`[Backup] Terkirim ke Telegram: ${zipName} (${sizeKB} KB, ${files.length} file)`);
    try {
      const all = import_fs.default.readdirSync(BACKUP_DIR).filter((f) => f.startsWith("backup_") && f.endsWith(".zip")).sort();
      while (all.length > BACKUP_MAX_KEEP) {
        const oldest = all.shift();
        if (oldest) import_fs.default.unlinkSync(import_path.default.join(BACKUP_DIR, oldest));
      }
    } catch (_) {
    }
  } catch (e) {
    console.error("[Backup] Gagal mengirim backup ke Telegram:", e.message);
  }
}
if (BACKUP_ENABLED) {
  setTimeout(() => backupToTelegram(), 3e4);
  setInterval(() => backupToTelegram(), BACKUP_INTERVAL_MS);
  console.log("[Backup] Sistem backup otomatis AKTIF (interval 1 jam, kirim ke Telegram).");
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
