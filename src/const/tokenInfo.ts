import { CryptoTokenInfo } from "@/types/CryptoTokenInfo";

import tokens from "./contracts/tokens/tokens";
import { externalTokens } from "./contracts/tokens/externalTokens";
import { ICurrency } from "@/const/contracts/types/tokenTypes";

const AAVE: CryptoTokenInfo = {
  iconSrc: "/tokens/AAVE.svg",
  symbol: "AAVE",
  decimals: 18,
  displayDecimals: 2,
};

const BIRDIE: CryptoTokenInfo = {
  iconSrc: "/tokens/Birdie.svg",
  symbol: "Birdie",
  decimals: 18,
  displayDecimals: 2,
};

export const TokenInfo = {
  AAVE,
  BIRDIE,
};

/* -------------------- 내부/외부 토큰 배열 & 헬퍼 -------------------- */

// object → array 헬퍼
function toCurrencyArray(obj: any): ICurrency[] {
  if (!obj) return [];
  return Array.isArray(obj) ? (obj as ICurrency[]) : Object.values(obj);
}

// 🔹 심볼 normalize (대문자로 통일)
const normSym = (s?: string | null) => (s ? String(s) : "").toUpperCase();

// 내부 토큰: tokens.ts
export const INTERNAL_TOKENS: ICurrency[] = toCurrencyArray(tokens);

// 외부 토큰: externalTokens.ts
export const EXTERNAL_TOKENS: ICurrency[] = toCurrencyArray(externalTokens);

// 🔹 Swap에서 사용할 전체 토큰 리스트
//    (현재 SwapFormAmount에서 사용하는 SwapTokens를 이걸로 대체)
export const SwapTokens: ICurrency[] = [...INTERNAL_TOKENS, ...EXTERNAL_TOKENS];

// 🔹 심볼 기준 판별용 Set (대문자로 통일)
export const INTERNAL_TOKEN_SYMBOLS = new Set(
  INTERNAL_TOKENS.map((t) => normSym(t.symbol))
);
export const EXTERNAL_TOKEN_SYMBOLS = new Set(
  EXTERNAL_TOKENS.map((t) => normSym(t.symbol))
);

// 🔹 토큰이 내부/외부인지 판별하는 헬퍼
export const isInternalToken = (token?: ICurrency | null): boolean => {
  if (!token?.symbol) return false;
  return INTERNAL_TOKEN_SYMBOLS.has(normSym(token.symbol));
};

export const isExternalToken = (token?: ICurrency | null): boolean => {
  if (!token?.symbol) return false;
  return EXTERNAL_TOKEN_SYMBOLS.has(normSym(token.symbol));
};

/* -------------------- 기존과 동일한 default export 유지 -------------------- */

export default TokenInfo;

/* -------------------- 기존과 동일한 default export 유지 -------------------- */

// export const SwapTokens = [
//   tokens.WETH,
//   tokens.USDC,
//   tokens.ETH,
//   tokens.WBTC,
//   //tokens.USDT,
//   //tokens.AAVE,
//   // tokens.CBBTC,
//   // tokens.EURC,
//   //tokens.DAI,
// ];
