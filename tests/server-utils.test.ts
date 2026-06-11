import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import {
  cpuAverage,
  drawProgressBar,
  parseDfOutput,
  parseProcNetDev,
  createAlertLog,
  appendLog,
  loadConfig,
  saveConfig,
  loadAlertLogs,
  writeAlertLogs,
  computeBandwidth,
  DEFAULT_BOT_CONFIG,
  type BotConfig,
  type AlertLog,
  type NetworkTraffic,
  type NetStats,
} from "../server-utils";

// ──────────────────────────────────────────────────────────────────────
// cpuAverage
// ──────────────────────────────────────────────────────────────────────
describe("cpuAverage", () => {
  it("returns averaged idle and total across cores", () => {
    const mockCpus = [
      {
        model: "cpu0",
        speed: 2400,
        times: { user: 100, nice: 0, sys: 50, idle: 800, irq: 50 },
      },
      {
        model: "cpu1",
        speed: 2400,
        times: { user: 200, nice: 0, sys: 100, idle: 600, irq: 100 },
      },
    ] as os.CpuInfo[];

    vi.spyOn(os, "cpus").mockReturnValue(mockCpus);
    const result = cpuAverage();

    // core0: total = 100+0+50+800+50 = 1000, idle = 800
    // core1: total = 200+0+100+600+100 = 1000, idle = 600
    // avg idle = (800+600)/2 = 700, avg total = (1000+1000)/2 = 1000
    expect(result.idle).toBe(700);
    expect(result.total).toBe(1000);

    vi.restoreAllMocks();
  });

  it("returns fallback when no CPUs", () => {
    vi.spyOn(os, "cpus").mockReturnValue([]);
    const result = cpuAverage();
    expect(result).toEqual({ idle: 0, total: 100 });
    vi.restoreAllMocks();
  });

  it("handles single core", () => {
    const mockCpus = [
      {
        model: "cpu0",
        speed: 3000,
        times: { user: 500, nice: 10, sys: 200, idle: 290, irq: 0 },
      },
    ] as os.CpuInfo[];

    vi.spyOn(os, "cpus").mockReturnValue(mockCpus);
    const result = cpuAverage();
    // total = 500+10+200+290+0 = 1000, idle = 290
    expect(result.idle).toBe(290);
    expect(result.total).toBe(1000);
    vi.restoreAllMocks();
  });
});

// ──────────────────────────────────────────────────────────────────────
// drawProgressBar
// ──────────────────────────────────────────────────────────────────────
describe("drawProgressBar", () => {
  it("draws 0%", () => {
    expect(drawProgressBar(0)).toBe("[░░░░░░░░░░] 0%");
  });

  it("draws 50%", () => {
    expect(drawProgressBar(50)).toBe("[█████░░░░░] 50%");
  });

  it("draws 100%", () => {
    expect(drawProgressBar(100)).toBe("[██████████] 100%");
  });

  it("draws with custom size", () => {
    const bar = drawProgressBar(50, 4);
    expect(bar).toBe("[██░░] 50%");
  });

  it("rounds progress correctly at 33%", () => {
    const bar = drawProgressBar(33, 10);
    // Math.round((33/100) * 10) = Math.round(3.3) = 3
    expect(bar).toBe("[███░░░░░░░] 33%");
  });

  it("handles percentages near boundaries", () => {
    // 95% with size 10: Math.round(9.5) = 10
    expect(drawProgressBar(95)).toBe("[██████████] 95%");
    // 5% with size 10: Math.round(0.5) = 1 (rounds up in JS for .5)
    expect(drawProgressBar(5)).toBe("[█░░░░░░░░░] 5%");
  });
});

// ──────────────────────────────────────────────────────────────────────
// parseDfOutput
// ──────────────────────────────────────────────────────────────────────
describe("parseDfOutput", () => {
  it("parses typical df output", () => {
    const stdout = `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/sda1       52428800 20971520  31457280  40% /`;
    const result = parseDfOutput(stdout);
    expect(result).not.toBeNull();
    expect(result!.total).toBeCloseTo(50, 0);
    expect(result!.used).toBeCloseTo(20, 0);
    expect(result!.free).toBeCloseTo(30, 0);
    expect(result!.usagePercent).toBe(40);
  });

  it("handles large disk sizes", () => {
    // 500GB = 524288000 KB
    const stdout = `Filesystem     1K-blocks       Used  Available Use% Mounted on
/dev/sda1      524288000  419430400  104857600  80% /`;
    const result = parseDfOutput(stdout);
    expect(result).not.toBeNull();
    expect(result!.usagePercent).toBe(80);
    expect(result!.total).toBeCloseTo(500, 0);
  });

  it("returns null for empty input", () => {
    expect(parseDfOutput("")).toBeNull();
  });

  it("returns null for single-line input", () => {
    expect(parseDfOutput("Filesystem     1K-blocks     Used Available Use% Mounted on")).toBeNull();
  });

  it("falls back when values are NaN", () => {
    const stdout = `Filesystem     1K-blocks     Used Available Use% Mounted on
/dev/sda1       abc       def   ghi  jk% /`;
    const result = parseDfOutput(stdout);
    expect(result).not.toBeNull();
    expect(result!.total).toBe(50);
    expect(result!.free).toBe(30);
    expect(result!.used).toBe(20);
    expect(result!.usagePercent).toBe(40);
  });
});

// ──────────────────────────────────────────────────────────────────────
// parseProcNetDev
// ──────────────────────────────────────────────────────────────────────
describe("parseProcNetDev", () => {
  const sampleProcNetDev = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:  123456    1000    0    0    0     0          0         0   123456    1000    0    0    0     0       0          0
  eth0: 9876543   50000    0    0    0     0          0         0  5432100   30000    0    0    0     0       0          0
 wlan0: 1111111   10000    0    0    0     0          0         0   222222    5000    0    0    0     0       0          0`;

  it("parses multi-interface data, skipping lo", () => {
    const result = parseProcNetDev(sampleProcNetDev);
    expect(result).not.toBeNull();
    // eth0 rx: 9876543, wlan0 rx: 1111111 -> 10987654
    expect(result!.rxBytes).toBe(9876543 + 1111111);
    expect(result!.rxPackets).toBe(50000 + 10000);
    // eth0 tx: 5432100, wlan0 tx: 222222 -> 5654322
    expect(result!.txBytes).toBe(5432100 + 222222);
    expect(result!.txPackets).toBe(30000 + 5000);
  });

  it("excludes loopback interface", () => {
    const loOnly = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:  999999    9999    0    0    0     0          0         0   999999    9999    0    0    0     0       0          0`;
    const result = parseProcNetDev(loOnly);
    expect(result).not.toBeNull();
    expect(result!.rxBytes).toBe(0);
    expect(result!.txBytes).toBe(0);
  });

  it("handles empty input", () => {
    const result = parseProcNetDev("");
    expect(result).not.toBeNull();
    expect(result!.rxBytes).toBe(0);
    expect(result!.txBytes).toBe(0);
  });

  it("handles single interface", () => {
    const data = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
  eth0: 5000000   25000    0    0    0     0          0         0  3000000   15000    0    0    0     0       0          0`;
    const result = parseProcNetDev(data);
    expect(result).not.toBeNull();
    expect(result!.rxBytes).toBe(5000000);
    expect(result!.txBytes).toBe(3000000);
    expect(result!.rxPackets).toBe(25000);
    expect(result!.txPackets).toBe(15000);
  });
});

// ──────────────────────────────────────────────────────────────────────
// createAlertLog
// ──────────────────────────────────────────────────────────────────────
describe("createAlertLog", () => {
  it("creates a log entry with proper fields", () => {
    const log = createAlertLog("cpu", "danger", "CPU High", "CPU at 95%");
    expect(log.type).toBe("cpu");
    expect(log.level).toBe("danger");
    expect(log.title).toBe("CPU High");
    expect(log.message).toBe("CPU at 95%");
    expect(log.id).toBeTruthy();
    expect(log.timestamp).toBeTruthy();
    // Validate ISO timestamp
    expect(new Date(log.timestamp).toISOString()).toBe(log.timestamp);
  });

  it("generates unique ids", () => {
    const log1 = createAlertLog("ram", "warning", "t1", "m1");
    const log2 = createAlertLog("disk", "info", "t2", "m2");
    expect(log1.id).not.toBe(log2.id);
  });
});

// ──────────────────────────────────────────────────────────────────────
// appendLog
// ──────────────────────────────────────────────────────────────────────
describe("appendLog", () => {
  it("prepends new log to array", () => {
    const existing: AlertLog[] = [
      createAlertLog("cpu", "info", "old", "old msg"),
    ];
    const newLog = createAlertLog("ram", "danger", "new", "new msg");
    const result = appendLog(existing, newLog);
    expect(result[0]).toBe(newLog);
    expect(result.length).toBe(2);
  });

  it("truncates to maxLogs", () => {
    const logs: AlertLog[] = Array.from({ length: 100 }, (_, i) =>
      createAlertLog("cpu", "info", `log-${i}`, `msg-${i}`)
    );
    const newLog = createAlertLog("disk", "danger", "overflow", "too many");
    const result = appendLog(logs, newLog, 100);
    expect(result.length).toBe(100);
    expect(result[0].title).toBe("overflow");
    // The last old entry (index 99) should have been dropped
  });

  it("does not truncate when under limit", () => {
    const logs: AlertLog[] = [createAlertLog("cpu", "info", "a", "b")];
    const newLog = createAlertLog("ram", "info", "c", "d");
    const result = appendLog(logs, newLog, 50);
    expect(result.length).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────────────
// computeBandwidth
// ──────────────────────────────────────────────────────────────────────
describe("computeBandwidth", () => {
  it("computes speed over a 1-second interval", () => {
    const prev: NetStats = {
      time: 1000,
      rxBytes: 100000,
      txBytes: 50000,
      rxPackets: 1000,
      txPackets: 500,
    };
    const current: NetworkTraffic = {
      rxBytes: 200000,
      txBytes: 100000,
      rxPackets: 2000,
      txPackets: 1000,
    };
    const result = computeBandwidth(prev, current, 2000);
    expect(result).not.toBeNull();
    expect(result!.speed.rxSpeed).toBe(100000);
    expect(result!.speed.txSpeed).toBe(50000);
    expect(result!.speed.rxPacketsSpeed).toBe(1000);
    expect(result!.speed.txPacketsSpeed).toBe(500);
    expect(result!.updatedStats.time).toBe(2000);
  });

  it("returns null when delta < 0.5s", () => {
    const prev: NetStats = {
      time: 1000,
      rxBytes: 0,
      txBytes: 0,
      rxPackets: 0,
      txPackets: 0,
    };
    const current: NetworkTraffic = {
      rxBytes: 1000,
      txBytes: 1000,
      rxPackets: 10,
      txPackets: 10,
    };
    const result = computeBandwidth(prev, current, 1400); // 400ms
    expect(result).toBeNull();
  });

  it("clamps negative deltas to zero", () => {
    const prev: NetStats = {
      time: 1000,
      rxBytes: 200000,
      txBytes: 100000,
      rxPackets: 2000,
      txPackets: 1000,
    };
    const current: NetworkTraffic = {
      rxBytes: 100000, // lower than prev
      txBytes: 50000,
      rxPackets: 1000,
      txPackets: 500,
    };
    const result = computeBandwidth(prev, current, 2000);
    expect(result).not.toBeNull();
    expect(result!.speed.rxSpeed).toBe(0);
    expect(result!.speed.txSpeed).toBe(0);
    expect(result!.speed.rxPacketsSpeed).toBe(0);
    expect(result!.speed.txPacketsSpeed).toBe(0);
  });

  it("computes correctly over a 5-second interval", () => {
    const prev: NetStats = {
      time: 0,
      rxBytes: 0,
      txBytes: 0,
      rxPackets: 0,
      txPackets: 0,
    };
    const current: NetworkTraffic = {
      rxBytes: 500000,
      txBytes: 250000,
      rxPackets: 5000,
      txPackets: 2500,
    };
    const result = computeBandwidth(prev, current, 5000);
    expect(result).not.toBeNull();
    expect(result!.speed.rxSpeed).toBe(100000); // 500000/5
    expect(result!.speed.txSpeed).toBe(50000);
    expect(result!.speed.rxPacketsSpeed).toBe(1000);
    expect(result!.speed.txPacketsSpeed).toBe(500);
  });
});

// ──────────────────────────────────────────────────────────────────────
// loadConfig / saveConfig
// ──────────────────────────────────────────────────────────────────────
describe("loadConfig", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when file does not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const config = loadConfig("/tmp/nonexistent.json", DEFAULT_BOT_CONFIG);
    expect(config).toEqual(DEFAULT_BOT_CONFIG);
  });

  it("merges stored config with defaults", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify({ token: "abc123", alertCpuThreshold: 95 })
    );
    const config = loadConfig("/tmp/config.json", DEFAULT_BOT_CONFIG);
    expect(config.token).toBe("abc123");
    expect(config.alertCpuThreshold).toBe(95);
    expect(config.alertRamThreshold).toBe(90); // default
  });

  it("returns defaults on invalid JSON", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("not json");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const config = loadConfig("/tmp/bad.json", DEFAULT_BOT_CONFIG);
    expect(config).toEqual(DEFAULT_BOT_CONFIG);
  });
});

describe("saveConfig", () => {
  it("writes JSON to file", () => {
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    const config: BotConfig = {
      ...DEFAULT_BOT_CONFIG,
      token: "test-token",
    };
    saveConfig("/tmp/config.json", config);
    expect(writeSpy).toHaveBeenCalledWith(
      "/tmp/config.json",
      expect.stringContaining("test-token"),
      "utf-8"
    );
    vi.restoreAllMocks();
  });

  it("handles write errors gracefully", () => {
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw new Error("disk full");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => saveConfig("/tmp/fail.json", DEFAULT_BOT_CONFIG)).not.toThrow();
    vi.restoreAllMocks();
  });
});

// ──────────────────────────────────────────────────────────────────────
// loadAlertLogs / writeAlertLogs
// ──────────────────────────────────────────────────────────────────────
describe("loadAlertLogs", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns empty array when file does not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(loadAlertLogs("/tmp/none.json")).toEqual([]);
  });

  it("loads and parses existing logs", () => {
    const mockLogs: AlertLog[] = [
      createAlertLog("cpu", "info", "test", "msg"),
    ];
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(mockLogs));
    const result = loadAlertLogs("/tmp/logs.json");
    expect(result.length).toBe(1);
    expect(result[0].title).toBe("test");
  });

  it("returns empty array on corrupt file", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("{bad json");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadAlertLogs("/tmp/corrupt.json")).toEqual([]);
  });
});

describe("writeAlertLogs", () => {
  it("writes logs as JSON", () => {
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    const logs: AlertLog[] = [createAlertLog("disk", "warning", "t", "m")];
    writeAlertLogs("/tmp/logs.json", logs);
    expect(writeSpy).toHaveBeenCalledWith(
      "/tmp/logs.json",
      expect.any(String),
      "utf-8"
    );
    const writtenJson = writeSpy.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe("disk");
    vi.restoreAllMocks();
  });
});

// ──────────────────────────────────────────────────────────────────────
// DEFAULT_BOT_CONFIG
// ──────────────────────────────────────────────────────────────────────
describe("DEFAULT_BOT_CONFIG", () => {
  it("has expected default values", () => {
    expect(DEFAULT_BOT_CONFIG.token).toBe("");
    expect(DEFAULT_BOT_CONFIG.chatId).toBe("");
    expect(DEFAULT_BOT_CONFIG.alertCpuThreshold).toBe(80);
    expect(DEFAULT_BOT_CONFIG.alertRamThreshold).toBe(90);
    expect(DEFAULT_BOT_CONFIG.alertDiskThreshold).toBe(85);
    expect(DEFAULT_BOT_CONFIG.alertIntervalMinutes).toBe(5);
    expect(DEFAULT_BOT_CONFIG.isActive).toBe(false);
    expect(DEFAULT_BOT_CONFIG.alertNetRxThreshold).toBe(10);
    expect(DEFAULT_BOT_CONFIG.alertNetTxThreshold).toBe(10);
  });
});
