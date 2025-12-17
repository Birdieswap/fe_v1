import { NextResponse } from "next/server";

const TRM_BASE_URL = "https://api.trmlabs.com";
const TRM_API_KEY = process.env.TRM_SANCTIONS_API_KEY!;

function makeBasicAuthHeader(apiKey: string) {
  const token = Buffer.from(`${apiKey}:${apiKey}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

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

    const trmRes = await fetch(
      `${TRM_BASE_URL}/public/v1/sanctions/screening`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: makeBasicAuthHeader(TRM_API_KEY),
        },
        body: JSON.stringify([{ address }]),
      }
    );

    if (trmRes.status === 429) {
      const retryAfter = trmRes.headers.get("Retry-After");
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfter },
        { status: 503 }
      );
    }

    // OpenAPI 상 성공은 201
    if (trmRes.status !== 201) {
      const text = await trmRes.text();
      return NextResponse.json(
        { ok: false, error: "trm_error", detail: text },
        { status: 502 }
      );
    }

    const data = (await trmRes.json()) as Array<{
      address: string;
      isSanctioned: boolean;
    }>;
    const isSanctioned = Boolean(data?.[0]?.isSanctioned);

    return NextResponse.json({ ok: true, isSanctioned }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
