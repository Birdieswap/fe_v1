// FarmListTableHeader.tsx
import { motion } from "framer-motion";
import clsx from "clsx";
import { defaultTransition } from "@/const/presenceTransition";
import Icons from "@/assets/icons/icons";
import { Button } from "@heroui/react";

export function FarmListTableHeader({
  gridCols,
  showUnderlying,
  onToggleUnderlying,
}: {
  gridCols: string;
  showUnderlying: boolean;
  onToggleUnderlying: () => void;
}) {
  return (
    <motion.div
      layout
      {...defaultTransition}
      className={clsx(
        "col-span-full",
        "grid origin-top p-6 max-md:hidden max-md:border-b-0 border-b border-default-400 dark:border-default-600",
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
      <div className="flex items-center justify-end text-right text-[12px] font-medium text-default-800 dark:text-foreground pr-2 gap-2">
        <span>{showUnderlying ? "Underlying Tokens" : "Your Balance"}</span>
        <Button
          type="button"
          isIconOnly
          radius="full"
          variant="light"
          onPress={onToggleUnderlying}
          aria-label="Toggle underlying tokens view"
          title="Toggle underlying tokens view"
          className="
            min-w-0 size-5 p-0
            bg-transparent shadow-none
            data-[hover=true]:bg-transparent
            data-[pressed=true]:bg-transparent
            data-[disabled=true]:bg-transparent
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <Icons.Change className="w-4 h-4 block" />
        </Button>
      </div>

      {/* 5) Donut+Arrow 자리(헤더는 비움) */}
      <div />
    </motion.div>
  );
}
