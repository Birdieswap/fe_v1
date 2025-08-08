import { PublicClient, ReadContractParameters, Abi } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";
import getProviderAddress from "../assets/getProviderAddress";


export default async function previewRedeem(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  amount: BigDecimal,
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;
  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  const providerAddress = getProviderAddress({
    provider : farm.provider,
    chainId,
  });
  
  if (!farmAddress) return null;
  console.log("amount",amount, "args_amount", amount.roundToDecimals(farm.decimals).value)

  const args: ReadContractParameters<
    Abi,//(typeof farm)["abi"],
    "previewFullRedeem",
    [`0x${string}`,bigint]
  > = {
    address: providerAddress as `0x${string}`,
    abi: farm.provider.abi as Abi,
    functionName: "previewFullRedeem",
    args: [
      farmAddress,
      amount.roundToDecimals(farm.decimals).value
    ],
  };

  const data = await readContract(client, args);
  console.log("previewRedeem",farm, data)
  return new BigDecimal(data as bigint, farm.decimals);
}
