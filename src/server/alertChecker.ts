import TelegramBot from "node-telegram-bot-api";

export interface AlertThresholds {
  alertCpuThreshold: number;
  alertRamThreshold: number;
  alertDiskThreshold: number;
  alertNetRxThreshold: number;
  alertNetTxThreshold: number;
  alertIntervalMinutes: number;
}

export interface AlertTimestamps {
  cpu: number;
  ram: number;
  disk: number;
  netRx: number;
  netTx: number;
}

interface AlertCheckResult {
  triggered: boolean;
  updatedTimestamps: AlertTimestamps;
}

interface ResourceValues {
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  diskFreeGb: number;
  rxSpeedMbps: number;
  txSpeedMbps: number;
  rxPacketsPerSec: number;
  txPacketsPerSec: number;
}

interface AlertMessage {
  resource: keyof AlertTimestamps;
  text: string;
  logType: "cpu" | "ram" | "disk" | "network";
  logTitle: string;
  logMessage: string;
}

export function checkThresholdsAndBuildAlerts(
  resources: ResourceValues,
  thresholds: AlertThresholds,
  lastAlertTimes: AlertTimestamps,
  now: number
): { alerts: AlertMessage[]; updatedTimestamps: AlertTimestamps } {
  const intervalMs = thresholds.alertIntervalMinutes * 60 * 1000;
  const updated = { ...lastAlertTimes };
  const alerts: AlertMessage[] = [];

  if (resources.cpuPercent >= thresholds.alertCpuThreshold && now - lastAlertTimes.cpu > intervalMs) {
    alerts.push({
      resource: "cpu",
      text:
        `⚠️ *PERINGATAN: PENGGUNAAN CPU TINGGI!*\n` +
        `Status CPU mencapai \`${resources.cpuPercent}%\` (Batas limit: ${thresholds.alertCpuThreshold}%).\n` +
        `Silakan periksa proses server Anda segera!`,
      logType: "cpu",
      logTitle: "Limit CPU Terlampaui",
      logMessage: `CPU lokal terdeteksi overload mencapai ${resources.cpuPercent}% (Threshold: ${thresholds.alertCpuThreshold}%).`,
    });
    updated.cpu = now;
  }

  if (resources.ramPercent >= thresholds.alertRamThreshold && now - lastAlertTimes.ram > intervalMs) {
    alerts.push({
      resource: "ram",
      text:
        `⚠️ *PERINGATAN: OVERLOAD RAM / MEMORY!*\n` +
        `Status RAM mencapai \`${resources.ramPercent}%\` (Batas limit: ${thresholds.alertRamThreshold}%).\n` +
        `Kapasitas tersisa sangat rendah!`,
      logType: "ram",
      logTitle: "Memory RAM Penuh",
      logMessage: `Beban Memory VPS overload di angka ${resources.ramPercent}% (Threshold: ${thresholds.alertRamThreshold}%).`,
    });
    updated.ram = now;
  }

  if (resources.diskPercent >= thresholds.alertDiskThreshold && now - lastAlertTimes.disk > intervalMs) {
    alerts.push({
      resource: "disk",
      text:
        `⚠️ *PERINGATAN: KAPASITAS DISK HAMPIR HABIS!*\n` +
        `Status Penyimpanan mencapai \`${resources.diskPercent}%\` (Batas limit: ${thresholds.alertDiskThreshold}%).\n` +
        `Sisa kapasitas: \`${resources.diskFreeGb} GB\`.`,
      logType: "disk",
      logTitle: "Penyimpanan Disk Penuh",
      logMessage: `Sisa kapasitas disk menipis dengan beban ${resources.diskPercent}% (Threshold: ${thresholds.alertDiskThreshold}%).`,
    });
    updated.disk = now;
  }

  const rxLimitMb = thresholds.alertNetRxThreshold || 10;
  const txLimitMb = thresholds.alertNetTxThreshold || 10;

  if (resources.rxSpeedMbps >= rxLimitMb && now - lastAlertTimes.netRx > intervalMs) {
    alerts.push({
      resource: "netRx",
      text:
        `⚠️ *PERINGATAN: TRAFIK MASUK (RX) SANGAT TINGGI!*\n` +
        `Intensitas bandwidth masuk mencapai \`${resources.rxSpeedMbps.toFixed(2)} MB/s\` (Batas limit: ${rxLimitMb} MB/s).\n` +
        `Deteksi paket per detik: \`${resources.rxPacketsPerSec.toLocaleString()} pps\`.`,
      logType: "network",
      logTitle: "Overload Bandwidth Masuk",
      logMessage: `Sistem mendeteksi bandwidth masuk tinggi di angka ${resources.rxSpeedMbps.toFixed(2)} MB/s (PPS: ${resources.rxPacketsPerSec}).`,
    });
    updated.netRx = now;
  }

  if (resources.txSpeedMbps >= txLimitMb && now - lastAlertTimes.netTx > intervalMs) {
    alerts.push({
      resource: "netTx",
      text:
        `⚠️ *PERINGATAN: TRAFIK KELUAR (TX) SANGAT TINGGI!*\n` +
        `Intensitas bandwidth keluar mencapai \`${resources.txSpeedMbps.toFixed(2)} MB/s\` (Batas limit: ${txLimitMb} MB/s).\n` +
        `Deteksi paket per detik: \`${resources.txPacketsPerSec.toLocaleString()} pps\`.`,
      logType: "network",
      logTitle: "Overload Bandwidth Keluar",
      logMessage: `Sistem mendeteksi bandwidth keluar tinggi di angka ${resources.txSpeedMbps.toFixed(2)} MB/s (PPS: ${resources.txPacketsPerSec}).`,
    });
    updated.netTx = now;
  }

  return { alerts, updatedTimestamps: updated };
}
