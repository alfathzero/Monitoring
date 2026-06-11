export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  if (m > 0) parts.push(`${m} menit`);
  if (d === 0 && h === 0) parts.push(`${s} detik`);
  return parts.join(" ");
}

export function drawProgressBar(percent: number, size = 10): string {
  const filled = Math.round((percent / 100) * size);
  const blank = size - filled;
  return "■".repeat(filled) + "□".repeat(blank) + ` [${percent}%]`;
}
