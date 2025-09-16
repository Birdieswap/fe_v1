import { Abi, Chain, erc20Abi, PublicClient, ReadContractParameters } from "viem";
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


export default async function getTotalSupply(
  client: PublicClient,
  farm:IBirdieLPFarm | IBirdieSingleFarm,
): Promise<BigDecimal | null> {


  const chainId = client.chain?.id;

  if (!chainId) return null;
  
  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  const routerAddress = stakingProviders.BIRDIESWAP_Router.addresses[chainId];

  if (!routerAddress || !farmAddress) return null;

  const args: ReadContractParameters = {
    address: routerAddress as `0x${string}`,
    abi: stakingProviders.BIRDIESWAP_Router.abi as Abi,
    functionName: "totalSupply",
    args: [farmAddress],
    blockTag: "latest" // 강제 최신 블록
  };
  const data = await readContract(client, args) as bigint;

  if (!data) return null;

  const totalSupply = new BigDecimal(data, farm.decimals);

  return Promise.resolve(totalSupply);
}