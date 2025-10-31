import { motion } from "framer-motion";

import { defaultTransition } from "@/const/presenceTransition";

export function StakeSectionHeader(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) {
  return <h1 className="text-sm font-semibold text-default-800" {...props} />;
}

export function StakePanelHeader(props: React.PropsWithChildren<{}>) {
  return (
    <motion.div
      layout
      className="mb-6 flex flex-row flex-wrap items-center gap-2"
      {...defaultTransition}
      {...props}
    />
  );
}

export function StakePanelContainer(
  props: React.PropsWithChildren<{ layoutId?: string }>
) {
  return (
    <motion.div
      layout
      animate={{ opacity: 1 }}
      className="flex w-full grow flex-col rounded-b-2xl bg-background px-4 py-6"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      layoutId={props.layoutId}
      transition={{
        duration: 0.1,
        ease: "linear",
      }}
      {...props}
    />
  );
}

export function StakeFiller() {
  return <motion.div layout className="flex grow" {...defaultTransition} />;
}
