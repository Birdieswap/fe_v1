
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest, // or Request
  ctx: { params: Record<string, string | string[]> } 
) {
  // `[...path]` → ctx.params.path 가 string|string[] | undefined 일 수 있으므로 정규화
  const raw = ctx.params?.path;
  const segs = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const endpoint = strip(segs.join("/"));

  const incoming = new URL(req.url);

  // 1) 1차 요청
  const u1 = new URL(`${UPSTREAM}/${endpoint}`);
  u1.search = incoming.search;

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual", // 클라이언트로 3xx 내보내지 않기
    headers: { accept: "application/json" },
  });

  // 2) 3xx면 서버에서 직접 따라가기 (https 강제 + 슬래시 정규화)
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const u2 = new URL(loc, UPSTREAM);
      if (u2.protocol === "http:") u2.protocol = "https:";
      u2.pathname = strip(u2.pathname);
      r = await fetch(u2.toString(), {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        headers: { accept: "application/json" },
      });
    }
  }

  // 원본 상태 코드를 유지하는 편이 좋습니다(200 강제 X)
  const buf = await r.arrayBuffer();
  const res = new NextResponse(buf, { status: r.status });

  // content-type 등 필요한 헤더를 전달
  const ct = r.headers.get("content-type") || "application/json";
  res.headers.set("content-type", ct);

  return res;
}
