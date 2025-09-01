// src/utils/wallet/buildTransactions.ts
import lpVaultsDefault from "@/const/contracts/tokens/lpVaults";
import tokensDefault from "@/const/contracts/tokens/tokens";
import { BigDecimal } from "@/types/BigDecimal";
import { 
  TransactionType,
  type TransactionProps,
  type TransactionTokenInfo,
} from "./txType";

const lc = (s?: string) => (s ? s.toLowerCase() : "");
const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

// BigDecimal → "decimals 반영 + 뒤 0 제거"
const toExactTrimmed = (bd: BigDecimal) => bd.toPrecisionString(true, false);

// ---------- 체인링크 가격 맵 타입 유연 처리 ----------
type ChainLinkData = {
  base?: { addresses?: Record<number, string> };
  value?: { base?: { addresses?: Record<number, string> }; price?: any; priceData?: any };
  price?: any;
  priceData?: any;
};
export type ChainLinkPriceMapLike =
  | Map<string, ChainLinkData>
  | Record<string, ChainLinkData>
  | ChainLinkData[]
  | undefined;

function normalizeToArray(src: ChainLinkPriceMapLike): ChainLinkData[] {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (src instanceof Map) return Array.from(src.values());
  if (typeof src === "object") return Object.values(src);
  return [];
}

function findPriceMeta(
  tokenAddress: string,
  chainId: number,
  priceMap: ChainLinkPriceMapLike
): { value: bigint; decimals: number } | null {
  const items = normalizeToArray(priceMap);
  const addrL = lc(tokenAddress);
  for (const item of items) {
    const matchAddr =
      lc(item?.value?.base?.addresses?.[chainId]) ||
      lc(item?.base?.addresses?.[chainId]);
    if (!matchAddr || matchAddr !== addrL) continue;

    const price = item?.value?.price ?? item?.value?.priceData ?? item?.price ?? item?.priceData;
    if (!isObj(price)) return null;
    const val = (price as any).value ?? (price as any).raw ?? (price as any).amount;
    const dec = (price as any).decimals ?? 8;
    if (val == null) return null;
    return { value: BigInt(Number(val)), decimals: Number(dec) };
  }
  return null;
}

// ---------- 메타 조회 ----------
function findTokenMetaFromTokens(
  tokenAddress: string,
  chainId: number,
  tokensOverride?: any
): { symbol: string; decimals: number; iconSrc?: string; address: string } | null {
  const addrL = lc(tokenAddress);
  const source = tokensOverride ?? tokensDefault;
  const list: any[] = Array.isArray(source) ? source : Object.values(source);

  for (const t of list) {
    const byChain =
      t?.addresses?.[chainId] ??
      t?.address?.[chainId] ??
      t?.chains?.[chainId] ??
      t?.address;
    const resolved = typeof byChain === "string" ? byChain : undefined;
    if (resolved && lc(resolved) === addrL) {
      return {
        symbol: t.symbol ?? t.ticker ?? t.name ?? "UNKNOWN",
        decimals: t.decimals ?? t.tokenDecimals ?? 18,
        iconSrc: t.iconSrc ?? t.icon ?? t.logoURI,
        address: resolved,
      };
    }
  }
  return null;
}

function findTokenMetaFromLpVaults(
  tokenAddress: string,
  chainId: number,
  vaultsOverride?: any
): { symbol: string; decimals: number; address: string; iconSrc?: string } | null {
  const addrL = lc(tokenAddress);
  const source = vaultsOverride ?? lpVaultsDefault;
  const list: any[] = Array.isArray(source) ? source : Object.values(source);

  for (const v of list) {
    const byChain =
      v?.addresses?.[chainId] ??
      v?.address?.[chainId] ??
      v?.blpTokenAddress?.[chainId] ??
      v?.blpTokenAddress;
    const resolved = typeof byChain === "string" ? byChain : undefined;
    if (resolved && lc(resolved) === addrL) {
      return {
        symbol: v?.symbol ?? v?.name ?? v?.vaultSymbol ?? v?.tokenSymbol ?? "UNKNOWN",
        decimals: v?.decimals ?? v?.tokenDecimals ?? 18,
        address: resolved,
        iconSrc: v?.iconSrc ?? v?.icon ?? v?.logoURI ?? v?.logo ?? v?.image ?? v?.icon_url,
      };
    }
  }
  return null;
}

// ---------- 표시/가격 포함 토큰 정보 ----------
function makeTokenInfo(
  tokenAddr: string,
  amountRaw: string | number | bigint,
  chainId: number,
  priceMap: ChainLinkPriceMapLike,
  preferLpMeta = false,
  tokensOverride?: any,
  vaultsOverride?: any
): TransactionTokenInfo | null {
  const baseMeta = preferLpMeta
    ? findTokenMetaFromLpVaults(tokenAddr, chainId, vaultsOverride) ??
      findTokenMetaFromTokens(tokenAddr, chainId, tokensOverride)
    : findTokenMetaFromTokens(tokenAddr, chainId, tokensOverride) ??
      findTokenMetaFromLpVaults(tokenAddr, chainId, vaultsOverride);

  if (!baseMeta) return null; // [SAFE] 메타 없으면 null 반환

  const symbol = baseMeta.symbol;
  const decimals = baseMeta?.decimals ?? 18;
  const iconSrc = (baseMeta as any)?.iconSrc;

  // [FIX] amountRaw를 Number로 변환하면 1e18 등에서 정밀도가 깨집니다.
  //       BigInt(String(...))로 안전 변환.
  const amountBD = new BigDecimal(BigInt(String(amountRaw)), decimals);
  const amount = toExactTrimmed(amountBD);

  let usdAmount: string | undefined;
  const priceMeta = findPriceMeta(tokenAddr, chainId, priceMap);
  if (priceMeta) {
    const priceBD = new BigDecimal(priceMeta.value, priceMeta.decimals);
    usdAmount = toExactTrimmed(amountBD.mul(priceBD) as BigDecimal);
  }

  return { symbol, amount, src: iconSrc, usdAmount };
}

// ---------- singleDeposits / singleWithdraws 파싱 ----------
// [NEW] SingleDeposit / SingleWithdraw을 정확히 반영하기 위한 유틸

type UnderlyingPair = { address: string; amount: string };

function extractUnderlyingFromDeposits(d: any): UnderlyingPair[] {
  const arr = Array.isArray(d?.singleDeposits) ? d.singleDeposits : [];
  const out: UnderlyingPair[] = [];
  for (const item of arr) {
    const addr = item?.underlyingTokenAddress;
    const amt = String(item?.underlyingTokenAmount ?? "0");
    if (typeof addr === "string") out.push({ address: addr, amount: amt });
    else if (Array.isArray(addr)) for (const a of addr) if (typeof a === "string") out.push({ address: a, amount: amt });
  }
  return out;
}

function extractUnderlyingFromWithdraws(d: any): UnderlyingPair[] {
  const arr = Array.isArray(d?.singleWithdraws) ? d.singleWithdraws : [];
  const out: UnderlyingPair[] = [];
  for (const item of arr) {
    const addr = item?.underlyingTokenAddress;
    const amt = String(item?.underlyingTokenAmount ?? "0");
    if (typeof addr === "string") out.push({ address: addr, amount: amt });
    else if (Array.isArray(addr)) for (const a of addr) if (typeof a === "string") out.push({ address: a, amount: amt });
  }
  return out;
}

// ---------- 메인 ----------
export function buildTransactions(
  info: Array<any>,
  chainId: number,
  chainLinkPriceMap: ChainLinkPriceMapLike,
  tokensOverride?: any,
  vaultsOverride?: any
): TransactionProps[] {
  if (!Array.isArray(info) || info.length === 0) return [];

  const txs: TransactionProps[] = [];

  for (const ev of info) {
    const typeStr: string = String(ev?.type ?? "");
    const hash: string = String(ev?.transactionHash ?? ev?.hash ?? "");
    const timestamp: string = String(ev?.blockTimestamp ?? ev?.timestamp ?? "0"); // 초 문자열

    // ---------- SWAP ----------
    if (typeStr === "Swap" || typeStr === "SWAP") {
      const d = ev?.data ?? {};
      const tokenInAddr = d?.tokenIn ?? d?.tokenin ?? d?.TokenIn;
      const tokenOutAddr = d?.tokenOut ?? d?.tokenout ?? d?.TokenOut;
      const amountIn = d?.amountIn ?? d?.AmountIn;
      const amountOut = d?.amountOut ?? d?.AmountOut;

      const from = makeTokenInfo(tokenInAddr, amountIn, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride);
      const to = makeTokenInfo(tokenOutAddr, amountOut, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride);
      if (!from || !to) continue;

      txs.push({ type: TransactionType.SWAP, hash, timestamp, from, to });
      continue;
    }

    // ---------- START_FARM: SingleDeposit | DualDeposit ----------
    if (typeStr === "SingleDeposit" || typeStr === "DualDeposit" || typeStr === "START_FARM") {
      const d = ev?.data ?? {};

      // [FIX] 우선순위: singleDeposits[*] → bToken0/1 → Token0/1 (레거시)
      let fromPairs: UnderlyingPair[] = extractUnderlyingFromDeposits(d); // singleDeposits 우선

      if (fromPairs.length === 0) {
        // bToken0/bToken1 (DualDeposit)
        const b0Addr = d?.bToken0Address ?? d?.Token0Address ?? d?.token0 ?? d?.token0Address; // [FIX] bToken* 우선
        const b1Addr = d?.bToken1Address ?? d?.Token1Address ?? d?.token1 ?? d?.token1Address; // [FIX]
        const b0Amt = d?.bToken0Amount ?? d?.Token0Amount ?? d?.token0Amount ?? d?.amount0;
        const b1Amt = d?.bToken1Amount ?? d?.Token1Amount ?? d?.token1Amount ?? d?.amount1;
        if (b0Addr && b0Amt) fromPairs.push({ address: String(b0Addr), amount: String(b0Amt) });
        if (b1Addr && b1Amt) fromPairs.push({ address: String(b1Addr), amount: String(b1Amt) });
      }

      const from: TransactionTokenInfo[] = fromPairs
        .map(({ address, amount }) =>
          makeTokenInfo(address, amount, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride)
        )
        .filter((x): x is TransactionTokenInfo => Boolean(x));

      if (from.length === 0) continue; // [SAFE] 표시할 입력 토큰이 없으면 스킵

      // LP (to)
      const lpAddr = d?.blpTokenAddress ?? d?.bTokenAddress ?? d?.lpToken ?? d?.lpTokenAddress; // [FIX] bTokenAddress도 수용
      const lpAmt = d?.blpTokenAmount ?? d?.bTokenAmount ?? d?.lpAmount ?? d?.amountLP; // [FIX]

      const to = makeTokenInfo(lpAddr, lpAmt, chainId, chainLinkPriceMap, true, tokensOverride, vaultsOverride);
      if (!to) continue;
      delete (to as any).usdAmount; // [SAFE] LP는 usdAmount 보통 없음

      txs.push({ type: TransactionType.START_FARM, hash, timestamp, from, to });
      continue;
    }

    // ---------- STOP_FARM: SingleWithdraw | DualWithdraw ----------
    if (typeStr === "SingleWithdraw" || typeStr === "DualWithdraw" || typeStr === "STOP_FARM") {
      const d = ev?.data ?? {};

      // LP (from)
      const lpAddr = d?.blpTokenAddress ?? d?.bTokenAddress ?? d?.lpToken ?? d?.lpTokenAddress; // [FIX]
      const lpAmt = d?.blpTokenAmount ?? d?.bTokenAmount ?? d?.lpAmount ?? d?.amountLP; // [FIX]

      const from = makeTokenInfo(lpAddr, lpAmt, chainId, chainLinkPriceMap, true, tokensOverride, vaultsOverride);
      if (!from) continue;
      delete (from as any).usdAmount; // [SAFE]

      // [FIX] 우선순위: singleWithdraws[*] → bToken0/1 → Token0/1 (레거시)
      let toPairs: UnderlyingPair[] = extractUnderlyingFromWithdraws(d); // singleWithdraws 우선

      if (toPairs.length === 0) {
        const b0Addr = d?.bToken0Address ?? d?.Token0Address ?? d?.token0 ?? d?.token0Address; // [FIX]
        const b1Addr = d?.bToken1Address ?? d?.Token1Address ?? d?.token1 ?? d?.token1Address; // [FIX]
        const b0Amt = d?.bToken0Amount ?? d?.Token0Amount ?? d?.token0Amount ?? d?.amount0;
        const b1Amt = d?.bToken1Amount ?? d?.Token1Amount ?? d?.token1Amount ?? d?.amount1;
        if (b0Addr && b0Amt) toPairs.push({ address: String(b0Addr), amount: String(b0Amt) });
        if (b1Addr && b1Amt) toPairs.push({ address: String(b1Addr), amount: String(b1Amt) });
      }

      const to: TransactionTokenInfo[] = toPairs
        .map(({ address, amount }) =>
          makeTokenInfo(address, amount, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride)
        )
        .filter((x): x is TransactionTokenInfo => Boolean(x));

      if (to.length === 0) continue; // [SAFE]

      txs.push({ type: TransactionType.STOP_FARM, hash, timestamp, from, to });
      continue;
    }

    // 알려지지 않은 타입은 스킵 (필요 시 로깅)
  }

  return txs;
}


// const lc = (s?: string) => (s ? s.toLowerCase() : "");
// const isObj = (x: unknown): x is Record<string, unknown> =>
//   typeof x === "object" && x !== null;

// // BigDecimal → "decimals 반영 + 뒤 0 제거"
// const toExactTrimmed = (bd: BigDecimal) =>

//   bd.toPrecisionString(true, false);

// // ---------- 체인링크 가격 맵 타입 유연 처리 ----------
// type ChainLinkData = {
//   base?: { addresses?: Record<number, string> };
//   value?: { base?: { addresses?: Record<number, string> }; price?: any; priceData?: any };
//   price?: any;
//   priceData?: any;
// };
// export type ChainLinkPriceMapLike =
//   | Map<string, ChainLinkData>
//   | Record<string, ChainLinkData>
//   | ChainLinkData[]
//   | undefined;

// function normalizeToArray(src: ChainLinkPriceMapLike): ChainLinkData[] {
//   if (!src) return [];
//   if (Array.isArray(src)) return src;
//   if (src instanceof Map) return Array.from(src.values());
//   if (typeof src === "object") return Object.values(src);
//   return [];
// }

// function findPriceMeta(
//   tokenAddress: string,
//   chainId: number,
//   priceMap: ChainLinkPriceMapLike
// ): { value: bigint; decimals: number } | null {
//   const items = normalizeToArray(priceMap);
//   const addrL = lc(tokenAddress);
//   for (const item of items) {
//     const matchAddr =
//       lc(item?.value?.base?.addresses?.[chainId]) ||
//       lc(item?.base?.addresses?.[chainId]);
//     if (!matchAddr || matchAddr !== addrL) continue;

//     const price = item?.value?.price ?? item?.value?.priceData ?? item?.price ?? item?.priceData;
//     if (!isObj(price)) return null;
//     const val = (price as any).value ?? (price as any).raw ?? (price as any).amount;
//     const dec = (price as any).decimals ?? 8;
//     if (val == null) return null;
//     return { value: BigInt(Number(val)), decimals: Number(dec) };
//   }
//   return null;
// }

// // ---------- 메타 조회 ----------
// function findTokenMetaFromTokens(
//   tokenAddress: string,
//   chainId: number,
//   tokensOverride?: any
// ): { symbol: string; decimals: number; iconSrc?: string; address: string } | null {
//   const addrL = lc(tokenAddress);
//   const source = tokensOverride ?? tokensDefault;
//   const list: any[] = Array.isArray(source) ? source : Object.values(source);

//   for (const t of list) {
//     const byChain =
//       t?.addresses?.[chainId] ??
//       t?.address?.[chainId] ??
//       t?.chains?.[chainId] ??
//       t?.address;
//     const resolved = typeof byChain === "string" ? byChain : undefined;
//     if (resolved && lc(resolved) === addrL) {
//       return {
//         symbol: t.symbol ?? t.ticker ?? t.name ?? "UNKNOWN",
//         decimals: t.decimals ?? t.tokenDecimals ?? 18,
//         iconSrc: t.iconSrc ?? t.icon ?? t.logoURI,
//         address: resolved,
//       };
//     }
//   }
//   return null;
// }

// function findTokenMetaFromLpVaults(
//   tokenAddress: string,
//   chainId: number,
//   vaultsOverride?: any
// ): { symbol: string; decimals: number; address: string; iconSrc?: string } | null {
//   const addrL = lc(tokenAddress);
//   const source = vaultsOverride ?? lpVaultsDefault;
//   const list: any[] = Array.isArray(source) ? source : Object.values(source);

//   for (const v of list) {
//     const byChain =
//       v?.addresses?.[chainId] ??
//       v?.address?.[chainId] ??
//       v?.blpTokenAddress?.[chainId] ??
//       v?.blpTokenAddress;
//     const resolved = typeof byChain === "string" ? byChain : undefined;
//     if (resolved && lc(resolved) === addrL) {
//       return {
//         symbol: v?.symbol ?? v?.name ?? v?.vaultSymbol ?? v?.tokenSymbol ?? "UNKNOWN",
//         decimals: v?.decimals ?? v?.tokenDecimals ?? 18,
//         address: resolved,
//         iconSrc: v?.iconSrc ?? v?.icon ?? v?.logoURI ?? v?.logo ?? v?.image ?? v?.icon_url,
//       };
//     }
//   }
//   return null;
// }

// // ---------- 표시/가격 포함 토큰 정보 ----------
// function makeTokenInfo(
//   tokenAddr: string,
//   amountRaw: string | number | bigint,
//   chainId: number,
//   priceMap: ChainLinkPriceMapLike,
//   preferLpMeta = false,
//   tokensOverride?: any,
//   vaultsOverride?: any
// ): TransactionTokenInfo | null {
//   const baseMeta = preferLpMeta
//     ? findTokenMetaFromLpVaults(tokenAddr, chainId, vaultsOverride) ??
//       findTokenMetaFromTokens(tokenAddr, chainId, tokensOverride)
//     : findTokenMetaFromTokens(tokenAddr, chainId, tokensOverride) ??
//       findTokenMetaFromLpVaults(tokenAddr, chainId, vaultsOverride);

//   if (!baseMeta) return null;                        // [CHANGED] 메타 없으면 null 반환

//   const symbol = baseMeta.symbol; 
//   const decimals = baseMeta?.decimals ?? 18;
//   const iconSrc = (baseMeta as any)?.iconSrc;

//   const amountBD = new BigDecimal(BigInt(Number(amountRaw)), decimals);
//   const amount = toExactTrimmed(amountBD);

//   let usdAmount: string | undefined;
//   const priceMeta = findPriceMeta(tokenAddr, chainId, priceMap);
//   if (priceMeta) {
//     const priceBD = new BigDecimal(priceMeta.value, priceMeta.decimals);
//     usdAmount = toExactTrimmed(amountBD.mul(priceBD) as BigDecimal);
//   }

//   return { symbol, amount, src: iconSrc, usdAmount };
// }

// // ---------- NEW: singleDeposits / singleWithdraws 파싱 ----------
// type UnderlyingPair = { address: string; amount: string };

// function extractUnderlyingFromDeposits(d: any): UnderlyingPair[] {
//   const arr = Array.isArray(d?.singleDeposits) ? d.singleDeposits : [];
//   const out: UnderlyingPair[] = [];
//   for (const item of arr) {
//     const addr = item?.underlyingTokenAddress;
//     const amt = String(item?.underlyingTokenAmount ?? "0");
//     if (typeof addr === "string") {
//       out.push({ address: addr, amount: amt });
//     } else if (Array.isArray(addr)) {
//       // 주소 배열이 들어오는 예외 케이스도 방어적으로 처리
//       for (const a of addr) if (typeof a === "string") out.push({ address: a, amount: amt });
//     }
//   }
//   return out;
// }

// function extractUnderlyingFromWithdraws(d: any): UnderlyingPair[] {
//   const arr = Array.isArray(d?.singleWithdraws) ? d.singleWithdraws : [];
//   const out: UnderlyingPair[] = [];
//   for (const item of arr) {
//     const addr = item?.underlyingTokenAddress;
//     const amt = String(item?.underlyingTokenAmount ?? "0");
//     if (typeof addr === "string") {
//       out.push({ address: addr, amount: amt });
//     } else if (Array.isArray(addr)) {
//       for (const a of addr) if (typeof a === "string") out.push({ address: a, amount: amt });
//     }
//   }
//   return out;
// }

// // ---------- 메인 ----------
// export function buildTransactions(
//   info: Array<any>,
//   chainId: number,
//   chainLinkPriceMap: ChainLinkPriceMapLike,
//   tokensOverride?: any,
//   vaultsOverride?: any
// ): TransactionProps[] {
//   if (!Array.isArray(info) || info.length === 0) return [];

//   const txs: TransactionProps[] = [];

//   for (const ev of info) {
//     const typeStr: string = String(ev?.type ?? "");
//     const hash: string = String(ev?.transactionHash ?? ev?.hash ?? "");
//     const timestamp: string = String(ev?.blockTimestamp ?? ev?.timestamp ?? "0"); // 초 문자열

//     // ---------- SWAP (기존 그대로) ----------
//     if (typeStr === "Swap" || typeStr === "SWAP") {
//       const d = ev?.data ?? {};
//       const tokenInAddr = d?.tokenIn ?? d?.tokenin ?? d?.TokenIn;
//       const tokenOutAddr = d?.tokenOut ?? d?.tokenout ?? d?.TokenOut;
//       const amountIn = d?.amountIn ?? d?.AmountIn;
//       const amountOut = d?.amountOut ?? d?.AmountOut;

//       const from = makeTokenInfo(tokenInAddr, amountIn, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride);
//       const to   = makeTokenInfo(tokenOutAddr, amountOut, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride);

//       if (!from || !to) continue;    

//       txs.push({ type: TransactionType.SWAP, hash, timestamp, from, to });
//       continue;
//     }

//     // ---------- START_FARM: SingleDeposit | DualDeposit (스키마 변경 반영) ----------
//     if (typeStr === "SingleDeposit" || typeStr === "DualDeposit" || typeStr === "START_FARM") {
//       const d = ev?.data ?? {};

//       // from: singleDeposits[*].underlyingTokenAddress/underlyingTokenAmount
//       // const pairs = extractUnderlyingFromDeposits(d);
//       // const from: TransactionTokenInfo[] = pairs.map(({ address, amount }) =>
//       //   makeTokenInfo(address, amount, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride)
//       // );

//       // // to: LP (주소/수량 키는 blpTokenAddress|bTokenAddress, blpTokenAmount|bTokenAmount)
//       // const lpAddr = d?.blpTokenAddress ?? d?.bTokenAddress ?? d?.lpToken ?? d?.lpTokenAddress;
//       // const lpAmt  = d?.blpTokenAmount  ?? d?.bTokenAmount  ?? d?.lpAmount ?? d?.amountLP;
//       // const to = makeTokenInfo(lpAddr, lpAmt, chainId, chainLinkPriceMap, true, tokensOverride, vaultsOverride);
//       // delete to.usdAmount; // LP는 usdAmount 보통 없음

//       // txs.push({ type: TransactionType.START_FARM, hash, timestamp, from, to });
//       // continue;
//       const t0Addr = d?.Token0Address ?? d?.token0 ?? d?.token0Address;
//       const t1Addr = d?.Token1Address ?? d?.token1 ?? d?.token1Address;
//       const t0Amt = d?.Token0Amount ?? d?.token0Amount ?? d?.amount0;
//       const t1Amt = d?.Token1Amount ?? d?.token1Amount ?? d?.amount1;

//       const lpAddr = d?.blpTokenAddress ?? d?.lpToken ?? d?.lpTokenAddress;
//       const lpAmt = d?.blpTokenAmount ?? d?.lpAmount ?? d?.amountLP;

//       const from: TransactionTokenInfo[] = [];

//       if (t0Addr && t0Amt) {
//         const f0 = makeTokenInfo(
//           t0Addr,
//           t0Amt,
//           chainId,
//           chainLinkPriceMap,
//           false,
//           tokensOverride,
//           vaultsOverride
//         );
//         if (!f0) continue;                        // [CHANGED] 하나라도 못 찾으면 제외
//         from.push(f0);
//       }
//       if (t1Addr && t1Amt) {
//         const f1 = makeTokenInfo(
//           t1Addr,
//           t1Amt,
//           chainId,
//           chainLinkPriceMap,
//           false,
//           tokensOverride,
//           vaultsOverride
//         );
//         if (!f1) continue;                        // [CHANGED]
//         from.push(f1);
//       }

//       const to = makeTokenInfo(
//         lpAddr,
//         lpAmt,
//         chainId,
//         chainLinkPriceMap,
//         true, // LP 메타 우선
//         tokensOverride,
//         vaultsOverride
//       );
//       if (!to) continue;                          // [CHANGED] LP 메타 못 찾으면 제외
//       delete to.usdAmount;                        // LP는 usdAmount 의미 없으니 제거 (기존 유지)

//       txs.push({
//         type: TransactionType.START_FARM,
//         hash,
//         timestamp,
//         from,
//         to,
//       });
//       continue;
//     }

//     // ---------- STOP_FARM: SingleWithdraw | DualWithdraw (스키마 변경 반영) ----------
//     if (typeStr === "SingleWithdraw" || typeStr === "DualWithdraw" || typeStr === "STOP_FARM") {
//       const d = ev?.data ?? {};

//       // from: LP
//       // const lpAddr = d?.blpTokenAddress ?? d?.bTokenAddress ?? d?.lpToken ?? d?.lpTokenAddress;
//       // const lpAmt  = d?.blpTokenAmount  ?? d?.bTokenAmount  ?? d?.lpAmount ?? d?.amountLP;
//       // const from = makeTokenInfo(lpAddr, lpAmt, chainId, chainLinkPriceMap, true, tokensOverride, vaultsOverride);
//       // delete (from as any).usdAmount;

//       // // to: singleWithdraws[*].underlyingTokenAddress/underlyingTokenAmount
//       // const pairs = extractUnderlyingFromWithdraws(d);
//       // const to: TransactionTokenInfo[] = pairs.map(({ address, amount }) =>
//       //   makeTokenInfo(address, amount, chainId, chainLinkPriceMap, false, tokensOverride, vaultsOverride)
//       // );

//       // txs.push({ type: TransactionType.STOP_FARM, hash, timestamp, from, to });
//       // continue;
//       const lpAddr = d?.blpTokenAddress ?? d?.lpToken ?? d?.lpTokenAddress;
//       const lpAmt = d?.blpTokenAmount ?? d?.lpAmount ?? d?.amountLP;

//       const t0Addr = d?.Token0Address ?? d?.token0 ?? d?.token0Address;
//       const t1Addr = d?.Token1Address ?? d?.token1 ?? d?.token1Address;
//       const t0Amt = d?.Token0Amount ?? d?.token0Amount ?? d?.amount0;
//       const t1Amt = d?.Token1Amount ?? d?.token1Amount ?? d?.amount1;

//       const from = makeTokenInfo(
//         lpAddr,
//         lpAmt,
//         chainId,
//         chainLinkPriceMap,
//         true, // LP 메타 우선
//         tokensOverride,
//         vaultsOverride
//       );
//       if (!from) continue;                        // [CHANGED]
//       delete from.usdAmount;                      // 기존 유지

//       const to: TransactionTokenInfo[] = [];
//       if (t0Addr && t0Amt) {
//         const t0 = makeTokenInfo(
//           t0Addr,
//           t0Amt,
//           chainId,
//           chainLinkPriceMap,
//           false,
//           tokensOverride,
//           vaultsOverride
//         );
//         if (!t0) continue;                        // [CHANGED]
//         to.push(t0);
//       }
//       if (t1Addr && t1Amt) {
//         const t1 = makeTokenInfo(
//           t1Addr,
//           t1Amt,
//           chainId,
//           chainLinkPriceMap,
//           false,
//           tokensOverride,
//           vaultsOverride
//         );
//         if (!t1) continue;                        // [CHANGED]
//         to.push(t1);
//       }

//       txs.push({
//         type: TransactionType.STOP_FARM,
//         hash,
//         timestamp,
//         from,
//         to,
//       });
//       continue;
//     }

//     // 알려지지 않은 타입은 스킵 (필요 시 로깅)
//   }

//   return txs;
// }

