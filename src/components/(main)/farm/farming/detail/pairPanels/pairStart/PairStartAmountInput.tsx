"use client";

import { UsePairStartPanelReturn } from "@/hooks/usePairStartPanel";
import { BigDecimal } from "@/types/BigDecimal";

import AmountInput from "../../../common/AmountInput";

export default function PairStartAmountInput({
  state,
  index,
  price,
  normalMaxAmount,
  limitMaxAmount,
  limitModeOn,
}: {
  state: UsePairStartPanelReturn;
  index: 0 | 1;
  price: BigDecimal | null;
  normalMaxAmount: BigDecimal;
  limitMaxAmount: BigDecimal;
  limitModeOn: boolean;
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

  const mode = (state.nativeMode?.[index] ?? "ETH") as "ETH" | "WETH";

  // MAX: 표시 잔고(displayBalances) 기준, ETH면 가스 버퍼 차감
  const handleMax = () => {
    const base = balance ?? BigDecimal.ZERO();

    if (mode === "ETH") {
      // 네트워크/가스 상황에 맞게 버퍼 조정 가능
      const buffer = new BigDecimal("0.003");
      const spendable = base.sub(buffer);
      state.setAmount(spendable.gt(0) ? spendable : BigDecimal.ZERO(), index);
    } else {
      // WETH는 전액 사용
      state.setAmount(base, index);
    }
  };

  const isEthLike = input?.symbol === "ETH" || input?.symbol === "WETH";

  const nativeToggle = isEthLike
    ? {
        value: mode,
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
        // 기존 state.setMaxAmount 대신, 인덱스/모드 반영한 로컬 핸들러
        setMaxAmount={handleMax}
        token={input}
        price={price}
        panel="start"
        nativeToggle={nativeToggle}
        normalMaxAmount={normalMaxAmount}
        limitMaxAmount={limitMaxAmount}
        limitModeOn={limitModeOn}
      />
    </>
  );
}
