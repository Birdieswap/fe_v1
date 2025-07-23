import { Address, PublicClient } from "viem";

import { uniswap_pool_v3_abi } from "@/const/contracts/abis/uniswap_pool_v3_abi";

export async function getSlot0(client: PublicClient, poolAddress: Address) {
  const [
    sqrtPriceX96,
    tick,
    observationIndex,
    observationCardinality,
    observationCardinalityNext,
    feeProtocol,
    unlocked,
  ] = await client.readContract<typeof uniswap_pool_v3_abi, "slot0", []>({
    address: poolAddress,
    abi: uniswap_pool_v3_abi,
    functionName: "slot0",
  });

  return {
    sqrtPriceX96,
    tick,
    observationIndex,
    observationCardinality,
    observationCardinalityNext,
    feeProtocol,
    unlocked,
  };
}

export async function getLiquidity(client: PublicClient, poolAddress: Address) {
  const liquidity = await client.readContract<
    typeof uniswap_pool_v3_abi,
    "liquidity",
    []
  >({
    address: poolAddress,
    abi: uniswap_pool_v3_abi,
    functionName: "liquidity",
  });

  return liquidity;
}

export async function getPoolState(client: PublicClient, poolAddress: Address) {
  const [slot0, liquidity] = await Promise.all([
    client.readContract<typeof uniswap_pool_v3_abi, "slot0", []>({
      address: poolAddress,
      abi: uniswap_pool_v3_abi,
      functionName: "slot0",
    }),
    client.readContract<typeof uniswap_pool_v3_abi, "liquidity", []>({
      address: poolAddress,
      abi: uniswap_pool_v3_abi,
      functionName: "liquidity",
    }),
  ]);

  return {
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
    liquidity,
  };
}
