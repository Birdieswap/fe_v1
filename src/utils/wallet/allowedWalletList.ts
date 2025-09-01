// utils/wallet/allowlist.ts
export const ALLOWED_ADDRESSES: string[] = (process.env.NEXT_PUBLIC_ALLOWED_WALLETS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// 필요시 로컬 테스트용 기본값 추가 가능
// if (!ALLOWED_ADDRESSES.length) ALLOWED_ADDRESSES.push("0x1234...abcd".toLowerCase());
