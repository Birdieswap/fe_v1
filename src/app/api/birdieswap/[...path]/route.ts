import { NextResponse } from "next/server";

// ✅ Edge 런타임으로 변경
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 운영 업스트림
const UPSTREAM = new URL("https://api.birdieswap.com");
const ALLOWED_ENDPOINTS: Record<string, string[]> = {
  Transactions: ["/Transactions/", "/Transactions", "/Transactions.json"],
  CurrentUserPoints: [
    "/CurrentUserPoints/",
    "/CurrentUserPoints",
    "/CurrentUserPoints.json",
  ],
  CurrentUserRewards: [
    "/CurrentUserRewards/",
    "/CurrentUserRewards",
    "/CurrentUserRewards.json",
  ],
  SwapRewards: ["/SwapRewards/", "/SwapRewards", "/SwapRewards.json"],
  ReferralRewards: [
    "/ReferralRewards/",
    "/ReferralRewards",
    "/ReferralRewards.json",
  ],
};
const ALLOWED_QUERY_KEYS = new Set([
  "address",
  "blockHeight",
  "chainId",
  "page",
  "size",
]);
const MAX_QUERY_VALUE_LENGTH = 160;
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const DIGITS_RE = /^\d+$/;

/* ───────── helpers ───────── */

function getUpstreamPaths(
  rawPath: string[] | string | undefined,
): string[] | null {
  const parts = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  if (parts.length !== 1) return null;
  const endpoint = parts[0];
  return ALLOWED_ENDPOINTS[endpoint] ?? null;
}

function appendValidatedQuery(req: Request, target: URL): boolean {
  const { searchParams } = new URL(req.url);
  for (const [key, value] of searchParams.entries()) {
    if (
      !ALLOWED_QUERY_KEYS.has(key) ||
      value.length === 0 ||
      value.length > MAX_QUERY_VALUE_LENGTH ||
      /[\r\n]/.test(value) ||
      /(?:https?:)?\/\//i.test(value)
    ) {
      return false;
    }

    if (key === "address") {
      if (!ADDRESS_RE.test(value)) return false;
      target.searchParams.set(key, value.toLowerCase());
      continue;
    }

    if (!DIGITS_RE.test(value)) return false;
    const asNum = Number(value);
    if (!Number.isSafeInteger(asNum) || asNum < 0) return false;

    if (key === "size" && (asNum < 1 || asNum > 200)) return false;
    if (key === "page" && asNum > 10000) return false;

    target.searchParams.set(key, String(asNum));
  }
  return true;
}

function makeBrowseryHeaders(tail: string) {
  const h = new Headers();

  // 최대한 현실적인 브라우저 UA/Accept
  h.set(
    "user-agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  h.set("accept", "application/json, text/plain, */*");
  h.set("accept-language", "en-US,en;q=0.9,ko;q=0.8");
  h.set("cache-control", "no-cache");
  h.set("pragma", "no-cache");

  // 🔸 CF가 보는 헤더들
  h.set("origin", "https://api.birdieswap.com");
  // /Transactions → /Transactions/ 기준 레퍼러로 고정
  const tailNorm = tail.replace(/\/+$/, "");
  h.set("referer", `https://api.birdieswap.com/${tailNorm}/`);

  // 일부 WAF가 체크하는 sec-* 헤더들 (서버에서 진짜로 의미는 없지만 통과율↑)
  h.set("sec-fetch-site", "cross-site");
  h.set("sec-fetch-mode", "cors");
  h.set("sec-fetch-dest", "empty");
  h.set("sec-ch-ua", '"Chromium";v="124", "Not(A:Brand";v="24"');
  h.set("sec-ch-ua-mobile", "?0");
  h.set("sec-ch-ua-platform", '"macOS"');

  return h;
}

function looksLikeCF(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("<title>just a moment") ||
    t.includes("cf-chl") ||
    t.includes("cloudflare") ||
    t.includes("enable javascript and cookies")
  );
}

/* ───────── route (GET) ───────── */

type RouteContext = {
  params?: Promise<{ path?: string[] | string }> | { path?: string[] | string };
};

export async function GET(req: Request, context: RouteContext) {
  try {
    // 1) App Router params 기반으로 허용 엔드포인트만 선택
    const params = context?.params ? await context.params : undefined;
    const upstreamPaths = getUpstreamPaths(params?.path);
    if (!upstreamPaths?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_endpoint",
          hint: "allowed: Transactions, CurrentUserPoints, CurrentUserRewards, SwapRewards, ReferralRewards",
        },
        { status: 400 },
      );
    }

    const endpointName = Array.isArray(params?.path)
      ? params.path[0]
      : params?.path ?? "";
    const upstreamHeaders = makeBrowseryHeaders(endpointName);

    let lastStatus: number | null = null;
    let lastReason = "upstream_non_json_or_error";
    for (const upstreamPath of upstreamPaths) {
      // 2) 고정 upstream에 검증된 query만 부착
      const upstream = new URL(upstreamPath, UPSTREAM);
      if (!appendValidatedQuery(req, upstream)) {
        return NextResponse.json(
          { ok: false, error: "invalid_query" },
          { status: 400 },
        );
      }
      if (upstream.origin !== UPSTREAM.origin) {
        return NextResponse.json(
          { ok: false, error: "invalid_target" },
          { status: 400 },
        );
      }

      // Edge fetch (노드와 다르게 TLS/네트워크 핑거프린트가 달라져 CF 통과율↑)
      let r: Response;
      try {
        r = await fetch(upstream.toString(), {
          method: "GET",
          headers: upstreamHeaders,
          redirect: "follow",
          cache: "no-store",
        });
      } catch {
        lastReason = "network_error";
        continue;
      }

      lastStatus = r.status;
      const ct = r.headers.get("content-type") || "";
      const buf = await r.text().catch(() => "");

      if (r.status === 403 || r.status === 503 || looksLikeCF(buf)) {
        lastReason = "upstream_blocked";
        continue;
      }

      if (
        r.ok &&
        (ct.includes("application/json") || /^[\s\r\n]*[\{\[]/.test(buf))
      ) {
        const out = new Headers();
        out.set("content-type", "application/json; charset=utf-8");
        out.set("cache-control", "no-store, max-age=0");
        out.set("x-upstream-url", upstream.toString());
        return new NextResponse(buf, { status: 200, headers: out });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        status: lastStatus ?? 502,
        reason: lastReason,
      },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, status: 502, reason: "route_error", message: String(e) },
      { status: 502 },
    );
  }
}
