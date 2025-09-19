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

import { PairStartPanel } from "./pairPanels/PairStartPanel";
import { SingleStartPanel } from "./singlePanels/SingleStartPanel";
import { PairStopPanel } from "./pairPanels/PairStopPanel";
import { SingleStopPanel } from "./singlePanels/SingleStopPanel";
import EarningsPanel from "./detail/EarningsPanel";
import PanelButtons from "./detail/PanelButtons";

export default function FarmDetail({
  item,
  selectedRow,
  price,
}: {
  item: Farm;
  selectedRow: string | null;
  price: BigDecimal | null;
}) {
  const [selectedPanel, setSelectedPanel] = useState<"START" | "STOP">("START");
  const isActive = selectedRow === item.wip_stakeToken.fullName;
  console.log("FarmDetail item", item);

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          key={`${item.name}-farm-detail`}
          layout
          {...presenceTransition}
          className={clsx(
            "flex w-full origin-top gap-4 overflow-hidden border-b-1 border-default-400 bg-default-100 px-4 py-6 dark:border-default-900 dark:bg-dark_popup_bg",
            "md:col-span-6 md:flex-row",
            "max-md:col-span-3 max-md:row-span-2 max-md:flex-col"
            // "data-[selected=false]:h-0 data-[selected=true]:h-fit data-[selected=true]:border-default-100",
          )}
          data-selected={isActive}
        >
          <motion.div
            layout
            {...defaultTransition}
            className="flex h-full grow basis-10 flex-col"
          >
            <motion.div
              layout
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

            <AnimatePresence initial={false}>
              {item.type === FarmType.PAIR &&
                (selectedPanel === "START" ? (
                  <PairStartPanel item={item} price={price} />
                ) : (
                  <PairStopPanel item={item} price={price} />
                ))}
              {item.type === FarmType.SINGLE &&
                (selectedPanel === "START" ? (
                  <SingleStartPanel item={item} />
                ) : (
                  <SingleStopPanel item={item} price={price} />
                ))}
            </AnimatePresence>
          </motion.div>
          <motion.div
            layout
            {...defaultTransition}
            className="flex h-full grow basis-0 flex-col"
          >
            <h2 className=" text-base font-semibold pl-2">Information</h2>
            <EarningsPanel item={item} selectedRow={selectedRow} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
