"use client";

import { motion } from "framer-motion";

import { Filler, PanelContainer } from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import ActiveNetwork from "./common/ActiveNetwork";

import PayAmountInput from "./common/PayAmountInput";

import ReceiveAddress from "./common/ReceiveAddress";
import PayConfirmButton from "./common/PayConfirmButton";

export function PayPanel({}: {}) {
  return (
    <PanelContainer layoutId="Pay">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col gap-3"
      >
        <ActiveNetwork />
        <ReceiveAddress />
        {/* ★ PAY 모드 */}
        <PayAmountInput mode="PAY" />
      </motion.div>

      <Filler />

      <PayConfirmButton />
    </PanelContainer>
  );
}
