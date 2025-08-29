
export function buildUrl(
  pathname: string, // "Transactions" | "CurrentUserRewards" | ...
  params?: Record<string, string | number | undefined>
) {
  // 앞/뒤 슬래시 모두 제거 → "Transactions"만 남도록
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const base = `/api/realkimp/${normalized}`;

  const sp = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    }
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
