// src/hooks/farm/calcFarmOnce.ts
import { PublicClient } from "viem";
import {
  IBirdieSingleFarm,
  IBirdieLPFarm,
  isBirdieLPFarm,
  isBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import getLiquidity from "@/utils/farm/getLiquidity";
import getTotalSupply from "@/utils/farm/getTotalSupply";
import type { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";

export type FarmCalc = {
  apy: BigDecimal;
  tvl: BigDecimal | null;
  price: BigDecimal | null;
};

export async function calcFarmOnce(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  assetValues: useAssetValuesReturnType
): Promise<FarmCalc> {
  const apy = BigDecimal.ZERO();

  const liq = await getLiquidity(client, farm, assetValues);
  const supply = await getTotalSupply(client, farm);

  let tvl: BigDecimal | null = null;

  if (liq !== null && liq !== undefined) {
    if (isBirdieLPFarm(farm) && Array.isArray(liq)) {
      const [liq0, liq1] = liq;
      const token0 = farm.swap.input[0].input;
      const token1 = farm.swap.input[1].input;

      // 주의: 심볼 기반 키는 충돌 위험. 추후 주소 기반으로 개선 권장.
      const price0 = assetValues.chainLinkPriceMap.get(`LINK:${token0.symbol}_USD`)?.price;
      const price1 = assetValues.chainLinkPriceMap.get(`LINK:${token1.symbol}_USD`)?.price;

      if (liq0 && liq1 && price0 && price1) {
        tvl = new BigDecimal(liq0.mul(price0).add(liq1.mul(price1)).toString());
      }
    } else if (isBirdieSingleFarm(farm) && liq instanceof BigDecimal) {
      const tokenPrice = assetValues.chainLinkPriceMap.get(`LINK:${farm.input.symbol}_USD`)?.price;
      if (tokenPrice) {
        tvl = new BigDecimal(liq.mul(tokenPrice).toString());
      }
    }
  }

  let price: BigDecimal | null = null;
  if (tvl && supply instanceof BigDecimal && supply.value !== BigInt(0)) {
    price = tvl.div(supply);
  }

  return { apy, tvl, price };
}
