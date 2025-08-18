import { motion } from "framer-motion";
import { ReactNode } from "react";
import clsx from "clsx";

import { defaultTransition } from "@/const/presenceTransition";

export function FarmListTableHeaderCell<T>({
  children,
  colSpan,
}: {
  column: keyof T;
  colSpan?: number;
  children: ReactNode;
}) {
  return (
    <div style={{ gridColumn: `span ${colSpan} / span ${colSpan}` }}>
      <div className="flex flex-row items-center justify-start gap-1 text-[12px] font-medium text-default-800 dark:text-foreground">
        {children}
      </div>
    </div>
  );
}

export function FarmListTableHeader() {
  return (
    <motion.div
      layout
      {...defaultTransition}
      className={clsx(
        "grid origin-top grid-cols-subgrid p-6",
        "md:col-span-6",
        "max-md:col-span-3 max-md:hidden",
      )}
    >
      <FarmListTableHeaderCell colSpan={2} column="name">
        Crypto
      </FarmListTableHeaderCell>
      <FarmListTableHeaderCell column="apy">APY(%)</FarmListTableHeaderCell>
      <FarmListTableHeaderCell column="tvl">TVL($)</FarmListTableHeaderCell>
      <div className="flex items-center justify-end">
        <FarmListTableHeaderCell colSpan={2} column="balance">
          Your Balance
        </FarmListTableHeaderCell>
      </div>
    </motion.div>
  );
}
