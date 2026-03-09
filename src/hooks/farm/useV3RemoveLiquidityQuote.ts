import { useMemo } from "react";
import { Percent, Token } from "@uniswap/sdk-core";
import { Pool, Position } from "@uniswap/v3-sdk";
import { formatUnits } from "viem";

const BPS_BASE = 10_000n;

export type TokenConfig = {
  chainId: number;
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  name?: string;
};

export type PoolState = {
  fee: number;
  sqrtPriceX96: bigint | string;
  tickCurrent: number;
  poolLiquidity: bigint | string;
};

export type PositionState = {
  tokenId: bigint | string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint | string;
  tokensOwed0?: bigint | string;
  tokensOwed1?: bigint | string;
};

export type UseV3RemoveLiquidityQuoteParams = {
  token0: TokenConfig;
  token1: TokenConfig;
  pool: PoolState;
  position: PositionState;
  removeBps: number;
  slippageBps?: number;
};

function toBigintish(v: bigint | string | number) {
  return typeof v === "bigint" ? v.toString() : String(v);
}

function fmt(raw: bigint | string, decimals: number, maxDp = 12) {
  const n = Number(formatUnits(BigInt(raw), decimals));
  if (!Number.isFinite(n)) return formatUnits(BigInt(raw), decimals);
  return n.toFixed(maxDp).replace(/\.?0+$/, "");
}

function mulDivFloor(a: bigint, b: bigint, d: bigint) {
  return (a * b) / d;
}

function ratio(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb) || nb === 0) return null;
  return na / nb;
}

export function quoteV3RemoveLiquidity({
  token0,
  token1,
  pool,
  position,
  removeBps,
  slippageBps = 50,
}: UseV3RemoveLiquidityQuoteParams) {
  if (removeBps < 0 || removeBps > 10_000) {
    throw new Error("removeBps must be between 0 and 10000");
  }

  const sdkToken0 = new Token(
    token0.chainId,
    token0.address,
    token0.decimals,
    token0.symbol,
    token0.name,
  );

  const sdkToken1 = new Token(
    token1.chainId,
    token1.address,
    token1.decimals,
    token1.symbol,
    token1.name,
  );

  const sdkPool = new Pool(
    sdkToken0,
    sdkToken1,
    pool.fee,
    toBigintish(pool.sqrtPriceX96),
    toBigintish(pool.poolLiquidity),
    pool.tickCurrent,
  );

  const fullLiquidity = BigInt(position.liquidity);
  const liquidityToRemove = mulDivFloor(
    fullLiquidity,
    BigInt(removeBps),
    BPS_BASE,
  );

  const fullPosition = new Position({
    pool: sdkPool,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: fullLiquidity.toString(),
  });

  const removePosition = new Position({
    pool: sdkPool,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: liquidityToRemove.toString(),
  });

  const fullAmount0 = fullPosition.amount0.quotient.toString();
  const fullAmount1 = fullPosition.amount1.quotient.toString();

  const removeAmount0 = removePosition.amount0.quotient.toString();
  const removeAmount1 = removePosition.amount1.quotient.toString();

  const burnMins = removePosition.burnAmountsWithSlippage(
    new Percent(slippageBps, Number(BPS_BASE)),
  );

  const owed0Raw = position.tokensOwed0
    ? BigInt(position.tokensOwed0).toString()
    : "0";
  const owed1Raw = position.tokensOwed1
    ? BigInt(position.tokensOwed1).toString()
    : "0";

  const totalIfCollectStored0 = (
    BigInt(removeAmount0) + BigInt(owed0Raw)
  ).toString();
  const totalIfCollectStored1 = (
    BigInt(removeAmount1) + BigInt(owed1Raw)
  ).toString();

  const removeAmount0Human = fmt(removeAmount0, token0.decimals);
  const removeAmount1Human = fmt(removeAmount1, token1.decimals);

  const withdrawRatioToken1PerToken0 = ratio(
    removeAmount1Human,
    removeAmount0Human,
  );
  const withdrawRatioToken0PerToken1 = ratio(
    removeAmount0Human,
    removeAmount1Human,
  );

  let note = "현재 가격 기준 principal 출금 비율입니다.";
  if (Number(removeAmount0Human) === 0 && Number(removeAmount1Human) > 0) {
    note =
      "현재 가격이 range 상단 쪽/밖에 있어서 출금 principal이 사실상 token1 쪽입니다.";
  } else if (
    Number(removeAmount1Human) === 0 &&
    Number(removeAmount0Human) > 0
  ) {
    note =
      "현재 가격이 range 하단 쪽/밖에 있어서 출금 principal이 사실상 token0 쪽입니다.";
  }

  return {
    pool: sdkPool,
    fullPosition,
    removePosition,
    liquidity: {
      total: fullLiquidity.toString(),
      removeBps,
      removeLiquidity: liquidityToRemove.toString(),
      remainLiquidity: (fullLiquidity - liquidityToRemove).toString(),
    },
    fullPrincipal: {
      amount0Raw: fullAmount0,
      amount1Raw: fullAmount1,
      amount0: fmt(fullAmount0, token0.decimals),
      amount1: fmt(fullAmount1, token1.decimals),
    },
    removePrincipal: {
      amount0Raw: removeAmount0,
      amount1Raw: removeAmount1,
      amount0: removeAmount0Human,
      amount1: removeAmount1Human,
    },
    removePrincipalMinWithSlippage: {
      amount0Raw: burnMins.amount0.toString(),
      amount1Raw: burnMins.amount1.toString(),
      amount0: fmt(burnMins.amount0.toString(), token0.decimals),
      amount1: fmt(burnMins.amount1.toString(), token1.decimals),
    },
    withdrawRatio: {
      token1PerToken0:
        withdrawRatioToken1PerToken0 == null
          ? null
          : withdrawRatioToken1PerToken0.toFixed(12).replace(/\.?0+$/, ""),
      token0PerToken1:
        withdrawRatioToken0PerToken1 == null
          ? null
          : withdrawRatioToken0PerToken1.toFixed(12).replace(/\.?0+$/, ""),
      note,
    },
    storedOwed: {
      amount0Raw: owed0Raw,
      amount1Raw: owed1Raw,
      amount0: fmt(owed0Raw, token0.decimals),
      amount1: fmt(owed1Raw, token1.decimals),
    },
    totalIfCollectStoredNow: {
      amount0Raw: totalIfCollectStored0,
      amount1Raw: totalIfCollectStored1,
      amount0: fmt(totalIfCollectStored0, token0.decimals),
      amount1: fmt(totalIfCollectStored1, token1.decimals),
    },
  };
}

export function useV3RemoveLiquidityQuote(
  params: UseV3RemoveLiquidityQuoteParams,
) {
  return useMemo(
    () => quoteV3RemoveLiquidity(params),
    [
      params.token0,
      params.token1,
      params.pool,
      params.position,
      params.removeBps,
      params.slippageBps,
    ],
  );
}
