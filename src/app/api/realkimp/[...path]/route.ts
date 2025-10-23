import { NextResponse } from "next/server";
import { pickProxyResponseHeaders } from "@/utils/proxy";
import { withTimeout } from "@/utils/timeout";

const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

// 업스트림 후보(우선순위대로)
const ORIGINS = [
  "https://realkimp.com/birdieswap",
  "https://realkimp.io/birdieswap",
];

// ─────────────────────────────────────────────────────────────
// 최소 헤더 세트 (서버-투-서버)
// ─────────────────────────────────────────────────────────────
function browserLikeHeaders(baseUA?: string) {
  const ua =
    baseUA ||
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  return {
    "user-agent": ua,
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ko;q=0.8",
    "accept-encoding": "gzip, deflate, br",
    pragma: "no-cache",
    "cache-control": "no-cache",
  };
}

/** 업스트림으로 전달할 헤더 (브라우저 흉내 최소, dev/prod Origin/Referer 유지) */
function safeUpstreamHeaders(req: Request, tail: string) {
  const h = new Headers();

  const bl = browserLikeHeaders(req.headers.get("user-agent") || undefined);
  Object.entries(bl).forEach(([k, v]) => h.set(k, v as string));

  // 요청 기준으로 origin/referrer 계산 (SSR엔 거의 없음)
  const reqOrigin = req.headers.get("origin");
  const siteOrigin = reqOrigin || new URL(req.url).origin;
  const reqReferer = req.headers.get("referer") || `${siteOrigin}/`;

  // 사람 사용 흔적이 필요한 엔드포인트만 세팅
  const needsHumanLike =
    /^(currentuserpoints|transactions|apr\/|consent(\/|$)|points?)/i.test(tail);

  if (needsHumanLike) {
    h.set("origin", siteOrigin);
    h.set("referer", reqReferer);
    const cookie = req.headers.get("cookie"); // cf_clearance 등
    if (cookie) h.set("cookie", cookie);
  } else {
    h.delete("cookie");
  }

  // 원 IP 전달(가능하면)
  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  // 업스트림이 http로 오판하지 않도록
  h.set("x-forwarded-proto", "https");
  h.set("x-forwarded-host", "realkimp.com");

  // 프록시/플랫폼에 맡김
  h.delete("authorization");

  return h;
}

// Cloudflare 챌린지/차단 HTML 탐지
function looksLikeCFChallenge(status: number, text: string) {
  if (status === 403 || status === 503) {
    const t = text.toLowerCase();
    return (
      t.includes("<title>just a moment") ||
      t.includes("cf-chl") ||
      t.includes("enable javascript and cookies to continue") ||
      t.includes("cloudflare")
    );
  }
  return false;
}

// dev 도메인(origin)인지
function isDevOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    // birdieswap-dev.vercel.app 및 프리뷰 서브도메인 포함
    return /(^|\.)birdieswap-dev\.vercel\.app$/i.test(u.hostname);
  } catch {
    return false;
  }
}

// 리다이렉트 허용할 안전한 GET 엔드포인트만
function isSafeRedirectTarget(tail: string) {
  // transactions, points 등도 허용
  return /^(currentuserpoints|transactions|apr\/|consent(\/|$)|points?)/i.test(
    tail
  );
}

// ⬇️ context를 any로 받아 런타임 params 사용
export async function GET(req: Request, context?: any) {
  const url = new URL(req.url);

  // 1) App Router params 우선
  const raw = context?.params?.path;
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // 2) pathname에서 보완
  let tail: string = strip(parts.join("/"));
  if (!tail) {
    const base = "/api/realkimp/";
    const i = url.pathname.indexOf(base);
    if (i >= 0) tail = strip(url.pathname.slice(i + base.length));
  }

  if (!tail) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing endpoint",
        hint: "call /api/realkimp/<path>",
      },
      { status: 200 }
    );
  }

  // 숫자 id 감지
  const m = tail.match(/^(\d+)(?:\.json)?$/);
  const id = m ? m[1] : null;

  const candidates = Array.from(
    new Set(
      ORIGINS.flatMap(
        (base) =>
          [
            `${base}/${tail}`,
            `${base}/${tail}/`,
            !tail.endsWith(".json") ? `${base}/${tail}.json` : null,
            id ? `${base}/${id}.json` : null,
            id ? `${base}/${id}` : null,
            id ? `${base}/chains/${id}.json` : null,
          ].filter(Boolean) as string[]
      )
    )
  );

  const tried: string[] = [];

  for (const baseUrl of candidates) {
    const u = new URL(baseUrl);
    u.search = url.search; // 쿼리 그대로 유지
    tried.push(u.toString());

    let r = await withTimeout(12_000, (signal) =>
      fetch(u, {
        method: "GET",
        headers: safeUpstreamHeaders(req, tail),
        cache: "no-store",
        redirect: "follow",
        signal,
      })
    ).catch((e) => new Response(String(e), { status: 502 }));

    // http로 강등되면 https로 재시도
    try {
      const finalUrl = (r as any).url as string | undefined;
      if (finalUrl && finalUrl.startsWith("http://realkimp.com/")) {
        const httpsUrl = finalUrl.replace(/^http:\/\//, "https://");
        r = await fetch(httpsUrl, {
          method: "GET",
          headers: safeUpstreamHeaders(req, tail),
          cache: "no-store",
          redirect: "follow",
        });
      }
    } catch {}

    // 3xx 리다이렉트는 디버그 용으로 그대로 반환
    if (r.status >= 300 && r.status < 400) {
      const location = r.headers.get("location") || "";
      return NextResponse.json(
        {
          ok: false,
          status: r.status,
          tried,
          redirectTo: location.slice(0, 500),
        },
        { status: 200 }
      );
    }

    const ct = r.headers.get("content-type") || "";

    // JSON 스트림 패스스루
    if (
      r.ok &&
      (ct.includes("application/json") || u.pathname.endsWith(".json"))
    ) {
      const out = pickProxyResponseHeaders(r);
      out.delete("content-encoding");
      out.delete("transfer-encoding");
      out.delete("content-length");
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(r.body, { status: 200, headers: out });
    }

    // 본문이 JSON처럼 보이면 텍스트로 전달
    const text = await r
      .clone()
      .text()
      .catch(() => "");
    if (r.ok && /^[\s\r\n]*[\{\[]/.test(text)) {
      const out = pickProxyResponseHeaders(r);
      out.delete("content-encoding");
      out.delete("transfer-encoding");
      out.delete("content-length");
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(text, { status: 200, headers: out });
    }

    // ⬇️ CF 챌린지 감지 → dev에서만 업스트림으로 307 리다이렉트 폴백
    if (looksLikeCFChallenge(r.status, text)) {
      const origin = req.headers.get("origin");
      const allowRedirect =
        req.method === "GET" &&
        isDevOrigin(origin) &&
        isSafeRedirectTarget(tail);

      if (allowRedirect) {
        // 브라우저가 CORS preflight + 직접 GET 하도록 유도
        return new NextResponse(null, {
          status: 307, // Temporary Redirect (메서드 유지)
          headers: {
            Location: u.toString(),
            "Cache-Control": "no-store",
            "x-birdie-cf-bypass": "dev-origin-redirect",
            "x-upstream-tried": tried.join(" | "),
          },
        });
      }

      // dev가 아니거나 비안전 엔드포인트면 그대로 에러 JSON
      return NextResponse.json(
        {
          ok: false,
          status: r.status,
          tried,
          bodyPreview: text.slice(0, 1000),
          reason: "cloudflare_challenge",
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json(
    { ok: false, error: "upstream error", tried: candidates },
    { status: 200 }
  );
}
