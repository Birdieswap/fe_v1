import { AnimatePresence, motion } from "framer-motion";
import { PropsWithChildren } from "react";

import { presenceTransition } from "@/const/presenceTransition";

export default function ApproveButtonsContainer(
  props: PropsWithChildren<{ isVisible: boolean }>,
) {
  return (
    <AnimatePresence initial={false}>
      {props.isVisible && (
        <motion.div
          layout
          {...presenceTransition}
          className="mb-6 flex h-[58px] w-full flex-row gap-3"
        >
          {props.children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
