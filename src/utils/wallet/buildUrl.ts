export function buildUrl(
  pathname: string, // "Transactions" | "CurrentUserRewards" | ...
  params?: Record<string, string | number | undefined>
) {
  // 앞/뒤 슬래시 모두 제거 → "Transactions"만 남도록
  const normalized = (pathname || "").replace(/^\/+|\/+$/g, "");
  const base = `/api/realkimp/${normalized}`;
  const sp = new URLSearchParams();

  const MODE = (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "")
    .trim()
    .toLowerCase();
  const DEV = MODE ? MODE === "dev" : process.env.NODE_ENV !== "production";

  const merged: Record<string, string | number | undefined> = {
    ...(params ?? {}),
  };

  // 🔸 dev일 때, 위 대상 엔드포인트에 한해서만 chainId=0 덮어쓰기
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

  // 값 정리: undefined/null/빈문자/NaN 방지
  const sanitize = (key: string, val: unknown): string | number | undefined => {
    if (val === undefined || val === null) return undefined;

    if (typeof val === "string") {
      const t = val.trim();
      if (!t) return undefined;
      const low = t.toLowerCase();
      if (low === "undefined" || low === "null" || low === "nan")
        return undefined;

      if (key === "blockHeight" || key === "chainId") {
        const n = Number(t);
        if (!Number.isFinite(n)) return undefined;
        if (key === "blockHeight" && n < 0) return undefined;
        return n;
      }
      return t;
    }

    if (typeof val === "number") {
      if (!Number.isFinite(val)) return undefined;
      if (key === "blockHeight" && val < 0) return undefined;
      return val;
    }

    return undefined;
  };

  for (const [k, v] of Object.entries(merged)) {
    const s = sanitize(k, v);
    if (s !== undefined) sp.set(k, String(s));
  }

  const qs = sp.toString();
  const url = qs ? `${base}?${qs}` : base;

  // 🔎 디버그: 실제 호출 URL을 한눈에
  if (typeof window !== "undefined" && normalized === "Transactions") {
    console.log("[buildUrl] Transactions URL =", url);
  }

  return url;
}
