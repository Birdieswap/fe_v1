import { motion } from "framer-motion";

import { FarmPair } from "@/types/FarmListTableRowProps";
import {
  UsePairStartPanelReturn,
  usePairStartPanel,
} from "@/hooks/usePairStartPanel";
import {
  Filler,
  PanelContainer,
  PanelHeader,
  SectionHeader,
} from "@/components/atoms/FarmPanel";
import { defaultTransition } from "@/const/presenceTransition";

import { ExecuteButtons } from "../../common/ExecuteButtons";

import PairStartAmountInput from "./pairStart/PairStartAmountInput";
import PairStartSummary from "./pairStart/PairStartSummary";
import { BigDecimal } from "@/types/BigDecimal";

export function PairStartPanel({
  item,
  price,
}: {
  item: FarmPair;
  price: BigDecimal | null;
}) {
  // 기존 훅: 지난 패치에서 ETH/WETH 파생값을 반환하도록 확장됨
  const state: UsePairStartPanelReturn = usePairStartPanel(item);

  const activeIndex: 0 | 1 = state.isActive[0] ? 0 : 1;

  const resolvePairIndex = (s: any): number | undefined => {
    const candidates = [
      s?.pairSliderIndex,
      s?.modeIndex,
      s?.selectedIndex,
      s?.tabIndex,
      s?.pairModeIndex,
    ];
    const hit = candidates.find((v) => typeof v === "number");
    return hit as number | undefined;
  };
  const pairIndex = resolvePairIndex(state);
  const showSummary = pairIndex === 0 || pairIndex === 2;

  return (
    <PanelContainer layoutId="detail-pair">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col"
      >
        <PairStartAmountInput index={0} state={state} price={price} />
        <PairStartAmountInput index={1} state={state} price={price} />
        {showSummary && <PairStartSummary item={item} state={state} />}
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
