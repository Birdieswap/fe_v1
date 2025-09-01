


import * as TokenInfoMod from "@/const/tokenInfo";
import type { ICurrency } from "@/const/contracts/types/tokenTypes";
import * as SingleVaultsMod from "@/const/contracts/tokens/singleVaults";
import * as SwapPoolMod from "@/const/contracts/tokens/swapPool";

const lc = (s?: string | null) => (s ? String(s).toLowerCase() : "");
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

function isTokenLike(x: any): x is ICurrency {
  return !!x && typeof x === "object" && typeof (x as any).symbol === "string";
}
function symOf(t?: ICurrency) {
  return lc((t as any)?.symbol);
}

// TokenInfo 모듈의 내보내기 형태가 다양할 수 있어 통합 해제
function resolveTokenInfo(mod: any): { SwapTokens: ICurrency[]; TokensRegistry: Record<string, ICurrency> } {
  const any = (mod || {}) as any;
  const def = (any.default || {}) as any;

  const arrCandidates = [any.SwapTokens, def.SwapTokens, any.TOKEN_LIST, def.TOKEN_LIST, any.tokensArray, def.tokensArray];
  let SwapTokens: ICurrency[] = (arrCandidates.find((v) => Array.isArray(v)) as ICurrency[]) || [];

  const regCandidates = [any.tokens, def.tokens, any.TOKENS, def.TOKENS, any.registry, def.registry];
  let TokensRegistry: Record<string, ICurrency> | null = (regCandidates.find((v) => isObj(v)) as any) || null;

  // 레지스트리만 있고 배열이 없다면, 레지스트리 값으로 배열 구성
  if (!SwapTokens.length && TokensRegistry) {
    const vals = Object.values(TokensRegistry).filter(isTokenLike) as ICurrency[];
    if (vals.length) SwapTokens = vals;
  }

  // 배열만 있고 레지스트리가 없다면, 심볼을 키로 한 레지스트리 생성
  if (!TokensRegistry) {
    const map: Record<string, ICurrency> = {};
    for (const t of SwapTokens) {
      const s = symOf(t);
      if (s) map[s] = t;
    }
    TokensRegistry = map;
  }

  return { SwapTokens, TokensRegistry };
}

const { SwapTokens: SWAP_TOKENS, TokensRegistry } = resolveTokenInfo(TokenInfoMod);

// 심볼 → 토큰 매핑 (SwapTokens와 레지스트리 병합; SwapTokens 우선 유지)
const TOKENS_BY_SYMBOL: Record<string, ICurrency> = (() => {
  const out: Record<string, ICurrency> = {};
  for (const t of SWAP_TOKENS) {
    const s = symOf(t);
    if (s) out[s] = t;
  }
  for (const [k, v] of Object.entries(TokensRegistry)) {
    if (isTokenLike(v)) {
      const s = symOf(v);
      if (s && !out[s]) out[s] = v;
    }
  }
  return out;
})();

// SingleVaults: 어떤 깊이든 문자열 키로 접근 가능하도록 평탄화 인덱스
function buildSingleVaultIndex(mod: any) {
  const root = (mod && (mod.default ?? mod)) ?? {};
  const idx = new Map<string, any>();
  function walk(obj: any, path: string[] = []) {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      const p = [...path, k];
      idx.set(k, v);
      idx.set(p.join("."), v); // groupA.blp... 대응
      if (typeof v === "object") walk(v, p);
    }
  }
  walk(root);
  return idx;
}
const SINGLE_VAULT_IDX = buildSingleVaultIndex(SingleVaultsMod);
const getVaultRecord = (key: any) => (typeof key === "string" ? SINGLE_VAULT_IDX.get(key) : key);

// swapPool: 다양한 구조 지원해서 풀 나열
function gatherPools(rawMod: any): Array<{ input?: any }> {
  const raw = (rawMod && (rawMod as any).default) || (rawMod as any);
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((p) => p && typeof p === "object");
  if (Array.isArray(raw.pools)) return raw.pools.filter((p: any) => p && typeof p === "object");
  const values = Object.values(raw).filter((v) => v && typeof v === "object");
  const withInput = values.filter((v: any) => Array.isArray(v?.input));
  return (withInput.length ? withInput : values) as any[];
}

// vault → 토큰 배열(ICurrency[])로 복원 (주소 불필요; 심볼 기반)
function tokensFromUnknown(x: any): ICurrency[] {
  if (Array.isArray(x) && x.every(isTokenLike)) return x as ICurrency[]; // 이미 토큰 배열
  if (Array.isArray(x) && x.every((v) => typeof v === "string")) {
    const out: ICurrency[] = [];
    for (const s of x as string[]) {
      const t = TOKENS_BY_SYMBOL[lc(s)];
      if (t) out.push(t);
    }
    return out;
  }
  if (typeof x === "string") return tokensFromUnknown(getVaultRecord(x));
  if (x && typeof x === "object") {
    const cand =
      (Array.isArray((x as any).input) && (x as any).input) ||
      (Array.isArray((x as any).tokens) && (x as any).tokens) ||
      (Array.isArray((x as any).underlyings) && (x as any).underlyings) ||
      (Array.isArray((x as any).assets) && (x as any).assets) ||
      (Array.isArray((x as any).pair) && (x as any).pair) ||
      (Array.isArray((x as any).pairs) && (x as any).pairs) ||
      null;
    if (!cand) return [];
    const out: ICurrency[] = [];
    for (const item of cand) {
      if (isTokenLike(item)) out.push(item);
      else if (typeof item === "string") {
        const t = TOKENS_BY_SYMBOL[lc(item)];
        if (t) out.push(t);
        else out.push(...tokensFromUnknown(getVaultRecord(item)));
      } else if (Array.isArray(item) || (item && typeof item === "object")) {
        out.push(...tokensFromUnknown(item));
      }
    }
    return out;
  }
  return [];
}

// 파트너 인덱스 구성: 같은 볼트에 등장하면 서로 파트너(자기 포함)
function buildPartnerIndex(): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  const pools = gatherPools(SwapPoolMod);
  for (const p of pools) {
    const inputs = Array.isArray(p?.input) ? p.input : [];
    for (const inItem of inputs) {
      const vaultTokens = tokensFromUnknown(inItem).filter(isTokenLike);
      const syms = vaultTokens.map((t) => symOf(t)).filter(Boolean) as string[];
      for (const s of syms) {
        map[s] = map[s] || new Set<string>();
        for (const t of syms) map[s].add(t); // 자기자신 포함
      }
    }
  }
  console.log("getCandidateToken!!!!!! buildPartnerIndex", map)
  return map;
}

const PARTNER_INDEX = buildPartnerIndex();

export function getPartnerCandidates(selected?: ICurrency): ICurrency[] {
  if (!selected) return SWAP_TOKENS;
  const s = symOf(selected);
  if (!s) return SWAP_TOKENS;
  const set = PARTNER_INDEX[s];
  if (!set || set.size === 0) {
    const self = TOKENS_BY_SYMBOL[s];
    return self ? [self] : SWAP_TOKENS;
  }
  const out: ICurrency[] = [];
  for (const sym of set) {
    const tok = TOKENS_BY_SYMBOL[sym];
    if (tok) out.push(tok);
  }
  return out.length ? out : SWAP_TOKENS;
}

export function useSwapCandidates(
  type: "buy" | "sell",
  fromToken?: ICurrency,
  toToken?: ICurrency
) {
  const selected = type === "buy" ? fromToken : toToken;
  return getPartnerCandidates(selected);
}
