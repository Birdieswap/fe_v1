// positionManager.ts
import { uniswap_nonfungiblePositionManager_abi } from "@/const/contracts/abis/uniswap_nonfungiblePositionManager_abi";
import { PublicClient } from "viem";

export type V3PositionRaw = {
  nonce: bigint;
  operator: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
};

export async function fetchV3Position(
  client: PublicClient,
  nfpmAddress: `0x${string}`,
  tokenId: bigint
): Promise<V3PositionRaw> {
  const res = await client.readContract({
    address: nfpmAddress,
    abi: uniswap_nonfungiblePositionManager_abi,
    functionName: "positions",
    args: [tokenId],
  });

  const [
    nonce,
    operator,
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    liquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  ] = res as any;

  return {
    nonce,
    operator,
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    liquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  };
}
