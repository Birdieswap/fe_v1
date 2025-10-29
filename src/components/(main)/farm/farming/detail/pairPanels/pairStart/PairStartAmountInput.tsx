"use client";

import { UsePairStartPanelReturn } from "@/hooks/usePairStartPanel";
import { BigDecimal } from "@/types/BigDecimal";

import AmountInput from "../../../common/AmountInput";

export default function PairStartAmountInput({
  state,
  index,
  price,
}: {
  state: UsePairStartPanelReturn;
  index: 0 | 1;
  price: BigDecimal | null;
}) {
  // [MOD] 표시용 파생값 사용(ETH/WETH 토글 반영)
  const input = state.displayTokens[index];
  const balance = state.displayBalances[index];
  const isApproved =
    state.displayApproved?.[index] ??
    state.tokenStatuses[index]?.isApproved ??
    false;

  const isActive = state.tokenStatuses[index]?.isActive;
  const isImpermanentInsolvency =
    state.tokenStatuses[index]?.isImpermanentInsolvency;
  const amount = state.tokenStatuses[index].amount;

  const setAmount = (v: BigDecimal) => {
    state.setAmount(v, index);
  };

  const setMaxAmount = state.setMaxAmount;

  const isEthLike = input?.symbol === "ETH" || input?.symbol === "WETH";

  const nativeToggle = isEthLike
    ? {
        value: (state.nativeMode?.[index] ?? "ETH") as "ETH" | "WETH",
        onToggle: () => {
          state.setNativeMode?.((prev) => {
            const next = [...(prev ?? [])] as ("ETH" | "WETH" | null)[];
            const cur = (prev?.[index] ?? "ETH") as "ETH" | "WETH";
            next[index] = cur === "ETH" ? "WETH" : "ETH";
            return next as typeof prev;
          });
        },
      }
    : undefined;

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
        nativeToggle={nativeToggle}
      />
    </>
  );
}
