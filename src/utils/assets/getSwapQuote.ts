import { PublicClient } from "viem";
import { Fraction } from "@uniswap/sdk-core";
import JSBI from "jsbi";

import {
  EProvider,
  IBirdieSingleFarm,
  ICurrency,
  ISwapPool,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

import { getPoolState } from "../uniswap/getPoolState";
import { getPoolImmutables } from "../uniswap/getPoolImmutables";

import getTokenAddress from "./getTokenAddress";
import getSwapPool from "./getSwapPool";
import { quoteExactAmount } from "./quoteExactAmount";

async function getSwapQuote(
  client: PublicClient,
  pool: ISwapPool,
  tokenFrom: IBirdieSingleFarm,
  tokenTo: IBirdieSingleFarm,
  amountSide: "in" | "out",
  amount: BigDecimal
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;
  const poolAddress = getTokenAddress({
    token: pool,
    chainId,
  });

  if (!poolAddress) return null;
  const tokenFromAddress = getTokenAddress({
    token: tokenFrom,
    chainId,
  });
  const tokenToAddress = getTokenAddress({
    token: tokenTo,
    chainId,
  });

  if (!tokenFromAddress || !tokenToAddress) return null;
  const isPoolInverted = BigInt(tokenFromAddress) > BigInt(tokenToAddress);
  const token0Address = isPoolInverted ? tokenToAddress : tokenFromAddress;
  const token1Address = isPoolInverted ? tokenFromAddress : tokenToAddress;
  const amountAddress = amountSide === "in" ? tokenFromAddress : tokenToAddress;
  const [immutables, state] = await Promise.all([
    getPoolImmutables(client, poolAddress),
    getPoolState(client, poolAddress),
  ]);

  const biAmount = amount.roundToDecimals(
    amountSide === "in" ? tokenFrom.decimals : tokenTo.decimals
  ).value;

  const res = await quoteExactAmount(
    client,
    token0Address,
    token1Address,
    amountAddress,
    amountSide,
    biAmount,
    immutables.fee
  );

  if (!res) return null;

  const sqrtPriceX96Before = isPoolInverted
    ? new Fraction(
        JSBI.BigInt((BigInt(1) << BigInt(96)).toString(10)),
        JSBI.BigInt(state.sqrtPriceX96.toString(10))
      )
    : new Fraction(
        JSBI.BigInt(state.sqrtPriceX96.toString(10)),
        JSBI.BigInt((BigInt(1) << BigInt(96)).toString(10))
      );
  const sqrtPriceX96After = isPoolInverted
    ? new Fraction(
        JSBI.BigInt((BigInt(1) << BigInt(96)).toString(10)),
        JSBI.BigInt(res.sqrtPriceX96After.toString(10))
      )
    : new Fraction(
        JSBI.BigInt(res.sqrtPriceX96After.toString(10)),
        JSBI.BigInt((BigInt(1) << BigInt(96)).toString(10))
      );

  // console.log("sqrtPriceX96Before: ", sqrtPriceX96Before.toFixed(18));
  // console.log("sqrtPriceX96After: ", sqrtPriceX96After.toFixed(18));

  const amountIn = new BigDecimal(res.amountOut, tokenFrom.decimals);
  const amountOut = new BigDecimal(res.amountOut, tokenTo.decimals);
  // p[x96] = y * (10 ** y.decimals) / x * (10 ** x.decimals)
  // we want to calculate the actual price
  // p = p[x96] * (10 ** (x.decimals - y.decimals))
  const priceBefore = sqrtPriceX96Before
    .multiply(sqrtPriceX96Before)
    .multiply((BigInt(10) ** BigInt(tokenFrom.decimals)).toString(10))
    .divide((BigInt(10) ** BigInt(tokenTo.decimals)).toString(10));
  const priceAfter = sqrtPriceX96After
    .multiply(sqrtPriceX96After)
    .multiply((BigInt(10) ** BigInt(tokenFrom.decimals)).toString(10))
    .divide((BigInt(10) ** BigInt(tokenTo.decimals)).toString(10));
  const priceImpact = priceAfter.subtract(priceBefore).divide(priceBefore);

  // TODO: exchange Token to BToken and vice versa
  return {
    poolAddress: poolAddress,
    sqrtPriceX96: sqrtPriceX96Before,
    isPoolInverted: isPoolInverted,
    amountIn: amountIn,
    amountOut: amountOut,
    priceBefore: priceBefore.toFixed(18),
    priceAfter: priceAfter.toFixed(18),
    priceImpact: priceImpact.toFixed(18),
    gasEstimate: res.gasEstimate.toString(),
  };
}

async function getSwapQuoteFromICurrencyAndProvider(
  client: PublicClient,
  tokenFrom: ICurrency,
  tokenTo: ICurrency,
  provider: EProvider,
  amountSide: "in" | "out",
  amount: BigDecimal
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;

  const pool = getSwapPool({
    fromToken: tokenFrom,
    toToken: tokenTo,
    chainId,
    provider,
  });

  // console.log("pool: ", pool?.fullName);
  if (!pool) return null;
  const bTokenFrom =
    pool.input[0].input.symbol === tokenFrom.symbol
      ? pool.input[0]
      : pool.input[1];
  const bTokenTo =
    pool.input[0].input.symbol === tokenTo.symbol
      ? pool.input[0]
      : pool.input[1];

  if (!bTokenFrom || !bTokenTo) return null;

  return getSwapQuote(client, pool, bTokenFrom, bTokenTo, amountSide, amount);
}

export async function getSwapQuoteForProviders(
  client: PublicClient,
  tokenFrom: ICurrency,
  tokenTo: ICurrency,
  amountSide: "in" | "out",
  amount: BigDecimal
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;

  const aaveQuote = await getSwapQuoteFromICurrencyAndProvider(
    client,
    tokenFrom,
    tokenTo,
    EProvider.AAVE,
    amountSide,
    amount
  ).catch((error) => {
    console.error("Error getting AAVE swap quote:", error);

    return null;
  });
  const autopilotQuote = await getSwapQuoteFromICurrencyAndProvider(
    client,
    tokenFrom,
    tokenTo,
    EProvider.AUTOPILOT,
    amountSide,
    amount
  ).catch((error) => {
    console.error("Error getting Autopilot swap quote:", error);

    return null;
  });

  return {
    aave: aaveQuote,
    autopilot: autopilotQuote,
  };
}

export async function updateToAmount(
  client: PublicClient,
  tokenFrom: ICurrency,
  tokenTo: ICurrency,
  amount: BigDecimal
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;

  return await getSwapQuoteForProviders(
    client,
    tokenFrom,
    tokenTo,
    "in",
    amount
  );
}
