import { describe, it, expect, vi, afterAll } from "vitest";
import request from "supertest";

/**
 * Tests import the real Express app from server.ts.
 * Side effects are controlled via vi.mock():
 * - node-telegram-bot-api: mocked to prevent real Telegram connections
 * - server-utils I/O functions: mocked to prevent fs/exec/proc reads
 * - child_process: mocked for the /api/run-command handler
 * - startServer() guarded by process.env.VITEST (set by Vitest)
 */

// Mock Telegram Bot before server.ts loads
vi.mock("node-telegram-bot-api", () => {
  return {
    default: class MockTelegramBot {
      on = vi.fn();
      onText = vi.fn();
      sendMessage = vi.fn().mockResolvedValue({});
      stopPolling = vi.fn();
    },
  };
});

// Mock server-utils I/O functions to prevent real filesystem/exec access,
// but keep all pure logic functions real.
vi.mock("../server-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../server-utils")>();
  return {
    ...actual,
    loadConfig: vi.fn().mockReturnValue({ ...actual.DEFAULT_BOT_CONFIG }),
    loadAlertLogs: vi.fn().mockReturnValue([]),
    saveConfig: vi.fn(),
    writeAlertLogs: vi.fn(),
    getDiskUsage: vi.fn().mockResolvedValue({
      total: 50,
      free: 30,
      used: 20,
      usagePercent: 40,
    }),
    getCPUUsage: vi.fn().mockResolvedValue(25),
    getNetworkTraffic: vi.fn().mockResolvedValue({
      rxBytes: 1000,
      txBytes: 500,
      rxPackets: 10,
      txPackets: 5,
    }),
  };
});

// Mock child_process.exec for /api/run-command handler
vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    exec: vi.fn((_cmd: string, cb: any) => cb(null, "mocked output", "")),
  };
});

// Import the REAL Express app (mocks are hoisted above this)
const { app } = await import("../server");

afterAll(() => {
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────────────
// Tests against the real server routes
// ──────────────────────────────────────────────────────────────────────

describe("GET /api/system-stats", () => {
  it("returns system stats with expected structure", async () => {
    const res = await request(app).get("/api/system-stats");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.cpu).toBe(25); // mocked getCPUUsage
    expect(data.ram).toHaveProperty("total");
    expect(data.ram).toHaveProperty("free");
    expect(data.ram).toHaveProperty("used");
    expect(data.ram).toHaveProperty("percent");
    expect(data.ram.percent).toBeGreaterThanOrEqual(0);
    expect(data.ram.percent).toBeLessThanOrEqual(100);
    expect(data.disk).toEqual({ total: 50, free: 30, used: 20, usagePercent: 40 }); // mocked getDiskUsage
    expect(data.platform).toBeDefined();
    expect(data.arch).toBeDefined();
    expect(data.cpuCores).toBeGreaterThan(0);
    expect(data.network).toHaveProperty("rxSpeed");
    expect(data.network).toHaveProperty("txSpeed");
  });
});

describe("GET /api/telegram-config", () => {
  it("returns current telegram config with defaults", async () => {
    const res = await request(app).get("/api/telegram-config");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alertCpuThreshold).toBe(80);
    expect(res.body.data.alertRamThreshold).toBe(90);
    expect(res.body.data.alertDiskThreshold).toBe(85);
    expect(res.body.data.status).toBeDefined();
  });
});

describe("POST /api/telegram-config", () => {
  it("updates telegram configuration and calls saveConfig", async () => {
    const { saveConfig } = await import("../server-utils");
    const res = await request(app)
      .post("/api/telegram-config")
      .send({
        token: "123:abc",
        chatId: "99999",
        alertCpuThreshold: 70,
        alertRamThreshold: 85,
        alertDiskThreshold: 90,
        alertIntervalMinutes: 10,
        isActive: false, // keep false to avoid initializing real bot
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe("123:abc");
    expect(res.body.data.chatId).toBe("99999");
    expect(res.body.data.alertCpuThreshold).toBe(70);
    // Verify the real saveConfig was invoked (mocked to no-op)
    expect(saveConfig).toHaveBeenCalled();
  });

  it("uses defaults for missing numeric fields", async () => {
    const res = await request(app)
      .post("/api/telegram-config")
      .send({ token: "tok", chatId: "id", isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.data.alertCpuThreshold).toBe(80);
    expect(res.body.data.alertRamThreshold).toBe(90);
  });
});

describe("GET /api/alert-logs", () => {
  it("returns logs array", async () => {
    const res = await request(app).get("/api/alert-logs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("POST /api/clear-logs", () => {
  it("clears logs and calls writeLogs + logEvent", async () => {
    const { writeAlertLogs } = await import("../server-utils");
    const res = await request(app).post("/api/clear-logs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // The real handler calls writeLogs() which delegates to writeAlertLogs
    expect(writeAlertLogs).toHaveBeenCalled();
  });
});

describe("GET /api/bandwidth-config", () => {
  it("returns bandwidth thresholds", async () => {
    const res = await request(app).get("/api/bandwidth-config");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("alertNetRxThreshold");
    expect(res.body.data).toHaveProperty("alertNetTxThreshold");
  });
});

describe("POST /api/bandwidth-config", () => {
  it("saves bandwidth config and calls saveConfig", async () => {
    const { saveConfig } = await import("../server-utils");
    const res = await request(app)
      .post("/api/bandwidth-config")
      .send({ alertNetRxThreshold: 25, alertNetTxThreshold: 30 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.alertNetRxThreshold).toBe(25);
    expect(res.body.data.alertNetTxThreshold).toBe(30);
    expect(saveConfig).toHaveBeenCalled();
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
  it("returns success with recovered bytes and log lines", async () => {
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
        stats: {
          cpu: 55,
          ram: { used: 4, total: 8, percent: 50 },
          disk: { used: 20, total: 50, percent: 40 },
          uptime: 3600,
          os: "linux",
        },
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
    // Register a device first via the real route
    await request(app)
      .post("/api/remote-stats")
      .send({
        nodeId: "node-test",
        stats: {
          cpu: 10,
          ram: { used: 1, total: 2, percent: 50 },
          disk: { used: 5, total: 10, percent: 50 },
          uptime: 100,
          os: "linux",
        },
      });

    const res = await request(app).get("/api/remote-devices");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.data.find((d: any) => d.nodeId === "node-test");
    expect(found).toBeDefined();
    expect(found.stats.cpu).toBe(10);
  });
});

describe("POST /api/check-ports", () => {
  it("checks provided ports and returns results", async () => {
    const res = await request(app)
      .post("/api/check-ports")
      .send({
        ports: [
          { id: "p1", host: "127.0.0.1", port: 1 },
          { id: "p2", host: "127.0.0.1", port: 2 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0]).toHaveProperty("id");
    expect(res.body.results[0]).toHaveProperty("status");
  });

  it("rejects invalid input", async () => {
    const res = await request(app)
      .post("/api/check-ports")
      .send({ ports: "not-an-array" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects missing ports field", async () => {
    const res = await request(app).post("/api/check-ports").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/run-command", () => {
  it("executes allowed command and returns output", async () => {
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
  it("rejects when no token/chatId available (body or config)", async () => {
    // Reset config to have no token/chatId so fallback is also empty
    await request(app)
      .post("/api/telegram-config")
      .send({ token: "", chatId: "", isActive: false });

    const res = await request(app)
      .post("/api/send-test-alert")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("wajib");
  });

  it("succeeds with valid token and chatId (mocked bot)", async () => {
    const res = await request(app)
      .post("/api/send-test-alert")
      .send({ token: "123:abc", chatId: "99999" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/restart-bot", () => {
  it("returns success", async () => {
    const res = await request(app).post("/api/restart-bot");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBeDefined();
  });
});

describe("POST /api/trigger-backup", () => {
  it("returns backup details", async () => {
    const res = await request(app)
      .post("/api/trigger-backup")
      .send({ name: "test-backup", target: "/var/data" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.backup).toHaveProperty("id");
    expect(res.body.backup).toHaveProperty("name", "test-backup");
    expect(res.body.backup).toHaveProperty("target", "/var/data");
    expect(res.body.backup).toHaveProperty("size");
    expect(res.body.backup).toHaveProperty("status", "success");
  });
});

describe("GET /api/pterodactyl-servers", () => {
  it("returns empty array", async () => {
    const res = await request(app).get("/api/pterodactyl-servers");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});
