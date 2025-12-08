"use client";

import { motion } from "framer-motion";

import { Filler, PanelContainer } from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import ActiveNetwork from "./common/ActiveNetwork";
import PayAmountInput from "./common/PayAmountInput";
import PayConfirmButton from "./common/PayConfirmButton";

export function EnterPanel({}: {}) {
  return (
    <PanelContainer layoutId="Enter">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col gap-3"
      >
        <ActiveNetwork />
        {/* easy ENTER 모드 */}
        <PayAmountInput mode="ENTER" />
      </motion.div>

      <Filler />

      <PayConfirmButton />
    </PanelContainer>
  );
}
