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
import { findSymbolByAddress } from "../assets/getTokenSymbol";
import { getLiquidityCached, getTotalSupplyCached } from "@/utils/farm/farmDataCache";

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
  // console.log("calcFarmOnce called", farm.fullName, farm);
  const chainId = client.chain?.id;

  const apy = BigDecimal.ZERO();

  const data = await getLiquidityCached(client, farm);
  const supply = await getTotalSupplyCached(client, farm);
  // const data = await getLiquidity(client, farm, assetValues);
  // const supply = await getTotalSupply(client, farm);

  // console.log("calcFarmOnce", farm, data, supply)



  let tvl: BigDecimal | null = null;

  if (data !== null && data !== undefined) {
    if (isBirdieLPFarm(farm) && Array.isArray(data)) {
      const [token0, liq0, token1, liq1] = data;
      const symbol0 = findSymbolByAddress(token0 as `0x${string}`,chainId as number)
      const symbol1 = findSymbolByAddress(token1 as `0x${string}`,chainId as number)
            // 주의: 심볼 기반 키는 충돌 위험. 추후 주소 기반으로 개선 권장.
      const price0 = assetValues.chainLinkPriceMap.get(`LINK:${symbol0}_USD`)?.price;
      const price1 = assetValues.chainLinkPriceMap.get(`LINK:${symbol1}_USD`)?.price;
      // console.log("calcFarmOnce", farm.fullName, farm, { liq0, liq1, token0, token1, symbol0, symbol1, price0, price1 });

      if (liq0 && liq1 && price0 && price1) {
        tvl = new BigDecimal(liq0.mul(price0).add(liq1.mul(price1)).toString());
      }
    } else if (isBirdieSingleFarm(farm) && data instanceof BigDecimal) {
      const tokenPrice = assetValues.chainLinkPriceMap.get(`LINK:${farm.input.symbol}_USD`)?.price;
      if (tokenPrice) {
        tvl = new BigDecimal(data.mul(tokenPrice).toString());
      }
    }
  }

  let price: BigDecimal | null = null;
  if (tvl && supply instanceof BigDecimal && supply.value !== BigInt(0)) {
    price = tvl.div(supply);
  }

  return { apy, tvl, price };
}
