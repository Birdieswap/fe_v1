import { useMemo } from "react";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import { IBirdieLPFarm } from "@/const/contracts/types/tokenTypes";

import { useAssetValuesReturnType } from "./assets/useAssets/useAssetValues";

export default function useFarmLPBalances(
  item: FarmPair | IBirdieLPFarm,
  assetValues?: useAssetValuesReturnType
) {
  const stakeToken = useMemo(
    () => ("addresses" in item ? item : item.wip_stakeToken),
    [item]
  );
  const [poolBalance0, poolBalance1] = useMemo(() => {
    const token0 = stakeToken.swap.input[0].input;

    if (assetValues && assetValues.uniswapPriceMap) {
      const swapPool = stakeToken.swap;
      const swapData = assetValues.uniswapPriceMap.get(swapPool.symbol);

      if (swapData) {
        if (token0.symbol === swapPool.input[0].input.symbol) {
          return [swapData.baseBalance, swapData.quoteBalance];
        } else {
          return [swapData.quoteBalance, swapData.baseBalance];
        }
      }
    }

    return [BigDecimal.ZERO(), BigDecimal.ZERO()];
  }, [assetValues, stakeToken]);
  console.log(
    "useFarmLPBalances poolBalance0, poolBalance1",
    item,
    poolBalance0,
    poolBalance1
  );
  return {
    poolBalance0,
    poolBalance1,
  };
}
