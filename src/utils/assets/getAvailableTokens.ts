import type { ICurrency } from "@/const/contracts/types/tokenTypes";
import * as SwapPoolMod from "@/const/contracts/tokens/swapPool";
import * as TokensRegMod from "@/const/contracts/tokens/tokens";
import * as SingleVaultsMod from "@/const/contracts/tokens/singleVaults";
import * as TokenInfoMod from "@/const/tokenInfo";

const lc = (s?: string | null) => (s ? String(s).toLowerCase() : "");
const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

function isTokenLike(x: any): x is ICurrency {
  return !!x && typeof x === "object" && typeof (x as any).symbol === "string";
}
const symOf = (t?: ICurrency) => lc((t as any)?.symbol);

// ----- tokenInfo.ts 호환: SwapTokens 배열 / tokens 레지스트리 복원 -----
function resolveTokenInfo(mod: any): {
  SwapTokens: ICurrency[];
  TokensRegistry: Record<string, ICurrency>;
} {
  const any = (mod || {}) as any;
  const def = (any.default || {}) as any;

  // SwapTokens 후보
  const arrCands = [
    any.SwapTokens,
    def.SwapTokens,
    any.TOKEN_LIST,
    def.TOKEN_LIST,
    any.tokensArray,
    def.tokensArray,
  ];
  let SwapTokens: ICurrency[] =
    (arrCands.find((v) => Array.isArray(v)) as ICurrency[]) || [];

  // tokens 레지스트리 후보
  const regCands = [
    any.tokens,
    def.tokens,
    any.TOKENS,
    def.TOKENS,
    any.registry,
    def.registry,
  ];
  let TokensRegistry: Record<string, ICurrency> | null =
    (regCands.find((v) => isObj(v)) as any) || null;

  // 레지스트리만 있고 배열이 없으면 값들로 배열 구성
  if (!SwapTokens.length && TokensRegistry) {
    const vals = Object.values(TokensRegistry).filter(
      isTokenLike
    ) as ICurrency[];
    if (vals.length) SwapTokens = vals;
  }
  // 배열만 있고 레지스트리 없으면 심볼 기반으로 생성
  if (!TokensRegistry) {
    const m: Record<string, ICurrency> = {};
    for (const t of SwapTokens) {
      const s = symOf(t);
      if (s) m[s] = t;
    }
    TokensRegistry = m;
  }
  return { SwapTokens, TokensRegistry: TokensRegistry! };
}
const { SwapTokens, TokensRegistry } = resolveTokenInfo(TokenInfoMod);

// ----- tokens.ts 레지스트리(예: tokens.USDC)도 합쳐둔다(없으면 패스) -----
(function mergeTokensRegistry(mod: any) {
  const any = (mod || {}) as any;
  const def = (any.default || {}) as any;
  const candidates = [
    any.tokens,
    def.tokens,
    any.TOKENS,
    def.TOKENS,
    any.registry,
    def.registry,
    any,
  ];
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    for (const [k, v] of Object.entries(c)) {
      if (!isTokenLike(v)) continue;
      const s = symOf(v);
      if (s && !TokensRegistry[s]) TokensRegistry[s] = v as ICurrency;
    }
  }
})(TokensRegMod);

// ----- singleVaults 전체를 평탄화(문자열 키 접근 가능) -----
function buildSingleVaultIndex(mod: any) {
  const root = (mod && (mod.default ?? mod)) ?? {};
  const idx = new Map<string, any>();
  function walk(obj: any, path: string[] = []) {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      const p = [...path, k];
      idx.set(k, v);
      idx.set(p.join("."), v); // groupA.blp... 같은 형태도 지원
      if (typeof v === "object") walk(v, p);
    }
  }
  walk(root);
  return idx;
}
const SINGLE_VAULT_IDX = buildSingleVaultIndex(SingleVaultsMod);
const getVaultRecord = (key: any) =>
  typeof key === "string" ? SINGLE_VAULT_IDX.get(key) : key;

// ----- swapPools 수집 (배열/객체/디폴트 모두 지원) -----
type PoolLike = { input?: any[]; name?: string; id?: string; key?: string };

function resolveSwapPools(mod: any): Array<PoolLike & { __name?: string }> {
  const raw = (mod && (mod.default ?? mod)) ?? {};
  const out: Array<PoolLike & { __name?: string }> = [];

  if (Array.isArray(raw)) {
    for (const p of raw) if (isObj(p)) out.push(p as any);
  } else {
    // named object로 들어오는 경우
    for (const [k, v] of Object.entries(raw)) {
      if (Array.isArray(v as any)) {
        // 배열이면 그 내부 객체들
        for (const p of v as any[]) {
          if (isObj(p)) out.push({ ...(p as any), __name: k });
        }
      } else if (isObj(v)) {
        out.push({ ...(v as any), __name: k });
      }
    }
    // 흔한 키들
    for (const key of ["swapPools", "pools"]) {
      if (Array.isArray((raw as any)[key])) {
        for (const p of (raw as any)[key]) if (isObj(p)) out.push(p as any);
      }
    }
  }
  return out;
}

// ----- vault input → 토큰(ICurrency[]) 복원 -----
//  (1) 이미 토큰 객체 배열이면 그대로
//  (2) 문자열 배열이면 심볼 키로 TokensRegistry 찾아서 복원
//  (3) vault 키(문자열)면 vault 찾아서 그 안의 input/tokens/underlyings 등을 다시 복원
function tokensFromUnknown(x: any): ICurrency[] {
  if (!x) return [];
  if (Array.isArray(x) && x.every(isTokenLike)) return x as ICurrency[];

  if (Array.isArray(x) && x.every((v) => typeof v === "string")) {
    const out: ICurrency[] = [];
    for (const s of x as string[]) {
      const key = lc(s);
      const tok = TokensRegistry[key] || TokensRegistry[key.toUpperCase()];
      if (isTokenLike(tok)) out.push(tok);
    }
    return out;
  }

  if (typeof x === "string") return tokensFromUnknown(getVaultRecord(x));

  if (isObj(x)) {
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
      else if (typeof item === "string")
        out.push(...tokensFromUnknown(getVaultRecord(item)));
      else if (Array.isArray(item) || isObj(item))
        out.push(...tokensFromUnknown(item));
    }
    return out;
  }
  return [];
}

// ======================================================================
//                            pairList 빌드
// ======================================================================

let PAIR_LIST_CACHE: ICurrency[][] | null = null;

/** swapPools의 각 pool.input에 있는 두 개의 singleVault를 읽고,
 *  각 vault.input을 토큰 배열로 복원해 무순서 쌍으로 pairList 구성 */
function buildPairList(): ICurrency[][] {
  const pools = resolveSwapPools(SwapPoolMod);
  const pairs: ICurrency[][] = [];
  const seen = new Set<string>();

  for (const pool of pools) {
    const inputs = Array.isArray(pool?.input) ? pool.input : [];
    if (inputs.length < 2) continue;

    // 문제에서 명시: input에는 두 개의 singleVault가 들어있음
    const vA = tokensFromUnknown(inputs[0]);
    const vB = tokensFromUnknown(inputs[1]);
    if (!vA.length || !vB.length) continue;

    // 일반화: 교차 조합으로 쌍 구성 (보통 각 1개지만 방어)
    for (const tA of vA)
      for (const tB of vB) {
        if (!isTokenLike(tA) || !isTokenLike(tB)) continue;
        const sA = symOf(tA);
        const sB = symOf(tB);
        if (!sA || !sB) continue;

        // 무순서 쌍 dedupe
        const key = sA < sB ? `${sA}|${sB}` : `${sB}|${sA}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push([tA, tB]);
      }
  }

  // 만약 swapPool/singleVaults 해석이 전부 실패했다면,
  // 안전장치로 pool 이름(예: ...WETHUSDC)의 접미부에서 심볼 두 개를 파싱해 복원 시도
  if (!pairs.length) {
    const pools = resolveSwapPools(SwapPoolMod);
    const symbols = Object.keys(TokensRegistry).sort(
      (a, b) => b.length - a.length
    ); // 긴 심볼 우선 매칭
    for (const p of pools) {
      const name = String(
        p?.name || p?.id || p?.key || (p as any)?.__name || ""
      );
      const cap = name.toUpperCase();
      // 접미부에서 두 심볼 추정 (ex: EURCUSDC, CBBTCWETH ...)
      for (let i = 0; i < symbols.length; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
          const s1 = symbols[i].toUpperCase();
          const s2 = symbols[j].toUpperCase();
          if (cap.includes(s1) && cap.includes(s2)) {
            const t1 = TokensRegistry[lc(s1)] || TokensRegistry[s1];
            const t2 = TokensRegistry[lc(s2)] || TokensRegistry[s2];
            if (isTokenLike(t1) && isTokenLike(t2)) {
              const key = s1 < s2 ? `${s1}|${s2}` : `${s2}|${s1}`;
              if (!seen.has(key)) {
                seen.add(key);
                pairs.push([t1, t2]);
              }
            }
          }
        }
      }
    }
  }

  return pairs;
}

function ensurePairList(): ICurrency[][] {
  if (!PAIR_LIST_CACHE) {
    PAIR_LIST_CACHE = buildPairList();
    // console.log("[getAvailableTokens] pairList built:", PAIR_LIST_CACHE?.map(p=>p.map(t=>t.symbol)));
  }
  return PAIR_LIST_CACHE;
}

// ======================================================================
//                       공개 API: 파트너 / 가용 토큰
// ======================================================================

/** baseToken을 포함하는 pair의 '상대 토큰'들을 모아 반환 */
export function getPartnerTokens(baseToken: ICurrency): ICurrency[] {
  const pairs = ensurePairList();
  const target = symOf(baseToken);
  if (!target) return [];

  const out: ICurrency[] = [];
  const seen = new Set<string>();

  for (const pair of pairs) {
    if (pair.length < 2) continue;
    const [a, b] = pair;
    const sA = symOf(a),
      sB = symOf(b);
    if (sA === target && sB && !seen.has(sB)) {
      seen.add(sB);
      out.push(b);
    } else if (sB === target && sA && !seen.has(sA)) {
      seen.add(sA);
      out.push(a);
    }
  }
  // console.log("getAvailableTokens!!!!!! getPartnerTokens PAIRS",pairs,"out",out)
  return out;
}

/** baseToken이 없으면 SwapTokens 전체, 있으면 파트너 + 자기 자신 반환 */
export default function getAvailableTokens(baseToken?: ICurrency): ICurrency[] {
  if (!baseToken) {
    return Array.isArray(SwapTokens) && SwapTokens.length
      ? SwapTokens
      : Object.values(TokensRegistry).filter(isTokenLike);
  }
  const partners = getPartnerTokens(baseToken);
  const selfSym = symOf(baseToken);
  const exists = partners.some((t) => symOf(t) === selfSym);

  // console.log("getAvailableTokens!!!!!! getPartnerTokens partners",partners,"exists",exists)

  return exists ? partners : [...partners, baseToken];
}

// 디버깅용
export function getPairList(): ICurrency[][] {
  return ensurePairList();
}
