"use client";

import { useMemo, useEffect } from "react";
import { useQueries, UseQueryOptions, useQueryClient } from "@tanstack/react-query";

import { getMyCurrentUserReward } from "@/utils/wallet/getMyCurrentUserReward";
import { getMyTransactionData } from "@/utils/wallet/getMyTransactionData";
import { getMyReferralReward } from "@/utils/wallet/getMyReferralReward";
import { getMySwapReward } from "@/utils/wallet/getMySwapReward";
import { isAddress } from "viem";
import { buildUrl } from "@/utils/wallet/buildUrl";

type Address = `0x${string}`;

export type AccountWalletData = {
  transactions?: Awaited<ReturnType<typeof getMyTransactionData>>["Transactions"];
  currentUserReward?: Awaited<ReturnType<typeof getMyCurrentUserReward>>;
  swapRewards?: Awaited<ReturnType<typeof getMySwapReward>>["SwapRewards"];
  referralRewards?: Awaited<ReturnType<typeof getMyReferralReward>>["ReferralRewards"];
  isLoading: boolean;
  isError: boolean;
  refetchAll: () => void;
};

export function useAccountWalletData(address?: Address, blockHeight?: string | number, chainId?: number): AccountWalletData {
  const validAddress = address && isAddress(address);
  const enabled = Boolean(validAddress);
  const qc = useQueryClient();

  const baseKey = ["wallet", (address ?? "").toLowerCase(), chainId ?? "na", blockHeight ?? "na"];

  const results = useQueries({
    queries: [
      {
        queryKey: [...baseKey, "txs"],
        queryFn: () => getMyTransactionData(address as Address, blockHeight),
        enabled,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
      {
        queryKey: [...baseKey, "current-user-reward"],
        queryFn: () => getMyCurrentUserReward(address as Address),
        enabled,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
      {
        queryKey: [...baseKey, "swap-reward"],
        queryFn: () => getMySwapReward(address as Address, blockHeight),
        enabled,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
      {
        queryKey: [...baseKey, "referral-reward"],
        queryFn: () => getMyReferralReward(address as Address, blockHeight),
        enabled,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
    ],
  });

  console.log("[wallet] useAccountWalletData", { address, chainId, blockHeight, enabled }, "result", results); 


  useEffect(() => {
  console.debug("[wallet] enabled:", enabled, "address:", address, "chainId:", chainId, "blockHeight:", blockHeight);
  if (enabled) {
    console.debug("[wallet] URLs:",
      buildUrl("CurrentUserRewards", { address: address! }),
      buildUrl("Transactions", { address: address!, blockHeight }),
      buildUrl("SwapRewards", { address: address!, blockHeight }),
      buildUrl("ReferralRewards", { address: address!, blockHeight }),
    );
  }
}, [enabled, address, chainId, blockHeight]);


  // 주소/체인 바뀌면 보수적으로 invalidate (안전망)
  useEffect(() => {
    if (enabled) qc.invalidateQueries({ queryKey: ["wallet", (address ?? "").toLowerCase(), chainId ?? "na"] });
  }, [address, chainId, enabled, qc]);

  const [txQ, curQ, swapQ, refQ] = results;
  const isLoading = results.some((q) => q.isLoading);
  const isError = results.some((q) => q.isError);
  const refetchAll = () => results.forEach((q) => q.refetch());

  return useMemo(
    () => ({
      transactions: txQ.data?.Transactions,
      currentUserReward: curQ.data,
      swapRewards: swapQ.data?.SwapRewards,
      referralRewards: refQ.data?.ReferralRewards,
      isLoading,
      isError,
      refetchAll,
    }),
    [txQ.data, curQ.data, swapQ.data, refQ.data, isLoading, isError]
  );
}
export default useAccountWalletData;
