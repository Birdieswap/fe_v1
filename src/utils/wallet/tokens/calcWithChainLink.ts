import { BigDecimal } from "@/types/BigDecimal";

export function chainlinkKeyForSymbol(symbol: string) {
  return `LINK:${symbol}_USD`;
}

export function getUsdPriceFromChainlink(
  chainLinkPriceMap: Map<string, { price: BigDecimal }>,
  symbol: string
): BigDecimal | null {
  const key = chainlinkKeyForSymbol(symbol);
  return chainLinkPriceMap.get(key)?.price ?? null;
}
