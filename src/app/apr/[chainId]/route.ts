
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { chainId: string } }) {
  const id = Number(params.chainId);

  // // 기본 유효성 체크
  // if (!Number.isInteger(id) || id <= 0) {
  //   return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
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
