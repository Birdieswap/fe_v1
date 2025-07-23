import { useContext, useMemo, useState } from "react";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";

import useFarmStopPanelCommon from "./useFarmStopPanelCommon";
import useFarmLPBalances from "./useFarmLPBalances";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

export function usePairStopPanel(item: FarmPair) {
  const {
    isConnected,
    chainId,
    amount,
    setAmount,
    balance,
    isApproved,
    tokenStatus,
    stopFarming,
    isInsufficientBalance,
    isImpermanentInsolvency,
    isPending,
    isInvalid,
    isAmountEditable,
    isWrongNetwork,
    isStoppable,
    setMaxAmount,
  } = useFarmStopPanelCommon(item);

  const [isActive, setIsActive] = useState<[boolean, boolean]>([true, true]);

  const { assetValues } = useContext(AssetsContext);
  const { poolBalance0, poolBalance1 } = useFarmLPBalances(item, assetValues);
  const unlockAmounts = useMemo(() => {
    const token0 = item.wip_stakeToken.swap.input[0].input;
    const token1 = item.wip_stakeToken.swap.input[1].input;
    // Get the amount of the change of liquidity as an integer
    const dL =
      amount?.shift(-(item.wip_stakeToken.decimals ?? 18)) ?? BigDecimal.ZERO();
    // Get the pool balances as integers
    const x = poolBalance0.shift(-(token0.decimals ?? 18)).roundToDecimals(36);
    const y = poolBalance1.shift(-(token1.decimals ?? 18)).roundToDecimals(36);

    if (x.eq(0)) return [null, null];
    const P = y.div(x);
    const sqrt_P = P.sqrt(); // Square root of the price

    if (sqrt_P.eq(0)) return [null, null];

    // Calculate the amounts to unlock
    // dx = dL ( \frac{1}{\sqrt{P}} - \frac{1}{\sqrt{B}} )
    // As we are staking with B (upper price range) of infinity, we can simplify this to:
    // dx = \frac{dL}{\sqrt{P}}
    const dx = dL
      .div(sqrt_P)
      .roundToDecimals(0)
      .shiftTo(token0.decimals ?? 18);
    // dy = dL ( \sqrt{P} - \sqrt{A} )
    // As we are staking with A (lower price range) of zero, we can simplify this to:
    // dy = dL \sqrt{P}
    const dy = dL
      .mul(sqrt_P)
      .roundToDecimals(0)
      .shiftTo(token1.decimals ?? 18);

    return [dx, dy];
  }, [
    amount,
    item.wip_stakeToken.decimals,
    item.wip_stakeToken.swap.input,
    poolBalance0,
    poolBalance1,
  ]);

  const receiveAmount = useMemo<[BigDecimal, BigDecimal]>(() => {
    const [amount0, amount1] = unlockAmounts;

    if (!amount0 || !amount1) {
      return [BigDecimal.ZERO(), BigDecimal.ZERO()];
    } else {
      return [amount0, amount1];
    }
  }, [unlockAmounts]);

  return {
    amount,
    balance,
    setAmount,
    setMaxAmount,
    isAmountEditable,
    receiveAmount,
    isInsufficientBalance,
    isImpermanentInsolvency,
    isApproved,
    tokenStatus,
    isInvalid,
    isActive,
    setIsActive,
    isPending,
    isConnected,
    chainId,
    isWrongNetwork,
    isStoppable,
    stopFarming,
    poolBalance0,
    poolBalance1,
    unlockAmounts,
  };
}

export type UsePairStopPanelReturn = ReturnType<typeof usePairStopPanel>;
