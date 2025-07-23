import { useCallback, useContext } from "react";
import { useChainId } from "wagmi";

import { AssetsContext } from "@/app/AssetsContextProvider";
import {
  IBirdieSingleFarm,
  ICurrency,
} from "@/const/contracts/types/tokenTypes";
import getLPPoolBalances from "@/utils/assets/getLPPoolBalances";

export default function useLPPoolBalances<
  T extends ICurrency | IBirdieSingleFarm,
>() {
  const chainId = useChainId();
  const { assetValues } = useContext(AssetsContext);

  return useCallback(
    (fromToken?: T, toToken?: T) => {
      if (!fromToken || !toToken || !chainId || !assetValues) {
        return [null, null];
      }

      return getLPPoolBalances({
        fromToken,
        toToken,
        chainId,
        assetValues,
      });
    },
    [chainId, assetValues],
  );
}
