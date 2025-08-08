import { Chain, erc20Abi, PublicClient, ReadContractParameters } from "viem";
import { readContract } from "viem/actions";

import {
  EProvider,
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieSingleFarm,
  IToken,
} from "@/const/contracts/types/tokenTypes";
import { aave_pool_abi } from "@/const/contracts/abis/aave_pool_abi";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { BigDecimal } from "@/types/BigDecimal";
import { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";

import getTokenAddress from "../assets/getTokenAddress";
import getLPPoolBalances from "../assets/getLPPoolBalances";

import previewRedeem from "./previewRedeem";

async function getAaveLiquidity(
  client: PublicClient,
  currency: IToken,
  chainId: number,
  farmAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
): Promise<BigDecimal | null> {
  const aaveAddress = stakingProviders.AAVE.addresses[chainId];

  if (!aaveAddress) return null;

  const args: ReadContractParameters<
    typeof aave_pool_abi,
    "getReserveAToken",
    [`0x${string}`]
  > = {
    address: aaveAddress,
    abi: aave_pool_abi,
    functionName: "getReserveAToken",
    args: [tokenAddress as `0x${string}`],
  };

  const aTokenAddress = await readContract<
    Chain | undefined,
    typeof aave_pool_abi,
    "getReserveAToken",
    [`0x${string}`]
  >(client, args);

  if (!aTokenAddress) return null;

  // Fetch the balance of the aToken in the farm address
  const aTokenBalanceArgs: ReadContractParameters<
    typeof erc20Abi,
    "balanceOf",
    [`0x${string}`]
  > = {
    address: aTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [farmAddress],
  };

  const tokenBalanceArgs: ReadContractParameters<
    typeof erc20Abi,
    "balanceOf",
    [`0x${string}`]
  > = {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [farmAddress],
  };

  const [aTokenBalance, tokenBalance] = await Promise.all([
    readContract<
      Chain | undefined,
      typeof erc20Abi,
      "balanceOf",
      [`0x${string}`]
    >(client, aTokenBalanceArgs),
    readContract<
      Chain | undefined,
      typeof erc20Abi,
      "balanceOf",
      [`0x${string}`]
    >(client, tokenBalanceArgs),
  ]);

  if (!aTokenBalance || !tokenBalance) return null;

  console.log(
    "getLiquidity AAVE aToken",
    farmAddress,
    currency.symbol,
    aTokenAddress,
    aTokenBalance,
  );
  console.log(
    "getLiquidity AAVE token",
    farmAddress,
    currency.symbol,
    tokenAddress,
    tokenBalance,
  );

  // aToken is pegged to the underlying asset
  return new BigDecimal(aTokenBalance, currency.decimals).add(
    new BigDecimal(tokenBalance, currency.decimals),
  );
}

async function getSingleLiquidity(
  client: PublicClient,
  farm: IBirdieSingleFarm,
) {
  console.log("getLiquidity_Farm",farm);
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

  if (farm.provider.provider === EProvider.AAVE) {
    return await getAaveLiquidity(
      client,
      currency,
      chainId,
      farmAddress,
      tokenAddress,
    );
  } else if (farm.provider.provider === EProvider.AUTOPILOT) {
    // Autopilot is not supported yet
    return null;
  }

  return null;
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

  const [poolBalance0, poolBalance1] = getLPPoolBalances({
    fromToken: farm.swap.input[0],
    toToken: farm.swap.input[1],
    chainId,
    assetValues,
  });
  console.log("pool balance",poolBalance0,poolBalance1)
  const balance0 = poolBalance0
    ? previewRedeem(client, farm.swap.input[0], poolBalance0)
    : null;
  const balance1 = poolBalance1
    ? previewRedeem(client, farm.swap.input[1], poolBalance1)
    : null;

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

    console.log(
      "getLiquidity",
      farm.fullName,
      "single farm liquidity",
      liq?.toString(),
    );

    return liq;
  } else {
    if (!assetValues) return null;

    return await getLPLiquidity(client, farm, assetValues);
  }
}
