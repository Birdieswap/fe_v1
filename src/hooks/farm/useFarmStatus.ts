import { useContext } from "react";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";

import useFarmPrice from "./useFarmPrice";
import useFarmTVL from "./useFarmTVL";

export type FarmStatus = {
  apy: BigDecimal | null;
  tvl: string | null;
  price: BigDecimal | null;
};

export default function useFarmStatus(farm: IBirdieSingleFarm | IBirdieLPFarm) {
  const { assetValues } = useContext(AssetsContext);
  const { price } = useFarmPrice(farm, assetValues);
  const apy = BigDecimal.ZERO();
  const tvl = useFarmTVL(farm, assetValues);
  // const liquidity = BigDecimal.ZERO();

  return {
    apy,
    tvl,
    price,
  };
}
