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

/* ───────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────── */

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

function safeUpstreamHeaders(req: Request, tail: string) {
  const h = new Headers();
  const bl = browserLikeHeaders(req.headers.get("user-agent") || undefined);
  Object.entries(bl).forEach(([k, v]) => h.set(k, v as string));

  // 필요한 엔드포인트에 한해 최소한의 human-like 헤더 부여
  const needsHumanLike =
    /^(currentuserpoints|transactions|apr\/|consent(\/|$)|points?)/i.test(tail);
  if (needsHumanLike) {
    const siteOrigin = req.headers.get("origin") || inferOriginFromReq(req);
    const ref = req.headers.get("referer") || `${siteOrigin}/`;
    if (siteOrigin) h.set("origin", siteOrigin);
    if (ref) h.set("referer", ref);
    const cookie = req.headers.get("cookie");
    if (cookie) h.set("cookie", cookie);
  } else {
    h.delete("cookie");
  }

  // best-effort 원 IP
  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  h.set("x-forwarded-proto", "https");
  // h.set("x-forwarded-host", "realkimp.com");
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

/* ───────────────────────────────────────────────────────────────
 * Route
 * ─────────────────────────────────────────────────────────────── */

export async function GET(req: Request, context?: any) {
  const url = new URL(req.url);

  // 1) App Router params
  const raw = context?.params?.path;
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // 2) pathname 보완
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

    // 3xx를 받은 경우: Location이 http://realkimp.com/* 이면 https로 정규화해 재시도
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location") || "";
      if (/^http:\/\/realkimp\.com\//i.test(loc)) {
        const httpsUrl = loc.replace(/^http:\/\//i, "https://");
        r = await fetch(httpsUrl, {
          method: "GET",
          headers: safeUpstreamHeaders(req, tail),
          cache: "no-store",
          redirect: "follow",
        });
      } else {
        // 그 외 3xx는 다음 후보로 진행
        continue;
      }
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
      out.delete("set-cookie"); // 안전 차단
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(r.body, { status: 200, headers: out });
    }

    // 본문이 JSON처럼 보이면 그대로 전달
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

    // Cloudflare 챌린지/차단 → 외부로는 절대 리다이렉트하지 않음
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

    // 비-JSON 응답/오류는 설명 JSON으로 통일
    if (r.status >= 300 || !r.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: r.status,
          contentType: ct.slice(0, 120),
          tried,
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
