import type { ICurrency } from "@/const/contracts/types/tokenTypes";
import internalSwapPoolsMod from "@/const/contracts/tokens/swapPool";
import externalSwapPoolsMod from "@/const/contracts/tokens/externalSwapPool";
import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";

const symUP = (t?: ICurrency | null) => String(t?.symbol ?? "").toUpperCase();
const isETH = (t?: ICurrency | null) => symUP(t) === "ETH";
const isWETH = (t?: ICurrency | null) => symUP(t) === "WETH";

function getAllTokens(): ICurrency[] {
  return [...Object.values(tokens), ...Object.values(externalTokens)].filter(
    Boolean
  ) as ICurrency[];
}

function tokenDedupeKey(token: ICurrency, chainId?: number) {
  const symbol = symUP(token);
  const addr = chainId ? matchAddrLower(token, chainId) : "";
  return addr ? `${symbol}:${addr}` : symbol;
}

function dedupeTokens(list: ICurrency[], chainId?: number) {
  const out: ICurrency[] = [];
  const seen = new Set<string>();

  for (const token of list) {
    const key = tokenDedupeKey(token, chainId);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }

  return out;
}

function resolvePoolList(mod: any): any[] {
  const root = (mod && (mod.default ?? mod)) ?? {};
  if (Array.isArray(root)) return root.filter(Boolean);
  if (root && typeof root === "object")
    return Object.values(root).filter(Boolean);
  return [];
}

/** pool 자체 주소가 chainId에 있어야 그 체인에서 "존재하는 풀"로 인정 */
function hasPoolAddressOnChain(pool: any, chainId: number) {
  const addr = pool?.addresses?.[chainId];
  return typeof addr === "string" && addr.length > 0;
}

/**
 * token이 체인 주소를 가지는지
 * - ETH는 native라 주소가 없을 수 있으니 true로 허용
 */
function hasAddressOnChain(token?: ICurrency | null, chainId?: number) {
  if (!token || !chainId) return false;
  if (isETH(token)) return true;
  const addr = token.addresses?.[chainId];
  return typeof addr === "string" && addr.length > 0;
}

/**
 * 페어 매칭용 address(lower)
 *
 * IMPORTANT:
 * - "풀 탐색/매칭"에서는 'ETH=ETH'로 취급하고 싶지만
 *   실제 풀 및 external 토큰 주소 비교는 ERC20 주소가 필요하다.
 * - 따라서 비교용 주소는 ETH -> WETH 주소로 정규화한다.
 *
 * (표시용 토큰은 별도로 매핑)
 */
function matchAddrLower(token?: ICurrency | null, chainId?: number): string {
  if (!token || !chainId) return "";
  const addr = isETH(token)
    ? (externalTokens.WETH.addresses?.[chainId] as string | undefined)
    : (token.addresses?.[chainId] as string | undefined);
  return typeof addr === "string" && addr.length > 0 ? addr.toLowerCase() : "";
}

function pairKey(a: string, b: string) {
  if (!a || !b) return "";
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * address(lower) => "표시용 토큰" 매핑
 * - ETH는 matchAddrLower에서 WETH주소로 들어가지만, 표시할 때는 ETH로 보여주고 싶다.
 * - 그래서 WETH 주소를 ETH 토큰 객체로 맵핑해 둔다.
 */
function buildAddrToDisplayToken(chainId: number) {
  const map = new Map<string, ICurrency>();
  const all = getAllTokens();

  for (const t of all) {
    const a = matchAddrLower(t, chainId);
    if (a) map.set(a, t);
  }

  //  핵심: WETH 주소는 표시용으로 ETH로 보이게 (ETH 선택 UX 유지)
  const wethAddr = matchAddrLower(externalTokens.WETH as any, chainId);
  if (wethAddr) map.set(wethAddr, externalTokens.ETH as any as ICurrency);

  return map;
}

/** internal pool: input[i]는 singleVault(bFarm), underlying은 input[i].input */
function internalUnderlyingTokens(
  pool: any
): [ICurrency | null, ICurrency | null] {
  const a = pool?.input?.[0]?.input ?? null;
  const b = pool?.input?.[1]?.input ?? null;
  return [a, b];
}

/** external pool: input[i]가 underlying token */
function externalUnderlyingTokens(
  pool: any
): [ICurrency | null, ICurrency | null] {
  const a = pool?.input?.[0] ?? null;
  const b = pool?.input?.[1] ?? null;
  return [a, b];
}

/**
 * getPartnerTokens
 *
 * 요구사항:
 * 1) baseToken 포함 풀을 internalSwapPool에서 찾고, 그 다음 externalSwapPool에서 찾는다.
 * 2) internal에도 있고 external에도 있으면 internal만 포함(중복 pair skip)
 * 4) pool + tokens 모두 chainId 주소가 있는 것만
 *
 * NOTE:
 * - 반환 토큰은 "표시용 토큰" (ETH는 ETH로 반환)
 * - 실제 비교는 matchAddrLower(ETH->WETH) 사용
 */
export function getPartnerTokens(
  baseToken: ICurrency,
  chainId: number
): ICurrency[] {
  if (!baseToken || !chainId) return [];

  const addrToDisplay = buildAddrToDisplayToken(chainId);
  const baseAddr = matchAddrLower(baseToken, chainId);
  if (!baseAddr) return [];

  const partners: ICurrency[] = [];
  const addedPartnerAddr = new Set<string>();
  const internalPairKeys = new Set<string>();

  // ---------------- internal first ----------------
  const internalPools = resolvePoolList(internalSwapPoolsMod);

  for (const p of internalPools) {
    if (!hasPoolAddressOnChain(p, chainId)) continue;

    const [u0, u1] = internalUnderlyingTokens(p);
    if (
      !hasAddressOnChain(u0 as any, chainId) ||
      !hasAddressOnChain(u1 as any, chainId)
    )
      continue;

    const a0 = matchAddrLower(u0 as any, chainId);
    const a1 = matchAddrLower(u1 as any, chainId);
    if (!a0 || !a1) continue;

    const pk = pairKey(a0, a1);
    if (!pk) continue;

    if (a0 !== baseAddr && a1 !== baseAddr) continue;

    internalPairKeys.add(pk);

    const otherAddr = a0 === baseAddr ? a1 : a0;
    if (!otherAddr || addedPartnerAddr.has(otherAddr)) continue;

    const displayToken = addrToDisplay.get(otherAddr);
    if (!displayToken) continue;

    addedPartnerAddr.add(otherAddr);
    partners.push(displayToken);
  }

  // ---------------- external (skip if internal already has same pair) ----------------
  const externalPools = resolvePoolList(externalSwapPoolsMod);

  for (const p of externalPools) {
    if (!hasPoolAddressOnChain(p, chainId)) continue;

    const [u0, u1] = externalUnderlyingTokens(p);
    if (
      !hasAddressOnChain(u0 as any, chainId) ||
      !hasAddressOnChain(u1 as any, chainId)
    )
      continue;

    const a0 = matchAddrLower(u0 as any, chainId);
    const a1 = matchAddrLower(u1 as any, chainId);
    if (!a0 || !a1) continue;

    const pk = pairKey(a0, a1);
    if (!pk) continue;

    //  요구사항 2: internal에 같은 pair 있으면 external 스킵
    if (internalPairKeys.has(pk)) continue;

    if (a0 !== baseAddr && a1 !== baseAddr) continue;

    const otherAddr = a0 === baseAddr ? a1 : a0;
    if (!otherAddr || addedPartnerAddr.has(otherAddr)) continue;

    const displayToken = addrToDisplay.get(otherAddr);
    if (!displayToken) continue;

    addedPartnerAddr.add(otherAddr);
    partners.push(displayToken);
  }

  return partners;
}

/**
 * getAvailableTokens
 *
 * 요구사항:
 * - baseToken은 항상 포함
 * - baseToken=ETH이면 WETH 포함
 * - baseToken=WETH이면 ETH 포함
 */
export default function getAvailableTokens(
  baseToken?: ICurrency,
  chainId?: number
): ICurrency[] {
  const all = dedupeTokens(getAllTokens(), chainId);
  if (!chainId) return all;

  // baseToken 없으면: 체인 주소 있는 토큰만
  if (!baseToken) return all.filter((t) => hasAddressOnChain(t, chainId));

  const out: ICurrency[] = [];
  const seen = new Set<string>();

  const push = (t?: ICurrency | null) => {
    if (!t) return;
    if (!hasAddressOnChain(t, chainId)) return;
    const k = symUP(t);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };

  // baseToken은 항상 포함
  push(baseToken);

  // partner들
  for (const p of getPartnerTokens(baseToken, chainId)) push(p);

  // ETH <-> WETH "표시/선택 편의" 규칙
  if (isETH(baseToken)) push(externalTokens.WETH as any as ICurrency);
  if (isWETH(baseToken)) push(externalTokens.ETH as any as ICurrency);

  // toToken 후보(out)에 ETH가 있으면 WETH도 같이 포함
  const hasEthInOut = out.some((t) => isETH(t));
  if (hasEthInOut) push(externalTokens.WETH as any as ICurrency);

  return dedupeTokens(out, chainId);
}
