"use client";

import { useMemo } from "react";
import { StakeExecuteButtons } from "./common/StakeExecuteButtons";

import { BigDecimal } from "@/types/BigDecimal";
import type { StakeTokenStatus } from "@/hooks/farm/StakeTokenStatus";
import StakingAmountInput from "./StakingAmountInput";
import useUnStakePanel from "@/hooks/useUnStakePanel";
import type { Farm } from "@/types/FarmListTableRowProps";
import { FaRegArrowAltCircleDown } from "react-icons/fa";
import { AprEntry } from "@/app/AssetsContextProvider";
import { ExtraRewardsInfo } from "./common/ExtraRewardsInfo";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";

/**
 * Unstake 시에는 Approve가 필요 없으므로
 * tokenStatuses를 모두 승인된 상태로 '오버라이드'하여 ExecuteButtons로 전달합니다.
 */
export default function UnStakePanel({
  item,
  matched,
}: {
  item: Farm;
  matched: AprEntry | undefined;
}) {
  const state = useUnStakePanel(item);

  const inputToken = state.token;

  const tokenStatusesApproved = useMemo<StakeTokenStatus[]>(
    () =>
      state.tokenStatuses.map((s) => ({
        ...s,
        isApproved: true,
        isActive: true,
      })),
    [state.tokenStatuses]
  );

  const balance = state.tokenStatuses[0].balance;
  const balanceNum = format2(balance.toNumber(), 5);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-low justify-between items-center text-xs px-1">
        <div className="flex items-center gap-1">
          <FaRegArrowAltCircleDown />
          <div>Amount to Unstake</div>
        </div>
        <div>{`Staked Balance ${balanceNum}`}</div>
      </div>
      <StakingAmountInput
        amount={state.amount}
        setAmount={(v: BigDecimal) => state.setAmount(v)}
        setMaxAmount={state.setMaxAmount}
        isInsolvency={state.isInsolvency}
        isDisabled={
          state.isPending || !state.isConnected || state.isWrongNetwork
        }
        isApproved={true} // 항상 승인됨으로 표시
        isActive
        token={inputToken}
        panel="unstake"
      />

      <StakeExecuteButtons
        isConnected={state.isConnected}
        isExecutable={state.isExecutable}
        isPending={state.isPending}
        isWrongNetwork={state.isWrongNetwork}
        execute={state.execute}
        executeText="Unstaking"
        tokenStatuses={tokenStatusesApproved}
        variant="PINK"
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
