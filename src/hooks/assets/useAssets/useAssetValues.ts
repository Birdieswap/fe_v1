import { useChainId, useReadContracts } from "wagmi";
import { ContractFunctionParameters, erc20Abi } from "viem";
import { useEffect, useMemo, useState } from "react";

import {
  WIP_ChainLinkPriceFeed,
  IContractBase,
  ISwapPool,
  IToken,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import priceFeeds from "@/const/contracts/priceFeeds";
import { chainlink_aggregator_v3_functions } from "@/const/contracts/abis/chainlink_aggregator_v3_abi";
import swapPools from "@/const/contracts/tokens/swapPool";

export function calcPrice(
  basePoolBalance: BigDecimal,
  quotePoolBalance: BigDecimal,
  baseAmount: BigDecimal = new BigDecimal(1, 18),
): BigDecimal | null {
  if (basePoolBalance.isZero() || quotePoolBalance.isZero()) {
    return null;
  }

  const price = baseAmount.mul(quotePoolBalance).div(basePoolBalance);

  return price;
}

/**
 * List of ChainLink price feeds and Uniswap LP pools.
 */
const priceFeedList: WIP_ChainLinkPriceFeed[] = Object.values(priceFeeds);
const priceFeedAbi = [chainlink_aggregator_v3_functions.latestRoundData];
const lpList: ISwapPool[] = Object.values(swapPools);

type ChainLinkData = {
  base: IToken;
  quote: IToken | "USD";
  price: BigDecimal;
  roundId: bigint;
  startedAt: bigint;
  updatedAt: bigint;
  answeredInRound: bigint;
};

type UniswapData = {
  base: IContractBase;
  quote: IContractBase;
  baseBalance: BigDecimal;
  quoteBalance: BigDecimal;
};

export function useAssetValues() {
  const chainId = useChainId();

  const availablePriceFeeds = useMemo(
    () =>
      priceFeedList.filter(
        (feed) =>
          feed.addresses[chainId] &&
          feed.base.addresses[chainId] && 
          // 수정: feed.quote가 "USD" 문자열일 수 있어 안전 접근
          (feed.quote === "USD" || (feed as any).quote?.addresses?.[chainId]),
      ),
    [chainId],
  );

  const availableLpPools = useMemo(
    () =>
      lpList.filter(
        (pool) =>
          pool.addresses[chainId] &&
          pool.input[0].addresses[chainId] &&
          pool.input[1].addresses[chainId],
      ),
    [chainId],
  );

  // console.log("availablePriceFeeds", availablePriceFeeds);
  // console.log("availableLpPools", availableLpPools);

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
    [availablePriceFeeds, chainId],
  );

  const uniswapBaseTokenArgs: ContractFunctionParameters<
    typeof erc20Abi,
    "view",
    "balanceOf"
  >[] = useMemo(() => {
    return availableLpPools.flatMap((pool) => {
      const baseToken = pool.input[0].addresses[chainId];
      const poolAddress = pool.addresses[chainId];

      return {
        abi: erc20Abi,
        address: baseToken,
        functionName: "balanceOf",
        args: [poolAddress],
      };
    });
  }, [availableLpPools, chainId]);
  const uniswapQuoteTokenArgs: ContractFunctionParameters<
    typeof erc20Abi,
    "view",
    "balanceOf"
  >[] = useMemo(() => {
    return availableLpPools.flatMap((pool) => {
      const quoteToken = pool.input[1].addresses[chainId];
      const poolAddress = pool.addresses[chainId];

      return {
        abi: erc20Abi,
        address: quoteToken,
        functionName: "balanceOf",
        args: [poolAddress],
      };
    });
  }, [availableLpPools, chainId]);

  // TODO: devise a better way to get data
  const [chainLinkPriceMap, setPriceMap] = useState<Map<string, ChainLinkData>>(
    new Map()
  );
  // TODO: devise a better way to get data
  const [uniswapPriceMap, setUniswapPriceMap] = useState<
    Map<string, UniswapData>
  >(new Map());

  const chainLinkData = useReadContracts({
    contracts: priceFeedArgs,
    query: {
      staleTime: 10000, // 10 seconds
    },
  });
  const uniswapBaseTokenData = useReadContracts({
    contracts: uniswapBaseTokenArgs,
    query: {
      staleTime: 10000, // 10 seconds
    },
  });
  const uniswapQuoteTokenData = useReadContracts({
    contracts: uniswapQuoteTokenArgs,
    query: {
      staleTime: 10000, // 10 seconds
    },
  });
  // console.log("chainLinkData", chainLinkData);
  // console.log("uniswapBaseTokenData", uniswapBaseTokenData);
  // console.log("uniswapQuoteTokenData", uniswapQuoteTokenData);
    
  useEffect(() => {
    if (chainLinkData.data) {
      setPriceMap((prev) => {
        // const newPriceMap = new Map<string, ChainLinkData>(priceMap);
      const next = new Map(prev);
      let changed = false;

      availablePriceFeeds.forEach((feed, index) => {
      const roundData = chainLinkData.data?.[index]?.result as
        | [bigint, bigint, bigint, bigint, bigint]
        | undefined;

      if (!roundData) return;

      const [roundId, answer, startedAt, updatedAt, answeredInRound] = roundData;
      const price = new BigDecimal(answer, feed.decimals);

        //     newPriceMap.set(feed.symbol, {
        //       base: feed.base,
        //       quote: feed.quote,
        //       price,
        //       roundId,
        //       startedAt,
        //       updatedAt,
        //       answeredInRound,
        //     });
        //   }
        // });

        // return newPriceMap;
        const prevVal = next.get(feed.symbol);
        const nextVal = {
          base: feed.base,
          quote: feed.quote,
          price,
          roundId,
          startedAt,
          updatedAt,
          answeredInRound,
        };

        // 수정: 동일성 비교로 불필요 set 차단
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
    }
  }, [chainLinkData.data, availablePriceFeeds]);

  useEffect(() => {
    if (!uniswapBaseTokenData.data || !uniswapQuoteTokenData.data) return;

    setUniswapPriceMap((prev) => {
      const next = new Map(prev);
      let changed = false;

      availableLpPools.forEach((pool, index) => {
        const baseRes = uniswapBaseTokenData.data?.[index]?.result;
        const quoteRes = uniswapQuoteTokenData.data?.[index]?.result;

        if (baseRes === undefined || quoteRes === undefined) {
          // console.warn(`Missing Uniswap data for pool ${pool.symbol} at index ${index}`);
          return;
        }

        const baseBalance = new BigDecimal(baseRes, pool.input[0].decimals);
        const quoteBalance = new BigDecimal(quoteRes, pool.input[1].decimals);

        const prevVal = next.get(pool.symbol);
        const nextVal = {
          base: pool.input[0], // <-- 수정 포인트
          quote: pool.input[1], // <-- 수정 포인트
          baseBalance,
          quoteBalance,
        };

        // 수정: 동일성 비교
        const same =
          prevVal &&
          prevVal.baseBalance.toString() === nextVal.baseBalance.toString() &&
          prevVal.quoteBalance.toString() === nextVal.quoteBalance.toString();

        if (!same) {
          next.set(pool.symbol, nextVal);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [uniswapBaseTokenData.data, uniswapQuoteTokenData.data, availableLpPools]);

  // console.log("chainLinkPriceMap", chainLinkPriceMap);
  // console.log("uniswapPriceMap", uniswapPriceMap);  
  
  const isFetching = useMemo(
    () =>
      chainLinkData.isFetching ||
      uniswapBaseTokenData.isFetching ||
      uniswapQuoteTokenData.isFetching,
    [
      chainLinkData.isFetching,
      uniswapBaseTokenData.isFetching,
      uniswapQuoteTokenData.isFetching,
    ],
  );

  return {
    chainLinkData,
    chainLinkPriceMap,
    uniswapBaseTokenData,
    uniswapQuoteTokenData,
    uniswapPriceMap,
    isFetching,
  };
}

export type useAssetValuesReturnType = ReturnType<typeof useAssetValues>;
