// app/api/coingecko/usd/route.ts
import { NextResponse } from "next/server";

type CacheEntry = { usd: number | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();

const TTL =
  Number(process.env.NEXT_PUBLIC_COINGECKO_TTL_SECONDS ?? "60") * 1000;
const SYMBOL_RE = /^[a-z0-9-]{1,32}$/;
const EVM_ADDRESS_RE = /^0x[a-f0-9]{40}$/;

function getPlan() {
  const plan = (process.env.NEXT_PUBLIC_COINGECKO_PLAN ?? "none").toLowerCase();
  if (plan === "pro") return "pro";
  if (plan === "demo") return "demo";
  return "none";
}

function getCgBaseUrl(plan: "pro" | "demo" | "none") {
  // pro base url
  if (plan === "pro") return new URL("https://pro-api.coingecko.com/api/v3/");
  // demo/free base url
  return new URL("https://api.coingecko.com/api/v3/");
}

function getHeaders(plan: "pro" | "demo" | "none") {
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (plan === "pro") {
    const key = process.env.NEXT_PUBLIC_COINGECKO_PRO_API_KEY;
    if (key) headers["x-cg-pro-api-key"] = key; // :contentReference[oaicite:3]{index=3}
  } else if (plan === "demo") {
    const key = process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY;
    if (key) headers["x-cg-demo-api-key"] = key; // :contentReference[oaicite:4]{index=4}
  }

  return headers;
}

// 필요한 체인만 우선 매핑 (추가 가능)
function chainIdToCgPlatform(chainId: number): string | null {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 8453:
      return "base";
    case 9998453:
      return "base";
    case 42161:
      return "arbitrum-one";
    case 10:
      return "optimistic-ethereum";
    case 137:
      return "polygon-pos";
    case 56:
      return "binance-smart-chain";
    // testnet류는 CoinGecko 커버가 애매해서 null 처리 권장
    // case 11155111: return "ethereum"; // sepolia는 보통
    default:
      return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsRaw = searchParams.get("symbols");
  const chainIdRaw = searchParams.get("chainId");
  const addressRaw = searchParams.get("address");

  if (symbolsRaw) {
    const symbol = symbolsRaw.split(",")[0]?.trim().toLowerCase();
    if (!symbol || !SYMBOL_RE.test(symbol)) {
      return NextResponse.json(
        { usd: null, reason: "bad_request" },
        { status: 400 }
      );
    }

    const key = `symbol:${symbol}`;
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now && cached.usd != null) {
      return NextResponse.json({ usd: cached.usd, cached: true, symbol });
    }

    const plan = getPlan();
    const baseUrl = getCgBaseUrl(plan);
    const headers = getHeaders(plan);

    const target = new URL("simple/price", baseUrl);
    target.searchParams.set("vs_currencies", "usd");
    target.searchParams.set("symbols", symbol);

    try {
      const res = await fetch(target.toString(), { headers, cache: "no-store" });
      const status = res.status;
      let usd: number | null = null;

      if (res.ok) {
        const json = await res.json();
        const dataKeys = Object.keys(json ?? {});
        const direct =
          json?.[symbol] ??
          (dataKeys.find((k) => k.toLowerCase() === symbol)
            ? json?.[
                dataKeys.find((k) => k.toLowerCase() === symbol) as string
              ]
            : null);
        const rawUsd = Number(direct?.usd);
        usd = Number.isFinite(rawUsd) ? rawUsd : null;
      }

      const finalUsd = Number.isFinite(usd) ? usd : null;
      cache.set(key, { usd: finalUsd, expiresAt: now + TTL });
      return NextResponse.json({
        usd: finalUsd,
        ok: finalUsd != null,
        status,
        symbol,
      });
    } catch {
      cache.set(key, { usd: null, expiresAt: now + TTL });
      return NextResponse.json({ usd: null, ok: false, symbol });
    }
  }

  const chainId = Number(chainIdRaw);
  const address = (addressRaw ?? "").toLowerCase();

  if (
    !chainIdRaw ||
    !Number.isInteger(chainId) ||
    chainId <= 0 ||
    !EVM_ADDRESS_RE.test(address)
  ) {
    return NextResponse.json(
      { usd: null, reason: "bad_request" },
      { status: 400 }
    );
  }

  const platform = chainIdToCgPlatform(chainId);
  console.log("[coingecko.usd] request", {
    chainId,
    address,
    platform,
  });
  if (!platform) {
    return NextResponse.json({ usd: null, reason: "unsupported_chain" });
  }

  const key = `${platform}:${address}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now && cached.usd != null) {
    return NextResponse.json({ usd: cached.usd, cached: true, platform });
  }

  // native ETH 같은 경우는 여기로 안 보내는 걸 추천 (Chainlink로 처리)
  // 하지만 혹시 들어오면 그냥 null 반환
  if (address === "0x0000000000000000000000000000000000000000") {
    cache.set(key, { usd: null, expiresAt: now + TTL });
    return NextResponse.json({ usd: null, reason: "zero_address", platform });
  }

  const plan = getPlan();
  const baseUrl = getCgBaseUrl(plan);
  const headers = getHeaders(plan);

  // Coin data by token contract address endpoint (price 포함)
  const tokenDataUrl = new URL(
    `coins/${platform}/contract/${address}`,
    baseUrl
  ).toString();
  // Onchain simple price endpoint (fallback)
  const onchainUrl = new URL(
    `onchain/simple/networks/${platform}/token_price/${address}`,
    baseUrl
  ).toString();

  console.log("[coingecko usd] fetching", { tokenDataUrl, onchainUrl, plan });

  try {
    const res = await fetch(tokenDataUrl, { headers, cache: "no-store" });
    let usd: number | null = null;
    let status = res.status;

    if (res.ok) {
      const json = await res.json();
      const primaryUsd = Number(json?.market_data?.current_price?.usd);
      usd = Number.isFinite(primaryUsd) ? primaryUsd : null;
    }

    // fallback: onchain simple price
    if (usd == null) {
      const res2 = await fetch(onchainUrl, { headers, cache: "no-store" });
      status = res2.status;
      if (res2.ok) {
        const json2 = await res2.json();
        const raw =
          json2?.data?.attributes?.token_prices?.[address?.toLowerCase?.()] ??
          json2?.data?.attributes?.token_prices?.[address];
        const fallbackUsd = Number(raw);
        usd = Number.isFinite(fallbackUsd) ? fallbackUsd : null;
      }
    }

    const finalUsd = Number.isFinite(usd) ? usd : null;
    cache.set(key, { usd: finalUsd, expiresAt: now + TTL });

    return NextResponse.json({
      usd: finalUsd,
      ok: finalUsd != null,
      status,
      platform,
    });
  } catch {
    cache.set(key, { usd: null, expiresAt: now + TTL });
    return NextResponse.json({ usd: null, ok: false, platform });
  }
}
