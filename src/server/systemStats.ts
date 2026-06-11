import os from "os";
import { exec } from "child_process";

export function cpuAverage(): { idle: number; total: number } {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return { idle: 0, total: 100 };
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    for (const type in core.times) {
      totalMs += (core.times as Record<string, number>)[type];
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

export interface DiskUsage {
  total: number;
  free: number;
  used: number;
  usagePercent: number;
}

export function getDiskUsage(): Promise<DiskUsage> {
  return new Promise((resolve) => {
    exec("df -k /", (err, stdout) => {
      if (err || !stdout) {
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

export interface RamInfo {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  percent: number;
  totalGb: number;
  freeGb: number;
  usedGb: number;
}

export function getRamInfo(): RamInfo {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  const percent = Math.round((usedBytes / totalBytes) * 100);
  return {
    totalBytes,
    freeBytes,
    usedBytes,
    percent,
    totalGb: +(totalBytes / 1024 / 1024 / 1024).toFixed(2),
    freeGb: +(freeBytes / 1024 / 1024 / 1024).toFixed(2),
    usedGb: +(usedBytes / 1024 / 1024 / 1024).toFixed(2),
  };
}
