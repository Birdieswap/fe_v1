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
import ETHSlider from "./ETHSlider";

export function PairStopPanel({
  item,
  price,
}: {
  item: FarmPair;
  price: BigDecimal | null;
}) {
  const state = usePairStopPanel(item);

  const sym0 = state.displayTokens?.[0]?.symbol;
  const sym1 = state.displayTokens?.[1]?.symbol;

  const showETHSlider =
    sym0 === "ETH" || sym0 === "WETH" || sym1 === "ETH" || sym1 === "WETH";

  // ETH/WETH 쪽을 우선 조작
  const controlsIndex: 0 | 1 =
    sym0 === "ETH" || sym0 === "WETH"
      ? 0
      : sym1 === "ETH" || sym1 === "WETH"
      ? 1
      : 0;

  const selected = (state.nativeMode?.[controlsIndex] ?? "ETH") as
    | "ETH"
    | "WETH";

  return (
    <PanelContainer layoutId="detail-pair">
      <PanelHeader>
        <SectionHeader>Receives</SectionHeader>
        <div className="grow" />
        {/* <PairSlider item={item} state={state} /> */}
        {showETHSlider && (
          <div className="ml-auto">
            <ETHSlider
              value={selected}
              onChange={(v) => {
                state.setNativeMode?.((prev) => {
                  const next = [...(prev ?? [])] as ("ETH" | "WETH" | null)[];
                  next[controlsIndex] = v;
                  return next as typeof prev;
                });
              }}
            />
          </div>
        )}
      </PanelHeader>
      <motion.div
        layout
        {...defaultTransition}
        className="flex w-full flex-col gap-0"
      >
        <PairStopAmountInput state={state} price={price} />
        <PairStopSummary item={item} state={state} />
      </motion.div>
      <PairStopReceiveAmountBox
        input={item.wip_stakeToken.swap.input}
        isActive={state.isActive}
        receiveAmount={state.receiveAmount}
        displayTokens={state.displayTokens}
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
