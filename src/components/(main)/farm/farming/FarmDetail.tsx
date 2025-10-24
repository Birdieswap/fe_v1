"use client";

import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

import { Farm, FarmType } from "@/types/FarmListTableRowProps";
import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import { BigDecimal } from "@/types/BigDecimal";

import { PairStartPanel } from "./detail/pairPanels/PairStartPanel";
import { SingleStartPanel } from "./detail/singlePanels/SingleStartPanel";
import { PairStopPanel } from "./detail/pairPanels/PairStopPanel";
import { SingleStopPanel } from "./detail/singlePanels/SingleStopPanel";
import EarningsPanel from "./detail/EarningsPanel";
import PanelButtons from "./detail/PanelButtons";
import FarmingPanels from "./detail/FarmingPanels";
import StakingPanels from "./detail/StakingPanels";

export default function FarmDetail({
  item,
  selectedRow,
  price,
  lpBalance,
  stakedBalance,
  totalBalance,
}: {
  item: Farm;
  selectedRow: string | null;
  price: BigDecimal | null;
  lpBalance?: BigDecimal;
  stakedBalance?: BigDecimal;
  totalBalance?: BigDecimal;
}) {
  const [selectedPanel, setSelectedPanel] = useState<"START" | "STOP">("START");
  const isActive = selectedRow === item.wip_stakeToken.fullName;

  const ENTER = { type: "tween", duration: 0.5, ease: [0.22, 0.61, 0.36, 1] };
  const EXIT = { type: "tween", duration: 0.32, ease: [0.4, 0.0, 1, 1] };

  return (
    <AnimatePresence initial={false} mode="wait">
      {isActive && (
        <motion.div
          key={`${item.name}-farm-detail`}
          // layout
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, transition: ENTER }}
          exit={{ height: 0, opacity: 0, transition: EXIT }}
          style={{ overflow: "hidden", willChange: "height, opacity" }}
          // {...presenceTransition}
          className={clsx(
            "flex w-full origin-top gap-4 overflow-hidden border-b-1 border-default-400 bg-default-100 px-4 py-6 dark:border-default-900 dark:bg-dark-popup-bg",
            "md:col-span-6 md:flex-row",
            "max-md:col-span-3 max-md:row-span-2 max-md:flex-col"
            // "data-[selected=false]:h-0 data-[selected=true]:h-fit data-[selected=true]:border-default-100",
          )}
          data-selected={isActive}
        >
          {/* 왼쪽: Start/Stop 패널 묶음 */}
          <FarmingPanels item={item} price={price} />

          {/* 오른쪽: 정보 패널 */}
          <StakingPanels
            item={item}
            selectedRow={selectedRow}
            lpBalance={lpBalance}
            stakedBalance={stakedBalance}
            totalBalance={totalBalance}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
