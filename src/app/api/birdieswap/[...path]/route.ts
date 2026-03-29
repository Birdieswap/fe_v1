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
  Check: ["/Consent/Check/", "/Consent/Check"],
  Initiate: ["/Consent/Initiate/", "/Consent/Initiate"],
  Verify: ["/Consent/Verify/", "/Consent/Verify", "/Consent/Verify/index.php"],
};
const ENDPOINT_QUERY_KEYS: Record<AllowedEndpoint, Set<string>> = {
  Transactions: new Set([
    "address",
    "blockHeight",
    "chainId",
    "page",
    "size",
    "_ts",
    "cursor",
    "offset",
    "limit",
    "fromBlock",
    "toBlock",
    "sort",
    "order",
    "type",
  ]),
  CurrentUserPoints: new Set(["address", "chainId", "_ts"]),
  CurrentUserRewards: new Set(["address", "chainId", "page", "size", "_ts"]),
  SwapRewards: new Set(["address", "chainId", "page", "size", "_ts"]),
  ReferralRewards: new Set(["address", "chainId", "page", "size", "_ts"]),
  Check: new Set(["address", "_ts"]),
  Initiate: new Set(["address", "chainId", "type", "_ts"]),
  Verify: new Set(),
};
const MAX_QUERY_VALUE_LENGTH = 160;
const MAX_POST_VALUE_LENGTH = 16_384;
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const DIGITS_RE = /^\d+$/;
const TYPE_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const HEX_SIG_RE = /^0x[a-fA-F0-9]{130}$/;
const HEX_32_RE = /^0x[a-fA-F0-9]{64}$/;
const NUMERIC_QUERY_KEYS = new Set([
  "blockHeight",
  "chainId",
  "page",
  "size",
  "cursor",
  "offset",
  "limit",
  "fromBlock",
  "toBlock",
]);
const TEXT_QUERY_KEYS = new Set(["type", "sort", "order"]);
const UPSTREAM_PATH_PREFIXES = new Set([
  "/Transactions",
  "/CurrentUserPoints",
  "/CurrentUserRewards",
  "/SwapRewards",
  "/ReferralRewards",
  "/Consent/Check",
  "/Consent/Initiate",
  "/Consent/Verify",
]);

type AllowedEndpoint =
  | "Transactions"
  | "CurrentUserPoints"
  | "CurrentUserRewards"
  | "SwapRewards"
  | "ReferralRewards"
  | "Check"
  | "Initiate"
  | "Verify";

/* ───────── helpers ───────── */

function applyApiSecurityHeaders(headers: Headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set(
    "Content-Security-Policy",
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  );
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
}

function jsonResponse(body: unknown, status: number) {
  const res = NextResponse.json(body, { status });
  applyApiSecurityHeaders(res.headers);
  return res;
}

function resolveEndpoint(
  rawPath: string[] | string | undefined,
): AllowedEndpoint | null {
  const parts = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  if (parts.length < 1 || parts.length > 2) return null;
  // consentApi에서 /api/birdieswap/Consent/Check 형태를 쓰는 환경과
  // /api/birdieswap/Check 형태를 모두 허용
  const endpointToken =
    parts.length === 2 && parts[0] === "Consent" ? parts[1] : parts[0];
  const endpoint = endpointToken as AllowedEndpoint;
  switch (endpoint) {
    case "Transactions":
    case "CurrentUserPoints":
    case "CurrentUserRewards":
    case "SwapRewards":
    case "ReferralRewards":
    case "Check":
    case "Initiate":
    case "Verify":
      return endpoint;
    default:
      return null;
  }
}

function getUpstreamPaths(endpoint: AllowedEndpoint): string[] {
  return ALLOWED_ENDPOINTS[endpoint];
}

function appendValidatedQuery(
  req: Request,
  target: URL,
  endpoint: AllowedEndpoint,
): { ok: true } | { ok: false; key: string; reason: string } {
  const endpointKeys = ENDPOINT_QUERY_KEYS[endpoint];
  const { searchParams } = new URL(req.url);
  for (const [key, value] of searchParams.entries()) {
    // 엔드포인트 스펙에 없는 키는 보안상 전달하지 않고 무시한다.
    if (!endpointKeys.has(key)) continue;

    if (
      value.length === 0 ||
      value.length > MAX_QUERY_VALUE_LENGTH ||
      /[\r\n]/.test(value) ||
      /(?:https?:)?\/\//i.test(value)
    ) {
      return { ok: false, key, reason: "malformed_value" };
    }

    if (key === "address") {
      if (!ADDRESS_RE.test(value)) {
        return { ok: false, key, reason: "invalid_address" };
      }
      target.searchParams.set(key, value.toLowerCase());
      continue;
    }

    if (TEXT_QUERY_KEYS.has(key)) {
      if (!TYPE_RE.test(value)) {
        return { ok: false, key, reason: "invalid_text_value" };
      }
      target.searchParams.set(key, value);
      continue;
    }

    if (!NUMERIC_QUERY_KEYS.has(key)) {
      // allowlist에 있지만 별도 타입 분류가 없다면 전달하지 않음
      continue;
    }

    if (!DIGITS_RE.test(value)) {
      return { ok: false, key, reason: "invalid_numeric_value" };
    }
    const asNum = Number(value);
    if (!Number.isSafeInteger(asNum) || asNum < 0) {
      return { ok: false, key, reason: "invalid_numeric_range" };
    }

    if (key === "size" && (asNum < 1 || asNum > 200)) {
      return { ok: false, key, reason: "size_out_of_range" };
    }
    if (key === "page" && asNum > 10000) {
      return { ok: false, key, reason: "page_out_of_range" };
    }

    target.searchParams.set(key, String(asNum));
  }
  return { ok: true };
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

function validateVerifyForm(
  form: URLSearchParams,
): { ok: true } | { ok: false; key: string; reason: string } {
  const address = form.get("address") ?? "";
  const signature = form.get("signature") ?? "";
  const digest = form.get("digest") ?? "";
  const chainId = form.get("chainId") ?? "";
  const nonce = form.get("nonce") ?? "";
  const type = form.get("type") ?? "";
  const version = form.get("version") ?? "";
  const payload = form.get("EIP712Payload");

  if (!ADDRESS_RE.test(address)) return { ok: false, key: "address", reason: "invalid_address" };
  if (!HEX_SIG_RE.test(signature)) return { ok: false, key: "signature", reason: "invalid_signature" };
  if (!HEX_32_RE.test(digest)) return { ok: false, key: "digest", reason: "invalid_digest" };
  if (!DIGITS_RE.test(chainId)) return { ok: false, key: "chainId", reason: "invalid_chain_id" };
  if (!DIGITS_RE.test(nonce)) return { ok: false, key: "nonce", reason: "invalid_nonce" };
  if (!TYPE_RE.test(type)) return { ok: false, key: "type", reason: "invalid_type" };
  if (!/^[a-zA-Z0-9._-]{1,32}$/.test(version)) {
    return { ok: false, key: "version", reason: "invalid_version" };
  }
  if (payload) {
    if (payload.length > MAX_POST_VALUE_LENGTH) {
      return { ok: false, key: "EIP712Payload", reason: "payload_too_large" };
    }
    try {
      JSON.parse(payload);
    } catch {
      return { ok: false, key: "EIP712Payload", reason: "invalid_payload_json" };
    }
  }
  return { ok: true };
}

async function readVerifyForm(req: Request): Promise<URLSearchParams> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    return new URLSearchParams(await req.text());
  }
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body ?? {})) {
      if (v == null) continue;
      if (typeof v === "object") params.set(k, JSON.stringify(v));
      else params.set(k, String(v));
    }
    return params;
  }
  return new URLSearchParams();
}

/* ───────── route (GET) ───────── */

type RouteContext = {
  params?: Promise<{ path?: string[] | string }> | { path?: string[] | string };
};

export async function GET(req: Request, context: RouteContext) {
  try {
    // 1) App Router params 기반으로 허용 엔드포인트만 선택
    const params = context?.params ? await context.params : undefined;
    const endpoint = resolveEndpoint(params?.path);
    if (!endpoint) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_endpoint",
          hint: "allowed: Transactions, CurrentUserPoints, CurrentUserRewards, SwapRewards, ReferralRewards, Check, Initiate, Verify",
        },
        400,
      );
    }
    if (endpoint === "Verify") {
      return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
    }

    const upstreamHeaders = makeBrowseryHeaders(endpoint);

    let lastStatus: number | null = null;
    let lastReason = "upstream_non_json_or_error";
    for (const upstreamPath of getUpstreamPaths(endpoint)) {
      // 2) 고정 upstream에 검증된 query만 부착
      const upstream = new URL(upstreamPath, UPSTREAM);
      const validatedQuery = appendValidatedQuery(req, upstream, endpoint);
      if (!validatedQuery.ok) {
        return jsonResponse(
          {
            ok: false,
            error: "invalid_query",
            key: validatedQuery.key,
            reason: validatedQuery.reason,
          },
          400,
        );
      }
      const hasAllowedPrefix = Array.from(UPSTREAM_PATH_PREFIXES).some((prefix) =>
        upstream.pathname.startsWith(prefix),
      );
      if (
        upstream.protocol !== "https:" ||
        upstream.origin !== UPSTREAM.origin ||
        !hasAllowedPrefix
      ) {
        return jsonResponse(
          { ok: false, error: "invalid_target" },
          400,
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
        applyApiSecurityHeaders(out);
        return new NextResponse(buf, { status: 200, headers: out });
      }
    }

    return jsonResponse(
      {
        ok: false,
        status: lastStatus ?? 502,
        reason: lastReason,
      },
      502,
    );
  } catch (e) {
    return jsonResponse(
      { ok: false, status: 502, reason: "route_error", message: String(e) },
      502,
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const params = context?.params ? await context.params : undefined;
    const endpoint = resolveEndpoint(params?.path);
    if (endpoint !== "Verify") {
      return jsonResponse({ ok: false, error: "invalid_endpoint" }, 400);
    }

    const form = await readVerifyForm(req);
    if (!form.size) {
      return jsonResponse({ ok: false, error: "empty_body" }, 400);
    }
    const validated = validateVerifyForm(form);
    if (!validated.ok) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_body",
          key: validated.key,
          reason: validated.reason,
        },
        400,
      );
    }

    const upstream = new URL(getUpstreamPaths(endpoint)[0], UPSTREAM);
    const hasAllowedPrefix = Array.from(UPSTREAM_PATH_PREFIXES).some((prefix) =>
      upstream.pathname.startsWith(prefix),
    );
    if (
      upstream.protocol !== "https:" ||
      upstream.origin !== UPSTREAM.origin ||
      !hasAllowedPrefix
    ) {
      return jsonResponse({ ok: false, error: "invalid_target" }, 400);
    }

    const headers = makeBrowseryHeaders(endpoint);
    headers.set("content-type", "application/x-www-form-urlencoded");
    headers.set("accept", "application/json, text/javascript;q=0.9, */*;q=0.8");

    const r = await fetch(upstream.toString(), {
      method: "POST",
      headers,
      redirect: "follow",
      cache: "no-store",
      body: form.toString(),
    }).catch(() => null);

    if (!r) {
      return jsonResponse({ ok: false, status: 502, reason: "network_error" }, 502);
    }

    const status = r.status;
    const ct = r.headers.get("content-type") || "";
    const buf = await r.text().catch(() => "");
    if (status === 403 || status === 503 || looksLikeCF(buf)) {
      return jsonResponse({ ok: false, status, reason: "upstream_blocked" }, 502);
    }

    if (!r.ok || !(ct.includes("application/json") || /^[\s\r\n]*[\{\[]/.test(buf))) {
      return jsonResponse({ ok: false, status, reason: "upstream_non_json_or_error" }, 502);
    }

    const out = new Headers();
    out.set("content-type", "application/json; charset=utf-8");
    out.set("cache-control", "no-store, max-age=0");
    out.set("x-upstream-url", upstream.toString());
    applyApiSecurityHeaders(out);
    return new NextResponse(buf, { status: 200, headers: out });
  } catch (e) {
    return jsonResponse(
      { ok: false, status: 502, reason: "route_error", message: String(e) },
      502,
    );
  }
}
