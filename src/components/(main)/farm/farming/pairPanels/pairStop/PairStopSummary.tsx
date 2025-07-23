import { AnimatePresence } from "framer-motion";
import { useContext, useMemo } from "react";

import { setPrecisionString } from "@/utils/setPrecision";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";
import usePriceImpact from "@/hooks/swap/usePriceImpact";
import { FarmPair } from "@/types/FarmListTableRowProps";
import { UsePairStopPanelReturn } from "@/hooks/usePairStopPanel";

import { SwapSummaryComponents as Components } from "../../common/SwapSummaryComponents";

export default function PairStopSummary({
  item,
  state,
}: {
  item: FarmPair;
  state: UsePairStopPanelReturn;
}) {
  const { assetValues } = useContext(AssetsContext);
  const activeIndex: 0 | 1 = state.isActive[0] ? 0 : 1;
  const otherIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;
  const activeAmount = state.receiveAmount[activeIndex];
  const otherAmount = state.receiveAmount[otherIndex];
  const activeToken = item.wip_stakeToken.swap.input[activeIndex];
  const otherToken = state.isActive[otherIndex]
    ? undefined
    : item.wip_stakeToken.swap.input[otherIndex];

  const activePrice = useMemo(() => {
    if (activeToken?.input.symbol && assetValues?.chainLinkPriceMap) {
      return assetValues.chainLinkPriceMap.get(
        `LINK:${activeToken.input.symbol}_USD`,
      )?.price;
    }

    return undefined;
  }, [activeToken.input.symbol, assetValues?.chainLinkPriceMap]);

  const otherPrice = useMemo(() => {
    if (otherToken?.input.symbol && assetValues?.chainLinkPriceMap) {
      return assetValues.chainLinkPriceMap.get(
        `LINK:${otherToken.input.symbol}_USD`,
      )?.price;
    }

    return undefined;
  }, [otherToken?.input.symbol, assetValues?.chainLinkPriceMap]);

  const chainId = state.chainId;
  const sellPoolBalance = useMemo(() => {
    if (activeIndex === 1) {
      return state.poolBalance0; // Sell other token for active token
    } else {
      return state.poolBalance1;
    }
  }, [activeIndex, state.poolBalance0, state.poolBalance1]);
  const buyPoolBalance = useMemo(() => {
    if (activeIndex === 1) {
      return state.poolBalance1;
    } else {
      return state.poolBalance0;
    }
  }, [activeIndex, state.poolBalance0, state.poolBalance1]);

  const priceImpact = usePriceImpact({
    pool: item?.wip_stakeToken.swap,
    token: item?.wip_stakeToken.swap.input[otherIndex],
    inputAmount: otherAmount || BigDecimal.ZERO(),
    chainId,
  });

  const active = useMemo(
    () => ({
      symbol: activeToken?.input?.symbol,
      iconSrc: activeToken?.input?.iconSrc,
      amount: activeAmount
        .roundToDecimals(
          activeToken?.input?.displayDecimals ??
            activeToken?.input?.decimals ??
            8,
        )
        .toPrecisionString(true),
      dollarAmount: activeAmount
        .mul(activePrice ?? 0)
        .roundToDecimals(2)
        .toPrecisionString(true, true),
    }),
    [activeToken, activeAmount, activePrice],
  );

  const swapFrom = useMemo(
    () => ({
      symbol: otherToken?.input?.symbol,
      iconSrc: otherToken?.input?.iconSrc,
      amount: setPrecisionString(
        otherAmount,
        otherToken?.input?.decimals || 8,
        true,
      ),
      dollarAmount: setPrecisionString(
        otherAmount.mul(otherPrice ?? 0),
        2,
        true,
        true,
      ),
    }),
    [otherToken, otherAmount, otherPrice],
  );

  const swapTo = useMemo(() => {
    const swapToAmount = sellPoolBalance.isZero()
      ? BigDecimal.ZERO().roundToDecimals(activeToken?.input.decimals ?? 18)
      : otherAmount
          .mul(buyPoolBalance)
          .div(sellPoolBalance)
          .roundToDecimals(activeToken?.input.decimals ?? 18);

    return {
      symbol: activeToken?.input?.symbol,
      iconSrc: activeToken?.input?.iconSrc,
      amount: swapToAmount
        .roundToDecimals(
          activeToken?.input.displayDecimals ??
            activeToken?.input.decimals ??
            4,
        )
        .toPrecisionString(true),
      dollarAmount: swapToAmount
        .mul(activePrice ?? 0)
        .roundToDecimals(2)
        .toPrecisionString(true, true),
    };
  }, [activeToken, otherAmount, sellPoolBalance, buyPoolBalance, activePrice]);

  return (
    <AnimatePresence initial={false}>
      {activeToken && activeToken.input && otherToken && otherToken.input && (
        <Components.Container>
          <Components.Header />
          <Components.InnerGrid>
            <Components.Swap
              priceImpact={priceImpact}
              swapFrom={swapFrom}
              swapTo={swapTo}
            />
            <Components.StartOrStop
              active={active}
              other={swapTo}
              type="Stop"
            />
          </Components.InnerGrid>
        </Components.Container>
      )}
    </AnimatePresence>
  );
}
