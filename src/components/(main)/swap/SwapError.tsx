"use client";

import { cn } from "@heroui/react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { presenceTransition } from "@/const/presenceTransition";

export default function SwapError({ children }: { children: ReactNode }) {
  return (
    <motion.div
      {...presenceTransition}
      className={cn(
        "flex flex-row items-center gap-1",
        "w-full rounded-[4px] border-1 border-danger bg-danger/[0.07] px-3 py-1 text-sm font-medium text-danger",
        "transition-opacity",
      )}
    >
      {children}
    </motion.div>
  );
}
