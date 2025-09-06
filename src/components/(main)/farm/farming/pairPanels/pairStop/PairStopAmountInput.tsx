"use client";

import { UsePairStopPanelReturn } from "@/hooks/usePairStopPanel";
import { BigDecimal } from "@/types/BigDecimal";

import AmountInput from "../../common/AmountInput";

export default function PairStopAmountInput({
  state,
  price,
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
  price: BigDecimal | null;
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
        price={price}
      />
    </>
  );
}
