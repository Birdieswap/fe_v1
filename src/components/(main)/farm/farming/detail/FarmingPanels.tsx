"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Farm, FarmType } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import { defaultTransition } from "@/const/presenceTransition";

import { PairStartPanel } from "./pairPanels/PairStartPanel";
import { SingleStartPanel } from "./singlePanels/SingleStartPanel";
import { PairStopPanel } from "./pairPanels/PairStopPanel";
import { SingleStopPanel } from "./singlePanels/SingleStopPanel";
import PanelButtons, { PanelMode } from "./PanelButtons";

export default function FarmingPanels({
  item,
  price,
  initialPanel = "START",
}: {
  item: Farm;
  price: BigDecimal | null;
  initialPanel?: PanelMode;
}) {
  const [selectedPanel, setSelectedPanel] = useState<PanelMode>(initialPanel);

  return (
    <motion.div
      layout={false}
      {...defaultTransition}
      className="flex h-full grow basis-10 flex-col"
    >
      {/* 상단 Start / Stop 스위치 */}
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex h-12 flex-row"
      >
        <PanelButtons.Start
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
        <PanelButtons.Stop
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
      </motion.div>

      {/* 패널 내용 */}
      <AnimatePresence initial={false}>
        {item.type === FarmType.PAIR &&
          (selectedPanel === "START" ? (
            <PairStartPanel key="pair-start" item={item} price={price} />
          ) : (
            <PairStopPanel key="pair-stop" item={item} price={price} />
          ))}

        {item.type === FarmType.SINGLE &&
          (selectedPanel === "START" ? (
            <SingleStartPanel key="single-start" item={item} />
          ) : (
            <SingleStopPanel key="single-stop" item={item} price={price} />
          ))}
      </AnimatePresence>
    </motion.div>
  );
}
