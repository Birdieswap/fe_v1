// src/app/api/realkimp/[...path]/route.ts
import { NextResponse } from "next/server";

const UPSTREAM = "https://realkimp.com/birdieswap";
const strip = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const endpoint = strip((params?.path ?? []).join("/"));  // "Transactions" 등
  const incoming = new URL(req.url);
  console.log("[realkimp] hit:", endpoint, incoming.search);
  // 1) 1차 요청
  const u1 = new URL(`${UPSTREAM}/${endpoint}`);
  u1.search = incoming.search;

  let r = await fetch(u1.toString(), {
    method: "GET",
    cache: "no-store",
    redirect: "manual",             // ★ 클라이언트로 리다이렉트 내보내지 않기
    headers: { accept: "application/json" },
  });

  // 2) 3xx면 서버에서 직접 따라가기 (https 강제 + 슬래시 정규화)
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const u2 = new URL(loc, UPSTREAM);   // 상대일 수도 있으니 base 지정
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
 

  const buf = await r.arrayBuffer();
  // 최종은 200으로 전달(필요시 r.status 유지해도 무방)
  const res = new NextResponse(buf, { status: 200 });
  res.headers.set("content-type", r.headers.get("content-type") || "application/json");
  return res;
}
