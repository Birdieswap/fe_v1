"use client";

import { UsePairStopPanelReturn } from "@/hooks/usePairStopPanel";
import { BigDecimal } from "@/types/BigDecimal";

import AmountInput from "../../../common/AmountInput";

export default function PairStopAmountInput({
  state,
  price,
  nativeToggle,
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
  nativeToggle?: { value: "ETH" | "WETH"; onToggle: () => void };
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
        panel="stop"
        nativeToggle={nativeToggle}
      />
    </>
  );
}
