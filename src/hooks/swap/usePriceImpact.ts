import { useContext, useMemo } from "react";

import { AssetsContext } from "@/app/AssetsContextProvider";
import { ISwapPool, IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

export function getPriceImpact({
  baseBalance,
  quoteBalance,
  inputAmount,
  side,
}: {
  baseBalance: BigDecimal;
  quoteBalance: BigDecimal;
  inputAmount: BigDecimal;
  side: "buy" | "sell";
}) {
  const isInputBase = side === "sell"; // true if input is base, false if input is quote
  const x = baseBalance;
  const y = quoteBalance;

  if (y.lte(0) || x.lte(0)) {
    return undefined; // No balance data available for the pool
  }
  const L = x.mul(y).sqrt(); // Liquidity
  const P = y.div(x);
  const sqrt_P = P.sqrt(); // Square root of the price
  let sqrt_P_target = sqrt_P;

  if (isInputBase) {
    // input amount is delta_x (selling base for quote)
    const delta_x = inputAmount;

    // \sqrt{P_{target}} = \frac {\sqrt{P} L} {\sqrt{P} \Delta x + L}
    sqrt_P_target = sqrt_P.mul(L).div(sqrt_P.mul(delta_x).add(L));
  } else {
    // input amount is delta_y (selling quote for base)
    const delta_y = inputAmount;
    // L = \frac{\Delta y}{\Delta \sqrt{P}}
    // \Delta \sqrt{P} = \frac{\Delta y}{L}
    const delta_sqrt_P = delta_y.div(L);

    // \sqrt{P_{target}} = \sqrt{P} + \Delta \sqrt{P}
    sqrt_P_target = sqrt_P.add(delta_sqrt_P);
  }

  const P_target = sqrt_P_target.mul(sqrt_P_target); // Target price

  const impact = P_target.sub(P).div(P); // Price impact

  return impact; // Price impact
}

export default function usePriceImpact(props: {
  pool?: ISwapPool | null;
  token?: IToken;
  inputAmount: BigDecimal;
  chainId?: number;
}) {
  const { pool, inputAmount, token, chainId } = props;

  const { assetValues } = useContext(AssetsContext);

  return useMemo(() => {
    if (!pool || !assetValues?.uniswapPriceMap || !token || !chainId) {
      return undefined;
    }
    const baseAddress = pool.input[0].addresses[chainId];
    const quoteAddress = pool.input[1].addresses[chainId];
    const tokenAddress = token.addresses[chainId];

    if (baseAddress !== tokenAddress && quoteAddress !== tokenAddress) {
      return undefined; // Token is not part of the pool
    }
    const data = assetValues.uniswapPriceMap.get(pool.symbol);
    // If the token to sell is the base token or the quote token in the pool
    const isSellingBase = baseAddress === tokenAddress;
    // If we are selling the quote token, we switch the base and quote balances
    // to display the price impact in terms of the token being sold
    // i.e. If we are selling BTC in a BTC/USDT pool, the price we want to use
    // is usual BTC/USDT price;
    // but if we are selling USDT in a BTC/USDT pool,
    // we want to use the USDT/BTC price, which is the inverse of the BTC/USDT price.
    const sellBalance = isSellingBase ? data?.baseBalance : data?.quoteBalance;
    const buyBalance = isSellingBase ? data?.quoteBalance : data?.baseBalance;

    if (!sellBalance || !buyBalance) {
      return undefined; // No balance data available for the pool
    }

    return getPriceImpact({
      baseBalance: sellBalance,
      quoteBalance: buyBalance,
      inputAmount,
      side: "sell",
    });
  }, [pool, inputAmount, token, chainId, assetValues?.uniswapPriceMap]);
}
