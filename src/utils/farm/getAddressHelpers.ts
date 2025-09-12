// src/utils/contracts/addressHelpers.ts
import { contractAddresses } from "@/const/contracts/contractAddresses";

/** 0x-address 타입 */
export type AddressHex = `0x${string}`;

/** EVM zero address */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** 0x형식의 주소인지 검사 */
export const isHexAddress = (v: unknown): v is AddressHex =>
  typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v);

/** zero address인지 검사 (대소문자 무시) */
export const isZeroAddress = (addr?: string) =>
  typeof addr === "string" && /^0x0{40}$/i.test(addr);

/** 문자열 소문자 변환(안전) */
export const toLower = (v?: string | null) =>
  typeof v === "string" ? v.toLowerCase() : undefined;

/** chainId → 네트워크 키(string) */
export function chainIdToNetworkKey(cid: number): string {
  switch (cid) {
    case 11155111: return "sepolia";
    case 8453:     return "base";
    case 42161:    return "arbitrum";
    default:       return String(cid);
  }
}


export function getFromContracts(tokenKey: string, chainId: number): AddressHex | null {
  const t: any = contractAddresses;
  const nk = chainIdToNetworkKey(chainId);

  const candidates = [
    t?.[chainId]?.[tokenKey],
    t?.[String(chainId)]?.[tokenKey],
    t?.[nk]?.[tokenKey],

    t?.[tokenKey]?.[chainId],
    t?.[tokenKey]?.[String(chainId)],
    t?.[tokenKey]?.[nk],
  ];

  const hit = candidates.find(isHexAddress);
  if (!hit) {
    // 개발 중 디버깅용 (프로덕션에선 조용히 null)
    if (typeof console !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("[getFromContracts] not found", {
        tokenKey,
        chainId,
        topKeys: Object.keys(t ?? {}),
        byChainKeys: Object.keys((t?.[chainId] ?? t?.[String(chainId)] ?? t?.[nk] ?? {}) as any),
        byTokenKeys: Object.keys((t?.[tokenKey] ?? {}) as any),
      });
    }
    return null;
  }
  return hit as AddressHex;
}
