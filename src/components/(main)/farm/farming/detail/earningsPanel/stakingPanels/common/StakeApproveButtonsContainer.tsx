import { AnimatePresence, motion } from "framer-motion";
import { PropsWithChildren } from "react";

import { presenceTransition } from "@/const/presenceTransition";

export default function StakeApproveButtonsContainer(
  props: PropsWithChildren<{ isVisible: boolean }>
) {
  return (
    <AnimatePresence initial={false}>
      {props.isVisible && (
        <motion.div
          layout
          {...presenceTransition}
          className="mb1 flex h-[32px] w-full flex-row gap-1"
        >
          {props.children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
