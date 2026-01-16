import { BigDecimal } from "@/types/BigDecimal";
import { ADDRESS } from "@/const/contracts/contractAddresses";
import {
  getFromContracts,
  isHexAddress,
  isZeroAddress,
  toLower,
} from "@/utils/farm/getAddressHelpers";

const COINGECKO_CACHE_MS = 60_000;
const coingeckoCache = new Map<
  string,
  {
    ts: number;
    price: BigDecimal | null;
    inflight?: Promise<BigDecimal | null>;
  }
>();
const coingeckoSymbolCache = new Map<
  string,
  {
    ts: number;
    price: BigDecimal | null;
    inflight?: Promise<BigDecimal | null>;
  }
>();

export function normalizeCoingeckoAddress(
  address: string | null,
  chainId?: number
): string | null {
  if (!address || !chainId) return null;
  const lower = toLower(address);
  if (!lower) return null;
  if (
    isZeroAddress(lower) ||
    lower === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  ) {
    const weth = getFromContracts(ADDRESS.WETH, chainId);
    return weth ? weth.toLowerCase() : null;
  }
  if (!isHexAddress(address)) return null;
  return lower;
}

export async function fetchCoingeckoUsdPrice(
  chainId: number,
  address: string
): Promise<BigDecimal | null> {
  if (typeof window === "undefined") return null;
  const key = `${chainId}:${address}`;
  const now = Date.now();
  const cached = coingeckoCache.get(key);
  if (cached && cached.inflight) return cached.inflight;
  if (cached && now - cached.ts < COINGECKO_CACHE_MS) return cached.price;

  const inflight = (async () => {
    try {
      const qs = new URLSearchParams({
        chainId: String(chainId),
        address,
      });
      const res = await fetch(`/api/coingecko/usd?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.usd == null) return null;
      const usd = Number(data.usd);
      return Number.isFinite(usd) ? new BigDecimal(String(usd), 8) : null;
    } catch {
      return null;
    }
  })();

  coingeckoCache.set(key, { ts: now, price: cached?.price ?? null, inflight });
  const price = await inflight;
  coingeckoCache.set(key, { ts: Date.now(), price });
  return price;
}

export async function fetchCoingeckoUsdPriceBySymbol(
  symbol: string
): Promise<BigDecimal | null> {
  if (typeof window === "undefined") return null;
  const key = String(symbol || "")
    .trim()
    .toLowerCase();
  if (!key) return null;

  const now = Date.now();
  const cached = coingeckoSymbolCache.get(key);
  if (cached && cached.inflight) return cached.inflight;
  if (cached && now - cached.ts < COINGECKO_CACHE_MS) return cached.price;

  const inflight = (async () => {
    try {
      const qs = new URLSearchParams({
        symbols: key,
      });
      const res = await fetch(`/api/coingecko/usd?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.usd == null) return null;
      const usd = Number(data.usd);
      return Number.isFinite(usd) ? new BigDecimal(String(usd), 8) : null;
    } catch {
      return null;
    }
  })();

  coingeckoSymbolCache.set(key, {
    ts: now,
    price: cached?.price ?? null,
    inflight,
  });
  const price = await inflight;
  coingeckoSymbolCache.set(key, { ts: Date.now(), price });
  return price;
}
