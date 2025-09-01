
// - 모드: open(누구나) / closed(허용 주소만)
// - 허용 주소: .env (NEXT_PUBLIC_ALLOWED_WALLETS)에서 쉼표 구분

import type { } from "wagmi"; // 타입 경로 충돌 방지용 (없어도 됨)

export type WalletAccessMode = "open" | "closed";

// 🔒 하드코딩 강제 모드 (필요 시 'open' 또는 'closed'로 지정)
//    undefined면 환경변수를 따름
const HARDCODED_MODE: WalletAccessMode | undefined = undefined;

// env → 기본 모드
const rawEnvMode = (process.env.NEXT_PUBLIC_WALLET_ACCESS_MODE || "").toLowerCase();
const ENV_MODE: WalletAccessMode = rawEnvMode === "closed" ? "closed" : "open";

// 최종 모드
export const WALLET_ACCESS_MODE: WalletAccessMode = HARDCODED_MODE ?? ENV_MODE;

// 허용 주소 목록(.env)
// 예: NEXT_PUBLIC_ALLOWED_WALLETS=0xabc...,0xdef...,0x123...
export const ALLOWED_ADDRESSES: string[] = (process.env.NEXT_PUBLIC_ALLOWED_WALLETS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// 검사 함수
export function isWalletAllowed(address?: string | null): boolean {
  if (WALLET_ACCESS_MODE === "open") return true;           // 아무 주소나 OK
  if (!address) return false;                                // closed 모드에선 주소 필요
  return ALLOWED_ADDRESSES.includes(address.toLowerCase());  // 허용 목록만 OK
}
