import { motion } from "framer-motion";

import { FarmPair } from "@/types/FarmListTableRowProps";
import {
  Filler,
  PanelContainer,
  PanelHeader,
} from "@/components/atoms/FarmPanel";
import { usePairStopPanel } from "@/hooks/usePairStopPanel";
import { defaultTransition } from "@/const/presenceTransition";
import { BigDecimal } from "@/types/BigDecimal";

import { SectionHeader } from "../common/SectionHeader";
import { ExecuteButtons } from "../common/ExecuteButtons";

import PairSlider from "./PairSlider";
import PairStopAmountInput from "./pairStop/PairStopAmountInput";
import PairStopReceiveAmountBox from "./pairStop/PairStopReceiveAmountBox";
import PairStopSummary from "./pairStop/PairStopSummary";

export function PairStopPanel({
  item,
  tokenPrice,
}: {
  item: FarmPair;
  tokenPrice?: BigDecimal | null;
}) {
  const state = usePairStopPanel(item);

  return (
    <PanelContainer layoutId="detail-pair">
      <PanelHeader>
        <SectionHeader>Receives</SectionHeader>
        <div className="grow" />
        <PairSlider item={item} state={state} />
      </PanelHeader>
      <motion.div
        layout
        {...defaultTransition}
        className="flex w-full flex-col gap-0"
      >
        <PairStopAmountInput state={state} tokenPrice={tokenPrice} />
        <PairStopSummary item={item} state={state} />
      </motion.div>
      <PairStopReceiveAmountBox
        input={item.wip_stakeToken.swap.input}
        isActive={state.isActive}
        receiveAmount={state.receiveAmount}
      />
      <Filler />
      <ExecuteButtons
        execute={state.stopFarming}
        executeText="Stop Farming"
        isConnected={state.isConnected}
        isExecutable={state.isStoppable}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        tokenStatuses={[state.tokenStatus]}
        variant="PINK"
      />
    </PanelContainer>
  );
}
