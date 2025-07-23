import { PublicClient, ReadContractParameters } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";

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

  if (!farmAddress) return null;
  const args: ReadContractParameters<
    (typeof farm)["abi"],
    "previewRedeem",
    [bigint]
  > = {
    address: farmAddress,
    abi: farm.abi,
    functionName: "previewRedeem",
    args: [amount.roundToDecimals(farm.decimals).value],
  };

  const data = await readContract(client, args);

  return new BigDecimal(data, farm.decimals);
}
