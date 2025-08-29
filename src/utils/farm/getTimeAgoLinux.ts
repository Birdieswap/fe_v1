export function getTimeAgoLinux(timeStamp: string): string {
  const thenSec = Number.parseInt(timeStamp, 10);
  if (!Number.isFinite(thenSec)) return "Invalid timestamp";

  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = nowSec - thenSec;      // 과거면 +, 미래면 -

  let time: string;
  if (diffSec < 60) {
    time = `${Math.floor(diffSec)}s`;
  } else if (diffSec < 3600) {
    time = `${Math.floor(diffSec / 60)}m`;
  } else if (diffSec < 86400) {
    time = `${Math.floor(diffSec / 3600)}h`;
  } else if (diffSec < 31536000) {
    time = `${Math.floor(diffSec / 86400)}d`;
  } else {
    time = `${Math.floor(diffSec / 31536000)}Y`;
  }

  return time;
}