"use client";

import { useEffect, useMemo, useRef } from "react";
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

import { useSearchParams, useRouter, usePathname } from "next/navigation";

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

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const unstakeParam = useMemo(
    () => searchParams.get("unstakeAmount"),
    // pathname을 포함하면 다른 farm로 이동했을 때도 새로 읽힘
    [searchParams, pathname]
  );

  const balanceKey = useMemo(() => {
    try {
      return state?.tokenStatuses?.[0]?.balance?.toString?.() ?? "";
    } catch {
      return "";
    }
  }, [state.tokenStatuses]);

  useEffect(() => {
    const val = searchParams.get("unstakeAmount");
    if (!val) return;

    const isReady =
      state.isConnected &&
      !state.isWrongNetwork &&
      !state.isPending &&
      typeof state.tokenStatuses?.[0]?.balance?.toString === "function" &&
      state.tokenStatuses?.[0]?.balance?.toString() !== "";

    if (!isReady) return;

    const lower = val.toLowerCase();
    const id = setTimeout(() => {
      try {
        if (lower === "max") {
          state.setMaxAmount();
        } else {
          const num = Number(val);
          if (!Number.isNaN(num) && Number.isFinite(num) && num >= 0) {
            state.setAmount(new BigDecimal(String(num)));
          }
        }
        // 적용 후에는 항상 URL에서 제거
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete("unstakeAmount");
        // stakePanel은 남겨도 되고(UNSTAKE 유지), 바로 지울 거면 StakeDetail 방법 A가 잡아줌
        const q = sp.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      } catch (e) {
        console.error("apply unstakeAmount failed:", e);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [
    searchParams,
    pathname,
    router,
    state.isConnected,
    state.isWrongNetwork,
    state.isPending,
    state.tokenStatuses,
    state.setMaxAmount,
    state.setAmount,
  ]);

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
