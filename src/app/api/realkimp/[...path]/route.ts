// src/app/api/realkimp/[...path]/route.ts
import { NextResponse } from "next/server";
import { pickProxyResponseHeaders } from "@/utils/proxy";
import { withTimeout } from "@/utils/timeout";

const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const ORIGINS = [
  "https://realkimp.com/birdieswap",
  "https://realkimp.io/birdieswap",
];

// ────────────────────────────────────────────────────────────────
// 최소 서버-투-서버 헤더 (브라우저 유사)
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

function inferOriginFromReq(req: Request): string {
  const o = req.headers.get("origin");
  if (o) return o;
  const ref = req.headers.get("referer");
  if (ref) {
    try {
      return new URL(ref).origin;
    } catch {}
  }
  const proto = (req.headers.get("x-forwarded-proto") || "https").replace(
    /:$/,
    ""
  );
  const xfHost = req.headers.get("x-forwarded-host");
  const host = xfHost || req.headers.get("host") || "";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

function isDevOrigin(originLike: string | null) {
  if (!originLike) return false;
  try {
    const h = new URL(originLike).hostname.toLowerCase();
    return (
      h === "birdieswap-dev.vercel.app" ||
      h.endsWith(".birdieswap-dev.vercel.app")
    );
  } catch {
    return false;
  }
}

// 업스트림 전달 헤더
function safeUpstreamHeaders(req: Request, tail: string) {
  const h = new Headers();
  const bl = browserLikeHeaders(req.headers.get("user-agent") || undefined);
  Object.entries(bl).forEach(([k, v]) => h.set(k, v as string));

  const originLike = req.headers.get("origin") || inferOriginFromReq(req);
  const humanLikeNeeded =
    /^(currentuserpoints|transactions|apr\/|consent(\/|$)|points?)/i.test(tail);

  // dev 프리뷰에서만 쿠키/레퍼러 전달(Cloudflare 통과 필요 케이스)
  if (humanLikeNeeded && isDevOrigin(originLike)) {
    h.set("origin", originLike);
    h.set("referer", `${originLike}/`);
    const cookie = req.headers.get("cookie");
    if (cookie) h.set("cookie", cookie);
  } else {
    h.delete("cookie");
  }

  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  h.set("x-forwarded-proto", "https");
  h.set("x-forwarded-host", "realkimp.com");
  h.delete("authorization");
  return h;
}

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

export async function GET(req: Request, context?: any) {
  const url = new URL(req.url);

  // 1) App Router params 우선
  const raw = context?.params?.path;
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  let tail: string = strip(parts.join("/"));

  // 2) pathname에서 보완
  if (!tail) {
    const base = "/api/realkimp/";
    const i = url.pathname.indexOf(base);
    if (i >= 0) tail = strip(url.pathname.slice(i + base.length));
  }

  if (!tail) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_endpoint",
        hint: "call /api/realkimp/<path>",
      },
      { status: 400 }
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
    u.search = url.search;
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

    // 업스트림이 http로 강등되면 https로 재시도
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

    const ct = r.headers.get("content-type") || "";

    // ✅ JSON 패스스루 (스트림 그대로)
    if (
      r.ok &&
      (ct.includes("application/json") || u.pathname.endsWith(".json"))
    ) {
      const out = pickProxyResponseHeaders(r);
      out.delete("content-encoding");
      out.delete("transfer-encoding");
      out.delete("content-length");
      out.delete("set-cookie"); // 민감 헤더 제거
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(r.body, { status: 200, headers: out });
    }

    // 본문이 JSON처럼 보이면 JSON으로 반환
    const text = await r
      .clone()
      .text()
      .catch(() => "");
    if (r.ok && /^[\s\r\n]*[\{\[]/.test(text)) {
      const out = pickProxyResponseHeaders(r);
      out.delete("content-encoding");
      out.delete("transfer-encoding");
      out.delete("content-length");
      out.delete("set-cookie");
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(text, { status: 200, headers: out });
    }

    // ❗ Cloudflare 챌린지/차단 → 절대 외부로 리다이렉트하지 않음 (CORS 회피)
    if (looksLikeCFChallenge(r.status, text)) {
      return NextResponse.json(
        {
          ok: false,
          status: r.status,
          reason: "cloudflare_challenge",
          tried,
          bodyPreview: text.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    // 3xx/4xx/5xx 등 비-JSON 응답은 설명 JSON으로 통일
    if (r.status >= 300) {
      return NextResponse.json(
        {
          ok: false,
          status: r.status,
          tried,
          contentType: ct.slice(0, 120),
          bodyPreview: text.slice(0, 1000),
        },
        { status: r.status === 304 ? 304 : 502 }
      );
    }
  }

  return NextResponse.json(
    { ok: false, error: "upstream_error", tried: candidates },
    { status: 502 }
  );
}
