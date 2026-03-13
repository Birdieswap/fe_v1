export function buildUrl(
  pathname: string, // "Transactions" | "CurrentUserPoints" | ...
  params?: Record<string, string | number | undefined>
) {
  const normalized = (pathname || "").replace(/^\/+|\/+$/g, "");

  // 브라우저 직통 금지 대상(민감 엔드포인트)
  const SENSITIVE = new Set([
    "Transactions",
    "CurrentUserPoints",
    "CurrentUserRewards",
    "SwapRewards",
    "ReferralRewards",
  ]);

  // dev 판별
  const MODE = (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "")
    .trim()
    .toLowerCase();
  const DEV = MODE ? MODE === "dev" : process.env.NODE_ENV !== "production";

  // dev일 때 일부 엔드포인트는 chainId=0 강제
  const merged: Record<string, string | number | undefined> = {
    ...(params ?? {}),
  };
  if (
    DEV &&
    [
      "Transactions",
      "CurrentUserRewards",
      "SwapRewards",
      "ReferralRewards",
    ].includes(normalized)
  ) {
    merged.chainId = 0;
  }

  // 쿼리 정리
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === null) continue;
    const s = `${v}`.trim();
    if (!s || s === "undefined" || s === "null" || s === "NaN") continue;
    sp.set(k, s);
  }
  const qs = sp.toString();
  const q = qs ? `?${qs}` : "";

  // ✅ 항상 /api 프록시만 사용 (여기서 .json 절대 붙이지 않음)
  const proxyUrl = `/api/birdieswap/${normalized}${q}`;

  if (typeof window !== "undefined" && SENSITIVE.has(normalized)) {
    // console.log(`[buildUrl] PROXY ONLY → ${normalized} =`, proxyUrl);
  }
  return proxyUrl;
}
