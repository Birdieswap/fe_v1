import {
  Filler,
  PanelContainer,
  PanelHeader,
  SectionHeader,
} from "@/components/atoms/FarmPanel";
import { useSingleStartPanel } from "@/hooks/useSingleStartPanel";
import { FarmSingle } from "@/types/FarmListTableRowProps";

import { ExecuteButtons } from "../common/ExecuteButtons";

import SingleStartAmountInput from "./singleStart/SingleStartAmountInput";

export function SingleStartPanel({ item }: { item: FarmSingle }) {
  const state = useSingleStartPanel(item);

  return (
    <PanelContainer>
      <PanelHeader>
        <div className="flex grow flex-row items-center gap-1">
          <SectionHeader>Start with</SectionHeader>
        </div>
      </PanelHeader>
      <SingleStartAmountInput state={state} />
      <Filler />
      <ExecuteButtons
        execute={state.startFarming}
        executeText="Start Farming"
        isConnected={state.isConnected}
        isExecutable={state.isStartable}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        tokenStatuses={[state.tokenStatus]}
        variant="MINT"
      />
    </PanelContainer>
  );
}
