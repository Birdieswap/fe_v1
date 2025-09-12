import { Chain, Address, PublicClient, ReadContractParameters } from "viem";
import { readContract } from "viem/actions";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { BigDecimal } from "@/types/BigDecimal";
import { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";

import getTokenAddress from "../assets/getTokenAddress";
import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";
import totalDualUnderlyingTokens from "./totalDualUnderlyingTokens";


async function getSingleLiquidity(
  client: PublicClient,
  farm:IBirdieSingleFarm,
): Promise<BigDecimal | null> {

  const currency = farm.input;
  const chainId = client.chain?.id;

  if (!chainId) return null;
  
  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  if (!farmAddress) return null;

  const tokenAddress = getTokenAddress({
    token: currency,
    chainId,
  });

  if (!tokenAddress) return null;
  const routerAddress = stakingProviders.BIRDIE.addresses[chainId];

  if (!routerAddress) return null;

  const args: ReadContractParameters<
    typeof birdieswap_router_abi,
    "totalUnderlyingTokens",
    [`0x${string}`]
  > = {
    address: routerAddress,
    abi: stakingProviders.BIRDIE.abi,
    functionName: "totalUnderlyingTokens",
    args: [farmAddress as `0x${string}`],
  };

  const result = await readContract<
    Chain | undefined,
    typeof birdieswap_router_abi,
    "totalUnderlyingTokens",
    [`0x${string}`]
  >(client, args);

  if (!result) return null;
  const totalUnderlyingTokens = new BigDecimal(result, currency.decimals);

  return Promise.resolve(totalUnderlyingTokens);
}

async function getLPLiquidity(
  client: PublicClient,
  farm: IBirdieLPFarm,
  assetValues: useAssetValuesReturnType,
): Promise<[`0x${string}` | null, BigDecimal | null, `0x${string}` | null, BigDecimal | null] | null> {
  const chainId = client.chain?.id;

  if (!chainId) return null;

  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });
  // console.log("getLiquidity farmAddress!!!!!!!",farm)
  if (!farmAddress) return null;

  const result = await totalDualUnderlyingTokens(
    client,
    farm,
  ) as [`0x${string}`,BigDecimal, `0x${string}`, BigDecimal] | null;

  // console.log("getLiquidity totalDualUnderlyingTokens!!!!!!!",result)

  let balance0: BigDecimal | null = null;
  let token0Address: `0x${string}` | null = null;
  let balance1: BigDecimal | null = null;
  let token1Address: `0x${string}` | null = null;

  if (result) {
    [token0Address, balance0, token1Address, balance1] = result;
  }
  return Promise.all([token0Address, balance0, token1Address, balance1]);
}

export async function getLiquidity(
  client: PublicClient,
  farm: IBirdieSingleFarm,
  assetValues?: useAssetValuesReturnType,
): Promise<BigDecimal | null>;
export async function getLiquidity(
  client: PublicClient,
  farm: IBirdieLPFarm,
  assetValues: useAssetValuesReturnType,
): Promise<[`0x${string}` | null, BigDecimal | null, `0x${string}` | null, BigDecimal | null] | null>;
export default async function getLiquidity(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  assetValues?: useAssetValuesReturnType,
): Promise<[`0x${string}` | null, BigDecimal | null, `0x${string}` | null, BigDecimal | null] | BigDecimal | null> {
  if (!client || !farm) return null;
  
  if (isBirdieSingleFarm(farm)) {
    const liq = await getSingleLiquidity(client, farm);

    return liq;
  } else {
    if (!assetValues) return null;
    
    return await getLPLiquidity(client, farm, assetValues);
  }
}
