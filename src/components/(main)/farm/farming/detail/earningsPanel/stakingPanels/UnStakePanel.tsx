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
import { LoadingPulse } from "./common/LoadingPulse";

export default function UnStakePanel({
  item,
  matched,
  presetMaxToken,
  onPresetApplied,
}: {
  item: Farm;
  matched: AprEntry | undefined;
  presetMaxToken?: number;
  onPresetApplied?: () => void;
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

  const firstStatus = state.tokenStatuses?.[0];
  const balanceBD = firstStatus?.balance ?? null; // null이면 아직 로딩 중
  const isBalanceReady = balanceBD !== null;
  const balanceNumber = isBalanceReady
    ? (balanceBD as any)?.toNumber?.() ??
      Number.parseFloat((balanceBD as any)?.toString?.() ?? "0")
    : NaN;
  const balanceText =
    isBalanceReady && Number.isFinite(balanceNumber)
      ? format2(balanceNumber, 5)
      : "";

  const balanceKey = useMemo(() => {
    try {
      return state?.tokenStatuses?.[0]?.balance?.toString?.() ?? "";
    } catch {
      return "";
    }
  }, [state.tokenStatuses]);

  // 한 번만 초기 프리셋을 적용하기 위한 가드
  const wantApplyRef = useRef(false);
  const appliedRef = useRef(false);
  const applyingRef = useRef(false);
  const lastTokenRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      presetMaxToken !== undefined &&
      presetMaxToken !== lastTokenRef.current
    ) {
      lastTokenRef.current = presetMaxToken;
      appliedRef.current = false; // 새 사이클: 아직 적용 전
      wantApplyRef.current = true; // 적용 의지 ON
    }
  }, [presetMaxToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get(
      "unstakeAmount"
    );
    if ((raw || "").toLowerCase() === "max") {
      appliedRef.current = false;
      wantApplyRef.current = true;
      // URL 삭제는 부모(onPresetApplied) 타이밍에서 처리하므로 여기선 건드리지 않음
    }
  }, []);

  const readyNow =
    state.isConnected &&
    !state.isWrongNetwork &&
    !state.isPending &&
    typeof state.tokenStatuses?.[0]?.balance?.toString === "function" &&
    state.tokenStatuses?.[0]?.balance?.toString() !== "";

  // ★ 타이머 재시도 제거!
  // ready가 변경되거나, balanceKey가 바뀌거나, 토큰이 바뀔 때마다 체크 → 준비되면 즉시 1회 적용
  useEffect(() => {
    // 의지가 없거나 이미 도는 중이면 시작하지 않음
    if (!wantApplyRef.current || applyingRef.current) return;

    applyingRef.current = true;

    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    const INTERVAL_MS = 50;

    const timer = setInterval(() => {
      attempts += 1;

      const ok =
        state.isConnected &&
        !state.isWrongNetwork &&
        !state.isPending &&
        typeof state.tokenStatuses?.[0]?.balance?.toString === "function" &&
        state.tokenStatuses?.[0]?.balance?.toString() !== "";

      if (ok && wantApplyRef.current && !appliedRef.current) {
        try {
          state.setMaxAmount();
          appliedRef.current = true;
          wantApplyRef.current = false;
          applyingRef.current = false;
          clearInterval(timer);
          onPresetApplied?.(); // 부모가 URL 정리
          return;
        } catch (e) {
          console.error("apply preset max failed:", e);
        }
      }

      // 시간초과 또는 더 이상 의지가 없으면 종료
      if (attempts >= MAX_ATTEMPTS || !wantApplyRef.current) {
        applyingRef.current = false;
        clearInterval(timer);
      }
    }, INTERVAL_MS);

    return () => {
      applyingRef.current = false;
      clearInterval(timer);
    };
    // 토큰·연결 플래그들이 바뀌면 이 이펙트가 다시 실행될 수 있도록 deps에 핵심만 넣음
  }, [
    // 아래는 “준비 상태 변화”에 해당하는 핵심 신호들
    state.isConnected,
    state.isWrongNetwork,
    state.isPending,
    state.tokenStatuses,
    // 부모 신호도 감지
    presetMaxToken,
  ]);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-low justify-between items-center text-xs px-1">
        <div className="flex items-center gap-1">
          {/* <FaRegArrowAltCircleDown />
          <div>Amount to Unstake</div> */}
        </div>
        <div className="flex items-center">
          {isBalanceReady ? (
            <>Staked Balance&nbsp;{balanceText}</>
          ) : (
            <LoadingPulse w="w-20" />
          )}
        </div>
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
        executeText="Stop Staking"
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
