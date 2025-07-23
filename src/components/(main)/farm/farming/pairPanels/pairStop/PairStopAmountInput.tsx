"use client";

import { UsePairStopPanelReturn } from "@/hooks/usePairStopPanel";
import { BigDecimal } from "@/types/BigDecimal";

import AmountInput from "../../common/AmountInput";

export default function PairStopAmountInput({
  state,
  tokenPrice,
}: {
  state: Pick<
    UsePairStopPanelReturn,
    | "amount"
    | "balance"
    | "isApproved"
    | "tokenStatus"
    | "setAmount"
    | "setMaxAmount"
    | "isAmountEditable"
    | "isImpermanentInsolvency"
  >;
  tokenPrice?: BigDecimal | null;
}) {
  const {
    amount,
    balance,
    isApproved,
    tokenStatus,
    setAmount,
    setMaxAmount,
    // isAmountEditable,
  } = state;

  return (
    <>
      <AmountInput
        amount={amount}
        balance={balance}
        isActive={true}
        isApproved={isApproved}
        isDisabled={false}
        isInsolvency={state.isImpermanentInsolvency}
        setAmount={setAmount}
        setMaxAmount={setMaxAmount}
        token={tokenStatus.input}
        tokenPrice={tokenPrice}
      />
    </>
  );
}
