export function drawProgressBar(percent: number, size = 10): string {
  const progress = Math.round((percent / 100) * size);
  const emptyProgress = size - progress;
  const progressText = "█".repeat(progress);
  const emptyProgressText = "░".repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${percent}%`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days} hari, ${hours} jam, ${minutes} menit`;
}
