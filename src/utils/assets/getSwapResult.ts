import {
  IBirdieSingleFarm,
  ICurrency,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import { useAssetValues } from "@/hooks/assets/useAssets/useAssetValues";

import getLPPoolBalances from "./getLPPoolBalances";

export default function getSwapResult<
  T extends ICurrency | IBirdieSingleFarm,
>(props: {
  swapFrom: T | undefined; // undefined 허용;
  swapTo: T | undefined; // undefined 허용;
  amount: BigDecimal;
  chainId: number;
  assetValues: ReturnType<typeof useAssetValues>;
}) {
  const { swapFrom, swapTo, amount, chainId, assetValues } = props;
  console.log("getSwapResult", swapFrom, swapTo, amount, chainId);
  if (!swapFrom || !swapTo) return null;

  const [fromPoolBalance, toPoolBalance] = getLPPoolBalances({
    fromToken: swapFrom,
    toToken: swapTo,
    chainId,
    assetValues,
  });

  // console.log("getSwapResult 2", fromPoolBalance, toPoolBalance);

  if (fromPoolBalance === null || toPoolBalance === null) return null;
  if (fromPoolBalance.isZero()) return null;

  const res = amount
    .mul(toPoolBalance)
    .div(fromPoolBalance)
    .roundToDecimals(swapTo.decimals);

  // console.log("getSwapResult 3", res.toString());

  return res;
}
