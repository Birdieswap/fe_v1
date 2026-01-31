// src/hooks/farm/useFarmCalcOnce.ts
import { useEffect, useState } from "react";
import { PublicClient } from "viem";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import type { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";
import { calcFarmOnce, FarmCalc } from "@/utils/farm/calcFarmOnce";

/**
 * 주어진 farm 에 대해 calcFarmOnce 를 한 번 실행해서
 * TVL / price / poolBalance0/1 을 가져오는 훅.
 *
 * - client, farm, assetValues 중 하나라도 없으면 null을 리턴
 * - 의존성이 바뀌면 자동으로 재계산
 */
export function useFarmCalcOnce(
  client: PublicClient | undefined,
  farm: IBirdieSingleFarm | IBirdieLPFarm | undefined,
  assetValues: useAssetValuesReturnType | undefined
): FarmCalc | null {
  const [result, setResult] = useState<FarmCalc | null>(null);

  useEffect(() => {
    if (!client || !farm || !assetValues) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await calcFarmOnce(client, farm, assetValues);
        if (!cancelled) {
          setResult(res);
        }
      } catch (e) {
        console.error("[useFarmCalcOnce] calcFarmOnce failed", e);
        if (!cancelled) {
          setResult(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, farm, assetValues]);

  return result;
}
