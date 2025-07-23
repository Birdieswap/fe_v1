import { motion } from "framer-motion";

import { FarmSingle } from "@/types/FarmListTableRowProps";
import {
  Filler,
  PanelContainer,
  PanelHeader,
} from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";
import { useSingleStopPanel } from "@/hooks/useSingleStopPanel";
import { BigDecimal } from "@/types/BigDecimal";

import PairStopAmountInput from "../pairPanels/pairStop/PairStopAmountInput";
import { SectionHeader } from "../common/SectionHeader";
import { ExecuteButtons } from "../common/ExecuteButtons";
import ReceiveAmountBox from "../common/ReceiveAmountBox";

export function SingleStopPanel({
  item,
  tokenPrice,
}: {
  item: FarmSingle;
  tokenPrice?: BigDecimal | null;
}) {
  const state = useSingleStopPanel(item);

  return (
    <PanelContainer layoutId="detail-pair">
      <PanelHeader>
        <SectionHeader>Receives</SectionHeader>
        <div className="grow" />
      </PanelHeader>
      <motion.div
        layout
        {...defaultTransition}
        className="flex w-full flex-col gap-0"
      >
        <PairStopAmountInput state={state} tokenPrice={tokenPrice} />
      </motion.div>
      <ReceiveAmountBox
        amount={state.amount ?? BigDecimal.ZERO()}
        bToken={item.wip_stakeToken}
      />
      <Filler />
      <div className="h-6 w-full" />
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
