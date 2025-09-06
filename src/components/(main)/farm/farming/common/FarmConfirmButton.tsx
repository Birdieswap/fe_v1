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

export default function FarmConfirmButton({
  isConnected,
  isWrongNetwork,
  isPending,
  isDisabled,
  variant,
  onPress,
  text,
}: {
  isConnected: boolean;
  isWrongNetwork: boolean;
  isPending: boolean;
  isDisabled: boolean;
  variant?: ThemedButtonVariant;
  onPress: () => void;
  text: string;
}) {
  const isCommonDisabled = !isConnected || isWrongNetwork || isPending;

  return (
    <motion.div
      layout
      className="flex w-full flex-col items-center"
      {...defaultTransition}
    >
      <AnimatePresence initial={false}>
        {isCommonDisabled ? (
          <CommonDisabledButtons
            isConnected={isConnected}
            isPending={isPending}
            isWrongNetwork={isWrongNetwork}
            excuteText={text}
          />
        ) : (
          <ThemedButton
            className="flex w-full items-center"
            isDisabled={isDisabled}
            variant={variant ?? "MINT"}
            onPress={onPress}
          >
            {text}
          </ThemedButton>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
