import { NextResponse } from "next/server";
import { pickProxyResponseHeaders } from "@/utils/proxy"; // buildUpstreamHeaders는 쓰지 않음
import { withTimeout } from "@/utils/timeout";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 업스트림으로 안전하게 전달할 헤더 구성 */
function safeUpstreamHeaders(req: Request) {
  const h = new Headers();

  // 최소 필수 헤더만
  h.set("accept", "application/json, text/plain, */*");
  h.set("user-agent", req.headers.get("user-agent") ?? "BirdieswapProxy/1.0");

  // 프록시 체인 정보(선택)
  const fwdFor =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "";
  if (fwdFor) h.set("x-forwarded-for", fwdFor);

  // 전송 중 압축 해제/재압축 꼬임 방지
  h.set("accept-encoding", "identity");

  // vhost/오리진에 민감한 헤더는 제거
  h.delete("host");
  h.delete("origin");
  h.delete("referer");
  h.delete("cookie");
  h.delete("authorization"); // 필요 시에만 별도 세팅

  return h;
}

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const tail = strip((params.path || []).join("/"));
  if (!tail) {
    return NextResponse.json(
      { ok: false, error: "missing endpoint" },
      { status: 200 }
    );
  }

  // 숫자 id 감지 (예: "1" 또는 "1.json")
  const m = tail.match(/^(\d+)(?:\.json)?$/);
  const id = m ? m[1] : null;

  // 시도할 후보 URL들
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

  const original = new URL(req.url);
  const tried: string[] = [];
  let lastResp: Response | null = null;

  for (const base of candidates) {
    const u = new URL(base);
    u.search = original.search; // 쿼리 그대로 유지
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

    // 1) 스트리밍으로 JSON 확신되면 바로 패스
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

    // 2) 본문 스니핑으로 JSON 보정
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
      // body 읽기 실패 시 다음 후보
    }

    lastResp = r;
  }

  // 3) 모두 실패 → 항상 200 JSON으로 래핑하여 반환 (프론트 res.json() 안정)
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
