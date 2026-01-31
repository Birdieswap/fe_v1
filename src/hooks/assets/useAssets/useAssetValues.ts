// hooks/assets/useAssets/useAssetValues.ts
import { useChainId, usePublicClient, useReadContracts } from "wagmi";
import { ContractFunctionParameters } from "viem";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  WIP_ChainLinkPriceFeed,
  IBirdieSingleFarm,
  IContractBase,
  ISwapPool,
  IToken,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import priceFeeds from "@/const/contracts/priceFeeds";
import { chainlink_aggregator_v3_functions } from "@/const/contracts/abis/chainlink_aggregator_v3_abi";
import swapPools from "@/const/contracts/tokens/swapPool";

import lpVaults from "@/const/contracts/tokens/lpVaults";
import totalDualUnderlyingTokens from "@/utils/farm/totalDualUnderlyingTokens";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { ADDRESS } from "@/const/contracts/contractAddresses";
import {
  fetchCoingeckoUsdPrice,
  fetchCoingeckoUsdPriceBySymbol,
  normalizeCoingeckoAddress,
} from "@/utils/prices/coingeckoUsd";
import {
  getFromContracts,
  toLower,
  ZERO_ADDRESS,
} from "@/utils/farm/getAddressHelpers";

export function calcPrice(
  basePoolBalance: BigDecimal,
  quotePoolBalance: BigDecimal,
  baseAmount: BigDecimal = new BigDecimal(1, 18)
): BigDecimal | null {
  if (basePoolBalance.isZero() || quotePoolBalance.isZero()) return null;
  return baseAmount.mul(quotePoolBalance).div(basePoolBalance);
}

/**
 * List of ChainLink price feeds and Uniswap LP pools.
 */
const priceFeedList: WIP_ChainLinkPriceFeed[] = Object.values(priceFeeds);
const priceFeedAbi = [chainlink_aggregator_v3_functions.latestRoundData];
const lpList = Object.values(swapPools) as ISwapPool<IBirdieSingleFarm>[];

type ChainLinkData = {
  base: IToken;
  quote: IToken | "USD";
  price: BigDecimal;
  roundId: bigint;
  startedAt: bigint;
  updatedAt: bigint;
  answeredInRound: bigint;
};

/**
 * ✅ Underlying 기준(USDC/WETH 등) 풀 밸런스 데이터
 */
type UniswapData = {
  base: IContractBase; // underlying token object
  quote: IContractBase; // underlying token object
  baseBalance: BigDecimal;
  quoteBalance: BigDecimal;
};

function isNativeLike(addr: string) {
  const low = addr.toLowerCase();
  return (
    low === ZERO_ADDRESS.toLowerCase() ||
    low === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  );
}

export function useAssetValues() {
  const chainId = useChainId();
  const client = usePublicClient({ chainId });

  /**
   * ChainLink price feed (기존 로직 유지)
   */
  const availablePriceFeeds = useMemo(
    () =>
      priceFeedList.filter(
        (feed) =>
          feed.addresses[chainId] &&
          feed.base.addresses[chainId] &&
          (feed.quote === "USD" || (feed as any).quote?.addresses?.[chainId])
      ),
    [chainId]
  );

  /**
   * ✅ swapPools 중 현 체인에서 주소/입력 토큰주소가 있는 풀만 사용 (기존 로직 유지)
   */
  const availableLpPools = useMemo(
    () =>
      lpList.filter(
        (pool) =>
          pool.addresses[chainId] &&
          pool.input[0].addresses[chainId] &&
          pool.input[1].addresses[chainId]
      ),
    [chainId]
  );

  const priceFeedArgs: ContractFunctionParameters<
    typeof priceFeedAbi,
    "view",
    "latestRoundData",
    []
  >[] = useMemo(
    () =>
      availablePriceFeeds.map((feed) => ({
        abi: priceFeedAbi,
        address: feed.addresses[chainId],
        functionName: "latestRoundData",
        args: [],
      })),
    [availablePriceFeeds, chainId]
  );

  const [chainLinkPriceMap, setPriceMap] = useState<Map<string, ChainLinkData>>(
    new Map()
  );

  /**
   * ✅ Underlying 기반 LP 밸런스 맵
   * key: pool.symbol (현 구조 유지: 중복이면 덮어씀)
   */
  const [uniswapPriceMap, setUniswapPriceMap] = useState<
    Map<string, UniswapData>
  >(new Map());

  const [coingeckoPriceMap, setCoingeckoPriceMap] = useState<
    Map<string, BigDecimal | null>
  >(new Map());
  const [coingeckoSymbolPriceMap, setCoingeckoSymbolPriceMap] = useState<
    Map<string, BigDecimal | null>
  >(new Map());

  const chainLinkData = useReadContracts({
    contracts: priceFeedArgs,
    query: { staleTime: 30_000 },
  });

  /**
   * ✅ underlying 값 갱신 주기(60s)
   */
  const [underlyingRefreshTick, setUnderlyingRefreshTick] = useState(0);
  const [isUnderlyingFetching, setIsUnderlyingFetching] = useState(false);

  // ✅ 외부에서 강제로 underlying 갱신 트리거할 수 있도록 노출
  const refetchUnderlying = useCallback(async () => {
    setUnderlyingRefreshTick((x) => x + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      setUnderlyingRefreshTick((x) => x + 1);
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setCoingeckoPriceMap(new Map());
    setCoingeckoSymbolPriceMap(new Map());
  }, [chainId]);

  const mergeCoingeckoPrices = useCallback(
    (entries: Array<[string, BigDecimal | null]>) => {
      if (!entries.length) return;
      setCoingeckoPriceMap((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [addr, price] of entries) {
          const prevVal = next.get(addr);
          const same =
            (prevVal == null && price == null) ||
            (prevVal != null &&
              price != null &&
              prevVal.toString() === price.toString());
          if (!same) {
            next.set(addr, price);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    []
  );

  const mergeCoingeckoSymbolPrices = useCallback(
    (entries: Array<[string, BigDecimal | null]>) => {
      if (!entries.length) return;
      setCoingeckoSymbolPriceMap((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [symbol, price] of entries) {
          const prevVal = next.get(symbol);
          const same =
            (prevVal == null && price == null) ||
            (prevVal != null &&
              price != null &&
              prevVal.toString() === price.toString());
          if (!same) {
            next.set(symbol, price);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    []
  );

  const refetchCoingeckoPrices = useCallback(
    async (addresses: Array<string | null | undefined>) => {
      if (!chainId || !addresses?.length) return;
      const deduped = new Set<string>();
      for (const addr of addresses) {
        const normalized = normalizeCoingeckoAddress(addr ?? null, chainId);
        if (normalized) deduped.add(normalized);
      }
      if (!deduped.size) return;

      const list = Array.from(deduped);
      const results = await Promise.all(
        list.map(async (addr) => {
          const price = await fetchCoingeckoUsdPrice(chainId, addr);
          return [addr, price] as [string, BigDecimal | null];
        })
      );
      mergeCoingeckoPrices(results);
    },
    [chainId, mergeCoingeckoPrices]
  );

  const refetchCoingeckoSymbolPrices = useCallback(
    async (symbols: Array<string | null | undefined>) => {
      const deduped = new Set<string>();
      for (const symbol of symbols) {
        const key = String(symbol ?? "").trim().toLowerCase();
        if (key) deduped.add(key);
      }
      if (!deduped.size) return;

      const list = Array.from(deduped);
      const results = await Promise.all(
        list.map(async (symbol) => {
          const price = await fetchCoingeckoUsdPriceBySymbol(symbol);
          return [symbol, price] as [string, BigDecimal | null];
        })
      );
      mergeCoingeckoSymbolPrices(results);
    },
    [mergeCoingeckoSymbolPrices]
  );

  /**
   * ✅ ChainLink map 갱신(기존 로직 유지)
   */
  useEffect(() => {
    if (!chainLinkData.data) return;

    setPriceMap((prev) => {
      const next = new Map(prev);
      let changed = false;

      availablePriceFeeds.forEach((feed, index) => {
        const roundData = chainLinkData.data?.[index]?.result as
          | [bigint, bigint, bigint, bigint, bigint]
          | undefined;

        if (!roundData) return;

        const [roundId, answer, startedAt, updatedAt, answeredInRound] =
          roundData;
        const price = new BigDecimal(answer, feed.decimals);

        const prevVal = next.get(feed.symbol);
        const nextVal: ChainLinkData = {
          base: feed.base,
          quote: feed.quote,
          price,
          roundId,
          startedAt,
          updatedAt,
          answeredInRound,
        };

        const same =
          prevVal &&
          prevVal.price.toString() === nextVal.price.toString() &&
          prevVal.roundId === nextVal.roundId &&
          prevVal.startedAt === nextVal.startedAt &&
          prevVal.updatedAt === nextVal.updatedAt &&
          prevVal.answeredInRound === nextVal.answeredInRound;

        if (!same) {
          next.set(feed.symbol, nextVal);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [chainLinkData.data, availablePriceFeeds]);

  /**
   * ✅ Underlying 기준 uniswapPriceMap 구성
   */
  useEffect(() => {
    if (!client || !chainId) return;
    if (!availableLpPools.length) return;

    const WETH_ADDRESS = getFromContracts(ADDRESS.WETH, chainId);

    const norm = (addr?: string) => {
      if (!addr) return "";
      if (isNativeLike(addr)) {
        return toLower((WETH_ADDRESS ?? (addr as any)) as `0x${string}`);
      }
      return toLower(addr as `0x${string}`);
    };

    // ✅ lpVaultKey 기준으로 중복 제거 (RPC 절약)
    const uniqueVaultKeys = Array.from(
      new Set(
        availableLpPools
          .map((p) => (p as any).lpVaultKey as string | undefined)
          .filter(Boolean)
      )
    ) as string[];

    let cancelled = false;

    (async () => {
      setIsUnderlyingFetching(true);
      try {
        // 1) vaultKey -> underlying balances 결과를 먼저 모은다(중복 제거된 RPC)
        const vaultResults = await Promise.all(
          uniqueVaultKeys.map(async (vaultKey) => {
            const farm = (lpVaults as any)[vaultKey];
            if (!farm) return { vaultKey, data: null as any };

            const data = await totalDualUnderlyingTokens(client, farm);
            return { vaultKey, data };
          })
        );

        if (cancelled) return;

        const vaultMap = new Map<string, any>();
        for (const r of vaultResults) {
          if (r.data) vaultMap.set(r.vaultKey, r.data);
        }

        // 2) 풀별로 uniswapPriceMap(= underlying 기준) 재구성
        setUniswapPriceMap((prev) => {
          const next = new Map(prev);
          let changed = false;

          for (const pool of availableLpPools) {
            const vaultKey = (pool as any).lpVaultKey as string | undefined;
            if (!vaultKey) continue;

            const data = vaultMap.get(vaultKey);
            if (!data) continue;

            const [addr0, bal0, addr1, bal1] = data as [
              `0x${string}`,
              BigDecimal,
              `0x${string}`,
              BigDecimal,
            ];

            // ✅ underlying token objects (IBirdieSingleFarm.input)
            const baseToken = pool.input[0].input;
            const quoteToken = pool.input[1].input;
            if (!baseToken || !quoteToken) continue;

            const baseAddrRaw = getTokenAddress({
              token: baseToken as any,
              chainId,
            });
            const quoteAddrRaw = getTokenAddress({
              token: quoteToken as any,
              chainId,
            });

            const baseAddr = norm(
              (baseToken as any).symbol === "ETH"
                ? ((WETH_ADDRESS ?? baseAddrRaw) as any)
                : baseAddrRaw
            );
            const quoteAddr = norm(
              (quoteToken as any).symbol === "ETH"
                ? ((WETH_ADDRESS ?? quoteAddrRaw) as any)
                : quoteAddrRaw
            );

            const u0 = norm(addr0);
            const u1 = norm(addr1);

            let baseBalance: BigDecimal | null = null;
            let quoteBalance: BigDecimal | null = null;

            if (u0 === baseAddr) baseBalance = bal0;
            else if (u1 === baseAddr) baseBalance = bal1;

            if (u0 === quoteAddr) quoteBalance = bal0;
            else if (u1 === quoteAddr) quoteBalance = bal1;

            if (!baseBalance || !quoteBalance) continue;

            const nextVal: UniswapData = {
              base: baseToken as any,
              quote: quoteToken as any,
              baseBalance,
              quoteBalance,
            };

            // ⚠️ key는 기존처럼 pool.symbol 유지(중복이면 덮어씀)
            const prevVal = next.get(pool.symbol);
            const same =
              prevVal &&
              prevVal.baseBalance.toString() ===
                nextVal.baseBalance.toString() &&
              prevVal.quoteBalance.toString() ===
                nextVal.quoteBalance.toString();

            if (!same) {
              next.set(pool.symbol, nextVal);
              changed = true;
            }
          }

          return changed ? next : prev;
        });
      } finally {
        if (!cancelled) setIsUnderlyingFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, chainId, availableLpPools, underlyingRefreshTick]);

  const isFetching = useMemo(
    () => chainLinkData.isFetching || isUnderlyingFetching,
    [chainLinkData.isFetching, isUnderlyingFetching]
  );

  return {
    chainLinkData,
    chainLinkPriceMap,
    uniswapPriceMap,
    coingeckoPriceMap,
    coingeckoSymbolPriceMap,
    isFetching,

    // ✅ 새로 추가 (useAssets.ts에서 refetchAll에 사용)
    refetchUnderlying,
    refetchCoingeckoPrices,
    refetchCoingeckoSymbolPrices,
  };
}

export type useAssetValuesReturnType = ReturnType<typeof useAssetValues>;
