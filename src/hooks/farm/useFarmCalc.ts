import { useEffect } from "react";
import { IBirdieSingleFarm, IBirdieLPFarm, isBirdieLPFarm, isBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import getLiquidity from "@/utils/farm/getLiquidity";
import getTotalSupply from "@/utils/farm/getTotalSupply";
import { usePublicClient } from "wagmi";
import type { useAssetValuesReturnType } from "../assets/useAssets/useAssetValues";

type Setter<T> = React.Dispatch<React.SetStateAction<T | null>>;

interface UseFarmCalcProps {
  farm: IBirdieSingleFarm | IBirdieLPFarm;
  assetValues?: useAssetValuesReturnType;
  setTvl: Setter<BigDecimal>;
  setTotalSupply: Setter<BigDecimal>;
  setPrice: Setter<BigDecimal>;
}

export default function useFarmCalc({ farm, assetValues, setTvl, setTotalSupply, setPrice }: UseFarmCalcProps) {
  const client = usePublicClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchAndCalculate() {
      if (!client || !assetValues || !farm) return;

      try {
        const liq = await getLiquidity(client, farm, assetValues); // BigDecimal|null or [BigDecimal|null, BigDecimal|null]|null
        const supply = await getTotalSupply(client, farm); // BigDecimal|null

        if (cancelled) return;

        let totalValue: BigDecimal | null = null;
        // TVL 상태 업데이트
        if (liq !== null && liq !== undefined) {
          if (isBirdieLPFarm(farm) &&Array.isArray(liq)) {
            const [liq0, liq1] = liq;
            const token0 = farm.swap.input[0].input;
            const token1 = farm.swap.input[1].input;
            const price0 = assetValues.chainLinkPriceMap.get(`LINK:${token0.symbol}_USD`)?.price;
            const price1 = assetValues.chainLinkPriceMap.get(`LINK:${token1.symbol}_USD`)?.price;
           
            if (liq0 && liq1 && price0 && price1) {
              totalValue = new BigDecimal(liq0.mul(price0).add(liq1.mul(price1)).toString());
            } 
          } else if (isBirdieSingleFarm(farm) && liq instanceof BigDecimal) {
            const tokenPrice = assetValues.chainLinkPriceMap.get(`LINK:${farm.input.symbol}_USD`)?.price;
            if (tokenPrice) {
              totalValue = new BigDecimal(liq.mul(tokenPrice).toString());
            }
          } 
        } 

        setTvl(totalValue);

        // totalSupply 상태 업데이트
        if (supply instanceof BigDecimal) {
                setTotalSupply(supply);
        } else {
          setTotalSupply(null);
        }

        // 가격 계산: tvl / supply 검사 후 계산
        if (
          totalValue !== null &&
          totalValue !== undefined &&
          supply instanceof BigDecimal &&
          supply.value !== BigInt(0)
          ) {
            setPrice(totalValue.div(supply));
          } else {
            setPrice(null);
          }
        } catch (error) {
        console.error("useFarmCalc fetch error:", error);
        if (!cancelled) {
          setTvl(null);
          setTotalSupply(null);
          setPrice(null);
        }
      }
    }

    fetchAndCalculate();

    return () => {
      cancelled = true;
    };
  }, [client, assetValues, farm, setTvl, setTotalSupply, setPrice]);
}


/*
import { ReadContractParameters, Abi, PublicClient } from "viem";
import { readContract } from "viem/actions";
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
import getTokenAddress from "@/utils/assets/getTokenAddress";
import getProviderAddress from "@/utils/assets/getProviderAddress";
import { get } from "http";
import getTotalSupply from "@/utils/farm/getTotalSupply";

type Setter<T> = React.Dispatch<React.SetStateAction<T | null>>;

interface UseFarmCalcProps {
  farm: IBirdieSingleFarm | IBirdieLPFarm;
  assetValues?: useAssetValuesReturnType;
  setTvl: Setter<BigDecimal>;
  setTotalSupply: Setter<BigDecimal>;
  setPrice: Setter<BigDecimal>;
}

export default function useFarmCalc({ farm, assetValues, setTvl, setTotalSupply, setPrice }: UseFarmCalcProps) {
  const client = usePublicClient();
  const chainId = client?.chain?.id;
  
  useEffect(() => {
    if (client && assetValues && farm && chainId) {
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

              const value0 = assetValues.chainLinkPriceMap.get(
                `LINK:${token0.symbol}_USD`,
              )?.price;
              const value1 = assetValues.chainLinkPriceMap.get(
                `LINK:${token1.symbol}_USD`,
              )?.price;

              if (liq0 && liq1 && value0 && value1) {
                setTvl(liq0.mul(value0).add(liq1.mul(value1)));
              }
            }
          } else {
            if (isBirdieSingleFarm(farm)) {
              const value = assetValues.chainLinkPriceMap.get(
                `LINK:${farm.input.symbol}_USD`,
              )?.price;

              if (value && liq) {
                setTvl(liq.mul(value));
              }
            }
          }
        }
      });

      getTotalSupply(client, farm).then((supply) => {
        if (supply) {
          setTotalSupply(supply);
        }
      });
    }
  }, [assetValues, client, farm]);

} */
