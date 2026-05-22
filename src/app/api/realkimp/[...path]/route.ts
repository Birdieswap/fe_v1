
import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // '/api/realkimp/' 이후의 경로 부분을 직접 추출
  const base = "/api/realkimp/";
  const idx = url.pathname.indexOf(base);
  const tail = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
  const endpoint = strip(tail);

  // 1) 1차 요청
  const u1 = new URL(`${UPSTREAM}/${endpoint}`);
  u1.search = url.search;

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual",           // 클라이언트에 3xx를 그대로 내보내지 않음
    headers: { accept: "application/json" },
  });

  // 2) 3xx면 서버에서 직접 따라가기 (https 강제 + 슬래시 정규화)
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const u2 = new URL(loc, UPSTREAM);    // 상대 경로 대비
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

  // 스트림 그대로 전달 + 원본 status/콘텐츠 타입 유지
  return new NextResponse(r.body, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
