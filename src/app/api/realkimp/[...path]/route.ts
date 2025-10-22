import { NextResponse } from "next/server";
import { pickProxyResponseHeaders } from "@/utils/proxy";
import { withTimeout } from "@/utils/timeout";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 업스트림으로 안전하게 전달할 헤더 구성 */
function safeUpstreamHeaders(req: Request) {
  const h = new Headers();
  h.set("accept", "application/json, text/plain, */*");
  h.set("user-agent", req.headers.get("user-agent") ?? "BirdieswapProxy/1.0");

  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  h.set("accept-encoding", "identity");

  // 오리진 민감/불필요 헤더 제거
  h.delete("host");
  h.delete("origin");
  h.delete("referer");
  h.delete("cookie");
  h.delete("authorization");
  return h;
}

// ⬇️ context를 any로 받아 타입 에러 회피 + 런타임 params 사용
export async function GET(req: Request, context?: any) {
  const url = new URL(req.url);

  // 1) 우선 App Router가 준 params.path를 사용
  const raw = context?.params?.path;
  const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // 2) 없으면 pathname에서 보완 슬라이스
  let tail = strip(parts.join("/"));
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
        headers: safeUpstreamHeaders(req),
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
