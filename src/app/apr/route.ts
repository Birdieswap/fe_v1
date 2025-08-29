// app/apr/route.ts
import { NextResponse } from "next/server";

const APR_URL = "https://realkimp.com/birdieswap/apr.json";
export const dynamic = "force-dynamic";

export async function GET() {
  const upstreamRes = await fetch(APR_URL, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    headers: { accept: "application/json" },
  });

  const body = await upstreamRes.arrayBuffer();
  const res = new NextResponse(body, { status: upstreamRes.status });
  res.headers.set("content-type", upstreamRes.headers.get("content-type") || "application/json");
  return res;
}
