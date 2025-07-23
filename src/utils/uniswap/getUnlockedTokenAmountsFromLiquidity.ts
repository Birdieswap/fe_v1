import { nearestUsableTick, Pool, Position } from "@uniswap/v3-sdk";
import { Percent, Token } from "@uniswap/sdk-core";
import { Address, PublicClient } from "viem";

import { getPoolImmutables } from "./getPoolImmutables";
import { getPoolState } from "./getPoolState";

/**
 * Calculates the amount of tokens that can be unlocked from a given liquidity position in a Uniswap V3 pool.
 *
 * @param client - The public client to interact with the blockchain.
 * @param poolAddress - The address of the Uniswap V3 pool.
 * @param token0 - The first token in the pool.
 * @param token1 - The second token in the pool.
 * @param liquidityDelta - The amount of liquidity being removed (in terms of liquidity units).
 * @param maxSlippage - The maximum slippage percentage allowed when calculating the amounts (default is 5%).
 * @param tickLower - The lower tick of the position from which liquidity is being removed (default is -887272).
 * @param tickUpper - The upper tick of the position from which liquidity is being removed (default is 887272).
 * @returns An object containing the amounts of token0 and token1 that can be unlocked, adjusted for slippage.
 */
export async function getUnlockedTokenAmountsFromLiquidity(
  client: PublicClient,
  poolAddress: Address,
  token0: Token,
  token1: Token,
  liquidityDelta: bigint, // liquidity being removed
  maxSlippage: number = 5,
  tickLower: number = -887272,
  tickUpper: number = 887272,
) {
  const [immutables, state] = await Promise.all([
    getPoolImmutables(client, poolAddress),
    getPoolState(client, poolAddress),
  ]);

  const availableTickLower = nearestUsableTick(
    tickLower,
    immutables.tickSpacing,
  );
  const availableTickUpper = nearestUsableTick(
    tickUpper,
    immutables.tickSpacing,
  );

  const pool = new Pool(
    token0,
    token1,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick,
  );

  const position = new Position({
    pool,
    liquidity: liquidityDelta.toString(),
    tickLower: availableTickLower,
    tickUpper: availableTickUpper,
  });

  const { amount0, amount1 } = position.burnAmountsWithSlippage(
    new Percent(maxSlippage, 100),
  );

  return {
    amount0: amount0.toString(),
    amount1: amount1.toString(),
  };
}
