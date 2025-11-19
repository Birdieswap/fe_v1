import { AnimatePresence, motion } from "framer-motion";

import { InvalidStatuses } from "@/hooks/usePairStartPanel";
import { FarmTokenStatus } from "@/hooks/FarmTokenStatus";
import Error from "@/assets/icons/error.svg";
import { presenceTransition } from "@/const/presenceTransition";
export default function FarmStartErrorMessages({
  tokenStatuses,
  showDepositLimitInfo,
}: {
  tokenStatuses: Pick<
    FarmTokenStatus,
    | "amount"
    | "isImpermanentInsolvency"
    | "impermanentInsolvency"
    | "isInsufficientBalance"
    | "isActive"
    | "input"
  >[];
  showDepositLimitInfo?: boolean;
}) {
  const errorMessages = [
    {
      type: InvalidStatuses.AMOUNT,
      status: tokenStatuses.some(
        (v) => v.isActive && (!v.amount || v.amount.lte(0))
      ),
      message: <p>Enter an amount</p>,
    },
    ...tokenStatuses
      .map((v) => [
        {
          type: InvalidStatuses.IMPERMANENT_INSOLVENCY,
          status: v.isImpermanentInsolvency,
          message: (
            <p>
              Enter an amount under{" "}
              {v.impermanentInsolvency?.toPrecisionString(true)}{" "}
              {v.input?.symbol}
            </p>
          ),
        },
        {
          type: InvalidStatuses.INSUFFICIENT_BALANCE,
          status: v.isInsufficientBalance,
          message: <p>Insufficient {v.input?.symbol} balance</p>,
        },
      ])
      .flat(),
  ].filter((v) => v.status);

  const message = errorMessages[0]?.message;

  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="farm-error"
          layout
          className="mt-4 flex flex-col items-center justify-center text-sm"
          {...presenceTransition}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-danger">
            <Error />
            {errorMessages[0]?.message}
          </div>
        </motion.div>
      )}
      {/* 🔹 limit 안내 문구: 버튼 하단, 회색 톤 */}
      {showDepositLimitInfo && (
        <motion.div
          key="limit-info"
          layout
          className="mt-6 flex flex-col items-center justify-center text-sm"
          {...presenceTransition}
        >
          <p className="text-sm font-sans font-medium text-default-700 dark:text-dark-300">
            Beta usage limits are currently applied.
          </p>
        </motion.div>
      )}

      {message &&
        errorMessages[0]?.type === InvalidStatuses.IMPERMANENT_INSOLVENCY && (
          <motion.div
            key="insolvency-explain"
            layout
            className="mb-2 mt-6 rounded-2xl border-1 border-default-300 p-4"
            {...presenceTransition}
          >
            <h3 className="text-sm font-medium text-foreground">
              Why am I seeing this?
            </h3>
            <p className="text-sm font-normal text-default-900">
              In case of &ldquo;Impermenent Insolvency&rdquo;, you may not be
              able to use your full amount for a while. However this situation
              is temporary, so we recommendyou to try later.{" "}
              <a className="font-medium text-primary">Learn more</a>
            </p>
          </motion.div>
        )}
    </AnimatePresence>
  );
}
