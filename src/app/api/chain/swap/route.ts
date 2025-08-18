import { NextRequest } from "next/server";
import { Address, createPublicClient, http } from "viem";

import networks from "@/const/contracts/networks";
import { getPoolState } from "@/utils/uniswap/getPoolState";
import { getPoolImmutables } from "@/utils/uniswap/getPoolImmutables";

export const revalidate = 20;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get("chainId");
  const poolAddress = searchParams.get("poolAddress");

  if (!poolAddress) {
    return new Response("Address not provided", { status: 400 });
  }
  if (!poolAddress.startsWith("0x") || poolAddress.length !== 42) {
    return new Response("Invalid address format", { status: 400 });
  }
  if (!chainId) {
    return new Response("Chain ID not provided", { status: 400 });
  }
  if (!/^\d+$/.test(chainId)) {
    return new Response("Invalid chain ID format", { status: 400 });
  }

  const network = Object.values(networks).find(
    (v) => v.id === parseInt(chainId),
  );

  if (!network) {
    return new Response("Network not found", { status: 404 });
  }

  const publicClient = createPublicClient({
    chain: network.viemChain,
    transport: http(),
    
  });
  
  const [immutables, state] = await Promise.all([
    getPoolImmutables(publicClient, poolAddress as Address),
    getPoolState(publicClient, poolAddress as Address),
  ]);

  const poolData = {
    factory: immutables.factory,
    token0: immutables.token0,
    token1: immutables.token1,
    fee: immutables.fee,
    tickSpacing: immutables.tickSpacing,
    sqrtPriceX96: state.sqrtPriceX96.toString(10),
    tick: state.tick,
    observationIndex: (state as any).observationIndex,
    observationCardinality: (state as any).observationCardinality,
    observationCardinalityNext: (state as any).observationCardinalityNext,
    feeProtocol: (state as any).feeProtocol,
    unlocked: (state as any).unlocked,
    liquidity: state.liquidity.toString(10),
  };

  return new Response(JSON.stringify(poolData), {
    headers: { "Content-Type": "application/json" },
  });
}
