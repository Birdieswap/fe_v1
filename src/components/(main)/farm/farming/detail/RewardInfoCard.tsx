"use client";

import Image from "next/image";
import clsx from "clsx";
import { Button, Spinner } from "@heroui/react";
import { useCallback, useContext, useEffect, useMemo } from "react";
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
import { AssetsContext, AprEntry } from "@/app/AssetsContextProvider";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";

import { TransactionContext } from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import {
  TransactionStatusProps,
  claimTransactionProps,
} from "@/app/TransactionContextProvider";

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

type VaultRowItem = {
  kind: "vault" | "staking";
  name: string;
  rawName: string;
  apy: number;
  aprSource: any;
};

// =========================
// Grid: [icon 1] [name 4] [metric 3] [right(amt+btn) 4]
// =========================
const ROW_BASE = "grid grid-cols-12 items-center gap-2 bg-content1/40 min-h-10";
const CELL_METRIC =
  "col-span-3 justify-self-end text-right text-foreground tabular-nums";
const RIGHT_GROUP =
  "col-span-5 justify-self-end grid grid-cols-2 items-center gap-6"; // gap-6 = 24px
const AMOUNT_INNER = "justify-self-end text-right tabular-nums";
const BTN_BASE =
  "justify-self-end btn-mint h-[33px] w-[64px] rounded-md text-sm text-center font-medium";

export default function RewardInfoCard({
  item,
  price: priceBD,
  onOpenStakingModal,
  className,
}: {
  item: Farm;
  price?: BigDecimal | null;
  onOpenStakingModal?: (row: VaultRowItem) => void;
  className?: string;
}) {
  const chainId = useChainId();
  const { aprDataState } = useContext(AssetsContext);
  const aprList: AprEntry[] = aprDataState?.apr ?? [];

  const price = useMemo(() => {
    const v: any = priceBD;
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v?.toNumber === "function") {
      try {
        return v.toNumber();
      } catch {
        return 0;
      }
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [priceBD]);

  const stakeAddr = item?.wip_stakeToken?.addresses?.[chainId];
  const stakeAddrLower = (stakeAddr ?? "").toLowerCase();
  const chainIdStr = (() => {
    const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
      .toString()
      .trim()
      .toLowerCase();
    return mode === "dev" ? "0" : String(chainId);
  })();

  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chainId === chainIdStr &&
          (e.contractAddress ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddrLower]
  );

  const dprRaw = matched?.staking?.dailyPointRate as
    | string
    | number
    | undefined;
  const dailyPointRateNum = Number(
    typeof dprRaw === "string" || typeof dprRaw === "number" ? dprRaw : 0
  );
  const hasPointRate =
    Number.isFinite(dailyPointRateNum) && dailyPointRateNum > 0;

  const extraList = (matched?.staking?.extraRewards ?? []) as ExtraReward[];
  const hasAnyExtra = Array.isArray(extraList) && extraList.length > 0;

  const showStakingBlock =
    Boolean(matched?.staking?.contractAddress) && (hasAnyExtra || hasPointRate);

  const openStakingModal = useCallback(() => {
    if (!matched?.staking || !onOpenStakingModal) return;
    const stakingRow: VaultRowItem = {
      kind: "staking",
      name: "Staking",
      rawName: "Staking",
      apy: 0,
      aprSource: matched.staking,
    };
    onOpenStakingModal(stakingRow);
  }, [matched?.staking, onOpenStakingModal]);

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
      {/* Header */}
      <div
        className={clsx(
          "flex select-none items-center transition-colors pb-4",
          onOpenStakingModal ? "cursor-pointer" : "cursor-default"
        )}
        role={onOpenStakingModal ? "button" : undefined}
        tabIndex={onOpenStakingModal ? 0 : -1}
        onClick={onOpenStakingModal ? openStakingModal : undefined}
        onKeyDown={
          onOpenStakingModal
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStakingModal();
                }
              }
            : undefined
        }
      >
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-default-800 dark:text-default-700">
            Staking
          </p>
          <Icons.Info
            className={clsx(
              "fill-default-500",
              "dark:fill-default-800",
              "transition-[fill]"
            )}
            fillRule="evenodd"
          />
        </div>
        <div className="grow" />
        <span className="whitespace-nowrap font-semibold text-primary">
          Live
        </span>
      </div>

      {/* Point Row */}
      <div className={ROW_BASE}>
        <div className="col-span-1 justify-self-start relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
          <Icons.PointIcon className="h-full w-full fill-primary text-background" />
        </div>
        <div className="col-span-3 min-w-0">
          <p className="whitespace-normal break-words text-[15px] font-semibold text-default-800 dark:text-default-700">
            <span className="hidden sm:inline">Birdieswap Point</span>
            <span className="inline sm:hidden">Point</span>
          </p>
        </div>
        <span className={CELL_METRIC}>
          {dailyPointRateNum
            ? `${(dailyPointRateNum / (price || 1) / 1e18).toFixed(2)} /$`
            : "0.00/$"}
        </span>
        <div className={RIGHT_GROUP}>
          <div className={AMOUNT_INNER}>
            <p className="font-medium text-inter text-[14px]">0</p>
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
  stakingAddress,
  reward,
  stakeUsdPrice,
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

  const aprPct = useMemo(() => {
    const base = stakeUsdPrice || 0;
    if (base <= 0) return null;
    const daily =
      Number(reward.dailyRewardPerTokenX18) /
      1e18 /
      Math.pow(10, reward.decimals) /
      base;
    return daily * 365 * 100;
  }, [reward.dailyRewardPerTokenX18, reward.decimals, stakeUsdPrice]);

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
        <p className="truncate text-[15px] font-semibold text-default-800 dark:text-default-700">
          {reward.symbol}
        </p>
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
              <p className="font-medium text-inter text-[14px] leading-[14px] text-default-700 dark:text-default-300 tabular-nums">
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
            "disabled:bg-default-300 disabled:text-default-600",
            "dark:disabled:bg-dark-popup-bg dark:disabled:text-default-400",
            "aria-[busy=true]:animate-pulse aria-[busy=true]:cursor-wait"
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
