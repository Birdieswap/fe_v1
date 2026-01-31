"use client";

import { PropsWithoutRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

import { presenceTransition } from "@/const/presenceTransition";
import ThemedButton, {
  ThemedButtonProps,
} from "@/components/atoms/ThemedButton";

export default function ButtonWithPresence(
  props: PropsWithoutRef<ThemedButtonProps>
) {
  const isBusy = Boolean((props as any)["aria-busy"]);

  return (
    <motion.div key="presence-btn" {...presenceTransition} className="w-full">
      <div className={clsx("w-full", isBusy && "animate-pulse")}>
        <ThemedButton {...props} />
      </div>
    </motion.div>
  );
}
