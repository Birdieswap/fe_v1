import type { IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

/** ExecuteButtons / StakeInput 이 실제로 쓰는 필드만 남긴 Lean 버전 */
export type StakeTokenStatus = {
  input: IToken;                   // 대상 토큰
  balance: BigDecimal;             // 지갑(or 스테이킹) 잔액
  amount: BigDecimal | null;       // 현재 입력값
  isActive : boolean;
  isApproved?: boolean;            // allowance 여부 (optional)
  isInsufficientBalance: boolean;  // 잔액 부족 여부
  isApprovable?: boolean;          // 승인 버튼 노출 가능 여부
  approve?: () => Promise<void>;   // 승인 핸들러(옵셔널)
};
