import { NextResponse } from "next/server";

const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

// ✅ Edge 런타임으로 변경
export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 운영 업스트림
const UPSTREAM = new URL("https://api.birdieswap.com");
const MAX_SEGMENT_LENGTH = 120;
const MAX_QUERY_KEY_LENGTH = 40;
const MAX_QUERY_VALUE_LENGTH = 200;

/* ───────── helpers ───────── */

function getSafeTailSegments(rawTail: string): string[] | null {
  const cleaned = strip(rawTail);
  if (!cleaned) return null;

  const segments = cleaned.split("/").filter(Boolean);
  for (const segment of segments) {
    if (
      segment.length > MAX_SEGMENT_LENGTH ||
      segment === "." ||
      segment === ".." ||
      /%2f|%5c|%2e/i.test(segment) ||
      !/^[a-zA-Z0-9._~-]+$/.test(segment)
    ) {
      return null;
    }
  }

  return segments;
}

function appendSafeQuery(
  incoming: URLSearchParams,
  target: URLSearchParams,
): boolean {
  for (const [key, value] of incoming.entries()) {
    if (
      !/^[a-zA-Z0-9_-]+$/.test(key) ||
      key.length > MAX_QUERY_KEY_LENGTH ||
      value.length > MAX_QUERY_VALUE_LENGTH ||
      /[\r\n]/.test(value) ||
      /(?:https?:)?\/\//i.test(value)
    ) {
      return false;
    }
    target.append(key, value);
  }
  return true;
}

function buildUpstreamUrl(pathname: string, searchParams: URLSearchParams) {
  const target = new URL(pathname, UPSTREAM);
  if (!appendSafeQuery(searchParams, target.searchParams)) return null;
  if (target.protocol !== "https:" || target.hostname !== UPSTREAM.hostname) {
    return null;
  }
  return target.toString();
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
    const url = new URL(req.url);

    // 1) App Router params
    const params = context?.params ? await context.params : undefined;
    const raw = params?.path;
    const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];

    // 2) tail 보정
    let safeSegments = getSafeTailSegments(parts.join("/"));
    if (!safeSegments) {
      const base = "/api/birdieswap/";
      const i = url.pathname.indexOf(base);
      if (i >= 0) {
        safeSegments = getSafeTailSegments(url.pathname.slice(i + base.length));
      }
    }
    if (!safeSegments?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_endpoint",
          hint: "call /api/birdieswap/<path>",
        },
        { status: 400 }
      );
    }

    const tail = safeSegments.join("/");

    // 숫자 id 추출 (후보 생성용)
    const m = tail.match(/^(\d+)(?:\.json)?$/);
    const id = m ? m[1] : null;

    // 🔥 후보 우선순위: 슬래시 → 원본 → .json
    const candidatePaths = [
      `/${tail}/`,
      `/${tail}`,
      `/${tail}.json`,
      ...(id ? [`/${id}/`, `/${id}`, `/${id}.json`, `/chains/${id}.json`] : []),
    ];

    const candidates = Array.from(
      new Set(
        candidatePaths
          .map((pathname) => buildUpstreamUrl(pathname, url.searchParams))
          .filter((v): v is string => v != null)
      )
    );
    if (!candidates.length) {
      return NextResponse.json(
        { ok: false, error: "invalid_query" },
        { status: 400 }
      );
    }

    const tried: string[] = [];
    for (const href of candidates) {
      tried.push(href);
      const upstreamHeaders = makeBrowseryHeaders(tail);

      // Edge fetch (노드와 다르게 TLS/네트워크 핑거프린트가 달라져 CF 통과율↑)
      let r: Response;
      try {
        r = await fetch(href, {
          method: "GET",
          headers: upstreamHeaders,
          redirect: "follow",
          cache: "no-store",
        });
      } catch (e) {
        // 네트워크 오류면 다음 후보 시도
        continue;
      }

      const ct = r.headers.get("content-type") || "";
      const buf = await r.text().catch(() => "");

      // CF 차단 페이지면 다음 후보
      if (r.status === 403 || r.status === 503 || looksLikeCF(buf)) {
        continue;
      }

      // JSON이면 패스스루
      if (
        r.ok &&
        (ct.includes("application/json") || /^[\s\r\n]*[\{\[]/.test(buf))
      ) {
        const out = new Headers();
        out.set("content-type", "application/json; charset=utf-8");
        out.set("cache-control", "no-store, max-age=0");
        out.set("x-upstream-url", href);
        out.set("x-upstream-tried", tried.join(" | "));

        // body가 스트림이면 그대로 전달, 아니면 텍스트->응답
        // 위에서 buf를 읽었으니 여기선 buf 사용
        return new NextResponse(buf, { status: 200, headers: out });
      }

      // 다른 형식이면 다음 후보
      if (!r.ok) continue;
    }

    // 모든 후보 실패
    return NextResponse.json(
      {
        ok: false,
        status: 502,
        reason: "upstream_error_or_cloudflare_challenge",
        tried: candidates,
      },
      { status: 502 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, status: 502, reason: "route_error", message: String(e) },
      { status: 502 }
    );
  }
}
