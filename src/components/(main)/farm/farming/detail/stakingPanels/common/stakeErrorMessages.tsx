"use client";

import { AnimatePresence, motion } from "framer-motion";
import Error from "@/assets/icons/error.svg";
import { presenceTransition } from "@/const/presenceTransition";
import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

type StakeTokenStatus = {
  amount: BigDecimal | null;
  isInsufficientBalance: boolean;
  isActive?: boolean;
  input?: IToken;
};

export default function StakeErrorMessages({
  tokenStatuses,
}: {
  tokenStatuses: StakeTokenStatus[];
}) {
  // ==== 에러 조건 정의 ====
  const errorMessages = [
    {
      type: "AMOUNT",
      status: tokenStatuses.some(
        (v) => v.isActive && (!v.amount || v.amount.lte(0))
      ),
      message: <p key="no-amount">Enter an amount</p>,
    },
    ...tokenStatuses.map((v) => ({
      type: "INSUFFICIENT_BALANCE",
      status: v.isInsufficientBalance,
      message: (
        <p key={`${v.input?.symbol}-insufficient`}>
          Insufficient {v.input?.symbol ?? "token"} balance
        </p>
      ),
    })),
  ].filter((v) => v.status);

  const message = errorMessages[0]?.message;

  // ==== 렌더 ====
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          layout
          className="mt-4 flex flex-col items-center justify-center text-sm"
          {...presenceTransition}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-danger">
            <Error />
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
