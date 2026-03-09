import { useMemo } from "react";
import { Percent, Token } from "@uniswap/sdk-core";
import { Pool, Position } from "@uniswap/v3-sdk";
import { formatUnits, parseUnits } from "viem";

const BPS_BASE = 10_000n;
const DEFAULT_PROBE_LIQUIDITY = "1000000000000000000";

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

export type RangeState = {
  tickLower: number;
  tickUpper: number;
};

export type AddInput =
  | { side: "token0"; amount: string }
  | { side: "token1"; amount: string }
  | { side: "both"; amount0: string; amount1: string }
  | undefined;

export type UseV3AddLiquidityQuoteParams = {
  token0: TokenConfig;
  token1: TokenConfig;
  pool: PoolState;
  range: RangeState;
  input?: AddInput;
  probeLiquidity?: bigint | string;
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

function ratio(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb) || nb === 0) return null;
  return na / nb;
}

export function quoteV3AddLiquidity({
  token0,
  token1,
  pool,
  range,
  input,
  probeLiquidity = DEFAULT_PROBE_LIQUIDITY,
  slippageBps = 50,
}: UseV3AddLiquidityQuoteParams) {
  if (range.tickLower >= range.tickUpper) {
    throw new Error("tickLower must be smaller than tickUpper");
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

  const spotPrice = {
    token1PerToken0: sdkPool.token0Price.toSignificant(18),
    token0PerToken1: sdkPool.token1Price.toSignificant(18),
  };

  const probePosition = new Position({
    pool: sdkPool,
    tickLower: range.tickLower,
    tickUpper: range.tickUpper,
    liquidity: toBigintish(probeLiquidity),
  });

  const probeMint = probePosition.mintAmounts;
  const probeAmount0 = fmt(probeMint.amount0.toString(), token0.decimals);
  const probeAmount1 = fmt(probeMint.amount1.toString(), token1.decimals);

  const recommendedRatioToken1PerToken0 = ratio(probeAmount1, probeAmount0);
  const recommendedRatioToken0PerToken1 = ratio(probeAmount0, probeAmount1);

  let note = "현재 이 range에 유동성을 넣을 때의 권장 투입 비율입니다.";
  if (Number(probeAmount0) === 0 && Number(probeAmount1) > 0) {
    note = "현재 가격이 range 상단 쪽/밖에 있어서 사실상 token1만 필요합니다.";
  } else if (Number(probeAmount1) === 0 && Number(probeAmount0) > 0) {
    note = "현재 가격이 range 하단 쪽/밖에 있어서 사실상 token0만 필요합니다.";
  }

  let quotedPosition: Position | null = null;

  if (input?.side === "token0") {
    quotedPosition = Position.fromAmount0({
      pool: sdkPool,
      tickLower: range.tickLower,
      tickUpper: range.tickUpper,
      amount0: parseUnits(input.amount, token0.decimals).toString(),
      useFullPrecision: true,
    });
  } else if (input?.side === "token1") {
    quotedPosition = Position.fromAmount1({
      pool: sdkPool,
      tickLower: range.tickLower,
      tickUpper: range.tickUpper,
      amount1: parseUnits(input.amount, token1.decimals).toString(),
    });
  } else if (input?.side === "both") {
    quotedPosition = Position.fromAmounts({
      pool: sdkPool,
      tickLower: range.tickLower,
      tickUpper: range.tickUpper,
      amount0: parseUnits(input.amount0, token0.decimals).toString(),
      amount1: parseUnits(input.amount1, token1.decimals).toString(),
      useFullPrecision: true,
    });
  }

  const slippageTolerance = new Percent(slippageBps, Number(BPS_BASE));

  const requiredAmounts = quotedPosition
    ? (() => {
        const mint = quotedPosition.mintAmounts;
        const mintWithSlippage =
          quotedPosition.mintAmountsWithSlippage(slippageTolerance);

        return {
          liquidity: quotedPosition.liquidity.toString(),
          amount0Raw: mint.amount0.toString(),
          amount1Raw: mint.amount1.toString(),
          amount0: fmt(mint.amount0.toString(), token0.decimals),
          amount1: fmt(mint.amount1.toString(), token1.decimals),
          amount0WithSlippageRaw: mintWithSlippage.amount0.toString(),
          amount1WithSlippageRaw: mintWithSlippage.amount1.toString(),
          amount0WithSlippage: fmt(
            mintWithSlippage.amount0.toString(),
            token0.decimals,
          ),
          amount1WithSlippage: fmt(
            mintWithSlippage.amount1.toString(),
            token1.decimals,
          ),
        };
      })()
    : null;

  return {
    pool: sdkPool,
    probePosition,
    quotedPosition,
    slippageTolerance,
    spotPrice,
    recommendedRatio: {
      token1PerToken0:
        recommendedRatioToken1PerToken0 == null
          ? null
          : recommendedRatioToken1PerToken0.toFixed(12).replace(/\.?0+$/, ""),
      token0PerToken1:
        recommendedRatioToken0PerToken1 == null
          ? null
          : recommendedRatioToken0PerToken1.toFixed(12).replace(/\.?0+$/, ""),
      probeAmount0,
      probeAmount1,
      note,
    },
    requiredAmounts,
  };
}

export function useV3AddLiquidityQuote(params: UseV3AddLiquidityQuoteParams) {
  return useMemo(
    () => quoteV3AddLiquidity(params),
    [
      params.token0,
      params.token1,
      params.pool,
      params.range,
      params.input,
      params.probeLiquidity,
      params.slippageBps,
    ],
  );
}

