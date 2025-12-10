// components/(main)/pay/EnterPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Filler, PanelContainer } from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import ActiveNetwork from "./common/ActiveNetwork";
import PayAmountInput from "./common/PayAmountInput";
import PayExecuteButtons from "./common/PayExecuteButtons";

export function EnterPanel() {
  return (
    <PanelContainer layoutId="Enter">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col gap-3"
      >
        <ActiveNetwork />
        <PayAmountInput mode="ENTER" />
      </motion.div>

      <Filler />

      <PayExecuteButtons mode="ENTER" />
    </PanelContainer>
  );
}
