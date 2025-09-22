"use client";

import { useMemo } from "react";

import { BigDecimal } from "@/types/BigDecimal";
import StakingAmountInput from "./StakingAmountInput";
import { StakeExecuteButtons } from "./common/StakeExecuteButtons";
import useStakePanel from "@/hooks/useStakePanel";
import type { Farm } from "@/types/FarmListTableRowProps";
import { FaRegArrowAltCircleUp } from "react-icons/fa";
import { ExtraRewardsInfo } from "./common/ExtraRewardsInfo";
import { AprEntry } from "@/app/AssetsContextProvider";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";

export default function StakePanel({
  item,
  matched,
}: {
  item: Farm;
  matched: AprEntry | undefined;
}) {
  const state = useStakePanel(item);
  const balance = state.tokenStatuses[0].balance;
  const symbol = state.token?.symbol;
  const balanceNum = format2(balance.toNumber(), 5);

  // 입력창 보여줄 토큰(예: 예치 토큰)
  const inputToken = state.token;
  // console.log("stakePanel", item, state);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-low justify-between items-center text-xs px-1">
        <div className="flex items-center gap-1">
          <FaRegArrowAltCircleUp />
          <div>Amount to Stake</div>
        </div>
        <div>{`Balance ${balanceNum} ${symbol}`}</div>
      </div>

      <StakingAmountInput
        amount={state.amount}
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

      <StakeExecuteButtons
        isConnected={state.isConnected}
        isExecutable={state.isExecutable}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        execute={state.execute}
        executeText="Staking"
        tokenStatuses={state.tokenStatuses}
        variant="MINT"
      />
      {matched?.staking?.contractAddress && (
        <ExtraRewardsInfo
          staking={{
            contractAddress: matched.staking.contractAddress as `0x${string}`,
            extraRewards: matched.staking.extraRewards ?? [],
          }}
          className="mt-3"
        />
      )}
    </div>
  );
}
