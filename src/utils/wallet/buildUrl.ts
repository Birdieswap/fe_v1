export function buildUrl(
  pathname: string, // "Transactions" | "CurrentUserRewards" | ...
  params?: Record<string, string | number | undefined>
) {
  // 앞/뒤 슬래시 제거
  const normalized = (pathname || "").replace(/^\/+|\/+$/g, "");

  // 🔧 직통이 필요한(서버 프록시가 CF에 막히는) 키 목록
  const DIRECT_KEYS = new Set([
    "Transactions",
    "CurrentUserPoints",
    "CurrentUserRewards",
    "SwapRewards",
    "ReferralRewards",
  ]);

  // 모드/환경 토글
  const MODE = (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "")
    .trim()
    .toLowerCase();
  const DEV = MODE ? MODE === "dev" : process.env.NODE_ENV !== "production";
  const FORCE_DIRECT = (process.env.NEXT_PUBLIC_REALKIMP_DIRECT ?? "") === "1";

  // 직통 베이스(우선순위 리스트). 지정 없으면 기본값 사용
  const BASES: string[] = (() => {
    const raw = (process.env.NEXT_PUBLIC_REALKIMP_BASES ?? "").trim();
    if (raw)
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return ["https://realkimp.com/birdieswap"]; // 기본
  })();

  const sp = new URLSearchParams();

  const merged: Record<string, string | number | undefined> = {
    ...(params ?? {}),
  };

  // dev일 때 일부 엔드포인트에 chainId=0 강제
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

  // 값 정리: undefined/null/빈문자/NaN 방지 + 숫자 검증
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

  // 🚦 직통 여부 결정: dev이거나 FORCE_DIRECT면, 문제 키만 외부 직통
  const shouldDirect = (DEV || FORCE_DIRECT) && DIRECT_KEYS.has(normalized);

  if (shouldDirect) {
    // 우선순위 베이스 첫 번째 사용 (환경변수로 .io를 먼저 두면 CF 우회에 유리)
    const baseDirect =
      BASES[0]?.replace(/\/+$/, "") || "https://realkimp.com/birdieswap";
    const directUrl = `${baseDirect}/${normalized}${qs ? `?${qs}` : ""}`;

    if (typeof window !== "undefined") {
      console.log(`[buildUrl] DIRECT → ${normalized} =`, directUrl);
    }
    return directUrl; // 🔥 브라우저가 외부 오리진으로 직접 호출
  }

  // 기본: 프록시 경로
  const baseProxy = `/api/realkimp/${normalized}`;
  const proxyUrl = qs ? `${baseProxy}?${qs}` : baseProxy;

  if (typeof window !== "undefined" && normalized === "Transactions") {
    console.log("[buildUrl] PROXY  → Transactions =", proxyUrl);
  }

  return proxyUrl;
}
