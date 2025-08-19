import { Chain, erc20Abi, PublicClient, ReadContractParameters } from "viem";
import { readContract } from "viem/actions";

import {
  EProvider,
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieSingleFarm,
  IToken,
} from "@/const/contracts/types/tokenTypes";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { BigDecimal } from "@/types/BigDecimal";
import { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";

import getTokenAddress from "../assets/getTokenAddress";
import getLPPoolBalances from "../assets/getLPPoolBalances";

import previewRedeem from "./previewRedeem";
import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";
import { aave_pool_abi } from "@/const/contracts/abis/aave_pool_abi";
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
): Promise<[BigDecimal | null, BigDecimal | null] | null> {
  const chainId = client.chain?.id;

  if (!chainId) return null;

  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  if (!farmAddress) return null;

  const result = await totalDualUnderlyingTokens(
    client,
    farm,
  ) as [BigDecimal, BigDecimal] | null;

  let balance0: BigDecimal | null = null;
  let balance1: BigDecimal | null = null;

  if (result) {
    [balance0, balance1] = result;
  }
  return Promise.all([balance0, balance1]);
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
): Promise<[BigDecimal | null, BigDecimal | null] | null>;
export default async function getLiquidity(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  assetValues?: useAssetValuesReturnType,
): Promise<[BigDecimal | null, BigDecimal | null] | BigDecimal | null> {
  if (!client || !farm) return null;
  
  if (isBirdieSingleFarm(farm)) {
    const liq = await getSingleLiquidity(client, farm);

    return liq;
  } else {
    if (!assetValues) return null;
    
    return await getLPLiquidity(client, farm, assetValues);
  }
}
