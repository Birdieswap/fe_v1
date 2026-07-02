import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";

export type Address = `0x${string}`;
type AnyToken =
  | (typeof tokens)[keyof typeof tokens]
  | (typeof externalTokens)[keyof typeof externalTokens];

// 주소 정규화
const norm = (addr: string) => addr.toLowerCase();

// chainId -> (normalizedAddress -> token) 역인덱스
const reverseIndex: Record<number, Record<string, AnyToken>> = Object.create(null);

// 애플리케이션 초기화 시 1회 빌드
(function buildReverseIndex() {
  const list = [...Object.values(tokens), ...Object.values(externalTokens)];
  for (const token of list) {
    // token.addresses는 {[chainId: number]: string} 형태
    for (const [chainIdStr, address] of Object.entries(token.addresses)) {
      if (!address) continue;
      const chainId = Number(chainIdStr);
      if (!reverseIndex[chainId]) reverseIndex[chainId] = Object.create(null);
      reverseIndex[chainId][norm(address)] = token;

      if (token.symbol === "ETH") {
        reverseIndex[chainId]["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"] =
          token;
      }
    }
  }
})();

// 주소로 토큰 전체 객체 찾기
export function findTokenByAddress(address: string, chainId: number): AnyToken | undefined {
  return reverseIndex[chainId]?.[norm(address)];
}

// 주소로 심볼만 찾기
export function findSymbolByAddress(address: string, chainId: number): string | undefined {
  return reverseIndex[chainId]?.[norm(address)]?.symbol;
}

// 필수 조회(없으면 에러)
export function requireTokenByAddress(address: string, chainId: number): AnyToken {
  const t = findTokenByAddress(address, chainId);
  if (!t) throw new Error(`Unknown token for address ${address} on chain ${chainId}`);
  return t;
}

export function requireSymbolByAddress(address: string, chainId: number): string {
  const s = findSymbolByAddress(address, chainId);
  if (!s) throw new Error(`Unknown token symbol for address ${address} on chain ${chainId}`);
  return s;
}
