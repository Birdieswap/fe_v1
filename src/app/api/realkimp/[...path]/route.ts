import { NextResponse } from "next/server";
import { pickProxyResponseHeaders } from "@/utils/proxy";
import { withTimeout } from "@/utils/timeout";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

/** 업스트림으로 안전하게 전달할 헤더 구성 (Consent 계열은 쿠키/오리진 보존) */
function safeUpstreamHeaders(req: Request, tail: string) {
  const h = new Headers();

  // 공통
  h.set("accept", "application/json, text/plain, */*");
  h.set("user-agent", req.headers.get("user-agent") ?? "BirdieswapProxy/1.0");
  h.set("accept-encoding", "identity");
  const acceptLang = req.headers.get("accept-language");
  if (acceptLang) h.set("accept-language", acceptLang);

  // 원격 IP/프로토콜 전달
  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) h.set("x-forwarded-proto", proto);

  // 기본적으로 민감 헤더 제거
  h.delete("host");
  h.delete("origin");
  h.delete("referer");
  h.delete("cookie");
  h.delete("authorization");

  // ✅ Consent/* 경로는 Cloudflare 통과에 쿠키/오리진 필요할 수 있어 보존
  const isConsentPath = /^consent(\/|$)/i.test(tail);
  if (isConsentPath) {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const cookie = req.headers.get("cookie"); // cf_clearance 등
    if (origin) h.set("origin", origin);
    if (referer) h.set("referer", referer);
    if (cookie) h.set("cookie", cookie);
  }

  return h;
}

// ⬇️ context를 any로 받아 타입 에러 회피 + 런타임 params 사용
export async function GET(req: Request, context?: any) {
  const url = new URL(req.url);

  // 1) App Router params 우선
  const raw = context?.params?.path;
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // 2) pathname에서 보완 슬라이스
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

  // 숫자 id 감지 (예: "1" 또는 "1.json")
  const m = tail.match(/^(\d+)(?:\.json)?$/);
  const id = m ? m[1] : null;

  const candidates = Array.from(
    new Set(
      [
        `${UPSTREAM}/${tail}`,
        !tail.endsWith(".json") ? `${UPSTREAM}/${tail}.json` : null,
        id ? `${UPSTREAM}/${id}.json` : null,
        id ? `${UPSTREAM}/${id}` : null,
        id ? `${UPSTREAM}/chains/${id}.json` : null,
      ].filter(Boolean) as string[]
    )
  );

  const tried: string[] = [];
  let lastResp: Response | null = null;

  for (const baseUrl of candidates) {
    const u = new URL(baseUrl);
    u.search = url.search; // 쿼리 그대로 유지
    tried.push(u.toString());

    const r = await withTimeout(12_000, (signal) =>
      fetch(u, {
        method: "GET",
        headers: safeUpstreamHeaders(req, tail), // ✅ tail 전달
        cache: "no-store",
        redirect: "follow",
        signal,
      })
    ).catch((e) => new Response(String(e), { status: 502 }));

    const ct = r.headers.get("content-type") || "";
    const looksJsonByCT =
      ct.includes("application/json") || u.pathname.endsWith(".json");

    // 1) 스트림 패스스루
    if (r.ok && r.body && looksJsonByCT) {
      const out = pickProxyResponseHeaders(r);
      out.delete("content-encoding");
      out.delete("transfer-encoding");
      out.delete("content-length");
      out.set("cache-control", "no-store, max-age=0");
      out.set("content-type", "application/json; charset=utf-8");
      out.set("x-upstream-url", u.toString());
      out.set("x-upstream-tried", tried.join(" | "));

      // ✅ Set-Cookie 전달 (환경에 따라 getSetCookie가 없을 수 있어 fallback)
      const getSetCookie = (r.headers as any).getSetCookie?.bind(r.headers) as
        | (() => string[])
        | undefined;
      const setCookies: string[] = getSetCookie ? getSetCookie() : [];
      for (const sc of setCookies) out.append("set-cookie", sc);

      return new NextResponse(r.body, { status: 200, headers: out });
    }

    // 2) 본문 스니핑
    try {
      const text = await r.clone().text();
      const looksJsonByBody = /^[\s\r\n]*[\{\[]/.test(text);
      if (r.ok && looksJsonByBody) {
        const out = pickProxyResponseHeaders(r);
        out.delete("content-encoding");
        out.delete("transfer-encoding");
        out.delete("content-length");
        out.set("cache-control", "no-store, max-age=0");
        out.set("content-type", "application/json; charset=utf-8");
        out.set("x-upstream-url", u.toString());
        out.set("x-upstream-tried", tried.join(" | "));

        const getSetCookie = (r.headers as any).getSetCookie?.bind(
          r.headers
        ) as (() => string[]) | undefined;
        const setCookies: string[] = getSetCookie ? getSetCookie() : [];
        for (const sc of setCookies) out.append("set-cookie", sc);

        return new NextResponse(text, { status: 200, headers: out });
      }
    } catch {
      // ignore and try next
    }

    lastResp = r;
  }

  if (lastResp) {
    const text = await lastResp.text().catch(() => "");
    return NextResponse.json(
      {
        ok: false,
        status: lastResp.status,
        tried,
        bodyPreview: text.slice(0, 2000),
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { ok: false, error: "upstream error", tried },
    { status: 200 }
  );
}
