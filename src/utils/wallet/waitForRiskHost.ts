export async function waitForRiskHost(timeout = 1500) {
  const w = typeof window !== "undefined" ? (window as any) : undefined;
  if (!w) return false;

  const start = Date.now();
  // 이미 마운트되어 있으면 즉시 반환
  if (w.__RISK_HOST_MOUNTED__) return true;

  // 최대 timeout ms 동안 2-3 프레임만 기다림
  while (!w.__RISK_HOST_MOUNTED__) {
    if (Date.now() - start > timeout) return false;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }
  return true;
}
