import internalSwapPoolsMod from "@/const/contracts/tokens/swapPool";
import externalSwapPoolsMod from "@/const/contracts/tokens/externalSwapPool";
import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";

import {
  isBirdieSingleFarm,
  IBirdieSingleFarm,
  ICurrency,
  EProvider,
} from "@/const/contracts/types/tokenTypes";

import getBToken from "./getBToken";

/**
 * NOTE
 * - 풀 "탐색/매칭" 관점에서는 ETH를 ETH로 두고(표시/선택 UX)
 * - 외부풀 매칭 시에는 pool.input 에 ETH가 들어있을 수 있으므로
 *   "주소 비교"만 ETH -> WETH 주소로 정규화해서 비교한다.
 *
 * - quoteService에서는 "주소 넘길 때(Quoter 호출)"만 ETH -> WETH로 바꾼다.
 */

const symUP = (t?: any) => String(t?.symbol ?? "").toUpperCase();
const isETH = (t?: any) => symUP(t) === "ETH";

type SwapPoolLike = any;

function resolvePoolList(mod: any): SwapPoolLike[] {
  const root = (mod && (mod.default ?? mod)) ?? {};
  if (Array.isArray(root)) return root.filter(Boolean);
  if (root && typeof root === "object")
    return Object.values(root).filter(Boolean);
  return [];
}

function hasPoolAddressOnChain(pool: any, chainId: number): boolean {
  const addr = pool?.addresses?.[chainId];
  return typeof addr === "string" && addr.length > 0;
}

/** 외부용: token에서 비교용 address를 얻는다 (ETH면 WETH 주소로) */
function addrForExternalMatch(
  token: any,
  chainId: number
): `0x${string}` | undefined {
  if (!token) return undefined;
  if (isETH(token)) return externalTokens.WETH.addresses?.[chainId] as any;
  const a = token.addresses?.[chainId];
  return typeof a === "string" && a.length > 0 ? (a as any) : undefined;
}

// ---------------------------------------------------------------------
// 내부 풀 조회 (기존 getBToken 기반 로직 유지)
// ---------------------------------------------------------------------

const internalPools: SwapPoolLike[] = resolvePoolList(internalSwapPoolsMod);

function findInternalSwapPool<T extends ICurrency | IBirdieSingleFarm>(props: {
  fromToken: T;
  toToken: T;
  chainId: number;
  provider?: EProvider;
}) {
  const { fromToken, toToken, chainId, provider } = props;
  if (!fromToken || !toToken || !chainId) return null;

  const fromBToken = isBirdieSingleFarm(fromToken)
    ? fromToken
    : getBToken({ token: fromToken, chainId, provider });

  const toBToken = isBirdieSingleFarm(toToken)
    ? toToken
    : getBToken({ token: toToken, chainId, provider });

  const fromBAddr = fromBToken?.addresses?.[chainId];
  const toBAddr = toBToken?.addresses?.[chainId];
  if (!fromBAddr || !toBAddr) return null;

  const pool = internalPools.find((p: any) => {
    if (!hasPoolAddressOnChain(p, chainId)) return false;

    const p0 = p?.input?.[0]?.addresses?.[chainId];
    const p1 = p?.input?.[1]?.addresses?.[chainId];
    if (!p0 || !p1) return false;

    return (
      (p0 === fromBAddr && p1 === toBAddr) ||
      (p0 === toBAddr && p1 === fromBAddr)
    );
  });

  return pool ?? null;
}

// ---------------------------------------------------------------------
// 외부 풀 조회 (underlying 기준)
//
// CHANGE(핵심):
// - externalSwapPool.ts 의 pool.input 이 [ETH, AERO] 같은 형태면
//   ETH는 addresses가 없을 수 있으므로, "주소 비교"만 ETH->WETH로 정규화한다.
// - pool 자체도 chainId에 addresses[chainId]가 있어야 사용한다.
// ---------------------------------------------------------------------

const externalPools: SwapPoolLike[] = resolvePoolList(externalSwapPoolsMod);

function findExternalSwapPool(props: {
  fromToken: ICurrency;
  toToken: ICurrency;
  chainId: number;
}) {
  const { fromToken, toToken, chainId } = props;
  if (!fromToken || !toToken || !chainId) return null;

  const fromAddr = addrForExternalMatch(fromToken, chainId);
  const toAddr = addrForExternalMatch(toToken, chainId);
  if (!fromAddr || !toAddr) return null;

  const pool = externalPools.find((p: any) => {
    if (!hasPoolAddressOnChain(p, chainId)) return false;

    const p0 = addrForExternalMatch(p?.input?.[0], chainId); // ✅ ETH 처리
    const p1 = addrForExternalMatch(p?.input?.[1], chainId); // ✅ ETH 처리
    if (!p0 || !p1) return false;

    return (
      (p0 === fromAddr && p1 === toAddr) || (p0 === toAddr && p1 === fromAddr)
    );
  });

  return pool ?? null;
}

// ---------------------------------------------------------------------
// 통합 API
// ---------------------------------------------------------------------

export type SwapPoolKind = "internal" | "external" | null;
export interface GetSwapPoolResult<TPool = any> {
  pool: TPool | null;
  kind: SwapPoolKind;
}

/**
 * getSwapPoolAny
 *
 * 규칙:
 * 1) "internal 먼저" 찾는다.
 * 2) 내부 없으면 external에서 찾는다.
 *
 * (요구사항: internal 우선)
 */
export function getSwapPoolAny<T extends ICurrency | IBirdieSingleFarm>(props: {
  fromToken: T;
  toToken: T;
  chainId: number;
  provider?: EProvider;
}): GetSwapPoolResult {
  const { fromToken, toToken, chainId } = props;
  if (!fromToken || !toToken || !chainId) return { pool: null, kind: null };

  const internal = findInternalSwapPool(props);
  if (internal) return { pool: internal, kind: "internal" };

  const external = findExternalSwapPool({
    fromToken: fromToken as any as ICurrency,
    toToken: toToken as any as ICurrency,
    chainId,
  });
  if (external) return { pool: external, kind: "external" };

  return { pool: null, kind: null };
}

/** 기존 호환용: pool만 리턴 */
export default function getSwapPool<
  T extends ICurrency | IBirdieSingleFarm,
>(props: {
  fromToken: T;
  toToken: T;
  chainId: number;
  provider?: EProvider;
}): any | null {
  return getSwapPoolAny(props).pool;
}

// import swapPools from "@/const/contracts/tokens/swapPool";
// import {
//   isBirdieSingleFarm,
//   IBirdieSingleFarm,
//   ICurrency,
//   EProvider,
// } from "@/const/contracts/types/tokenTypes";

// import getBToken from "./getBToken";

// const swapPool = Object.values(swapPools).filter((pool) => !pool.isInternal);

// export default function getSwapPool<
//   T extends ICurrency | IBirdieSingleFarm,
// >(props: { fromToken: T; toToken: T; chainId: number; provider?: EProvider }) {
//   const { fromToken, toToken, chainId } = props;

//   if (!fromToken || !toToken || !chainId) return null;
//   const fromBToken = isBirdieSingleFarm(fromToken)
//     ? fromToken
//     : getBToken({
//         token: fromToken,
//         chainId,
//         provider: props.provider,
//       });
//   const toBToken = isBirdieSingleFarm(toToken)
//     ? toToken
//     : getBToken({
//         token: toToken,
//         chainId,
//         provider: props.provider,
//       });
//   const fromBTokenAddress = fromBToken?.addresses[chainId];
//   const toBTokenAddress = toBToken?.addresses[chainId];

//   if (!fromBTokenAddress || !toBTokenAddress) return null;
//   const pool = Object.values(swapPools).find((pool) => {
//     const poolAddress0 = pool.input[0].addresses[chainId];
//     const poolAddress1 = pool.input[1].addresses[chainId];

//     return (
//       (poolAddress0 === fromBTokenAddress &&
//         poolAddress1 === toBTokenAddress) ||
//       (poolAddress0 === toBTokenAddress && poolAddress1 === fromBTokenAddress)
//     );
//   });

//   // console.log("getSwapPool", fromBToken, toBToken, pool);

//   return pool ? pool : null;
// }
