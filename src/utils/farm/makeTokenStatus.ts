import { BigDecimal } from "@/types/BigDecimal";
import type { IToken } from "@/const/contracts/types/tokenTypes";
import type { StakeTokenStatus } from "@/hooks/farm/StakeTokenStatus";

export function makeTokenStatus(
  token: IToken,
  overrides: Partial<StakeTokenStatus> = {}
): StakeTokenStatus {
  const base: StakeTokenStatus = {
    input: token,
    balance: new BigDecimal("0"),
    amount: null,
    isApproved: false,
    isActive : true,
    isInsufficientBalance: false,
    isApprovable: true,
    approve: async () => {},
  };
  return { ...base, ...overrides };
}
