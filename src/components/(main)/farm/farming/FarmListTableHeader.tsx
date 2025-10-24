// FarmListTableHeader.tsx
import { motion } from "framer-motion";
import clsx from "clsx";
import { defaultTransition } from "@/const/presenceTransition";

export function FarmListTableHeader({ gridCols }: { gridCols: string }) {
  return (
    <motion.div
      layout
      {...defaultTransition}
      className={clsx(
        "col-span-full",
        "grid origin-top p-6 max-md:hidden",
        gridCols // ✅ 로우와 동일한 grid-template-columns
      )}
    >
      {/* 1) Crypto */}
      <div className="flex items-center justify-start text-[12px] font-medium text-default-800 dark:text-foreground pr-2">
        Crypto
      </div>

      {/* 2) APY */}
      <div className="flex items-center justify-end text-right text-[12px] font-medium text-default-800 dark:text-foreground pr-2">
        7d APY(%)
      </div>

      {/* 3) TVL */}
      <div className="flex items-center justify-end text-right text-[12px] font-medium text-default-800 dark:text-foreground pr-2">
        TVL($)
      </div>

      {/* 4) Your Balance */}
      <div className="flex items-center justify-end text-right text-[12px] font-medium text-default-800 dark:text-foreground pr-2">
        Your Balance
      </div>

      {/* 5) Donut+Arrow 자리(헤더는 비움) */}
      <div />
    </motion.div>
  );
}
