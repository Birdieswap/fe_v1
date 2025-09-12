
import type { ICurrency } from "@/const/contracts/types/tokenTypes";

export const isETH = (t?: ICurrency) =>
  !!t && t.symbol?.toUpperCase() === "ETH";

export const isWETH = (t?: ICurrency) =>
  !!t && t.symbol?.toUpperCase() === "WETH"; // 필요시 "WETH9" 등 추가 매칭

export const isWrapPair = (from?: ICurrency, to?: ICurrency) =>
  (isETH(from) && isWETH(to)) || (isWETH(from) && isETH(to));

export const isEthOnlyOneSide = (from?: ICurrency, to?: ICurrency) =>
  (isETH(from) || isETH(to)) && !isWrapPair(from, to);

/**
 * wrapper/addresses 헬퍼
 */
export type Address = `0x${string}`;

type GetFromContracts = (tokenKey: string, cid: number) => Address | null;

import { getFromContracts as _getFromContracts } from "@/utils/farm/getAddressHelpers";

export const getFromContracts = _getFromContracts as GetFromContracts;

export function getWethAddress(chainId: number): Address {
  const keys = ["WETH", "weth", "Weth", "weth9"];
  for (const k of keys) {
    const addr = getFromContracts(k, chainId);
    if (addr) return addr;
  }
  throw new Error("WETH address not found in contractAddresses");
}

export function getRouterAddress(chainId: number): Address {
  const keys = ["birdieswap_router", "router", "swap_router"];
  for (const k of keys) {
    const addr = getFromContracts(k, chainId);
    if (addr) return addr;
  }
  throw new Error("Router address not found in contractAddresses");
}

export function getWrapperAddress(chainId: number): Address {
  const keys = ["birdieswap_wrapper", "wrapper", "swap_wrapper"];
  for (const k of keys) {
    const addr = getFromContracts(k, chainId);
    if (addr) return addr;
  }
  throw new Error("Wrapper address not found in contractAddresses");
}
