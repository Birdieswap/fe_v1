import { UseSingleStartPanelReturn } from "@/hooks/useSingleStartPanel";

import AmountInput from "../../common/AmountInput";

export default function SingleStartAmountInput({
  state,
}: {
  state: UseSingleStartPanelReturn;
}) {
  const { setAmount, tokenStatus, setMaxAmount } = state;
  const { input, amount, balance, isApproved, isImpermanentInsolvency } =
    tokenStatus;

  return (
    <AmountInput
      amount={amount}
      balance={balance}
      isActive={true}
      isApproved={isApproved}
      isDisabled={false}
      isInsolvency={isImpermanentInsolvency}
      setAmount={setAmount}
      setMaxAmount={setMaxAmount}
      token={input}
    />
  );
}
