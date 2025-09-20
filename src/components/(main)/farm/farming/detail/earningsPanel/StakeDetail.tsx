"use client";

import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import StakePanel from "./stakingPanels/StakePanel";
import UnStakePanel from "./stakingPanels/UnStakePanel";
import StakePanelButton from "./stakingPanels/StakePanelButtons";
import type { Farm } from "@/types/FarmListTableRowProps";
import { AprEntry } from "@/app/AssetsContextProvider";

export default function StakeDetail({
  item,
  selectedRow,
  matched,
}: {
  item: Farm; // 필요 시 Farm 타입으로 바꾸세요
  selectedRow: string | null;
  matched: AprEntry | undefined;
}) {
  const [selectedPanel, setSelectedPanel] = useState<"STAKE" | "UNSTAKE">(
    "STAKE"
  );

  // FarmDetail과 동일한 방식으로 활성화 판단 (키는 프로젝트 규칙에 맞게)
  const activeKey = item?.wip_stakeToken?.fullName ?? item?.name ?? "";
  const isActive = selectedRow === activeKey;

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          layout
          {...defaultTransition}
          className="flex h-full grow basis-0 flex-col"
        >
          <motion.div
            layout
            {...defaultTransition}
            className="flex h-full grow basis-10 flex-col"
          >
            <motion.div
              layout
              {...defaultTransition}
              className="flex h-8 flex-row"
            >
              <StakePanelButton.Stake
                selectedPanel={selectedPanel}
                setSelectedPanel={setSelectedPanel}
              />
              <StakePanelButton.Unstake
                selectedPanel={selectedPanel}
                setSelectedPanel={setSelectedPanel}
              />
            </motion.div>
            <motion.div
              className={clsx("rounded-b-xl bg-background px-4 py-4")}
            >
              <AnimatePresence initial={false}>
                {selectedPanel === "STAKE" ? (
                  <StakePanel item={item} matched={matched} />
                ) : (
                  <UnStakePanel item={item} matched={matched} />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
