// components/(main)/pay/PayPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Filler, PanelContainer } from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import ActiveNetwork from "./common/ActiveNetwork";
import ReceiveAddress from "./common/ReceiveAddress";
import PayAmountInput from "./common/PayAmountInput";
import PayExecuteButtons from "./common/PayExecuteButtons";

import { usePayContext } from "@/components/(main)/pay/PayProvider";

export function PayPanel() {
  const pay = usePayContext();

  return (
    <PanelContainer layoutId="Pay">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col gap-2"
      >
        <ActiveNetwork />
        <ReceiveAddress value={pay.receiver} onChange={pay.setReceiver} />
        <PayAmountInput mode="PAY" />
      </motion.div>

      <Filler />

      <PayExecuteButtons mode="PAY" />
    </PanelContainer>
  );
}
