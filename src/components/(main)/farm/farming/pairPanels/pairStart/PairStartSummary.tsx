import { AnimatePresence } from "framer-motion";
import { useContext, useMemo } from "react";

import { UsePairStartPanelReturn } from "@/hooks/usePairStartPanel";
import { setPrecisionString } from "@/utils/setPrecision";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";
import usePriceImpact from "@/hooks/swap/usePriceImpact";
import { FarmPair } from "@/types/FarmListTableRowProps";

import { SwapSummaryComponents as Components } from "../../common/SwapSummaryComponents";

export default function PairStartSummary({
  item,
  state,
}: {
  item: FarmPair;
  state: UsePairStartPanelReturn;
}) {
  const { assetValues } = useContext(AssetsContext);
  const activeIndex: 0 | 1 = state.isActive[0] ? 0 : 1;
  // const otherIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;
  const activeTokenStatus = state.tokenStatuses.find((v) => v.isActive);
  const otherTokenStatus = state.tokenStatuses.find((v) => !v.isActive);
  const activeToken = activeTokenStatus?.input;
  const otherToken = otherTokenStatus?.input;
  const activePrice = useMemo(() => {
    if (activeToken?.symbol && assetValues?.chainLinkPriceMap) {
      return assetValues.chainLinkPriceMap.get(`LINK:${activeToken.symbol}_USD`)
        ?.price;
    }

    return undefined;
  }, [activeToken?.symbol, assetValues?.chainLinkPriceMap]);
  const otherPrice = useMemo(() => {
    if (otherToken?.symbol && assetValues?.chainLinkPriceMap) {
      return assetValues.chainLinkPriceMap.get(`LINK:${otherToken.symbol}_USD`)
        ?.price;
    }

    return undefined;
  }, [otherToken?.symbol, assetValues?.chainLinkPriceMap]);
  const chainId = state.chainId;
  const basePoolBalance = useMemo(() => {
    if (activeIndex === 0) {
      return state.poolBalance0;
    } else {
      return state.poolBalance1;
    }
  }, [activeIndex, state.poolBalance0, state.poolBalance1]);
  const quotePoolBalance = useMemo(() => {
    if (activeIndex === 0) {
      return state.poolBalance1;
    } else {
      return state.poolBalance0;
    }
  }, [activeIndex, state.poolBalance0, state.poolBalance1]);

  const priceImpact = usePriceImpact({
    pool: item?.wip_stakeToken.swap,
    token: item?.wip_stakeToken.swap.input[activeIndex],
    inputAmount: activeTokenStatus?.amount || BigDecimal.ZERO(),
    chainId,
  });

  const swapAmount = useMemo<{
    swapAmount: BigDecimal;
    swappedAmount: BigDecimal;
    activeAmount: BigDecimal;
  }>(() => {
    if (activeTokenStatus && otherTokenStatus && activeToken && otherToken) {
      const swapAmount = new BigDecimal(activeTokenStatus.amount || 0)
        .div(2)
        .roundToDecimals(activeToken.decimals || 8);
      const swappedAmount = swapAmount
        .mul(quotePoolBalance)
        .div(basePoolBalance)
        .roundToDecimals(otherToken.decimals || 8);

      return {
        swapAmount,
        swappedAmount,
        activeAmount: new BigDecimal(activeTokenStatus.amount || 0).sub(
          swapAmount,
        ),
      };
    } else {
      return {
        swapAmount: BigDecimal.ZERO(),
        activeAmount: BigDecimal.ZERO(),
        swappedAmount: BigDecimal.ZERO(),
      };
    }
  }, [
    activeTokenStatus,
    otherTokenStatus,
    activeToken,
    otherToken,
    quotePoolBalance,
    basePoolBalance,
  ]);

  const active = useMemo(
    () => ({
      symbol: activeToken?.symbol,
      iconSrc: activeToken?.iconSrc,
      amount: setPrecisionString(
        swapAmount.activeAmount,
        activeToken?.decimals || 8,
        true,
      ),
      dollarAmount: setPrecisionString(
        swapAmount.activeAmount.mul(activePrice ?? 0),
        2,
        true,
        true,
      ),
    }),
    [
      activeToken?.symbol,
      activeToken?.iconSrc,
      activeToken?.decimals,
      swapAmount.activeAmount,
      activePrice,
    ],
  );

  const swapFrom = useMemo(
    () => ({
      symbol: activeToken?.symbol,
      iconSrc: activeToken?.iconSrc,
      amount: setPrecisionString(
        swapAmount.swapAmount,
        activeToken?.decimals || 8,
        true,
      ),
      dollarAmount: setPrecisionString(
        swapAmount.swapAmount.mul(activePrice ?? 0),
        2,
        true,
        true,
      ),
    }),
    [
      activeToken?.symbol,
      activeToken?.iconSrc,
      activeToken?.decimals,
      swapAmount.swapAmount,
      activePrice,
    ],
  );

  const swapTo = useMemo(
    () => ({
      symbol: otherToken?.symbol,
      iconSrc: otherToken?.iconSrc,
      amount: setPrecisionString(
        swapAmount.swappedAmount,
        otherToken?.decimals || 8,
        true,
      ),
      dollarAmount: setPrecisionString(
        swapAmount.swappedAmount.mul(otherPrice ?? 0),
        2,
        true,
        true,
      ),
    }),
    [
      otherToken?.symbol,
      otherToken?.iconSrc,
      otherToken?.decimals,
      swapAmount.swappedAmount,
      otherPrice,
    ],
  );

  return (
    <AnimatePresence initial={false}>
      {activeTokenStatus && activeToken && otherTokenStatus && otherToken && (
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
              type={"Start"}
            />
          </Components.InnerGrid>
        </Components.Container>
      )}
    </AnimatePresence>
  );
}
