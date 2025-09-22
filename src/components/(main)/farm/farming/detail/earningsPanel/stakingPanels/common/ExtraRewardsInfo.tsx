"use client";

import Image from "next/image";
import { Button, Spinner, cn } from "@heroui/react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits } from "viem";
import { useContext, useEffect, useMemo } from "react";
import clsx from "clsx";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import { AssetsContext } from "@/app/AssetsContextProvider";

type Address = `0x${string}`;

type ExtraReward = {
  contractAddress: Address;
  dailyRewardPerTokenX18: string;
  symbol: string;
  name: string;
  displayName?: string;
  decimals: number;
  indexNumber: number;
  priceUSD: number;
};

type MatchedStaking = {
  contractAddress: Address; // staking 컨트랙트 주소
  extraRewards?: ExtraReward[]; // 보너스 보상들
};

export function ExtraRewardsInfo(props: {
  staking: MatchedStaking | null | undefined;
  className?: string;
}) {
  const list = props.staking?.extraRewards ?? [];

  if (!props.staking?.contractAddress || list.length === 0) return null;

  return (
    <div className={cn("rounded-sm bg-background text-sm", props.className)}>
      <p className="mb-2 font-bold text-default-800 dark:text-default-700">
        Extra Rewards
      </p>

      <div className="flex flex-col gap-3">
        {list.map((er) => (
          <ExtraRewardInfoRow
            key={`${er.symbol}-${er.indexNumber}`}
            stakingAddress={props.staking!.contractAddress}
            reward={er}
          />
        ))}
      </div>
    </div>
  );
}

function ExtraRewardInfoRow(props: {
  stakingAddress: Address;
  reward: ExtraReward;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { reward, stakingAddress } = props;
  const { refetchAll } = useContext(AssetsContext);

  // ====== 1) 읽기: earned(account, index) ======
  const {
    data: earnedRaw,
    isLoading: isReading,
    refetch: refetchEarned,
  } = useReadContract({
    address: stakingAddress,
    abi: birdieswap_staking_abi,
    functionName: "earned",
    // earned(account, index) 형태라고 가정 (추측입니다)
    args: [address as Address, BigInt(reward.indexNumber)],
    query: {
      enabled: Boolean(address && stakingAddress), // 주소 있을 때만
      refetchOnWindowFocus: false,
    },
  });

  // ====== 2) 포맷팅 ======
  const amountNum = useMemo(() => {
    try {
      const v = (earnedRaw ?? BigInt(0)) as bigint;
      return Number(formatUnits(v, reward.decimals));
    } catch {
      return 0;
    }
  }, [earnedRaw, reward.decimals]);

  const dollar = useMemo(() => {
    const val = amountNum * (reward.priceUSD ?? 0);
    return Number.isFinite(val) ? val : 0;
  }, [amountNum, reward.priceUSD]);

  // ====== 3) 쓰기: claim(index) ======
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const canClaim =
    (amountNum ?? 0) > 0 && !!address && !isPending && !isWaiting;

  const onClaim = () => {
    if (!canClaim) return;
    writeContract({
      address: stakingAddress,
      abi: birdieswap_staking_abi,
      functionName: "claim",
      // claim(uint256 index) 형태라고 가정 (추측입니다)
      args: [BigInt(reward.indexNumber)],
      chainId,
    });
  };

  // 트랜잭션 성공 후 최신화
  useEffect(() => {
    if (!isSuccess) return;

    (async () => {
      // 1) 현재 리워드 수량(earned)만 다시 읽기
      await refetchEarned();

      // 2) 잔고/리워드/TVL만 갱신
      await refetchAll?.();
      // 🔸 포인트는 갱신하지 않음
    })();
  }, [isSuccess, refetchEarned, refetchAll]);

  return (
    <div className="flex w-full items-center gap-2 bg-content1/40 ">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
        <Image
          src={`/tokens/${reward.symbol}.svg`}
          alt={reward.symbol}
          fill
          sizes="28px"
        />
      </div>

      <div className="min-w-0 grow">
        <p className="truncate font-semibold text-default-800 dark:text-default-700">
          {reward.symbol}
        </p>
      </div>

      <div className="mr-2 text-right">
        {isReading ? (
          <Spinner size="sm" color="default" />
        ) : (
          <div>
            <p className="font-semibold">
              {amountNum.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </p>
            <p className="text-[10px] leading-[14px] text-default-700 dark:text-default-400">
              {dollar > 0
                ? `$${dollar.toLocaleString(undefined, {
                    maximumFractionDigits: 3,
                  })}`
                : "$0.000"}
            </p>
          </div>
        )}
      </div>

      <Button
        size="sm"
        className={clsx(
          "btn-mint h-[28px] w-[72px] rounded-md text-sm font-semibold"
        )}
        isLoading={false}
        isDisabled={!canClaim || isPending || isWaiting}
        onPress={onClaim}
        aria-busy={isPending || isWaiting}
      >
        Claim
      </Button>
    </div>
  );
}
