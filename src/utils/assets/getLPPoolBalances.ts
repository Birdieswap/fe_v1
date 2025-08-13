import {
  isBirdieSingleFarm,
  IBirdieSingleFarm,
  ICurrency,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

import { useAssetValues } from "../../hooks/assets/useAssets/useAssetValues";

import getBToken from "./getBToken";
import getSwapPool from "./getSwapPool";

export default function getLPPoolBalances<
  T extends ICurrency | IBirdieSingleFarm,
>(props: {
  fromToken: T;
  toToken: T;
  chainId: number;
  assetValues: ReturnType<typeof useAssetValues>;
}): [BigDecimal | null, BigDecimal | null] {
  const { fromToken, toToken, chainId, assetValues } = props;

  if (!fromToken || !toToken || !chainId || !assetValues) return [null, null];

  // console.log("getLPPoolBalances", fromToken, toToken, chainId);
  const fromBToken = isBirdieSingleFarm(fromToken)
    ? fromToken
    : getBToken({
        token: fromToken,
        chainId,
      });
  const toBToken = isBirdieSingleFarm(toToken)
    ? toToken
    : getBToken({
        token: toToken,
        chainId,
      });

  // console.log("getLPPoolBalances 2", fromBToken, toBToken);

  const fromBTokenAddress = fromBToken?.addresses[chainId];
  const toBTokenAddress = toBToken?.addresses[chainId];

  if (!fromBTokenAddress || !toBTokenAddress) return [null, null];
  const pool = getSwapPool({
    fromToken,
    toToken,
    chainId,
  });

  console.log("getLPPoolBalances", pool)

  if (!pool) return [null, null];
  const poolData = assetValues.uniswapPriceMap.get(pool.symbol);

  console.log("getLPPoolBalances 4", poolData);

  if (!poolData) return [null, null];
  const baseAddress = poolData.base.addresses[chainId];
  const fromBalance =
    baseAddress === fromBTokenAddress
      ? poolData.baseBalance
      : poolData.quoteBalance;
  const toBalance =
    baseAddress === toBTokenAddress
      ? poolData.baseBalance
      : poolData.quoteBalance;

  console.log("getLPPoolBalances 5", fromBalance, toBalance);

  return [fromBalance, toBalance];
}
