import { BigDecimal } from "@/types/BigDecimal";
import type { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";
import {
  fetchCoingeckoUsdPrice,
  normalizeCoingeckoAddress,
} from "@/utils/prices/coingeckoUsd";

function getChainlinkUsdPrice(
  assetValues: useAssetValuesReturnType,
  symbol?: string
): BigDecimal | null {
  if (!symbol) return null;
  const map = assetValues?.chainLinkPriceMap;
  if (!map) return null;
  const direct = map.get(`LINK:${symbol}_USD`)?.price ?? null;
  if (direct && !direct.isZero()) return direct;
  if (symbol === "ETH") {
    const price = map.get("LINK:WETH_USD")?.price ?? null;
    return price && !price.isZero() ? price : null;
  }
  if (symbol === "WETH") {
    const price = map.get("LINK:ETH_USD")?.price ?? null;
    return price && !price.isZero() ? price : null;
  }
  return null;
}

export async function getUsdPriceWithFallback(params: {
  assetValues: useAssetValuesReturnType;
  chainId?: number;
  symbol?: string;
  address?: string | null;
}): Promise<BigDecimal | null> {
  const { assetValues, chainId, symbol, address } = params;
  const chainlink = getChainlinkUsdPrice(assetValues, symbol);
  if (chainlink) return chainlink;
  const cgSymbolMap = assetValues?.coingeckoSymbolPriceMap;
  const symbolKey = String(symbol ?? "").trim().toLowerCase();
  if (cgSymbolMap && symbolKey && cgSymbolMap.has(symbolKey)) {
    const cached = cgSymbolMap.get(symbolKey) ?? null;
    if (cached && !cached.isZero()) return cached;
    if (cached && cached.isZero()) return null;
  }
  if (!chainId) return null;
  const normalized = normalizeCoingeckoAddress(address ?? null, chainId);
  if (!normalized) return null;
  const cgMap = assetValues?.coingeckoPriceMap;
  if (cgMap && cgMap.has(normalized)) {
    const cached = cgMap.get(normalized) ?? null;
    if (cached && !cached.isZero()) return cached;
    if (cached && cached.isZero()) return null;
  }
  return await fetchCoingeckoUsdPrice(chainId, normalized);
}
