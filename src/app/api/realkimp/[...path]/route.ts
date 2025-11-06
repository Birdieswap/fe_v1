// src/app/api/realkimp/[...path]/route.ts
import { NextResponse } from "next/server";
import { pickProxyResponseHeaders } from "@/utils/proxy";
import { withTimeout } from "@/utils/timeout";

const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

// 업스트림 우선순위
const UPSTREAMS = ["https://realkimp.com/birdieswap"];

// 🔁 데모용 CORS 프록시 (환경변수로 교체 가능)
const CORS_PROXY =
  (process.env.NEXT_PUBLIC_CORS_PROXY ?? "").trim() ||
  "https://cors.isomorphic-git.org/";

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

  // 브라우저스러운 기본 헤더
  h.set(
    "user-agent",
    req.headers.get("user-agent") ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  h.set("accept", "application/json, text/plain, */*");
  h.set("accept-language", "en-US,en;q=0.9,ko;q=0.8");
  h.set("accept-encoding", "gzip, deflate, br");
  h.set("pragma", "no-cache");
  h.set("cache-control", "no-cache");

  // 🔸 이 엔드포인트들은 CF가 Origin/Referer를 강하게 본다고 가정
  const needsHumanLike =
    /^(currentuserpoints|transactions|apr\/|consent(\/|$)|points?)/i.test(tail);

  if (needsHumanLike) {
    // ❗️업스트림 기준으로 Origin/Referer를 'realkimp.com'로 통일
    h.set("origin", "https://realkimp.com");
    h.set(
      "referer",
      `https://realkimp.com/birdieswap/${tail.replace(/\/+$/, "")}/`
    );

    // 쿠키는 원칙적으로 제거(서버→업스트림 전달 불필요/위험)
    h.delete("cookie");
  } else {
    h.delete("cookie");
  }

  // 원 IP 전달(가능하면)
  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  h.set("x-forwarded-proto", "https");
  // ❌ 이 값은 제거 (호스트를 강제로 바꾸면 CF가 더 의심)
  h.delete("x-forwarded-host");

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
  try {
    const url = new URL(req.url);
    const raw = context?.params?.path;
    const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
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

    const m = tail.match(/^(\d+)(?:\.json)?$/);
    const id = m ? m[1] : null;

    // 🔥 후보 URL: .json 우선 + CORS 프록시 후보까지
    const candidates = Array.from(
      new Set(
        UPSTREAMS.flatMap((base) => {
          const arr: string[] = [];

          // 항상 트레일링 슬래시 우선
          arr.push(`${base}/${tail}/`);

          // 그 다음 확장자 없는 원본
          arr.push(`${base}/${tail}`);

          // 마지막으로 .json
          arr.push(`${base}/${tail}.json`);

          // 숫자 id 케이스도 동일 우선순위로
          if (id) {
            arr.push(`${base}/${id}/`);
            arr.push(`${base}/${id}`);
            arr.push(`${base}/${id}.json`);
            arr.push(`${base}/chains/${id}.json`);
          }

          return arr;
        })
      )
    );

    const tried: string[] = [];

    for (const baseUrl of candidates) {
      const u = new URL(baseUrl);
      u.search = url.search;
      tried.push(u.toString());

      let r = await withTimeout(8_000, (signal) =>
        fetch(u, {
          method: "GET",
          headers: safeUpstreamHeaders(req, tail),
          cache: "no-store",
          redirect: "follow",
          signal,
        })
      ).catch((e) => new Response(String(e), { status: 502 }));

      // http → https 정규화
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

      // 3xx → 다음 후보
      if (r.status >= 300 && r.status < 400) continue;

      const ct = r.headers.get("content-type") || "";
      const text = await r
        .clone()
        .text()
        .catch(() => "");

      // CF 챌린지면 다음 후보
      if (looksLikeCFChallenge(r.status, text)) continue;

      // JSON 패스스루
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

      // 실패 → 다음 후보
      if (r.status >= 300 || !r.ok) continue;
    }

    return NextResponse.json(
      {
        ok: false,
        status: 502,
        reason: "upstream_error_or_cloudflare_challenge",
        tried,
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
