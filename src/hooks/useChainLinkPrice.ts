import { useContext, useMemo } from "react";

import { AssetsContext } from "@/app/AssetsContextProvider";
import { IToken } from "@/const/contracts/types/tokenTypes";

export default function useChainLinkPrice(
  base?: IToken,
  quote: IToken | string = "USD",
) {
  const { assetValues } = useContext(AssetsContext);
  const price = useMemo(() => {
    if (base && assetValues) {
      const quoteSymbol = typeof quote === "string" ? quote : quote.symbol;

      return assetValues.chainLinkPriceMap.get(
        `LINK:${base.symbol}_${quoteSymbol}`,
      )?.price;
    }
  }, [assetValues, base, quote]);

  return price;
}
