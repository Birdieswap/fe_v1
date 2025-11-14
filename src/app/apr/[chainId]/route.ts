import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const { pathname } = new URL(_req.url);
  const segments = pathname.replace(/\/$/, "").split("/");
  const chainIdStr = segments[segments.length - 1] || "";
  const id = Number(chainIdStr);
  console.log("APR fetch chainIdStr", chainIdStr);

  // // 기본 유효성 체크
  // if (!Number.isInteger(id) || id <= 0) {
  //   return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
  // }

  const upstreamUrl = `https://realkimp.com/birdieswap/${id}.json`;

  // const upstreamRes = await fetch(upstreamUrl, {
  //   method: "GET",
  //   cache: "no-store",
  //   redirect: "follow",
  //   headers: { accept: "application/json" },
  // });
  const upstreamRes = await fetch(upstreamUrl, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    headers: {
      accept:
        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7",
      // 적당히 최신 크롬 UA 비슷하게
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      // 선택: referer를 호스트 도메인 비슷하게 주기
      referer: "https://realkimp.com/",
    },
  });

  // 업스트림 실패 시 상태 그대로 전달
  if (!upstreamRes.ok) {
    const text = await upstreamRes.text().catch(() => "");
    return NextResponse.json(
      {
        error: "Upstream fetch failed",
        statusText: upstreamRes.statusText,
        upstreamStatus: upstreamRes.status,
        upstreamBody: text,
      },
      { status: upstreamRes.status }
    );
  }

  // 바디/헤더 프록시
  const body = await upstreamRes.arrayBuffer();
  const res = new NextResponse(body, { status: upstreamRes.status });
  res.headers.set(
    "content-type",
    upstreamRes.headers.get("content-type") || "application/json"
  );
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}
