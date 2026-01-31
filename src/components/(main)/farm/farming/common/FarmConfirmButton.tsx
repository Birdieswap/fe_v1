"use client";

import { AnimatePresence, motion } from "framer-motion";
import { defaultTransition } from "@/const/presenceTransition";
import { CommonDisabledButtons } from "@/components/(main)/swap/swapConfirmButton/SwapConfirmButton";
import { ThemedButtonVariant } from "@/components/atoms/ThemedButton";
import ButtonWithPresence from "@/components/common/ButtonWithPresence";

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

  // 추가: approve가 pending일 때 confirm은 pulse 없이 disable만
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
          <ButtonWithPresence
            fullWidth
            className="flex w-full items-center"
            isDisabled={isDisabled}
            variant={variant ?? "MINT"}
            onPress={onPress}
            aria-busy={isPending ? true : undefined}
          >
            {text}
          </ButtonWithPresence>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
