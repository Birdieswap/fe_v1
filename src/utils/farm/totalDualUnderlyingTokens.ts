import { ReadContractParameters, Abi, PublicClient } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";
import getProviderAddress from "../assets/getProviderAddress";


export default async function totalDualUnderlyingTokens(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
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
  
  const args: ReadContractParameters<
    Abi,//(typeof farm)["abi"],
    "totalDualUnderlyingTokens",
    [`0x${string}`,bigint]
  > = {
    address: providerAddress as `0x${string}`,
    abi: farm.provider.abi as Abi,
    functionName: "totalDualUnderlyingTokens",
    args: [
      farmAddress,
    ],
  };

  const data = await readContract(client, args) as [string, string, bigint, bigint];;
  
  if (!data) return null;
  if ('swap' in farm && farm.swap && data[0] === farm.swap?.input[0].input.addresses[chainId]) {
    const poolBalance0 = new BigDecimal(data[2] as bigint, farm.swap.input[0].input.decimals);
    const token0Address = farm.swap.input[0].input.addresses[chainId];
    const poolBalance1 = new BigDecimal(data[3] as bigint, farm.swap.input[1].input.decimals);
    const token1Address = farm.swap.input[1].input.addresses[chainId];
    return [token0Address, poolBalance0, token1Address, poolBalance1 ];
  } else if ('swap' in farm && farm.swap && data[0] === farm.swap?.input[1].input.addresses[chainId]) {
    const poolBalance0 = new BigDecimal(data[2] as bigint, farm.swap.input[1].input.decimals);
    const token0Address = farm.swap.input[1].input.addresses[chainId];
    const poolBalance1 = new BigDecimal(data[3] as bigint, farm.swap.input[0].input.decimals);
    const token1Address = farm.swap.input[0].input.addresses[chainId];
    return [token0Address, poolBalance0, token1Address, poolBalance1 ];
  }
  
}
