// app/apr/[chainId]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: { chainId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const chainIdStr = params.chainId;
  const id = Number(chainIdStr);

  // 기본 유효성 체크
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
  }

  // (선택) 허용 네트워크 화이트리스트
  // const ALLOWED = new Set(["8453", "42161", "11155111"]);
  // if (!ALLOWED.has(chainIdStr)) {
  //   return NextResponse.json({ error: "Unsupported chainId" }, { status: 400 });
  // }

  const upstreamUrl = `https://realkimp.com/birdieswap/${id}.json`;

  const upstreamRes = await fetch(upstreamUrl, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    headers: { accept: "application/json" },
  });

  // 업스트림 실패 시 상태 그대로 전달
  if (!upstreamRes.ok) {
    return NextResponse.json(
      { error: "Upstream fetch failed", statusText: upstreamRes.statusText },
      { status: upstreamRes.status },
    );
  }

  // 바디/헤더 프록시
  const body = await upstreamRes.arrayBuffer();
  const res = new NextResponse(body, { status: upstreamRes.status });
  res.headers.set(
    "content-type",
    upstreamRes.headers.get("content-type") || "application/json",
  );
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}
