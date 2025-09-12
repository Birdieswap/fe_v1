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

import { ExecuteButtons } from "../common/ExecuteButtons";

import PairStartAmountInput from "./pairStart/PairStartAmountInput";
import PairSlider from "./PairSlider";
import PairStartSummary from "./pairStart/PairStartSummary";
import { BigDecimal } from "@/types/BigDecimal";
import ETHSlider from "./ETHSlider";

export function PairStartPanel({
  item,
  price,
}: {
  item: FarmPair;
  price: BigDecimal | null;
}) {
  // 기존 훅: 지난 패치에서 ETH/WETH 파생값을 반환하도록 확장됨
  const state: UsePairStartPanelReturn = usePairStartPanel(item);

  // [ADDED] 활성 인덱스: 요약에서 쓰던 규칙과 동일 (0이 true면 0, 아니면 1)
  const activeIndex: 0 | 1 = state.isActive[0] ? 0 : 1;
  const otherIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;

  const sym0 = state.displayTokens?.[0]?.symbol;
  const sym1 = state.displayTokens?.[1]?.symbol;

  //두 입력 모두 ETH/WETH가 아니면 숨김
  const hasEthLike0 = sym0 === "ETH" || sym0 === "WETH";
  const hasEthLike1 = sym1 === "ETH" || sym1 === "WETH";

  const showETHSlider = !!(hasEthLike0 || hasEthLike1);

  //활성 인덱스가 ETH/WETH면 그대로, 아니면 다른쪽이 ETH/WETH면 그쪽
  const controlsIndex: 0 | 1 =
    sym0 === "ETH" || sym0 === "WETH" || sym1 === "ETH" || sym1 === "WETH"
      ? state.displayTokens?.[activeIndex]?.symbol === "ETH" ||
        state.displayTokens?.[activeIndex]?.symbol === "WETH"
        ? activeIndex
        : state.displayTokens?.[otherIndex]?.symbol === "ETH" ||
          state.displayTokens?.[otherIndex]?.symbol === "WETH"
        ? otherIndex
        : activeIndex
      : activeIndex;

  const selected = (state.nativeMode?.[controlsIndex] ?? "ETH") as
    | "ETH"
    | "WETH";

  //  PairSlider의 인덱스가 0 또는 2일 때만
  const resolvePairIndex = (s: any): number | undefined => {
    // 프로젝트마다 키 이름이 달 수 있으니 주요 후보를 안전 탐색
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
      <PanelHeader>
        <div className="flex justify-between w-full items-center">
          <div className="flex grow flex-row items-center gap-1">
            <SectionHeader>Start with</SectionHeader>
            <div className="flex flex-row items-center text-sm font-normal">
              {/* (
            <div className="flex flex-row items-center gap-1.5">
              <span className="text-xs font-normal">Fee tier</span>
              <span className="text-base font-bold">
                {item.feeTier.toFixed(2)}%
              </span>
            </div>
            ) */}
            </div>
          </div>
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
        </div>
        {/* <PairSlider isDisabled={false} item={item} state={state} /> */}
      </PanelHeader>
      <motion.div
        layout
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
