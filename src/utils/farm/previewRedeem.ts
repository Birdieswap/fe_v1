import { PublicClient, ReadContractParameters, Abi } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";

export default async function previewRedeem(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  amount: BigDecimal
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;
  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  const providerAddress =
    stakingProviders.BIRDIESWAP_Router.addresses?.[chainId];
  const underlyingDecimals = (farm as any)?.input?.decimals ?? farm.decimals;

  if (!farmAddress) return null;

  const args: ReadContractParameters<
    Abi, //(typeof farm)["abi"],
    "previewFullRedeem",
    [`0x${string}`, bigint]
  > = {
    address: providerAddress as `0x${string}`,
    abi: stakingProviders.BIRDIESWAP_Router.abi as Abi,
    functionName: "previewFullRedeem",
    args: [farmAddress, amount.roundToDecimals(farm.decimals).value],
  };

  const data = await readContract(client, args);
  return new BigDecimal(data as bigint, underlyingDecimals);
}
