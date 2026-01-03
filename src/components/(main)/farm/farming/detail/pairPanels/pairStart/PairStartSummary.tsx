import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";

import { UsePairStartPanelReturn } from "@/hooks/usePairStartPanel";
import { setPrecisionString } from "@/utils/setPrecision";
import { BigDecimal } from "@/types/BigDecimal";
import usePriceImpact from "@/hooks/swap/usePriceImpact";
import { FarmPair } from "@/types/FarmListTableRowProps";
import useTokenUsdPrice from "@/hooks/useTokenUsdPrice";

import { SwapSummaryComponents as Components } from "../../../common/SwapSummaryComponents";

export default function PairStartSummary({
  item,
  state,
}: {
  item: FarmPair;
  state: UsePairStartPanelReturn;
}) {
  const activeIndex: 0 | 1 = state.isActive[0] ? 0 : 1;
  const otherIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;

  // [MOD] 표시/계산에 모두 토글 반영된 표시용 토큰 사용
  const activeToken = state.displayTokens?.[activeIndex];
  const otherToken = state.displayTokens?.[otherIndex];

  // const activeTokenStatus = state.tokenStatuses.find((v) => v.isActive);
  // const otherTokenStatus = state.tokenStatuses.find((v) => !v.isActive);
  // const activeToken = activeTokenStatus?.input;
  // const otherToken = otherTokenStatus?.input;

  const { priceUsd: activePriceUsd } = useTokenUsdPrice(activeToken as any);
  const { priceUsd: otherPriceUsd } = useTokenUsdPrice(otherToken as any);
  const activePrice = useMemo(
    () =>
      activePriceUsd != null
        ? new BigDecimal(String(activePriceUsd), 8)
        : undefined,
    [activePriceUsd]
  );
  const otherPrice = useMemo(
    () =>
      otherPriceUsd != null
        ? new BigDecimal(String(otherPriceUsd), 8)
        : undefined,
    [otherPriceUsd]
  );

  // const activePrice = useMemo(() => {
  //   if (activeToken?.symbol && assetValues?.chainLinkPriceMap) {
  //     return assetValues.chainLinkPriceMap.get(`LINK:${activeToken.symbol}_USD`)
  //       ?.price;
  //   }

  //   return undefined;
  // }, [activeToken?.symbol, assetValues?.chainLinkPriceMap]);

  // const otherPrice = useMemo(() => {
  //   if (otherToken?.symbol && assetValues?.chainLinkPriceMap) {
  //     return assetValues.chainLinkPriceMap.get(`LINK:${otherToken.symbol}_USD`)
  //       ?.price;
  //   }

  //   return undefined;
  // }, [otherToken?.symbol, assetValues?.chainLinkPriceMap]);

  const chainId = state.chainId;

  // const basePoolBalance = useMemo(() => {
  //   if (activeIndex === 0) {
  //     return state.poolBalance0;
  //   } else {
  //     return state.poolBalance1;
  //   }
  // }, [activeIndex, state.poolBalance0, state.poolBalance1]);

  // const quotePoolBalance = useMemo(() => {
  //   if (activeIndex === 0) {
  //     return state.poolBalance1;
  //   } else {
  //     return state.poolBalance0;
  //   }
  // }, [activeIndex, state.poolBalance0, state.poolBalance1]);

  // [MOD] 풀 잔고 선택 규칙은 기존 유지
  const basePoolBalance = useMemo(
    () => (activeIndex === 0 ? state.poolBalance0 : state.poolBalance1),
    [activeIndex, state.poolBalance0, state.poolBalance1]
  );
  const quotePoolBalance = useMemo(
    () => (activeIndex === 0 ? state.poolBalance1 : state.poolBalance0),
    [activeIndex, state.poolBalance0, state.poolBalance1]
  );

  // const priceImpact = usePriceImpact({
  //   pool: item?.wip_stakeToken.swap,
  //   token: item?.wip_stakeToken.swap.input[activeIndex],
  //   inputAmount: activeTokenStatus?.amount || BigDecimal.ZERO(),
  //   chainId,
  // });

  // const swapAmount = useMemo<{
  //   swapAmount: BigDecimal;
  //   swappedAmount: BigDecimal;
  //   activeAmount: BigDecimal;
  // }>(() => {
  //   if (activeTokenStatus && otherTokenStatus && activeToken && otherToken) {
  //     const swapAmount = new BigDecimal(activeTokenStatus.amount || 0)
  //       .div(2)
  //       .roundToDecimals(activeToken.decimals || 8);
  //     const swappedAmount = swapAmount
  //       .mul(quotePoolBalance)
  //       .div(basePoolBalance)
  //       .roundToDecimals(otherToken.decimals || 8);

  //     return {
  //       swapAmount,
  //       swappedAmount,
  //       activeAmount: new BigDecimal(activeTokenStatus.amount || 0).sub(
  //         swapAmount,
  //       ),
  //     };
  //   } else {
  //     return {
  //       swapAmount: BigDecimal.ZERO(),
  //       activeAmount: BigDecimal.ZERO(),
  //       swappedAmount: BigDecimal.ZERO(),
  //     };
  //   }
  // }, [
  //   activeTokenStatus,
  //   otherTokenStatus,
  //   activeToken,
  //   otherToken,
  //   quotePoolBalance,
  //   basePoolBalance,
  // ]);

  // const active = useMemo(
  //   () => ({
  //     symbol: activeToken?.symbol,
  //     iconSrc: activeToken?.iconSrc,
  //     amount: setPrecisionString(
  //       swapAmount.activeAmount,
  //       activeToken?.decimals || 8,
  //       true,
  //     ),
  //     dollarAmount: setPrecisionString(
  //       swapAmount.activeAmount.mul(activePrice ?? 0),
  //       2,
  //       true,
  //       true,
  //     ),
  //   }),
  //   [
  //     activeToken?.symbol,
  //     activeToken?.iconSrc,
  //     activeToken?.decimals,
  //     swapAmount.activeAmount,
  //     activePrice,
  //   ],
  // );

  // [MOD] price impact 계산 시 토큰은 주소 기준(수학은 기존대로), 단 토글 반영된 표시 토큰 전달
  const activeTokenStatus = state.tokenStatuses?.[activeIndex];
  const priceImpact = activeToken
    ? usePriceImpact({
        pool: item?.wip_stakeToken?.swap,
        token: activeToken as any, // ⬅️ 주소 맵 포함된 전체 객체를 그대로 넘김
        inputAmount: activeTokenStatus?.amount || BigDecimal.ZERO(),
        chainId,
      })
    : 0;

  // [MOD] 스왑 반영량(표시)은 토글된 토큰 기준. (1:1로 수치 영향 없음)
  const swapAmount = useMemo<{
    swapAmount: BigDecimal;
    swappedAmount: BigDecimal;
    activeAmount: BigDecimal;
  }>(() => {
    if (activeTokenStatus && activeToken && otherToken) {
      const half = new BigDecimal(activeTokenStatus.amount || 0)
        .div(2)
        .roundToDecimals(activeToken.decimals || 8);
      const swapped = half
        .mul(quotePoolBalance)
        .div(basePoolBalance)
        .roundToDecimals(otherToken.decimals || 8);

      return {
        swapAmount: half,
        swappedAmount: swapped,
        activeAmount: new BigDecimal(activeTokenStatus.amount || 0).sub(half),
      };
    }
    return {
      swapAmount: BigDecimal.ZERO(),
      swappedAmount: BigDecimal.ZERO(),
      activeAmount: BigDecimal.ZERO(),
    };
  }, [
    activeTokenStatus,
    activeToken,
    otherToken,
    quotePoolBalance,
    basePoolBalance,
  ]);

  const active = useMemo(
    () => ({
      symbol: activeToken?.symbol,
      iconSrc: (activeToken as any)?.iconSrc,
      amount: setPrecisionString(
        new BigDecimal(activeTokenStatus?.amount || 0),
        activeToken?.decimals || 8,
        true
      ),
      dollarAmount: setPrecisionString(
        new BigDecimal(activeTokenStatus?.amount || 0).mul(activePrice ?? 0),
        2,
        true,
        true
      ),
    }),
    [
      activeToken?.symbol,
      (activeToken as any)?.iconSrc,
      activeToken?.decimals,
      activeTokenStatus?.amount,
      activePrice,
    ]
  );

  const swapFrom = useMemo(
    () => ({
      symbol: activeToken?.symbol,
      iconSrc: activeToken?.iconSrc,
      amount: setPrecisionString(
        swapAmount.swapAmount,
        activeToken?.decimals || 8,
        true
      ),
      dollarAmount: setPrecisionString(
        swapAmount.swapAmount.mul(activePrice ?? 0),
        2,
        true,
        true
      ),
    }),
    [
      activeToken?.symbol,
      activeToken?.iconSrc,
      activeToken?.decimals,
      swapAmount.swapAmount,
      activePrice,
    ]
  );

  const swapTo = useMemo(
    () => ({
      symbol: otherToken?.symbol,
      iconSrc: otherToken?.iconSrc,
      amount: setPrecisionString(
        swapAmount.swappedAmount,
        otherToken?.decimals || 8,
        true
      ),
      dollarAmount: setPrecisionString(
        swapAmount.swappedAmount.mul(otherPrice ?? 0),
        2,
        true,
        true
      ),
    }),
    [
      otherToken?.symbol,
      otherToken?.iconSrc,
      otherToken?.decimals,
      swapAmount.swappedAmount,
      otherPrice,
    ]
  );

  const start = useMemo(
    () => ({
      symbol: activeToken?.symbol,
      iconSrc: (activeToken as any)?.iconSrc,
      amount: setPrecisionString(
        swapAmount.activeAmount,
        activeToken?.decimals || 8,
        true
      ),
      dollarAmount: setPrecisionString(
        swapAmount.activeAmount.mul(activePrice ?? 0),
        2,
        true,
        true
      ),
    }),
    [
      activeToken?.symbol,
      (activeToken as any)?.iconSrc,
      activeToken?.decimals,
      swapAmount.activeAmount,
      activePrice,
    ]
  );

  return (
    <AnimatePresence initial={false}>
      {/* {activeTokenStatus && activeToken && otherTokenStatus && otherToken && ( */}
      <Components.Container>
        <Components.Header />
        <Components.InnerGrid>
          <Components.Swap
            priceImpact={priceImpact as BigDecimal}
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
      {/* )} */}
    </AnimatePresence>
  );
}
