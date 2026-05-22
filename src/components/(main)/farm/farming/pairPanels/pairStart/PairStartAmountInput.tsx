"use client";

import { UsePairStartPanelReturn } from "@/hooks/usePairStartPanel";
import { BigDecimal } from "@/types/BigDecimal";

import AmountInput from "../../common/AmountInput";

export default function PairStartAmountInput({
  state,
  index,
  price,
}: {
  state: UsePairStartPanelReturn;
  index: 0 | 1;
  price: BigDecimal | null;
}) {
  const setAmount = (v: BigDecimal) => {
    state.setAmount(v, index);
  };
  const setMaxAmount = state.setMaxAmount;
  const {
    input,
    balance,
    amount,
    isApproved,
    isActive,
    isImpermanentInsolvency,
  } = state.tokenStatuses[index];

  return (
    <>
      <AmountInput
        amount={amount}
        balance={balance}
        isActive={isActive}
        isApproved={isApproved}
        isDisabled={false}
        isInsolvency={isImpermanentInsolvency}
        setAmount={setAmount}
        setMaxAmount={setMaxAmount}
        token={input}
        price={price}
        panel="start"
      />
    </>
  );
}
