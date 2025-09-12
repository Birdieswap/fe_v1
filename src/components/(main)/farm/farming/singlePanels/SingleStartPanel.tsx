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
import ETHSlider from "../pairPanels/ETHSlider";

export function SingleStartPanel({ item }: { item: FarmSingle }) {
  const state = useSingleStartPanel(item);

  const showETHSlider = !!state.nativeToggleCanShow;
  const selected = (state.nativeMode ?? "ETH") as "ETH" | "WETH";

  return (
    <PanelContainer>
      <PanelHeader>
        <div className="flex justify-between w-full items-center">
          <div className="flex grow flex-row items-center gap-1">
            <SectionHeader>Start with</SectionHeader>
          </div>
          {showETHSlider && (
            <div className="ml-auto">
              <ETHSlider
                value={selected}
                onChange={(v) => state.setNativeMode?.(v)}
              />
            </div>
          )}
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
