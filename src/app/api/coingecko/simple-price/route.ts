import { NextResponse } from "next/server";

const CG_BASE_URL = "https://api.coingecko.com";
const CG_DEMO_KEY =
  process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY ??
  "CG-WFEWBPHnW6QKi3rk8zLrRSDs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vs = url.searchParams.get("vs_currencies") ?? "usd";
    const symbols = url.searchParams.get("symbols") ?? "";

    const qs = new URLSearchParams({
      vs_currencies: vs,
      symbols,
    });

    const cgRes = await fetch(
      `${CG_BASE_URL}/api/v3/simple/price?${qs.toString()}`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": CG_DEMO_KEY,
        },
        cache: "no-store",
      }
    );

    if (cgRes.status === 429) {
      const retryAfter = cgRes.headers.get("Retry-After");
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfter },
        { status: 503 }
      );
    }

    if (!cgRes.ok) {
      const text = await cgRes.text();
      return NextResponse.json(
        { ok: false, error: "coingecko_error", detail: text },
        { status: 502 }
      );
    }

    const data = await cgRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
