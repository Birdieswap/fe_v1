// useFarmTVL.ts
import { usePublicClient } from "wagmi";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieLPFarm,
  isBirdieSingleFarm
} from "@/const/contracts/types/tokenTypes";
import getLiquidity from "@/utils/farm/getLiquidity";
import { BigDecimal } from "@/types/BigDecimal";
import { useAssetValuesReturnType } from "../assets/useAssets/useAssetValues";
import { PublicClient } from "viem";

export default function useFarmTVL(
  farm: IBirdieLPFarm | IBirdieSingleFarm,
  assetValues?: useAssetValuesReturnType
) {
  const [tvl, setTvl] = useState<BigDecimal | null>(null);
  const client = usePublicClient();
  const didFetchRef = useRef(false);

  const fetchTVL = useCallback(async (): Promise<BigDecimal | null> => {
    if (!client || !farm || !assetValues) {
      setTvl(null);
      return null;
    }
    try {
      console.log("[useFarmTVL] Fetching liquidity for farm:", farm.fullName);
      const liq = await getLiquidity(client as PublicClient, farm, assetValues);
      console.log("[useFarmTVL] liquidity data:", liq);
      if (!liq) {
        setTvl(null);
        console.warn("[useFarmTVL] Liquidity data missing");
        return null;
      }
      let totalValue: BigDecimal | null = null;
      if (isBirdieLPFarm(farm) && Array.isArray(liq)) {
        const [liq0, liq1] = liq;
        const token0 = farm.swap.input[0].input;
        const token1 = farm.swap.input[1].input;
        const price0 = assetValues.chainLinkPriceMap.get(`LINK:${token0.symbol}_USD`)?.price;
        const price1 = assetValues.chainLinkPriceMap.get(`LINK:${token1.symbol}_USD`)?.price;
        if (liq0 && liq1 && price0 && price1) {
          totalValue = new BigDecimal(liq0.mul(price0).add(liq1.mul(price1)).toString());
          console.log("[useFarmTVL] LP farm total value:", totalValue.toString());
        } else {
          console.warn("[useFarmTVL] Missing price/liquidity for LP farm");
        }
      } else if (isBirdieSingleFarm(farm) && liq instanceof BigDecimal) {
        const tokenPrice = assetValues.chainLinkPriceMap.get(`LINK:${farm.input.symbol}_USD`)?.price;
        if (tokenPrice) {
          totalValue = new BigDecimal(liq.mul(tokenPrice).toString());
          console.log("[useFarmTVL] Single farm total value:", totalValue.toString());
        } else {
          console.warn("[useFarmTVL] Missing tokenPrice for single farm");
        }
      } else {
        console.warn("[useFarmTVL] Unexpected liquidity format");
      }
      if (totalValue) {
        setTvl(totalValue);
        return totalValue;
      }
      setTvl(null);
      return null;
    } catch (err: any) {
      console.error("[useFarmTVL] fetch error:", err?.message || err);
      setTvl(null);
      return null;
    }
  }, [assetValues, client, farm]);

  useEffect(() => {
    didFetchRef.current = false;
  }, [client?.chain?.id, assetValues]);

  useEffect(() => {
    if (!didFetchRef.current) {
      fetchTVL();
      didFetchRef.current = true;
    }
  }, [fetchTVL]);

  return { tvl, refetchTVL: fetchTVL };
}
