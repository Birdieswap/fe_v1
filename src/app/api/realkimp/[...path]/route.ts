
import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // '/api/realkimp/' 이후의 경로 부분을 직접 추출
  const base = "/api/realkimp/";
  const idx = url.pathname.indexOf(base);
  const after = idx >= 0 ? url.pathname.slice(idx + base.length) : "";
  const endpoint = strip(after); // "Transactions" 같은 세그먼트 조합

  // 1) 1차 요청
  const u1 = new URL(`${UPSTREAM}/${endpoint}`);
  u1.search = url.search;

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual", // 클라이언트로 3xx 노출하지 않음
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

  // 스트림 그대로 전달(대용량에서 메모리 효율 ↑)
  const res = new NextResponse(r.body, { status: r.status });
  res.headers.set("content-type", r.headers.get("content-type") ?? "application/json");
  return res;
}
