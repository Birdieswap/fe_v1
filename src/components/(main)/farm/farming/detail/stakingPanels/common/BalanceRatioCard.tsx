"use client";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { BigDecimal } from "@/types/BigDecimal";
import { LoadingPulse } from "../common/LoadingPulse";
import BarRatio from "../../../common/BarRatio";
import { presenceTransition } from "@/const/presenceTransition";

type Props = {
  balanceText: string;
  symbol?: string;
  isBalanceReady: boolean;
  staked?: BigDecimal;
  lp?: BigDecimal;
  total?: BigDecimal;
  height?: number;
  radius?: number;
  className?: string;
};

export default function BalanceRatioCard({
  balanceText,
  symbol,
  isBalanceReady,
  staked,
  lp,
  total,
  height = 24,
  radius = 4,
  className,
}: Props) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        layout
        className={clsx(
          "mb-6 flex w-full flex-col justify-center rounded-2xl px-4 py-4",
          "bg-default-100 dark:bg-dark-swap-bg",
          "focus-within:bg-default-500/5 hover:bg-default-500/10 group-hover:bg-default-500/10 group-focus:bg-default-500/5 group-focus-visible:bg-default-500/5",
          "dark:focus-within:bg-default-500/5 dark:hover:bg-default-500/10 dark:group-hover:bg-default-500/10 dark:group-focus:bg-default-500/5 dark:group-focus-visible:bg-default-500/5",
          "h-32 overflow-auto"
        )}
        {...presenceTransition}
      >
        {/* 상단 Balance 영역 */}
        <div className="flex w-full justify-between items-center font-sans">
          <div className="flex items-center text-[14px] font-semibold text-default-900 dark:text-default-200 gap-1">
            Balance
          </div>
          <div className="flex items-center gap-1">
            {isBalanceReady ? (
              <>
                <span className="text-[12px] font-medium text-foreground dark:text-default-300">
                  {balanceText}
                </span>
                <span className="text-[10px] font-regular text-foreground dark:text-default-300">
                  {symbol}
                </span>
              </>
            ) : (
              <LoadingPulse w="w-20" />
            )}
          </div>
        </div>

        {/* 비율 바 */}
        <BarRatio
          staked={staked}
          lp={lp}
          total={total}
          height={height}
          radius={radius}
          className="mt-4"
        />
      </motion.div>
    </AnimatePresence>
  );
}
