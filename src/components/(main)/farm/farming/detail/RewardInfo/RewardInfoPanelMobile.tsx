"use client";

import clsx from "clsx";
import { Button, Spinner } from "@heroui/react";
import Image from "next/image";
import {
  useAccount,
  useChainId,
  useClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits } from "viem";
import Icons from "@/assets/icons/icons";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { TransactionContext } from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import {
  TransactionStatusProps,
  claimTransactionProps,
} from "@/app/TransactionContextProvider";
import { useContext, useEffect, useMemo, useCallback } from "react";
import { useRewardInfo } from "@/hooks/farm/useRewardInfo";
import { AssetsContext } from "@/app/AssetsContextProvider";

import type { Farm } from "@/types/FarmListTableRowProps";
import type { BigDecimal } from "@/types/BigDecimal";

type Address = `0x${string}`;

type ExtraReward = {
  contractAddress: Address;
  dailyRewardPerTokenX18: string;
  symbol: string;
  name?: string;
  displayName?: string;
  decimals: number;
  indexNumber: number;
  priceUSD?: number;
};

/** 공통 그리드 규칙(웹과 동일) */
const ROW_BASE =
  "grid grid-cols-12 items-center min-h-10 bg-content1/40 text-foreground";

/** 왼쪽 그룹(아이콘 + 심볼): 2~7열 */
const LEFT_GROUP = "col-span-7 min-w-0 flex items-center gap-2";

/** 우측 그룹(Amount + 버튼): 8~12열 */
const RIGHT_GROUP =
  "col-span-5 justify-self-end grid grid-cols-[1fr_auto] items-center gap-3";

/** 모바일 버튼 기본 스타일 */
const BTN_BASE =
  "justify-self-end btn-mint h-[33px] w-[64px] rounded-md text-sm text-center font-medium";

export default function RewardInfoPanelMobile({
  item,
  price: priceBD,
  points,
  onOpenStakingModal,
  className,
}: {
  item: Farm;
  price?: BigDecimal | null;
  points?: string | null;
  onOpenStakingModal?: (row: any) => void;
  className?: string;
}) {
  const {
    price,
    matched,
    extraList,
    showStakingBlock,
    hasEarned,
    hasUserStakePoint,
  } = useRewardInfo(item, priceBD);

  const openStakingModal = useCallback(() => {
    if (!matched?.staking || !onOpenStakingModal) return;
    onOpenStakingModal({
      kind: "staking",
      name: "Staking",
      rawName: "Staking",
      apy: 0,
      aprSource: matched.staking,
    });
  }, [matched?.staking, onOpenStakingModal]);

  if (!showStakingBlock && !hasUserStakePoint && !hasEarned) {
    return (
      <div className={clsx("rounded-2xl bg-background p-4 text-sm", className)}>
        <div className="flex grow flex-col items-center justify-center gap-4 pt-1.5 pb-4">
          <Icons.WalletEmptyReward className="fill-light-mid-mint-2 dark:fill-dark-empty-state" />
          <p className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            There are no additional staking rewards available at the moment.
          </p>
          <p className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            But you are still enjoying the double growth rate of
            Birdieswap!{" "}
          </p>
        </div>
      </div>
    );
  }

  if (!hasUserStakePoint && !hasEarned) {
    return (
      <div className={clsx("rounded-2xl bg-background p-4 text-sm", className)}>
        <div className="flex grow flex-col items-center justify-center gap-4 pt-1.5 pb-4">
          <Icons.WalletEmptyReward className="fill-light-mid-mint-2 dark:fill-dark-empty-state" />
          <p className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            You haven’t started staking yet.
          </p>
          <p className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            Join staking to enjoy even more rewards on Birdieswap!{" "}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-2xl bg-background p-4 text-sm sm:hidden",
        className
      )}
    >
      {/* ================= Header(모바일) ================= */}
      <div className="grid grid-cols-12 items-center select-none pb-3">
        <div className="col-span-12 flex items-center gap-1.5">
          <p className="text-[14px] font-bold text-default-800 dark:text-default-700">
            Extra Rewards
          </p>
        </div>
      </div>

      {/* ================= Point Row (아이콘+심볼 / Amount+버튼) ================= */}
      <div className={clsx(ROW_BASE, "gap-2 py-2 rounded-md")}>
        {/* 2~7: 아이콘 + 심볼 (한 셀, flex gap-2) */}
        <div className={LEFT_GROUP}>
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
            <Icons.PointIcon className="h-full w-full fill-primary text-background" />
          </div>
          <p className="text-[14px] font-semibold truncate">Point</p>
        </div>

        {/* 8~12: Amount + 버튼 */}
        <div className={RIGHT_GROUP}>
          <div className="justify-self-end text-right tabular-nums">
            {/* 필요시 포인트 보유량 표기 (현재 0 고정) */}
            <span className="text-[13px] font-medium">
              {Number(points).toFixed(2) ?? "0"}
            </span>
          </div>
          <Button
            size="sm"
            isDisabled
            className={clsx(
              BTN_BASE,
              "data-[disabled=true]:!bg-default-300 data-[disabled=true]:!text-default-600",
              "dark:data-[disabled=true]:!bg-dark-popup-bg dark:data-[disabled=true]:!text-default-400",
              "data-[disabled=true]:!opacity-100 data-[disabled=true]:!shadow-none data-[disabled=true]:!ring-0",
              "data-[disabled=true]:pointer-events-none"
            )}
          >
            Point
          </Button>
        </div>
      </div>

      {/* ================= Extra Rewards (아이콘+심볼 / Amount+버튼) ================= */}
      <div className="mt-3 flex flex-col gap-2">
        {extraList.map((er) => (
          <ExtraRewardClaimRowMobile
            key={`${er.symbol}-${er.indexNumber}`}
            stakingAddress={matched!.staking!.contractAddress as Address}
            stakeUsdPrice={price}
            reward={{
              ...er,
              contractAddress:
                (er.contractAddress as Address) ??
                (matched!.staking!.contractAddress as Address),
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── ExtraReward 행 (모바일, APR/PointRate 제거) ───────────────────────── */

function ExtraRewardClaimRowMobile({
  stakingAddress,
  reward,
  stakeUsdPrice, // 현재 사용하지 않지만 시그니처 유지(필요 시 재활용)
}: {
  stakingAddress: Address;
  reward: ExtraReward;
  stakeUsdPrice: number;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const client = useClient();
  const { refetchAll } = useContext(AssetsContext);
  const transactionContext = useContext(TransactionContext);

  const {
    data: earnedRaw,
    isLoading: isReading,
    refetch: refetchEarned,
  } = useReadContract({
    address: stakingAddress,
    abi: birdieswap_staking_abi,
    functionName: "earned",
    args: [address as Address, BigInt(reward.indexNumber)],
    query: {
      enabled: Boolean(address && stakingAddress),
      refetchOnWindowFocus: false,
    },
  });

  const amountNum = useMemo(() => {
    try {
      const v = (earnedRaw ?? BigInt(0)) as bigint;
      return Number(formatUnits(v, reward.decimals));
    } catch {
      return 0;
    }
  }, [earnedRaw, reward.decimals]);

  const dollar = useMemo(() => {
    const unit = reward.priceUSD ?? 0;
    const val = amountNum * unit;
    return Number.isFinite(val) ? val : 0;
  }, [amountNum, reward.priceUSD]);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const canClaim =
    (amountNum ?? 0) > 0 && !!address && !isPending && !isWaiting;

  const onClaim = () => {
    if (!canClaim) return;
    const transactionProps: TransactionStatusProps & claimTransactionProps = {
      chainId,
      transactionType: TransactionType.CLAIM,
      output: { symbol: reward.symbol, amount: amountNum },
      address,
    } as const;

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      refetch: async () => {
        await Promise.all([refetchEarned(), refetchAll?.()]);
      },
      transactionProps,
    });

    writeContract(
      {
        address: stakingAddress,
        abi: birdieswap_staking_abi,
        functionName: "claim",
        args: [BigInt(reward.indexNumber)],
        chainId,
      },
      { onError: handlers.onError, onSuccess: handlers.onSuccess }
    );
  };

  useEffect(() => {
    if (!isSuccess) return;
    (async () => {
      await refetchEarned();
      await refetchAll?.();
    })();
  }, [isSuccess, refetchEarned, refetchAll]);

  return (
    // [2~7: 아이콘+심볼][8~12: Amount+버튼]
    <div className={clsx(ROW_BASE, "gap-2 py-2 rounded-md")}>
      {/* 2~7: 아이콘 + 심볼 (한 셀, flex gap-2) */}
      <div className={LEFT_GROUP}>
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
          <Image
            src={`/tokens/${reward.symbol}.svg`}
            alt={reward.symbol}
            fill
            sizes="24px"
          />
        </div>
        <span className="text-[14px] font-semibold truncate">
          {reward.symbol}
        </span>
      </div>

      {/* 8~12: Amount + 버튼 */}
      <div className={RIGHT_GROUP}>
        <div className="justify-self-end text-right tabular-nums">
          {isReading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <span className="text-[13px] font-medium">
                {amountNum.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
              </span>
              <br />
              <span className="text-[11px] text-default-800 dark:text-default-300">
                {dollar > 0
                  ? `$${dollar.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}`
                  : "$0.00"}
              </span>
            </>
          )}
        </div>

        <Button
          size="sm"
          className={clsx(
            BTN_BASE,
            "data-[disabled=true]:!bg-default-300 data-[disabled=true]:!text-default-600",
            "dark:data-[disabled=true]:!bg-dark-popup-bg dark:data-[disabled=true]:!text-default-400",
            "data-[disabled=true]:!opacity-100 data-[disabled=true]:!shadow-none data-[disabled=true]:!ring-0",
            "data-[disabled=true]:pointer-events-none"
          )}
          isLoading={false}
          isDisabled={!canClaim || isPending || isWaiting}
          onPress={onClaim}
          aria-busy={isPending || isWaiting}
        >
          Claim
        </Button>
      </div>
    </div>
  );
}
