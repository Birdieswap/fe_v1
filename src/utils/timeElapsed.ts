export function timeElapsed(timestamp: number): string {
  const now = Date.now();
  const elapsed = now - timestamp;

  const seconds = Math.floor(elapsed / 1000);

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  // Check if a month has passed
  // 30 days is a rough estimate for a month
  if (days < 30) return `${days}d`;

  const startDate = new Date(timestamp);
  const nowDate = new Date();
  const years = nowDate.getFullYear() - startDate.getFullYear();
  const months = nowDate.getMonth() - startDate.getMonth() + years * 12;

  if (months < 12) return `${months}mo`;

  return `${years}y`;
}
