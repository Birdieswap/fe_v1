import { motion } from "framer-motion";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { Filler, PanelContainer } from "@/components/atoms/FarmPanel";
import { usePairStopPanel } from "@/hooks/usePairStopPanel";
import { defaultTransition } from "@/const/presenceTransition";
import { BigDecimal } from "@/types/BigDecimal";

import { ExecuteButtons } from "../../common/ExecuteButtons";

import PairStopAmountInput from "./pairStop/PairStopAmountInput";
import PairStopReceiveAmountBox from "./pairStop/PairStopReceiveAmountBox";
import PairStopSummary from "./pairStop/PairStopSummary";

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

  const isEthLike0 = sym0 === "ETH" || sym0 === "WETH";
  const isEthLike1 = sym1 === "ETH" || sym1 === "WETH";
  const hasAnyEthLike = isEthLike0 || isEthLike1;

  // ETH/WETH 쪽을 우선 조작
  const controlsIndex: 0 | 1 = isEthLike0 ? 0 : isEthLike1 ? 1 : 0;

  const selected = (state.nativeMode?.[controlsIndex] ?? "ETH") as
    | "ETH"
    | "WETH";

  // 헤더 슬라이더 대신 AmountInput으로 내려줄 토글 객체 구성
  const nativeToggle = hasAnyEthLike
    ? {
        value: selected,
        onToggle: () => {
          state.setNativeMode?.((prev) => {
            const next = [...(prev ?? [])] as ("ETH" | "WETH" | null)[];
            const cur = (prev?.[controlsIndex] ?? "ETH") as "ETH" | "WETH";
            next[controlsIndex] = cur === "ETH" ? "WETH" : "ETH";
            return next as typeof prev;
          });
        },
      }
    : undefined;

  return (
    <PanelContainer layoutId="detail-pair">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col gap-0"
      >
        <PairStopAmountInput
          state={state}
          price={price}
          // nativeToggle={nativeToggle}
        />
        <PairStopSummary item={item} state={state} />
      </motion.div>
      <PairStopReceiveAmountBox
        input={item.wip_stakeToken.swap.input}
        isActive={state.isActive}
        receiveAmount={state.receiveAmount}
        displayTokens={state.displayTokens}
        nativeToggle={nativeToggle}
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
