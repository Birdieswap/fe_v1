import { usePublicClient } from "wagmi";
import { useEffect, useState } from "react";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieLPFarm,
  isBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import getLiquidity from "@/utils/farm/getLiquidity";
import { BigDecimal } from "@/types/BigDecimal";

import { useAssetValuesReturnType } from "../assets/useAssets/useAssetValues";

/**
 * Get pool liquidity from the farm and calculate the TVL (Total Value Locked) based on the current asset values.
 * @param farm
 * @param assetValues
 */
export default function useFarmTVL(
  farm: IBirdieLPFarm | IBirdieSingleFarm,
  assetValues?: useAssetValuesReturnType,
) {
  const [tvl, setTvl] = useState<BigDecimal | null>(null);
  const client = usePublicClient();

  useEffect(() => {
    if (client && assetValues) {
      getLiquidity(client, farm, assetValues).then((liq) => {
        if (liq) {
          if (0 in liq) {
            console.log(
              "Liq",
              farm.fullName,
              liq[0]?.toString(),
              liq[1]?.toString(),
            );
            if (isBirdieLPFarm(farm)) {
              const liq0 = liq[0];
              const liq1 = liq[1];

              // Currencies
              const token0 = farm.swap.input[0].input;
              const token1 = farm.swap.input[1].input;

              const price0 = assetValues.chainLinkPriceMap.get(
                `LINK:${token0.symbol}_USD`,
              )?.price;
              const price1 = assetValues.chainLinkPriceMap.get(
                `LINK:${token1.symbol}_USD`,
              )?.price;

              if (liq0 && liq1 && price0 && price1) {
                setTvl(liq0.mul(price0).add(liq1.mul(price1)));
              }
            }
          } else {
            if (isBirdieSingleFarm(farm)) {
              const price = assetValues.chainLinkPriceMap.get(
                `LINK:${farm.input.symbol}_USD`,
              )?.price;

              if (price && liq) {
                setTvl(liq.mul(price));
              }
            }
          }
        }
      });
    }
  }, [assetValues, client, farm]);

  return tvl;
}
