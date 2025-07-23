import { Address, PublicClient } from "viem";

import { uniswap_pool_v3_abi } from "@/const/contracts/abis/uniswap_pool_v3_abi";

export async function getPoolImmutables(
  client: PublicClient,
  poolAddress: Address,
) {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
    await Promise.all([
      client.readContract<typeof uniswap_pool_v3_abi, "factory", []>({
        address: poolAddress,
        abi: uniswap_pool_v3_abi,
        functionName: "factory",
      }),
      client.readContract<typeof uniswap_pool_v3_abi, "token0", []>({
        address: poolAddress,
        abi: uniswap_pool_v3_abi,
        functionName: "token0",
      }),
      client.readContract<typeof uniswap_pool_v3_abi, "token1", []>({
        address: poolAddress,
        abi: uniswap_pool_v3_abi,
        functionName: "token1",
      }),
      client.readContract<typeof uniswap_pool_v3_abi, "fee", []>({
        address: poolAddress,
        abi: uniswap_pool_v3_abi,
        functionName: "fee",
      }),
      client.readContract<typeof uniswap_pool_v3_abi, "tickSpacing", []>({
        address: poolAddress,
        abi: uniswap_pool_v3_abi,
        functionName: "tickSpacing",
      }),
      client.readContract<
        typeof uniswap_pool_v3_abi,
        "maxLiquidityPerTick",
        []
      >({
        address: poolAddress,
        abi: uniswap_pool_v3_abi,
        functionName: "maxLiquidityPerTick",
      }),
    ]);

  return { factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick };
}
