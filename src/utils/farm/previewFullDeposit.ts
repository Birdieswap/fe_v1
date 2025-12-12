import { ReadContractParameters, Abi, PublicClient } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";
import getProviderAddress from "../assets/getProviderAddress";

export default async function previewFullDeposit(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  amount: BigDecimal,
  providerOverride?: {
    address?: `0x${string}`;
    abi?: Abi;
  }
) {
  const chainId = client.chain?.id;

  if (!chainId) return null;
  const farmAddress = getTokenAddress({
    token: farm,
    chainId,
  });

  const defaultProviderAddress = getProviderAddress({
    provider: farm.provider,
    chainId,
  });

  // 🔥 override 가 있으면 그걸 우선 사용
  const providerAddress =
    (providerOverride?.address as `0x${string}` | undefined) ??
    (defaultProviderAddress as `0x${string}`);

  const abi: Abi =
    (providerOverride?.abi as Abi | undefined) ?? (farm.provider.abi as Abi);

  // console.log("previewFulDeposit ", farm);

  if (!farmAddress) return null;

  const args: ReadContractParameters<
    Abi, //(typeof farm)["abi"],
    "previewFullDeposit",
    [`0x${string}`, bigint]
  > = {
    address: providerAddress as `0x${string}`,
    abi,
    functionName: "previewFullDeposit",
    args: [farmAddress, amount.roundToDecimals(farm.decimals).value],
  };

  const data = await readContract(client, args);

  return new BigDecimal(data as bigint, farm.decimals);
}
