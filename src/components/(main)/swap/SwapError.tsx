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
        "flex flex-row items-center gap-1 mb-4",
        "w-full rounded-[4px] border-1 border-danger dark:border-[#FF3F3F] bg-danger/[0.07] dark:bg-[#FF3F3F]/[0.1] px-3 py-1 text-sm font-medium text-danger dark:text-[#FF3F3F]",
        "transition-opacity"
      )}
    >
      {children}
    </motion.div>
  );
}
