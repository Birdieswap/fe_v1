"use client";

import { AnimatePresence, motion } from "framer-motion";

import { defaultTransition } from "@/const/presenceTransition";
import { CommonDisabledButtons } from "@/components/(main)/swap/swapConfirmButton/SwapConfirmButton";
import ThemedButton, {
  ThemedButtonVariant,
} from "@/components/atoms/ThemedButton";

/**
 * @see SwapConfirmButton
 */

export default function PayConfirmButton({}: {}) {
  return (
    <motion.div
      layout
      className="flex w-full flex-col items-center"
      {...defaultTransition}
    >
      {/* <AnimatePresence initial={false}>
        {isCommonDisabled ? (
          <CommonDisabledButtons
            isConnected={isConnected}
            isPending={isPending}
            isWrongNetwork={isWrongNetwork}
            excuteText={text}
          />
        ) : ( */}
      <ThemedButton
        className="flex w-full items-center"
        isDisabled={false}
        variant={"MINT"}
      >
        Start Paying
      </ThemedButton>
      {/* )}
      </AnimatePresence> */}
    </motion.div>
  );
}
