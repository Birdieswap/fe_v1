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
import { useContext, useEffect, useMemo, useCallback } from "react";
import { TransactionType } from "@/types/TransactionTypes";
import {
  TransactionStatusProps,
  claimTransactionProps,
} from "@/app/TransactionContextProvider";

import type { Farm } from "@/types/FarmListTableRowProps";
import type { BigDecimal } from "@/types/BigDecimal";
import { useRewardInfo } from "@/hooks/farm/useRewardInfo";
import { AssetsContext } from "@/app/AssetsContextProvider";

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

// 기존 상수/스타일 그대로 사용
const ROW_BASE =
  "grid grid-cols-12 items-center gap-2 bg-content1/40 min-h-10 text-foreground";
const CELL_METRIC =
  "col-span-3 justify-self-end text-right text-foreground tabular-nums";
const RIGHT_GROUP =
  "col-span-5 justify-self-end grid grid-cols-2 items-center gap-6";
const AMOUNT_INNER = "justify-self-end text-right tabular-nums";
const BTN_BASE =
  "justify-self-end btn-mint h-[33px] w-[64px] rounded-md text-sm text-center font-medium";

export default function RewardInfoPanel({
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
  const { price, matched, dailyPointRateNum, extraList, showStakingBlock } =
    useRewardInfo(item, priceBD);
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
  // console.log("RewardInfoPanel render:", extraList);
  if (!showStakingBlock) {
    return (
      <div className={clsx("rounded-2xl bg-background p-4 text-sm", className)}>
        <p className="text-default-500">No rewards info.</p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-2xl min-h-[176px] bg-background p-4 text-sm",
        className
      )}
    >
      {/* Header (웹) */}
      <div
        className={clsx(
          "grid grid-cols-12 items-center select-none pb-4",
          onOpenStakingModal ? "cursor-pointer" : "cursor-default"
        )}
        onClick={openStakingModal}
      >
        <div className="col-span-4 flex items-center gap-1.5">
          <p className="font-bold text-default-800 dark:text-default-400">
            Staking
          </p>
          <Icons.Info
            className={clsx(
              "fill-default-500",
              "dark:fill-default-300",
              "transition-[fill]"
            )}
            fillRule="evenodd"
          />
        </div>
        <span className="col-span-3 justify-self-end whitespace-nowrap font-semibold text-primary dark:text-dark-green-key pr-3">
          Live
        </span>
        <div className="col-span-5" />
      </div>

      {/* Point Row (웹 그대로) */}
      <div className={ROW_BASE}>
        <div className="col-span-1 justify-self-start relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
          <Icons.PointIcon className="h-full w-full fill-primary text-background" />
        </div>
        <div className="col-span-3 min-w-0">
          <p className="text-[15px] font-semibold">Birdieswap Point</p>
        </div>
        <span className={CELL_METRIC}>
          {dailyPointRateNum
            ? `${(dailyPointRateNum / (price || 1) / 1e18).toFixed(2)} /$`
            : "0.00/$"}
        </span>
        <div className={RIGHT_GROUP}>
          <div className={AMOUNT_INNER}>
            <p className="font-medium text-sans text-[14px]">
              {Number(points).toFixed(2) ?? "0"}
            </p>
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

      {/* Extra Rewards */}
      <div className="mt-4 rounded-sm bg-background text-sm">
        <div className="flex flex-col gap-3">
          {extraList.map((er) => (
            <ExtraRewardClaimRow
              key={`${er.symbol}-${er.indexNumber}`}
              item={item}
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
    </div>
  );
}

function ExtraRewardClaimRow({
  item,
  stakingAddress,
  reward,
  stakeUsdPrice,
}: {
  item: Farm;
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

  const {
    data: totalSupplyRaw,
    isLoading: isReadingTotal,
    refetch: refetchTotalSupply,
  } = useReadContract({
    address: stakingAddress,
    abi: birdieswap_staking_abi,
    functionName: "getTotalSupply",
    query: {
      enabled: Boolean(stakingAddress),
      refetchOnWindowFocus: false,
    },
  });

  const totalSupply = useMemo(() => {
    try {
      if (!totalSupplyRaw) return 0;
      return Number(
        formatUnits(totalSupplyRaw as bigint, item.wip_stakeToken.decimals)
      );
    } catch {
      return 0;
    }
  }, [totalSupplyRaw, item.wip_stakeToken.decimals]);

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

  const aprPct = useMemo(() => {
    const base = stakeUsdPrice || 0;
    const rewardPrice = reward.priceUSD ?? 0;

    // 기본 값들 유효성 체크
    if (base <= 0) return null;
    if (!rewardPrice || rewardPrice <= 0) return null;
    if (!totalSupply || totalSupply <= 0) return null;

    // dailyRewardPerTokenX18는 "1e18 스케일"이라고 가정
    const dailyRewardPerToken =
      Number(reward.dailyRewardPerTokenX18) /
      1e18 /
      Math.pow(10, reward.decimals);

    // 토큰 기준 일일 USD 보상
    const dailyRewardUsdPerToken = dailyRewardPerToken * rewardPrice;

    // TVL = 스테이킹된 수량 * stakeUsdPrice
    const tvlUsd = totalSupply * base;
    if (!Number.isFinite(tvlUsd) || tvlUsd <= 0) return null;

    const dailyRate = dailyRewardUsdPerToken / tvlUsd;
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) return null;

    return dailyRate * 365 * 100;
  }, [
    reward.dailyRewardPerTokenX18,
    reward.decimals,
    reward.priceUSD,
    stakeUsdPrice,
    totalSupply,
  ]);

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
    <div className={ROW_BASE}>
      <div className="col-span-1 justify-self-start relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
        <Image
          src={`/tokens/${reward.symbol}.svg`}
          alt={reward.symbol}
          fill
          sizes="24px"
        />
      </div>
      <div className="col-span-3 min-w-0">
        <p className="truncate text-[15px] font-semibold">{reward.symbol}</p>
      </div>
      <span className={CELL_METRIC}>
        {aprPct == null ? "—" : `${aprPct.toFixed(2)}% APR`}
      </span>
      <div className={RIGHT_GROUP}>
        <div className={AMOUNT_INNER}>
          {isReading ? (
            <div className="inline-block w-full text-right">
              <Spinner size="sm" color="default" />
            </div>
          ) : (
            <div>
              <p className="font-medium text-inter text-[14px]">
                {amountNum.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
              </p>
              <p className="font-medium text-inter text-[14px] leading-[14px]  text-default-800 dark:text-default-300 tabular-nums">
                {dollar > 0
                  ? `$${dollar.toLocaleString(undefined, { maximumFractionDigits: 3 })}`
                  : "$0.000"}
              </p>
            </div>
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
