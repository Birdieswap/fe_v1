import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { PublicClient } from "viem";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieLPFarm,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import { getPreviewRedeemAmount } from "@/utils/farm/getPreviewRedeemAmount";

import useInterval from "../useInterval";
import {
  useAssetValues,
  useAssetValuesReturnType,
} from "../assets/useAssets/useAssetValues";

function fetchLPPrice(
  farm: IBirdieLPFarm,
  setPrice: (price: BigDecimal | null) => void,
  client?: PublicClient,
  assetValues?: ReturnType<typeof useAssetValues>,
) {
  const token0 = farm.swap.input[0].input;
  const token1 = farm.swap.input[1].input;

  if (!client || !assetValues) return;
  getPreviewRedeemAmount(client, farm, BigDecimal.ONE()).then((v) => {
    if (v && v.tokenAmount[0] && v.tokenAmount[1]) {
      const amount0 = v.tokenAmount[0];
      const amount1 = v.tokenAmount[1];

      if (amount0 && amount1) {
        const value0 = assetValues?.chainLinkPriceMap.get(
          `LINK:${token0.symbol}_USD`,
        )?.price;
        const value1 = assetValues?.chainLinkPriceMap.get(
          `LINK:${token1.symbol}_USD`,
        )?.price;

        if (value0 && value1) {
          setPrice(amount0.mul(value0).add(amount1.mul(value1)));
        }
      }
    }
  });
}

function fetchSinglePrice(
  farm: IBirdieSingleFarm,
  setPrice: (price: BigDecimal | null) => void,
  client?: PublicClient,
  assetValues?: ReturnType<typeof useAssetValues>,
) {
  const token = farm.input;

  if (!client || !assetValues) return;
  getPreviewRedeemAmount(client, farm, BigDecimal.ONE()).then((v) => {
    if (v && v.tokenAmount) {
      const amount = v.tokenAmount;

      if (amount) {
        const value = assetValues?.chainLinkPriceMap.get(
          `LINK:${token.symbol}_USD`,
        )?.price;

        if (value) {
          setPrice(amount.mul(value));
        }
      }
    }
  });
}

export default function useFarmPrice(
  farm: IBirdieLPFarm | IBirdieSingleFarm,
  assetValues?: useAssetValuesReturnType,
) {
  const client = usePublicClient();
  const [price, setPrice] = useState<BigDecimal | null>(null);

  const fetch = useCallback(() => {
    if (!client) return;
    if (isBirdieLPFarm(farm)) {
      fetchLPPrice(farm, setPrice, client, assetValues);
    } else {
      fetchSinglePrice(farm, setPrice, client, assetValues);
    }
  }, [assetValues, client, farm]);

  useInterval(fetch, 30000);

  return { price, fetch };
}
