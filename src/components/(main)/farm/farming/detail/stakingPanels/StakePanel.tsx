"use client";

import { motion } from "framer-motion";
import {
  StakeFiller,
  StakePanelContainer,
} from "@/components/atoms/stakePanelBase";

import { BigDecimal } from "@/types/BigDecimal";
import StakingAmountInput from "./StakingAmountInput";
import { StakeExecuteButtons } from "./common/StakeExecuteButtons";
import useStakePanel from "@/hooks/useStakePanel";
import type { Farm } from "@/types/FarmListTableRowProps";

import { AprEntry } from "@/app/AssetsContextProvider";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";
import BalanceRatioCard from "./common/BalanceRatioCard";
import { defaultTransition } from "@/const/presenceTransition";

export default function StakePanel({
  item,
  matched,
  lpBalance,
  stakedBalance,
  totalBalance,
  price,
  hasRewards,
}: {
  item: Farm;
  matched: AprEntry | undefined;
  lpBalance?: BigDecimal;
  stakedBalance?: BigDecimal;
  totalBalance?: BigDecimal;
  price?: BigDecimal | null;
  hasRewards: boolean;
}) {
  const state = useStakePanel(item);
  const firstStatus = state.tokenStatuses?.[0];
  const balanceBD = firstStatus?.balance ?? null; // null이면 로딩 중으로 간주
  const symbol = state.token?.symbol ?? "";

  const isBalanceReady = balanceBD !== null;
  const balanceNumber = isBalanceReady
    ? ((balanceBD as any)?.toNumber?.() ??
      Number.parseFloat((balanceBD as any)?.toString?.() ?? "0"))
    : NaN;
  const balanceText =
    isBalanceReady && Number.isFinite(balanceNumber)
      ? format2(balanceNumber, 5)
      : "";
  // 입력창 보여줄 토큰(예: 예치 토큰)
  const inputToken = state.token;
  // console.log("[StakePanel] hasRewards debug", {
  //   matched,
  //   hasRewards,
  //   isExecutableBase: state.isExecutable,
  //   finalIsExecutable: state.isExecutable && hasRewards,
  // });

  // console.log("stakePanel", item, state, matched);
  // console.log("stakePanel tokenStatuses", state.tokenStatuses);

  return (
    <StakePanelContainer layoutId="stake-unstake">
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex w-full flex-col"
      >
        <BalanceRatioCard
          balanceText={balanceText}
          symbol={symbol}
          isBalanceReady={isBalanceReady}
          staked={stakedBalance}
          lp={lpBalance}
          total={totalBalance}
        />
        <StakingAmountInput
          amount={state.amount}
          balance={balanceBD}
          price={price}
          setAmount={(v: BigDecimal) => state.setAmount(v)}
          setMaxAmount={state.setMaxAmount}
          isInsolvency={false}
          isDisabled={
            state.isPending || !state.isConnected || state.isWrongNetwork
          }
          isApproved={
            // ExecuteButtons가 Approve 버튼을 자체로 노출하지만,
            // 인풋 옆 자물쇠 아이콘 제어를 위해 첫 번째 토큰 승인 상태를 힌트로 반영
            !state.tokenStatuses.some((s) => s.isApproved === false)
          }
          isActive
          token={inputToken}
          panel="stake"
        />
      </motion.div>
      <StakeFiller />

      <StakeExecuteButtons
        isConnected={state.isConnected}
        isExecutable={state.isExecutable && hasRewards}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        execute={state.execute}
        executeText="Start Staking"
        tokenStatuses={state.tokenStatuses}
        variant="MINT"
        showErrorMessages={hasRewards}
        hasRewards={hasRewards}
      />
    </StakePanelContainer>
  );
}
