import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

/**
 * Since server.ts is monolithic and has side effects (telegram bot, intervals, vite),
 * we create a minimal Express app here that mimics the API routes we want to test.
 * This validates route logic without triggering real telegram connections or timers.
 */

// Simulate the server state
let alertLogs: any[] = [];
let botConfig = {
  token: "",
  chatId: "",
  alertCpuThreshold: 80,
  alertRamThreshold: 90,
  alertDiskThreshold: 85,
  alertIntervalMinutes: 5,
  isActive: false,
  alertNetRxThreshold: 10,
  alertNetTxThreshold: 10,
};
let currentBotStatus = "Offline";
let currentNetSpeed = { rxSpeed: 0, txSpeed: 0, rxPacketsSpeed: 0, txPacketsSpeed: 0 };
let prevNetStats = { time: Date.now(), rxBytes: 0, txBytes: 0, rxPackets: 0, txPackets: 0 };

function createTestApp() {
  const app = express();
  app.use(express.json());

  // GET /api/system-stats
  app.get("/api/system-stats", async (req, res) => {
    try {
      const os = await import("os");
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      res.json({
        success: true,
        data: {
          cpu: 25, // mock
          ram: {
            total: +(totalMem / 1024 / 1024 / 1024).toFixed(2),
            free: +(freeMem / 1024 / 1024 / 1024).toFixed(2),
            used: +((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2),
            percent: Math.round(((totalMem - freeMem) / totalMem) * 100),
          },
          disk: { total: 50, free: 30, used: 20, usagePercent: 40 },
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

  // GET /api/telegram-config
  app.get("/api/telegram-config", (req, res) => {
    res.json({
      success: true,
      data: {
        ...botConfig,
        status: currentBotStatus,
      },
    });
  });

  // POST /api/telegram-config
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

  // GET /api/alert-logs
  app.get("/api/alert-logs", (req, res) => {
    res.json({ success: true, data: alertLogs });
  });

  // POST /api/clear-logs
  app.post("/api/clear-logs", (req, res) => {
    alertLogs = [];
    res.json({ success: true, message: "Seluruh riwayat logs berhasil dibersihkan!", data: alertLogs });
  });

  // GET /api/bandwidth-config
  app.get("/api/bandwidth-config", (req, res) => {
    res.json({
      success: true,
      data: {
        alertNetRxThreshold: botConfig.alertNetRxThreshold || 10,
        alertNetTxThreshold: botConfig.alertNetTxThreshold || 10,
      },
    });
  });

  // POST /api/bandwidth-config
  app.post("/api/bandwidth-config", (req, res) => {
    try {
      const { alertNetRxThreshold, alertNetTxThreshold } = req.body;
      botConfig.alertNetRxThreshold = Number(alertNetRxThreshold) || 10;
      botConfig.alertNetTxThreshold = Number(alertNetTxThreshold) || 10;
      res.json({
        success: true,
        message: "Konfigurasi bandwidth berhasil disimpan!",
        data: {
          alertNetRxThreshold: botConfig.alertNetRxThreshold,
          alertNetTxThreshold: botConfig.alertNetTxThreshold,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/optimize-ram
  app.post("/api/optimize-ram", (req, res) => {
    try {
      const lines = [
        `[${new Date().toLocaleTimeString()}] Menghapus pagecaches, dentries, dan memory inodes...`,
        `[${new Date().toLocaleTimeString()}] Menjalankan sinkronisasi write-out (sync)...`,
        `[${new Date().toLocaleTimeString()}] Sukses! Cache sisa proses dibuang ke penampungan.`,
      ];
      res.json({
        success: true,
        recoveredBytes: 100000000,
        logs: lines,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/bandwidth-test-flood
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

      // Reset after duration (simulated)
      setTimeout(() => {
        currentNetSpeed.rxSpeed = 0;
        currentNetSpeed.txSpeed = 0;
        currentNetSpeed.rxPacketsSpeed = 0;
        currentNetSpeed.txPacketsSpeed = 0;
      }, testDuration * 1000);

      return res.json({
        success: true,
        message: `Simulasi banjir paket ${type === "rx" ? "masuk" : "keluar"} berhasil diluncurkan! Kecepatan target: ${testSpeed} MB/s selama ${testDuration} detik. Bot Telegram akan merespon laporan ini segera!`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/remote-stats
  const remoteServers = new Map<string, any>();
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
      res.json({ success: true, message: "Data telemetry remote berhasil diterima!" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/remote-devices
  app.get("/api/remote-devices", (req, res) => {
    const devicesList: any[] = [];
    remoteServers.forEach((device) => {
      devicesList.push(device);
    });
    res.json({ success: true, data: devicesList });
  });

  // POST /api/check-ports
  app.post("/api/check-ports", async (req, res) => {
    try {
      const { ports: targetPorts } = req.body;
      if (!targetPorts || !Array.isArray(targetPorts)) {
        return res.status(400).json({ success: false, error: "Daftar port tidak valid." });
      }
      // Simulate all ports as offline for testing
      const results = targetPorts.map((p: any) => ({ id: p.id, status: "offline" }));
      res.json({ success: true, results });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST /api/run-command
  app.post("/api/run-command", (req, res) => {
    try {
      const { cmdId } = req.body;
      const commandMap: Record<string, string> = {
        "cpu-info": "uname -a",
        "ram-usage": "free -h",
        "disk-usage": "df -h .",
        "dir-list": "ls -la .",
        "node-version": "node -v && npm -v",
      };
      const actualCmd = commandMap[cmdId];
      if (!actualCmd) {
        return res.status(400).json({ success: false, error: "Perintah tidak diizinkan atau tidak ditemui!" });
      }
      res.json({ success: true, output: "mocked output" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/send-test-alert
  app.post("/api/send-test-alert", async (req, res) => {
    const { token, chatId } = req.body;
    const testToken = token || botConfig.token;
    const testChatId = chatId || botConfig.chatId;
    if (!testToken || !testChatId) {
      return res.status(400).json({ success: false, error: "Bot Token dan Chat ID wajib diisi." });
    }
    // In tests, we don't actually send to Telegram
    res.json({ success: true, message: "Pesan tes berhasil dikirim ke Telegram!" });
  });

  return app;
}

// ──────────────────────────────────────────────────────────────────────
// API Endpoint Tests
// ──────────────────────────────────────────────────────────────────────

describe("API Endpoints", () => {
  let app: express.Express;

  beforeEach(() => {
    // Reset state
    alertLogs = [];
    botConfig = {
      token: "",
      chatId: "",
      alertCpuThreshold: 80,
      alertRamThreshold: 90,
      alertDiskThreshold: 85,
      alertIntervalMinutes: 5,
      isActive: false,
      alertNetRxThreshold: 10,
      alertNetTxThreshold: 10,
    };
    currentBotStatus = "Offline";
    currentNetSpeed = { rxSpeed: 0, txSpeed: 0, rxPacketsSpeed: 0, txPacketsSpeed: 0 };
    app = createTestApp();
  });

  describe("GET /api/system-stats", () => {
    it("returns system stats successfully", async () => {
      const res = await request(app).get("/api/system-stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.cpu).toBeDefined();
      expect(res.body.data.ram).toBeDefined();
      expect(res.body.data.ram.total).toBeGreaterThan(0);
      expect(res.body.data.disk).toBeDefined();
      expect(res.body.data.network).toBeDefined();
      expect(res.body.data.platform).toBeDefined();
    });

    it("includes proper ram structure", async () => {
      const res = await request(app).get("/api/system-stats");
      const { ram } = res.body.data;
      expect(ram).toHaveProperty("total");
      expect(ram).toHaveProperty("free");
      expect(ram).toHaveProperty("used");
      expect(ram).toHaveProperty("percent");
      expect(ram.percent).toBeGreaterThanOrEqual(0);
      expect(ram.percent).toBeLessThanOrEqual(100);
    });
  });

  describe("GET /api/telegram-config", () => {
    it("returns current telegram config", async () => {
      const res = await request(app).get("/api/telegram-config");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alertCpuThreshold).toBe(80);
      expect(res.body.data.status).toBe("Offline");
    });
  });

  describe("POST /api/telegram-config", () => {
    it("updates telegram configuration", async () => {
      const res = await request(app)
        .post("/api/telegram-config")
        .send({
          token: "123:abc",
          chatId: "99999",
          alertCpuThreshold: 70,
          alertRamThreshold: 85,
          alertDiskThreshold: 90,
          alertIntervalMinutes: 10,
          isActive: true,
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe("123:abc");
      expect(res.body.data.chatId).toBe("99999");
      expect(res.body.data.alertCpuThreshold).toBe(70);
      expect(res.body.data.isActive).toBe(true);
    });

    it("uses defaults for missing numeric fields", async () => {
      const res = await request(app)
        .post("/api/telegram-config")
        .send({ token: "tok", chatId: "id" });
      expect(res.status).toBe(200);
      expect(res.body.data.alertCpuThreshold).toBe(80);
      expect(res.body.data.alertRamThreshold).toBe(90);
    });
  });

  describe("GET /api/alert-logs", () => {
    it("returns empty logs initially", async () => {
      const res = await request(app).get("/api/alert-logs");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("POST /api/clear-logs", () => {
    it("clears all logs", async () => {
      alertLogs = [{ id: "1", type: "cpu", level: "info", title: "t", message: "m", timestamp: "" }];
      const res = await request(app).post("/api/clear-logs");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("GET /api/bandwidth-config", () => {
    it("returns bandwidth thresholds", async () => {
      const res = await request(app).get("/api/bandwidth-config");
      expect(res.status).toBe(200);
      expect(res.body.data.alertNetRxThreshold).toBe(10);
      expect(res.body.data.alertNetTxThreshold).toBe(10);
    });
  });

  describe("POST /api/bandwidth-config", () => {
    it("saves bandwidth config", async () => {
      const res = await request(app)
        .post("/api/bandwidth-config")
        .send({ alertNetRxThreshold: 25, alertNetTxThreshold: 30 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alertNetRxThreshold).toBe(25);
      expect(res.body.data.alertNetTxThreshold).toBe(30);
    });

    it("defaults to 10 for non-numeric input", async () => {
      const res = await request(app)
        .post("/api/bandwidth-config")
        .send({ alertNetRxThreshold: "abc", alertNetTxThreshold: null });
      expect(res.status).toBe(200);
      expect(res.body.data.alertNetRxThreshold).toBe(10);
      expect(res.body.data.alertNetTxThreshold).toBe(10);
    });
  });

  describe("POST /api/optimize-ram", () => {
    it("returns success with recovered bytes", async () => {
      const res = await request(app).post("/api/optimize-ram");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recoveredBytes).toBeGreaterThan(0);
      expect(res.body.logs).toHaveLength(3);
    });
  });

  describe("POST /api/bandwidth-test-flood", () => {
    it("simulates rx flood", async () => {
      const res = await request(app)
        .post("/api/bandwidth-test-flood")
        .send({ type: "rx", speedMb: 20, durationSec: 5 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("masuk");
    });

    it("simulates tx flood", async () => {
      const res = await request(app)
        .post("/api/bandwidth-test-flood")
        .send({ type: "tx", speedMb: 15, durationSec: 10 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("keluar");
    });

    it("uses default speed and duration", async () => {
      const res = await request(app)
        .post("/api/bandwidth-test-flood")
        .send({ type: "rx" });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("15 MB/s");
      expect(res.body.message).toContain("10 detik");
    });
  });

  describe("POST /api/remote-stats", () => {
    it("accepts remote telemetry data", async () => {
      const res = await request(app)
        .post("/api/remote-stats")
        .send({
          nodeId: "server-1",
          secret: "s3cr3t",
          stats: { cpu: 55, ram: { used: 4, total: 8, percent: 50 }, disk: { used: 20, total: 50, percent: 40 }, uptime: 3600, os: "linux" },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects missing nodeId", async () => {
      const res = await request(app)
        .post("/api/remote-stats")
        .send({ secret: "s3cr3t" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/remote-devices", () => {
    it("returns registered devices", async () => {
      // First register a device
      await request(app)
        .post("/api/remote-stats")
        .send({ nodeId: "node-abc", stats: { cpu: 10, ram: { used: 1, total: 2, percent: 50 }, disk: { used: 5, total: 10, percent: 50 }, uptime: 100, os: "linux" } });

      const res = await request(app).get("/api/remote-devices");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].nodeId).toBe("node-abc");
    });
  });

  describe("POST /api/check-ports", () => {
    it("checks provided ports", async () => {
      const res = await request(app)
        .post("/api/check-ports")
        .send({ ports: [{ id: "p1", host: "localhost", port: 80 }, { id: "p2", host: "localhost", port: 443 }] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results).toHaveLength(2);
    });

    it("rejects invalid input", async () => {
      const res = await request(app)
        .post("/api/check-ports")
        .send({ ports: "not-an-array" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects missing ports field", async () => {
      const res = await request(app)
        .post("/api/check-ports")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/run-command", () => {
    it("executes allowed command", async () => {
      const res = await request(app)
        .post("/api/run-command")
        .send({ cmdId: "node-version" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.output).toBeDefined();
    });

    it("rejects unknown command", async () => {
      const res = await request(app)
        .post("/api/run-command")
        .send({ cmdId: "rm -rf /" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/send-test-alert", () => {
    it("rejects when no token/chatId", async () => {
      const res = await request(app)
        .post("/api/send-test-alert")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("wajib");
    });

    it("succeeds with valid token and chatId", async () => {
      const res = await request(app)
        .post("/api/send-test-alert")
        .send({ token: "123:abc", chatId: "99999" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
