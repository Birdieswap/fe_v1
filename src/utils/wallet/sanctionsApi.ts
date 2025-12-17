export type SanctionsCheckResult =
  | { ok: true; isSanctioned: boolean }
  | { ok: false; error: string; retryAfter?: string | null };

export async function apiSanctionsCheck(
  address: string
): Promise<SanctionsCheckResult> {
  const res = await fetch("/api/compliance/sanctions-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!res.ok) {
    try {
      const j = await res.json();
      return {
        ok: false,
        error: String(j?.error ?? `http_${res.status}`),
        retryAfter: j?.retryAfter ?? null,
      };
    } catch {
      return { ok: false, error: `http_${res.status}` };
    }
  }

  const json = await res.json();
  return { ok: true, isSanctioned: Boolean(json?.isSanctioned) };
}
