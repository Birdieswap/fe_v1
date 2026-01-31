// src/utils/wallet/buildTransactions.ts
import lpVaultsDefault from "@/const/contracts/tokens/lpVaults";
import tokensDefault from "@/const/contracts/tokens/tokens";
import externalTokensDefault from "@/const/contracts/tokens/externalTokens";
import { BigDecimal } from "@/types/BigDecimal";
import type { aprDataState } from "@/app/AssetsContextProvider";
import {
  TransactionType,
  type TransactionWithKey,
  type TransactionTokenInfo,
} from "./txType";

const lc = (s?: string) => (s ? s.toLowerCase() : "");
const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;
const NATIVE_PLACEHOLDER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

function normalizeTokenAddress(tokenAddress: string, chainId: number): string {
  if (lc(tokenAddress) !== NATIVE_PLACEHOLDER) return tokenAddress;
  return tokensDefault.ETH.addresses?.[chainId] ?? tokenAddress;
}

function makeTxKey(ev: any): string {
  const block = String(ev?.blockNumber ?? "");
  const txIndex = String(ev?.transactionIndex ?? "0").padStart(4, "0");
  const logIndex = String(ev?.logIndex ?? "0").padStart(4, "0");
  const key = `${block}${txIndex}${logIndex}`;
  return key || String(ev?.transactionHash ?? ev?.hash ?? "");
}

// BigDecimal → "decimals 반영 + 뒤 0 제거"
const toExactTrimmed = (bd: BigDecimal) => bd.toPrecisionString(true, false);

// ---------- 체인링크 가격 맵 타입 유연 처리 ----------
type ChainLinkData = {
  base?: { addresses?: Record<number, string> };
  value?: {
    base?: { addresses?: Record<number, string> };
    price?: any;
    priceData?: any;
  };
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
  priceMap: ChainLinkPriceMapLike,
): { value: bigint; decimals: number } | null {
  const normalizedAddr = normalizeTokenAddress(tokenAddress, chainId);
  const items = normalizeToArray(priceMap);
  const addrL = lc(normalizedAddr);
  for (const item of items) {
    const matchAddr =
      lc(item?.value?.base?.addresses?.[chainId]) ||
      lc(item?.base?.addresses?.[chainId]);
    if (!matchAddr || matchAddr !== addrL) continue;

    const price =
      item?.value?.price ??
      item?.value?.priceData ??
      item?.price ??
      item?.priceData;
    if (!isObj(price)) return null;
    const val =
      (price as any).value ?? (price as any).raw ?? (price as any).amount;
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
  tokensOverride?: any,
  externalTokensOverride?: any,
): {
  symbol: string;
  decimals: number;
  iconSrc?: string;
  address: string;
} | null {
  const addrL = lc(tokenAddress);

  const sources = [
    tokensOverride ?? tokensDefault,
    externalTokensOverride ?? externalTokensDefault, //  추가
  ];

  for (const source of sources) {
    if (!source) continue;
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
  }

  return null;
}

function findTokenMetaFromLpVaults(
  tokenAddress: string,
  chainId: number,
  vaultsOverride?: any,
): {
  symbol: string;
  decimals: number;
  address: string;
  iconSrc?: string;
} | null {
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
        symbol:
          v?.symbol ?? v?.name ?? v?.vaultSymbol ?? v?.tokenSymbol ?? "UNKNOWN",
        decimals: v?.decimals ?? v?.tokenDecimals ?? 18,
        address: resolved,
        iconSrc:
          v?.iconSrc ??
          v?.icon ??
          v?.logoURI ??
          v?.logo ??
          v?.image ??
          v?.icon_url,
      };
    }
  }
  return null;
}

function findLpVaultMetaFromAprStaking(
  stakingContractAddr: string | undefined,
  chainId: number,
  aprData: aprDataState | null | undefined,
  vaultsOverride?: any,
): {
  symbol: string;
  decimals: number;
  address: string;
  iconSrc?: string;
} | null {
  const target = lc(stakingContractAddr);
  if (!target) return null;
  const list = Array.isArray(aprData?.apr) ? aprData?.apr : [];
  const match = list.find((e) => lc(e?.staking?.contractAddress) === target);
  const lpVaultAddr = match?.contractAddress;
  if (!lpVaultAddr) return null;
  return findTokenMetaFromLpVaults(lpVaultAddr, chainId, vaultsOverride);
}

// ---------- 표시/가격 포함 토큰 정보 ----------
function makeTokenInfo(
  tokenAddr: string,
  amountRaw: string | number | bigint,
  chainId: number,
  priceMap: ChainLinkPriceMapLike,
  preferLpMeta = false,
  tokensOverride?: any,
  vaultsOverride?: any,
  externalTokensOverride?: any, // 추가
): TransactionTokenInfo | null {
  const normalizedAddr = normalizeTokenAddress(tokenAddr, chainId);
  const baseMeta = preferLpMeta
    ? (findTokenMetaFromLpVaults(normalizedAddr, chainId, vaultsOverride) ??
      findTokenMetaFromTokens(
        normalizedAddr,
        chainId,
        tokensOverride,
        externalTokensOverride,
      ))
    : (findTokenMetaFromTokens(
        normalizedAddr,
        chainId,
        tokensOverride,
        externalTokensOverride,
      ) ?? findTokenMetaFromLpVaults(normalizedAddr, chainId, vaultsOverride));

  if (!baseMeta) return null; // [SAFE] 메타 없으면 null 반환

  const symbol = baseMeta.symbol;
  const decimals = baseMeta?.decimals ?? 18;
  const iconSrc = (baseMeta as any)?.iconSrc;

  // [FIX] amountRaw를 Number로 변환하면 1e18 등에서 정밀도가 깨집니다.
  //       BigInt(String(...))로 안전 변환.
  const amountBD = new BigDecimal(BigInt(String(amountRaw)), decimals);
  const amount = toExactTrimmed(amountBD);

  let usdAmount: string | undefined;
  const priceMeta = findPriceMeta(normalizedAddr, chainId, priceMap);
  if (priceMeta) {
    const priceBD = new BigDecimal(priceMeta.value, priceMeta.decimals);
    usdAmount = toExactTrimmed(amountBD.mul(priceBD) as BigDecimal);
  }

  return { symbol, amount, src: iconSrc, usdAmount };
}

function makeStakeTokenInfo(
  symbol: string,
  src: string | undefined,
  amountRaw: string | number | bigint,
  decimals: number, // ← 여기서는 8 고정으로 사용
): TransactionTokenInfo {
  // BigDecimal( raw, decimals ) → "정확한 문자열" (뒤 0 제거)
  const bd = new BigDecimal(BigInt(String(amountRaw)), decimals);
  const amount = toExactTrimmed(bd);
  return { symbol, amount, src };
}

function findEthIconSrc() {
  return tokensDefault.ETH?.iconSrc ?? "/tokens/ETH.svg";
}

function normalizeWethToEth(
  tokenAddr: string,
  chainId: number,
  info: TransactionTokenInfo
): TransactionTokenInfo {
  const wethAddr = tokensDefault.WETH?.addresses?.[chainId];
  if (wethAddr && lc(wethAddr) === lc(tokenAddr)) {
    return { ...info, symbol: "ETH", src: findEthIconSrc() };
  }
  if (info.symbol === "WETH") {
    return { ...info, symbol: "ETH", src: findEthIconSrc() };
  }
  return info;
}

function getUsdcMeta(chainId: number) {
  const meta = tokensDefault.USDC;
  const addr = meta?.addresses?.[chainId];
  return {
    symbol: meta?.symbol ?? "USDC",
    decimals: meta?.decimals ?? 6,
    iconSrc: meta?.iconSrc ?? "/tokens/USDC.svg",
    address: addr ?? "",
  };
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
    else if (Array.isArray(addr))
      for (const a of addr)
        if (typeof a === "string") out.push({ address: a, amount: amt });
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
    else if (Array.isArray(addr))
      for (const a of addr)
        if (typeof a === "string") out.push({ address: a, amount: amt });
  }
  return out;
}

// ---------- 메인 ----------
export function buildTransactions(
  info: Array<any>,
  chainId: number,
  chainLinkPriceMap: ChainLinkPriceMapLike,
  tokensOverride?: any,
  vaultsOverride?: any,
  aprDataState?: aprDataState | null,
): TransactionWithKey[] {
  if (!Array.isArray(info) || info.length === 0) return [];

  const txs: TransactionWithKey[] = [];

  for (const ev of info) {
    const typeStr: string = String(ev?.type ?? "");
    const hash: string = String(ev?.transactionHash ?? ev?.hash ?? "");
    const timestamp: string = String(
      ev?.blockTimestamp ?? ev?.timestamp ?? "0",
    ); // 초 문자열
    const key = makeTxKey(ev);

    // ---------- SWAP ----------
    if (typeStr === "Swap" || typeStr === "SWAP") {
      const d = ev?.data ?? {};
      const tokenInAddr = d?.tokenIn ?? d?.tokenin ?? d?.TokenIn;
      const tokenOutAddr = d?.tokenOut ?? d?.tokenout ?? d?.TokenOut;
      const amountIn = d?.amountIn ?? d?.AmountIn;
      const amountOut = d?.amountOut ?? d?.AmountOut;

      const from = makeTokenInfo(
        tokenInAddr,
        amountIn,
        chainId,
        chainLinkPriceMap,
        false,
        tokensOverride,
        vaultsOverride,
        externalTokensDefault, // 추가
      );
      const to = makeTokenInfo(
        tokenOutAddr,
        amountOut,
        chainId,
        chainLinkPriceMap,
        false,
        tokensOverride,
        vaultsOverride,
        externalTokensDefault, //  추가
      );
      if (!from || !to) continue;

      txs.push({ type: TransactionType.SWAP, key, hash, timestamp, from, to });
      continue;
    }

    // ---------- START_FARM: SingleDeposit | DualDeposit ----------
    if (
      typeStr === "SingleDeposit" ||
      typeStr === "DualDeposit" ||
      typeStr === "START_FARM"
    ) {
      const d = ev?.data ?? {};

      // [FIX] 우선순위: singleDeposits[*] → bToken0/1 → Token0/1 (레거시)
      let fromPairs: UnderlyingPair[] = extractUnderlyingFromDeposits(d); // singleDeposits 우선

      if (fromPairs.length === 0) {
        // bToken0/bToken1 (DualDeposit)
        const b0Addr =
          d?.bToken0Address ??
          d?.Token0Address ??
          d?.token0 ??
          d?.token0Address; // [FIX] bToken* 우선
        const b1Addr =
          d?.bToken1Address ??
          d?.Token1Address ??
          d?.token1 ??
          d?.token1Address; // [FIX]
        const b0Amt =
          d?.bToken0Amount ?? d?.Token0Amount ?? d?.token0Amount ?? d?.amount0;
        const b1Amt =
          d?.bToken1Amount ?? d?.Token1Amount ?? d?.token1Amount ?? d?.amount1;
        if (b0Addr && b0Amt)
          fromPairs.push({ address: String(b0Addr), amount: String(b0Amt) });
        if (b1Addr && b1Amt)
          fromPairs.push({ address: String(b1Addr), amount: String(b1Amt) });
      }

      const from: TransactionTokenInfo[] = fromPairs
        .map(({ address, amount }) =>
          makeTokenInfo(
            address,
            amount,
            chainId,
            chainLinkPriceMap,
            false,
            tokensOverride,
            vaultsOverride,
          ),
        )
        .filter((x): x is TransactionTokenInfo => Boolean(x));

      if (from.length === 0) continue; // [SAFE] 표시할 입력 토큰이 없으면 스킵

      // LP (to)
      const lpAddr =
        d?.blpTokenAddress ??
        d?.bTokenAddress ??
        d?.lpToken ??
        d?.lpTokenAddress; // [FIX] bTokenAddress도 수용
      const lpAmt =
        d?.blpTokenAmount ?? d?.bTokenAmount ?? d?.lpAmount ?? d?.amountLP; // [FIX]

      const to = makeTokenInfo(
        lpAddr,
        lpAmt,
        chainId,
        chainLinkPriceMap,
        true,
        tokensOverride,
        vaultsOverride,
      );
      if (!to) continue;
      delete (to as any).usdAmount; // [SAFE] LP는 usdAmount 보통 없음

      txs.push({
        type: TransactionType.START_FARM,
        key,
        hash,
        timestamp,
        from,
        to,
      });
      continue;
    }

    // ---------- STOP_FARM: SingleWithdraw | DualWithdraw ----------
    if (
      typeStr === "SingleWithdraw" ||
      typeStr === "DualWithdraw" ||
      typeStr === "STOP_FARM"
    ) {
      const d = ev?.data ?? {};

      // LP (from)
      const lpAddr =
        d?.blpTokenAddress ??
        d?.bTokenAddress ??
        d?.lpToken ??
        d?.lpTokenAddress; // [FIX]
      const lpAmt =
        d?.blpTokenAmount ?? d?.bTokenAmount ?? d?.lpAmount ?? d?.amountLP; // [FIX]

      const from = makeTokenInfo(
        lpAddr,
        lpAmt,
        chainId,
        chainLinkPriceMap,
        true,
        tokensOverride,
        vaultsOverride,
      );
      if (!from) continue;
      delete (from as any).usdAmount; // [SAFE]

      // [FIX] 우선순위: singleWithdraws[*] → bToken0/1 → Token0/1 (레거시)
      let toPairs: UnderlyingPair[] = extractUnderlyingFromWithdraws(d); // singleWithdraws 우선

      if (toPairs.length === 0) {
        const b0Addr =
          d?.bToken0Address ??
          d?.Token0Address ??
          d?.token0 ??
          d?.token0Address; // [FIX]
        const b1Addr =
          d?.bToken1Address ??
          d?.Token1Address ??
          d?.token1 ??
          d?.token1Address; // [FIX]
        const b0Amt =
          d?.bToken0Amount ?? d?.Token0Amount ?? d?.token0Amount ?? d?.amount0;
        const b1Amt =
          d?.bToken1Amount ?? d?.Token1Amount ?? d?.token1Amount ?? d?.amount1;
        if (b0Addr && b0Amt)
          toPairs.push({ address: String(b0Addr), amount: String(b0Amt) });
        if (b1Addr && b1Amt)
          toPairs.push({ address: String(b1Addr), amount: String(b1Amt) });
      }

      const to: TransactionTokenInfo[] = toPairs
        .map(({ address, amount }) =>
          makeTokenInfo(
            address,
            amount,
            chainId,
            chainLinkPriceMap,
            false,
            tokensOverride,
            vaultsOverride,
          ),
        )
        .filter((x): x is TransactionTokenInfo => Boolean(x));

      if (to.length === 0) continue; // [SAFE]

      txs.push({
        type: TransactionType.STOP_FARM,
        key,
        hash,
        timestamp,
        from,
        to,
      });
      continue;
    }

    // ---------- STAKING_DEPOSIT ----------
    if (typeStr === "StakingDeposit") {
      const d = ev?.data ?? {};
      const hash: string = String(ev?.transactionHash ?? ev?.hash ?? "");
      const timestamp: string = String(
        ev?.blockTimestamp ?? ev?.timestamp ?? "0",
      );

      const stakingTokenAddr: string | undefined = d?.stakingTokenAddress;

      // ✅ stakingTokenAddress로 메타 찾기 (LP vault 우선)
      const meta =
        (stakingTokenAddr
          ? (findTokenMetaFromLpVaults(
              stakingTokenAddr,
              chainId,
              vaultsOverride,
            ) ??
            findTokenMetaFromTokens(stakingTokenAddr, chainId, tokensOverride))
          : null) ?? null;

      const displayName = meta?.symbol ?? "Vault";

      // amount: / 10^8 (기존 로직 유지)
      const amtRaw = d?.stakingAmount ?? d?.amount ?? "0";
      const DEC = meta?.decimals ?? 18;

      // ✅ 아이콘: 메타가 있으면 그걸 사용, 없으면 기존 기본값
      const fromSrc = "/tokens/blp-token.svg";
      const toSrc = "/tokens/sblp-token.svg";

      const from = makeStakeTokenInfo(displayName, fromSrc, amtRaw, DEC);
      const to = makeStakeTokenInfo(displayName, toSrc, amtRaw, DEC);

      txs.push({
        type: TransactionType.STAKING,
        key,
        hash,
        timestamp,
        from,
        to,
      });
      continue;
    }

    // ---------- STAKING_WITHDRAW ----------
    if (typeStr === "StakingWithdraw") {
      const d = ev?.data ?? {};
      const hash: string = String(ev?.transactionHash ?? ev?.hash ?? "");
      const timestamp: string = String(
        ev?.blockTimestamp ?? ev?.timestamp ?? "0",
      );

      const stakingTokenAddr: string | undefined = d?.stakingTokenAddress;

      // ✅ stakingTokenAddress로 메타 찾기 (LP vault 우선)
      const meta =
        (stakingTokenAddr
          ? (findTokenMetaFromLpVaults(
              stakingTokenAddr,
              chainId,
              vaultsOverride,
            ) ??
            findTokenMetaFromTokens(stakingTokenAddr, chainId, tokensOverride))
          : null) ?? null;

      const displayName = meta?.symbol ?? "Vault";

      const amtRaw = d?.stakingAmount ?? d?.amount ?? "0";
      const DEC = meta?.decimals ?? 18;

      const fromSrc = "/tokens/sblp-token.svg";
      const toSrc = "/tokens/blp-token.svg";

      const from = makeStakeTokenInfo(displayName, fromSrc, amtRaw, DEC);
      const to = makeStakeTokenInfo(displayName, toSrc, amtRaw, DEC);

      txs.push({
        type: TransactionType.UNSTAKING,
        key,
        hash,
        timestamp,
        from,
        to,
      });
      continue;
    }

    // ---------- STAKING_CLAIM ----------
    if (typeStr === "StakingClaim") {
      const d = ev?.data ?? {};
      const hash: string = String(ev?.transactionHash ?? ev?.hash ?? "");
      const timestamp: string = String(
        ev?.blockTimestamp ?? ev?.timestamp ?? "0",
      );

      const rewardSymbol: string = String(
        d?.rewardSymbol ?? d?.symbol ?? "REWARD",
      );
      const amtRaw = d?.rewardAmount ?? d?.amount ?? "0";
      const DEC = d.rewardDecimals;

      const to = makeStakeTokenInfo(
        rewardSymbol,
        `/tokens/${rewardSymbol}.svg`,
        amtRaw,
        DEC,
      );

      txs.push({
        type: TransactionType.CLAIM ?? ("StakingClaim" as any),
        key,
        hash,
        timestamp,
        token: to, // from 없음
      } as any);
      continue;
    }

    // ---------- EASY_ENTER ----------
    if (typeStr === "EasyEnter") {
      const d = ev?.data ?? {};
      const tokenInAddr = d?.tokenIn;
      const tokenAmount = d?.tokenAmount ?? "0";
      const stakingContract = d?.stakingContract;
      const stakingTokenAddr =
        d?.stakingTokenAddress ?? d?.stakingToken ?? stakingContract;
      const sharesMinted = d?.sharesMinted ?? "0";

      const fromRaw = makeTokenInfo(
        tokenInAddr,
        tokenAmount,
        chainId,
        chainLinkPriceMap,
        false,
        tokensOverride,
        vaultsOverride,
        externalTokensDefault
      );
      if (!fromRaw) continue;
      const from = normalizeWethToEth(tokenInAddr, chainId, fromRaw);

      const stakingMeta =
        stakingTokenAddr
          ? (findTokenMetaFromLpVaults(
              stakingTokenAddr,
              chainId,
              vaultsOverride,
            ) ??
            findTokenMetaFromTokens(stakingTokenAddr, chainId, tokensOverride))
          : null;
      const aprMeta =
        findLpVaultMetaFromAprStaking(
          stakingContract ?? stakingTokenAddr,
          chainId,
          aprDataState,
          vaultsOverride
        ) ?? null;
      const resolvedMeta = stakingMeta ?? aprMeta;

      const toSymbol = resolvedMeta?.symbol ?? "Vault";
      const toDecimals = resolvedMeta?.decimals ?? 18;
      const to = makeStakeTokenInfo(
        toSymbol,
        "/tokens/sblp-token.svg",
        sharesMinted,
        toDecimals
      );

      txs.push({
        type: TransactionType.EASY_ENTER,
        key,
        hash,
        timestamp,
        from,
        to,
      });
      continue;
    }

    // ---------- EASY_PAY ----------
    if (typeStr === "EasyPay") {
      const d = ev?.data ?? {};
      const stakingContract = d?.stakingContract;
      const stakingTokenAddr =
        d?.stakingTokenAddress ?? d?.stakingToken ?? stakingContract;
      const blpTokenRedeemed = d?.blpTokenRedeemed ?? "0";
      const beneficiary = String(d?.beneficiary ?? "");
      const amountPaid = d?.amountPaid ?? "0";
      const refundOut = d?.refundOut ?? "0";

      const stakingMeta =
        stakingTokenAddr
          ? (findTokenMetaFromLpVaults(
              stakingTokenAddr,
              chainId,
              vaultsOverride,
            ) ??
            findTokenMetaFromTokens(stakingTokenAddr, chainId, tokensOverride))
          : null;
      const aprMeta =
        findLpVaultMetaFromAprStaking(
          stakingContract ?? stakingTokenAddr,
          chainId,
          aprDataState,
          vaultsOverride
        ) ?? null;
      const resolvedMeta = stakingMeta ?? aprMeta;

      const redeemSymbol = resolvedMeta?.symbol ?? "Vault";
      const redeemDecimals = resolvedMeta?.decimals ?? 18;
      const redeem = makeStakeTokenInfo(
        redeemSymbol,
        "/tokens/sblp-token.svg",
        blpTokenRedeemed,
        redeemDecimals
      );

      const usdcMeta = getUsdcMeta(chainId);
      const paid = makeStakeTokenInfo(
        usdcMeta.symbol,
        usdcMeta.iconSrc,
        amountPaid,
        usdcMeta.decimals
      );
      const refund = makeStakeTokenInfo(
        usdcMeta.symbol,
        usdcMeta.iconSrc,
        refundOut,
        usdcMeta.decimals
      );

      txs.push({
        type: TransactionType.EASY_PAY,
        key,
        hash,
        timestamp,
        redeem,
        beneficiary,
        amountPaid: paid,
        refund,
      });
      continue;
    }

    // 알려지지 않은 타입은 스킵 (필요 시 로깅)
  }
  // console.log("[wallet] buildTransaction useAccountWalletData", { chainId, txs });

  // If a hash has EasyEnter/EasyPay, keep only those for that hash.
  const easyHashSet = new Set(
    txs
      .filter(
        (t) =>
          t.type === TransactionType.EASY_ENTER ||
          t.type === TransactionType.EASY_PAY
      )
      .map((t) => t.hash)
      .filter((h): h is string => Boolean(h))
  );
  if (easyHashSet.size === 0) return txs;

  return txs.filter((t) => {
    if (!t.hash) return true;
    if (!easyHashSet.has(t.hash)) return true;
    return (
      t.type === TransactionType.EASY_ENTER ||
      t.type === TransactionType.EASY_PAY
    );
  });
}
