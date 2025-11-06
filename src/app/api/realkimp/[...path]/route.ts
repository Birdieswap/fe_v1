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

/* ────────────────── Helpers ────────────────── */

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
    // Cloudflare가 기대하는 fetch 계열 힌트
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "sec-fetch-site": "cross-site",
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

// ⚠️ 업스트림 URL(u)에 맞춰 Origin/Referer를 세팅하도록 변경
function buildUpstreamHeaders(req: Request, tail: string, u: URL) {
  const h = new Headers();
  const bl = browserLikeHeaders(req.headers.get("user-agent") || undefined);
  Object.entries(bl).forEach(([k, v]) => h.set(k, v as string));

  // dev/prod 모두 공통: 업스트림 기준으로 origin/referrer 설정
  h.set("origin", u.origin);
  h.set("referer", `${u.origin}/`);

  // 쿠키 전달: Transactions 등은 세션/쿠키가 필요할 수 있으므로 전달 시도
  // (동일오리진 프록시 호출이므로 클라 fetch에서 credentials: 'same-origin' 이어야 쿠키가 도착)
  const needsHumanLike =
    /^(currentuserpoints|transactions|apr\/|consent(\/|$)|points?)/i.test(tail);
  const cookie = req.headers.get("cookie");
  if (needsHumanLike && cookie) {
    h.set("cookie", cookie);
  }

  // 원 IP (best-effort)
  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  h.set("x-forwarded-proto", "https");
  // ❌ CF 판단을 꼬이게 할 수 있으므로 금지
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

/* ────────────────── Route ────────────────── */

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

  // id 감지
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
        headers: buildUpstreamHeaders(req, tail, u), // ← 업스트림 기준 헤더
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
          headers: buildUpstreamHeaders(req, tail, new URL(httpsUrl)),
          cache: "no-store",
          redirect: "follow",
        });
      }
    } catch {}

    // 3xx http→https 정규화
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location") || "";
      if (/^http:\/\/realkimp\.com\//i.test(loc)) {
        const httpsUrl = loc.replace(/^http:\/\//i, "https://");
        r = await fetch(httpsUrl, {
          method: "GET",
          headers: buildUpstreamHeaders(req, tail, new URL(httpsUrl)),
          cache: "no-store",
          redirect: "follow",
        });
      } else {
        // 다른 3xx면 다음 후보 시도
        continue;
      }
    }

    const ct = r.headers.get("content-type") || "";
    const text = await r
      .clone()
      .text()
      .catch(() => "");

    // ✅ CF 챌린지면 "즉시 종료"하지 말고 **다음 후보로 폴백**
    if (looksLikeCFChallenge(r.status, text)) {
      // console.warn("CF challenge on", u.toString());
      continue;
    }

    // JSON 스트림 패스스루
    if (
      r.ok &&
      (ct.includes("application/json") || u.pathname.endsWith(".json"))
    ) {
      const out = pickProxyResponseHeaders(r);
      out.delete("content-encoding");
      out.delete("transfer-encoding");
      out.delete("content-length");
      out.delete("set-cookie");
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(r.body, { status: 200, headers: out });
    }

    // 본문이 JSON처럼 보이면 그대로 전달
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

    // 오류는 설명 JSON
    if (r.status >= 300 || !r.ok) {
      // 다음 후보도 남아있으면 계속 시도
      continue;
    }
  }

  // 모든 후보 실패(혹은 CF 챌린지)
  return NextResponse.json(
    {
      ok: false,
      status: 502,
      reason: "upstream_error_or_cloudflare_challenge",
      tried: ORIGINS.map(
        (b) =>
          `${b}/${strip(new URL(req.url).pathname.split("/api/realkimp/")[1] || "")}`
      ),
    },
    { status: 502 }
  );
}
