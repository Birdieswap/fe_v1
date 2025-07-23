import { IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

export type FarmTokenStatus = {
  index: number;
  isActive: boolean;
  input: IToken;
  balance: BigDecimal | null;
  amount: BigDecimal | null;
  isApproved: boolean;
  isValueLoading?: boolean;
  isImpermanentInsolvency: boolean;
  impermanentInsolvency?: BigDecimal | null;
  isInsufficientBalance: boolean;
  isApprovable: boolean;
  approve: () => void;
};

export type FarmStartTokenStatus = FarmTokenStatus;
