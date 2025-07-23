import { useMemo, useState } from "react";

import { FarmSingle } from "@/types/FarmListTableRowProps";

import useFarmStopPanelCommon from "./useFarmStopPanelCommon";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

export function useSingleStopPanel(item: FarmSingle) {
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

  const [isActive, setIsActive] = useState<boolean>(true);

  const receiveAmount = useMemo(() => {
    return amount; // TODO edit here when bToken and aToken are not 1:1
  }, [amount]);

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
  };
}

export type UseSingleStopPanelReturn = ReturnType<typeof useSingleStopPanel>;
