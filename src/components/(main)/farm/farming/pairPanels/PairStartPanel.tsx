import { motion } from "framer-motion";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { usePairStartPanel } from "@/hooks/usePairStartPanel";
import {
  Filler,
  PanelContainer,
  PanelHeader,
  SectionHeader,
} from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import { ExecuteButtons } from "../common/ExecuteButtons";

import PairStartAmountInput from "./pairStart/PairStartAmountInput";
import PairSlider from "./PairSlider";
import PairStartSummary from "./pairStart/PairStartSummary";

export function PairStartPanel({ item }: { item: FarmPair }) {
  const state = usePairStartPanel(item);

  return (
    <PanelContainer layoutId="detail-pair">
      <PanelHeader>
        <div className="flex grow flex-row items-center gap-1">
          <SectionHeader>Start with</SectionHeader>
          <div className="flex flex-row items-center text-sm font-normal">
            (
            <div className="flex flex-row items-center gap-1.5">
              <span className="text-xs font-normal">Fee tier</span>
              <span className="text-base font-bold">
                {item.feeTier.toFixed(2)}%
              </span>
            </div>
            )
          </div>
        </div>
        {/* <PairSlider isDisabled={false} item={item} state={state} /> */}
      </PanelHeader>
      <motion.div
        layout
        {...defaultTransition}
        className="flex w-full flex-col"
      >
        <PairStartAmountInput index={0} state={state} />
        <PairStartAmountInput index={1} state={state} />
        <PairStartSummary item={item} state={state} />
      </motion.div>
      <Filler />
      <ExecuteButtons
        execute={state.startFarming}
        executeText="Start Farming"
        isConnected={state.isConnected}
        isExecutable={state.isStartable}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        tokenStatuses={state.tokenStatuses}
        variant="MINT"
      />
    </PanelContainer>
  );
}
