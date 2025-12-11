"use client";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { useContext, useMemo } from "react";
import { AssetsContext, AprEntry } from "@/app/AssetsContextProvider";

import type { Farm } from "@/types/FarmListTableRowProps";
import type { BigDecimal } from "@/types/BigDecimal";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";

type Address = `0x${string}`;

export function useRewardInfo(item: Farm, priceBD?: BigDecimal | null) {
  const chainId = useChainId();
  const { address } = useAccount();
  const { aprDataState, userPoints } = useContext(AssetsContext);

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

  const aprList: AprEntry[] = (aprDataState as any)?.apr ?? [];
  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chainId === chainIdStr &&
          (e.contractAddress ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddrLower]
  );

  const dprRaw = matched?.staking?.dailyPoint as string | number | undefined;

  const dailyPointNum =
    Number(
      typeof dprRaw === "string" || typeof dprRaw === "number" ? dprRaw : 0
    ) * 365;
  const extraList = (matched?.staking?.extraRewards ?? []) as any[];

  // --- 1) userPoints 기반 유저 스테이킹 여부 ---
  const userStakePoint = useMemo(() => {
    const raw =
      userPoints?.staking?.[stakeAddrLower] ??
      userPoints?.staking?.[stakeAddr ?? ""] ??
      0;

    if (typeof raw === "bigint") return Number(raw);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [userPoints, stakeAddrLower, stakeAddr]);

  const hasUserStakePoint = userStakePoint > 0;

  // --- 2) earned(0,1,2) 합산해서 > 0인지 ---
  const REWARD_INDEXES = [0, 1, 2] as const;

  const { data: earnedResults } = useReadContracts({
    contracts: REWARD_INDEXES.map((idx) => ({
      address: stakeAddr as Address,
      abi: birdieswap_staking_abi,
      functionName: "earned",
      args: [address as Address, BigInt(idx)],
    })),
    allowFailure: true, // 리버트나도 전체 실패 안나고 개별 status로 떨어지게
    query: {
      enabled: Boolean(address && stakeAddr),
      refetchOnWindowFocus: false,
    },
  });

  type EarnedResult = {
    status: "success" | "failure";
    result?: bigint | null;
  };

  const totalEarned = useMemo(() => {
    // 👇 wagmi가 준 복잡한 타입을 여기서 한 번 단순화해서 받는다
    const results = earnedResults as EarnedResult[] | undefined;

    if (!results) return 0n;

    let sum = 0n;

    for (const res of results) {
      // wagmi v2: { status: "success" | "failure", result?: any, error?: Error }
      if (res.status !== "success" || res.result == null) continue;
      sum += res.result;
    }

    return sum;
  }, [earnedResults]);

  const hasEarned = totalEarned > 0n;

  const showStakingBlock =
    (Boolean(matched?.staking?.contractAddress) &&
      Array.isArray(extraList) &&
      extraList.length > 0) ||
    (Number.isFinite(dailyPointNum) && dailyPointNum > 0);

  return {
    price,
    matched,
    dailyPointNum,
    extraList,
    showStakingBlock,
    hasEarned,
    hasUserStakePoint,
  };
}
