import { NextResponse } from "next/server";

const CHAINALYSIS_BASE_URL = "https://public.chainalysis.com";
const CHAINALYSIS_API_KEY = process.env.CHAINALYSIS_SANCTIONS_API_KEY!;

function isHexAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function POST(req: Request) {
  try {
    const { address } = (await req.json()) as { address?: string };
    if (!address || !isHexAddress(address)) {
      return NextResponse.json(
        { ok: false, error: "invalid_address" },
        { status: 400 }
      );
    }

    const chainalysisRes = await fetch(
      `${CHAINALYSIS_BASE_URL}/api/v1/address/${address}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": CHAINALYSIS_API_KEY,
        },
      }
    );

    if (chainalysisRes.status === 429) {
      const retryAfter = chainalysisRes.headers.get("Retry-After");
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfter },
        { status: 503 }
      );
    }

    if (!chainalysisRes.ok) {
      const text = await chainalysisRes.text();
      return NextResponse.json(
        { ok: false, error: "chainalysis_error", detail: text },
        { status: 502 }
      );
    }

    const data = (await chainalysisRes.json()) as {
      identifications?: Array<unknown>;
    };
    const identifications = data?.identifications ?? [];
    const isSanctioned = identifications.length > 0;

    const includeRaw = (process.env.NEXT_PUBLIC_DEBUG ?? "0") === "1";
    return NextResponse.json(
      includeRaw ? { ok: true, isSanctioned, raw: data } : { ok: true, isSanctioned },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
