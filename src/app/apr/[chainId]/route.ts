import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const { pathname } = new URL(_req.url);
  const segments = pathname.replace(/\/$/, "").split("/");
  const chainIdStr = segments[segments.length - 1] || "";
  const id = Number(chainIdStr);
  console.log("[APR] chainIdStr:", chainIdStr, "id:", id);

  // // 기본 유효성 체크
  // if (!Number.isInteger(id) || id <= 0) {
  //   return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
  // }

  const upstreamUrl = `https://api.birdieswap.com/${id}.json`;

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
      // 브라우저 비슷한 Accept
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
      // 한국/영어 혼합
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      // 최신 크롬 비슷한 UA (bot 티 안 나게)
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      // 일반 브라우저가 넣는 헤더들
      "cache-control": "no-cache",
      "upgrade-insecure-requests": "1",
      pragma: "no-cache",
      // 때에 따라 도움 될 수도 있는 참조자
      referer: "https://api.birdieswap.com/",
    },
  });

  // 업스트림 실패 시 상태 그대로 전달
  if (!upstreamRes.ok) {
    // 디버깅을 위해 Cloudflare 페이지/본문 로그 찍기 (서버 로그에서만 확인)
    const text = await upstreamRes.text().catch(() => "");
    console.error(
      "[APR] upstream failed",
      upstreamRes.status,
      upstreamRes.statusText,
      "| url:",
      upstreamUrl,
      "| body snippet:",
      text.slice(0, 300)
    );

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
