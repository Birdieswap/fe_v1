import { NextResponse } from "next/server";
import { buildUpstreamHeaders, pickProxyResponseHeaders } from "@/utils/proxy";
import { withTimeout } from "@/utils/timeout";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const tail = strip((params.path || []).join("/"));
  if (!tail) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }

  // 숫자 id 감지 (예: "1" 또는 "1.json")
  const m = tail.match(/^(\d+)(?:\.json)?$/);
  const id = m ? m[1] : null;

  // 1) 후보 URL들 구성 (중복 제거)
  const candidates = Array.from(
    new Set(
      [
        // 그대로 시도
        `${UPSTREAM}/${tail}`,
        // tail이 .json이 아니면 .json 붙여 시도
        !tail.endsWith(".json") ? `${UPSTREAM}/${tail}.json` : null,
        // 숫자 id면 패턴 몇 개 추가 시도
        id ? `${UPSTREAM}/${id}.json` : null,
        id ? `${UPSTREAM}/${id}` : null,
        id ? `${UPSTREAM}/chains/${id}.json` : null,
      ].filter(Boolean) as string[]
    )
  );

  // 쿼리 문자열 유지
  const original = new URL(req.url);
  const tried: string[] = [];
  let lastResp: Response | null = null;

  for (const base of candidates) {
    const u = new URL(base);
    u.search = original.search; // ?query 그대로

    tried.push(u.toString());

    const r = await withTimeout(10_000, (signal) =>
      fetch(u.toString(), {
        method: "GET",
        headers: buildUpstreamHeaders(req),
        cache: "no-store",
        redirect: "follow",
        signal,
      })
    ).catch((e) => new Response(String(e), { status: 502 }));

    // JSON이라고 확신할 수 있는지 가벼운 체크
    const ct = r.headers.get("content-type") || "";
    const looksJson =
      ct.includes("application/json") || u.pathname.endsWith(".json");

    if (r.ok && r.body && looksJson) {
      const headers = pickProxyResponseHeaders(r);
      headers.set("cache-control", "no-store, max-age=0");
      headers.set("x-upstream-url", u.toString());
      headers.set("x-upstream-ms", r.headers.get("x-upstream-ms") ?? ""); // 있으면 보존
      headers.set("x-upstream-tried", tried.join(" | "));
      return new NextResponse(r.body, { status: r.status, headers });
    }

    // 실패 응답 저장해두고 다음 후보 시도
    lastResp = r;
  }

  // 전부 실패: 마지막 응답을 그대로 전달 + 디버그 헤더
  const body = lastResp
    ? await lastResp.text().catch(() => "")
    : "upstream error";
  const h = new Headers();
  h.set("content-type", lastResp?.headers.get("content-type") ?? "text/plain");
  h.set("x-upstream-tried", tried.join(" | "));
  return new NextResponse(body || "upstream error", {
    status: lastResp?.status || 502,
    headers: h,
  });
}
