
export function buildUrl(
  pathname: string, // "Transactions" | "CurrentUserRewards" | ...
  params?: Record<string, string | number | undefined>
) {
  // 앞/뒤 슬래시 모두 제거 → "Transactions"만 남도록
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const base = `/api/realkimp/${normalized}`;

  const sp = new URLSearchParams();

  const merged: Record<string, string | number | undefined> = { ...(params ?? {}) };

  // 🔹 dev 모드면 무조건 chainId=0 강제
  if (process.env.NEXT_PUBLIC_OPERATION_MODE === "dev") {
    merged.chainId = 0;
  }

  // 쿼리스트링 구성
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }

  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
//   if (params) {
//     for (const [k, v] of Object.entries(params)) {
//       if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
//     }
//   }
//   const qs = sp.toString();
//   return qs ? `${base}?${qs}` : base;
// }
