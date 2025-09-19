import StakeInput from "./common/StakeInput";
import type { UseSingleStartPanelReturn } from "@/hooks/useSingleStartPanel";
import type { IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

type LegacyProps = {
  state: UseSingleStartPanelReturn;
};

type FlatProps = {
  amount: BigDecimal | null;
  setAmount: (v: BigDecimal) => void;
  setMaxAmount: () => void;

  isInsolvency?: boolean;
  isDisabled?: boolean;
  isApproved: boolean;
  isActive?: boolean;

  token?: IToken;
  panel?: "stake" | "unstake" | string;
};

function isLegacyProps(p: LegacyProps | FlatProps): p is LegacyProps {
  return (p as LegacyProps).state !== undefined;
}

export default function StakingAmountInput(props: LegacyProps | FlatProps) {
  if (isLegacyProps(props)) {
    // ==== 기존 방식: state prop 사용 ====
    const { setAmount, tokenStatus, setMaxAmount } = props.state;
    const {
      input,
      amount,
      balance, // 필요 시 StakeInput에 표시 용도로 쓸 수 있음
      isApproved,
      isImpermanentInsolvency,
    } = tokenStatus;

    return (
      <StakeInput
        amount={amount}
        isActive={true}
        isApproved={isApproved}
        isDisabled={false}
        isInsolvency={isImpermanentInsolvency}
        setAmount={setAmount}
        setMaxAmount={setMaxAmount}
        token={input}
        // panel은 기존 파일엔 없었지만, 필요하면 내려주세요
      />
    );
  }

  // ==== 새 방식: flat props 사용 ====
  const {
    amount,
    setAmount,
    setMaxAmount,
    isInsolvency,
    isDisabled,
    isApproved,
    isActive = true,
    token,
    panel,
  } = props;

  return (
    <StakeInput
      amount={amount}
      setAmount={setAmount}
      setMaxAmount={setMaxAmount}
      isInsolvency={isInsolvency}
      isDisabled={!!isDisabled}
      isApproved={!!isApproved}
      isActive={isActive}
      token={token}
      panel={panel as any}
    />
  );
}

// import { UseSingleStartPanelReturn } from "@/hooks/useSingleStartPanel";
// import StakeInput from "./common/StakeInput";

// export default function StakingAmountInput({
//   state,
// }: {
//   state: UseSingleStartPanelReturn;
// }) {
//   const { setAmount, tokenStatus, setMaxAmount } = state;
//   const { input, amount, balance, isApproved, isImpermanentInsolvency } =
//     tokenStatus;

//   return (
//     <StakeInput
//       amount={amount}
//       isActive={true}
//       isApproved={isApproved}
//       isDisabled={false}
//       isInsolvency={isImpermanentInsolvency}
//       setAmount={setAmount}
//       setMaxAmount={setMaxAmount}
//       token={input}
//     />
//   );
// }
