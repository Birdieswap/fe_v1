import StakeInput from "./common/StakeInput";
import type { UseSingleStartPanelReturn } from "@/hooks/useSingleStartPanel";
import type { IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

type LegacyProps = {
  state: UseSingleStartPanelReturn;
  price?: BigDecimal | null;
};

type FlatProps = {
  amount: BigDecimal | null;
  balance: BigDecimal | null;
  price?: BigDecimal | null;
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

export default function StakingAmountInput(props: FlatProps) {
  if (isLegacyProps(props)) {
    // ==== 기존 방식: state prop 사용 (안전 가드 추가) ====
    const { setAmount, setMaxAmount } = props.state as any;

    // tokenStatus 또는 tokenStatuses[0] 중 사용 가능한 것을 선택
    const tokenStatus =
      (props.state as any)?.tokenStatus ??
      (props.state as any)?.tokenStatuses?.[0] ??
      null;

    // 아직 로딩 중이거나 토큰 상태가 없다면 아무 것도 렌더하지 않음(또는 스켈레톤)
    if (!tokenStatus) {
      return null;
      // 또는 스켈레톤:
      // return <div className="h-20 rounded-2xl bg-default-100 animate-pulse" />;
    }

    const { input, amount, balance, isApproved, isImpermanentInsolvency } =
      tokenStatus;

    const price = props.price ?? null;

    return (
      <StakeInput
        amount={amount}
        balance={balance ?? null}
        price={price}
        isActive={true}
        isApproved={!!isApproved}
        isDisabled={false}
        isInsolvency={isImpermanentInsolvency}
        setAmount={setAmount}
        setMaxAmount={setMaxAmount}
        token={input}
        panel="stake"
      />
    );
  }

  // ==== 새 방식: flat props 사용 ====
  const {
    amount,
    balance,
    price,
    setAmount,
    setMaxAmount,
    isInsolvency,
    isDisabled,
    isApproved,
    isActive = true,
    token,
    panel = "stake",
  } = props;

  return (
    <StakeInput
      amount={amount}
      balance={balance}
      price={price}
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
