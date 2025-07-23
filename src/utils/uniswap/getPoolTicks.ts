import { ContractFunctionParameters, PublicClient } from "viem";
import { Tick } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

import { uniswap_pool_v3_abi } from "@/const/contracts/abis/uniswap_pool_v3_abi";

function tickToWord(tick: number, tickSpacing: number): number {
  let compressed = Math.floor(tick / tickSpacing);

  if (tick < 0 && tick % tickSpacing !== 0) {
    compressed -= 1;
  }

  return (compressed * tickSpacing) >> 8;
}

async function getTickBitmap(
  client: PublicClient,
  tickSpacing: number,
  poolAddress: `0x${string}`,
) {
  let calls: ContractFunctionParameters<
    typeof uniswap_pool_v3_abi,
    "view",
    "tickBitmap",
    [number]
  >[] = [];
  let wordPosIndices: number[] = [];
  const minWord = tickToWord(-887272, tickSpacing);
  const maxWord = tickToWord(887272, tickSpacing);

  for (let i = minWord; i <= maxWord; i++) {
    wordPosIndices.push(i);
    calls.push({
      address: poolAddress,
      abi: uniswap_pool_v3_abi,
      functionName: "tickBitmap",
      args: [i],
    });
  }

  const results = await client
    .multicall<
      ContractFunctionParameters<
        typeof uniswap_pool_v3_abi,
        "view",
        "tickBitmap",
        [number]
      >[]
    >({ contracts: calls, allowFailure: true, batchSize: 32768 })
    .catch((error) => {
      console.error("Error fetching tickBitmap:", error);

      return [];
    })
    .then((results) => {
      return results.map((res) => {
        if (res.status === "success" && res.result) {
          return res.result as bigint;
        } else {
          return BigInt(0); // Default to 0 if the call failed
        }
      });
    });

  const tickIndices: number[] = [];

  for (let j = 0; j < wordPosIndices.length; j++) {
    const ind = wordPosIndices[j];
    const bitmap = results[j];

    if (bitmap !== BigInt(0)) {
      for (let i = 0; i < 256; i++) {
        const bit = BigInt(1);
        const initialized = (bitmap & (bit << BigInt(i))) !== BigInt(0);

        if (initialized) {
          const tickIndex = (ind * 256 + i) * tickSpacing;

          tickIndices.push(tickIndex);
        }
      }
    }
  }

  return tickIndices;
}

export async function getPoolTicks(
  client: PublicClient,
  poolAddress: `0x${string}`,
  tickSpacing: number,
) {
  const tickIndices = await getTickBitmap(client, tickSpacing, poolAddress);

  const calls: ContractFunctionParameters<
    typeof uniswap_pool_v3_abi,
    "view",
    "ticks",
    [number]
  >[] = tickIndices.map((tickIndex) => ({
    address: poolAddress,
    abi: uniswap_pool_v3_abi,
    functionName: "ticks",
    args: [tickIndex],
  }));

  const results = await client
    .multicall<
      ContractFunctionParameters<
        typeof uniswap_pool_v3_abi,
        "view",
        "ticks",
        [number]
      >[]
    >({ contracts: calls, allowFailure: true, batchSize: 32768 })
    .catch((error) => {
      console.error("Error fetching ticks:", error);

      return [];
    })
    .then((results) => {
      return results.map((res) => {
        if (
          res.status === "success" &&
          res.result &&
          typeof res.result === "object"
        ) {
          const [
            liquidityGross,
            liquidityNet,
            feeGrowthOutside0X128,
            feeGrowthOutside1X128,
            tickCumulativeOutside,
            secondsPerLiquidityOutsideX128,
            secondsOutside,
            initialized,
          ] = res.result;

          return {
            liquidityGross,
            liquidityNet,
            feeGrowthOutside0X128,
            feeGrowthOutside1X128,
            tickCumulativeOutside,
            secondsPerLiquidityOutsideX128,
            secondsOutside,
            initialized,
          };
        }
      });
    });

  const ticks = tickIndices.map((tickIndex, index) => {
    if (results[index]) {
      return new Tick({
        index: tickIndex,
        liquidityGross: JSBI.BigInt(results[index].liquidityGross.toString()),
        liquidityNet: JSBI.BigInt(results[index].liquidityNet.toString()),
      });
    }
  });

  return ticks;
}
