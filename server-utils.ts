import os from "os";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

// ─── Types ────────────────────────────────────────────────────────────

export interface BotConfig {
  token: string;
  chatId: string;
  alertCpuThreshold: number;
  alertRamThreshold: number;
  alertDiskThreshold: number;
  alertIntervalMinutes: number;
  isActive: boolean;
  alertNetRxThreshold: number;
  alertNetTxThreshold: number;
}

export interface AlertLog {
  id: string;
  timestamp: string;
  type: "cpu" | "ram" | "disk" | "system" | "remote" | "network";
  level: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
}

export interface DiskUsage {
  total: number;
  free: number;
  used: number;
  usagePercent: number;
}

export interface NetworkTraffic {
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

// ─── Default Config ───────────────────────────────────────────────────

export const DEFAULT_BOT_CONFIG: BotConfig = {
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

// ─── Pure Utility Functions ───────────────────────────────────────────

export function cpuAverage(): { idle: number; total: number } {
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

export function getCPUUsage(): Promise<number> {
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

export function drawProgressBar(percent: number, size = 10): string {
  const progress = Math.round((percent / 100) * size);
  const emptyProgress = size - progress;
  const progressText = "█".repeat(progress);
  const emptyProgressText = "░".repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${percent}%`;
}

// ─── Disk Usage Parsing ───────────────────────────────────────────────

export function parseDfOutput(stdout: string): DiskUsage | null {
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

      return {
        total: isNaN(totalGb) ? 50 : totalGb,
        free: isNaN(freeGb) ? 30 : freeGb,
        used: isNaN(usedGb) ? 20 : usedGb,
        usagePercent: isNaN(usagePercent) ? 40 : usagePercent,
      };
    }
  } catch (e) {
    // Fallback
  }
  return null;
}

export function getDiskUsage(): Promise<DiskUsage> {
  return new Promise((resolve) => {
    exec("df -k /", (err, stdout) => {
      if (err || !stdout) {
        return resolve({ total: 50, free: 30, used: 20, usagePercent: 40 });
      }
      const parsed = parseDfOutput(stdout);
      resolve(parsed || { total: 100, free: 60, used: 40, usagePercent: 40 });
    });
  });
}

// ─── Network Traffic Parsing ──────────────────────────────────────────

export function parseProcNetDev(data: string): NetworkTraffic | null {
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
    return { rxBytes, txBytes, rxPackets, txPackets };
  } catch (e) {
    return null;
  }
}

export function getNetworkTraffic(
  simulatedNetwork: NetworkTraffic
): Promise<NetworkTraffic> {
  return new Promise((resolve) => {
    fs.readFile("/proc/net/dev", "utf8", (err, data) => {
      if (err || !data) {
        return resolve({ ...simulatedNetwork });
      }
      const parsed = parseProcNetDev(data);
      resolve(parsed || { ...simulatedNetwork });
    });
  });
}

// ─── Alert Log Management ─────────────────────────────────────────────

export function createAlertLog(
  type: AlertLog["type"],
  level: AlertLog["level"],
  title: string,
  message: string
): AlertLog {
  return {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    type,
    level,
    title,
    message,
  };
}

export function appendLog(logs: AlertLog[], newLog: AlertLog, maxLogs = 100): AlertLog[] {
  const updated = [newLog, ...logs];
  return updated.length > maxLogs ? updated.slice(0, maxLogs) : updated;
}

// ─── Config Persistence ───────────────────────────────────────────────

export function loadConfig(configPath: string, defaults: BotConfig): BotConfig {
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      return { ...defaults, ...JSON.parse(raw) };
    } catch (err) {
      console.error("Error reading config.json", err);
    }
  }
  return { ...defaults };
}

export function saveConfig(configPath: string, config: BotConfig): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving config.json", err);
  }
}

export function loadAlertLogs(logsPath: string): AlertLog[] {
  if (fs.existsSync(logsPath)) {
    try {
      const raw = fs.readFileSync(logsPath, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("Error reading alert_logs.json", err);
    }
  }
  return [];
}

export function writeAlertLogs(logsPath: string, logs: AlertLog[]): void {
  try {
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving alert_logs.json", err);
  }
}

// ─── Bandwidth Tracking ──────────────────────────────────────────────

export interface NetSpeed {
  rxSpeed: number;
  txSpeed: number;
  rxPacketsSpeed: number;
  txPacketsSpeed: number;
}

export interface NetStats {
  time: number;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

export function computeBandwidth(
  prevStats: NetStats,
  currentTraffic: NetworkTraffic,
  now: number
): { speed: NetSpeed; updatedStats: NetStats } | null {
  const deltaSec = (now - prevStats.time) / 1000;

  if (deltaSec <= 0.5) return null;

  let rxDelta = currentTraffic.rxBytes - prevStats.rxBytes;
  let txDelta = currentTraffic.txBytes - prevStats.txBytes;
  let rxPacketsDelta = currentTraffic.rxPackets - prevStats.rxPackets;
  let txPacketsDelta = currentTraffic.txPackets - prevStats.txPackets;

  if (rxDelta < 0) rxDelta = 0;
  if (txDelta < 0) txDelta = 0;
  if (rxPacketsDelta < 0) rxPacketsDelta = 0;
  if (txPacketsDelta < 0) txPacketsDelta = 0;

  return {
    speed: {
      rxSpeed: Math.round(rxDelta / deltaSec),
      txSpeed: Math.round(txDelta / deltaSec),
      rxPacketsSpeed: Math.round(rxPacketsDelta / deltaSec),
      txPacketsSpeed: Math.round(txPacketsDelta / deltaSec),
    },
    updatedStats: {
      time: now,
      rxBytes: currentTraffic.rxBytes,
      txBytes: currentTraffic.txBytes,
      rxPackets: currentTraffic.rxPackets,
      txPackets: currentTraffic.txPackets,
    },
  };
}
