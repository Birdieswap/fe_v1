"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import { defaultTransition } from "@/const/presenceTransition";

import { PayPanel } from "@/components/(main)/pay/PayPanel";
import { EnterPanel } from "@/components/(main)/pay/EnterPanel";
import PanelButtons, {
  type Mode,
} from "@/components/(main)/pay/common/PanelButton";

export default function PayIndex() {
  const [selectedPanel, setSelectedPanel] = useState<Mode>("ENTER");

  const ENTER = { type: "tween", duration: 0.5, ease: [0.22, 0.61, 0.36, 1] };
  const EXIT = { type: "tween", duration: 0.32, ease: [0.4, 0.0, 1, 1] };

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1, transition: ENTER }}
        exit={{ height: 0, opacity: 0, transition: EXIT }}
        style={{ overflow: "hidden", willChange: "height, opacity" }}
        className={clsx(
          "flex w-full flex-col gap-4 overflow-hidden px-4 py-6 rounded-2xl",
          "bg-default-100 dark:bg-dark-popup-bg",
          "md:col-span-full",
          "max-md:col-span-3 max-md:row-span-2"
        )}
      >
        <motion.div
          layout={false}
          {...defaultTransition}
          className="flex h-full grow basis-10 flex-col"
        >
          {/* 상단 PAY / easy Enter 스위치 */}
          <motion.div
            layout={false}
            {...defaultTransition}
            className="flex h-12 flex-row"
          >
            <PanelButtons.Enter
              selectedPanel={selectedPanel}
              setSelectedPanel={setSelectedPanel}
            />
            <PanelButtons.Pay
              selectedPanel={selectedPanel}
              setSelectedPanel={setSelectedPanel}
            />
          </motion.div>

          {/* 패널 내용: 선택된 패널만 렌더링 */}
          <AnimatePresence initial={false} mode="wait">
            {selectedPanel === "PAY" ? (
              <PayPanel key="PAY" />
            ) : (
              <EnterPanel key="ENTER" />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
