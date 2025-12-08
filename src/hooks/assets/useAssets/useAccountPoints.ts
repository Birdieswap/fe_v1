"use client";

import { useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAddress } from "viem";
import { getCurrentUserPoints } from "@/utils/assets/getCurrentUserPoints";

type Address = `0x${string}`;

export type CurrentUserPointsResponse = {
  response: boolean;
  result: boolean;
  chainId: string | number | null;
  totalPoints: string;
  totalPointsDetail?: {
    staking?: string;
    swapWithReferrals?: string;
    swapWithoutReferrals?: string;
    referrals?: string;
  };
  pointsDetail?: {
    staking?: Record<string, string>;
    swapWithReferrals?: Record<Address, string>;
    swapWithoutReferrals?: Record<Address, string>;
    referrals?: Record<Address, string>;
  };
};

export type UserPoints = {
  totalPoints: string;
  totalPointsDetail?: {
    staking?: string;
    swapWithReferrals?: string;
    swapWithoutReferrals?: string;
    referrals?: string;
  };
  staking: Record<string, string>;
  swapWithReferrals: Record<Address, string>;
  swapWithoutReferrals?: Record<Address, string>;
  referrals: Record<Address, string>;
};

function normalize(resp?: CurrentUserPointsResponse | null): UserPoints | null {
  if (!resp || !resp.response || !resp.result) return null;
  const detail = resp.pointsDetail ?? {};
  return {
    totalPoints: resp.totalPoints ?? "0",
    totalPointsDetail: {
      staking: resp.totalPointsDetail?.staking ?? "0",
      swapWithReferrals: resp.totalPointsDetail?.swapWithReferrals ?? "0",
      swapWithoutReferrals: resp.totalPointsDetail?.swapWithoutReferrals ?? "0",
      referrals: resp.totalPointsDetail?.referrals ?? "0",
    },
    staking: (detail.staking as Record<string, string>) ?? {},
    swapWithReferrals:
      (detail.swapWithReferrals as Record<Address, string>) ?? {},
    referrals: (detail.referrals as Record<Address, string>) ?? {},
  };
}

export function useAccountPoints(address?: Address | null) {
  const qc = useQueryClient();
  const enabled = !!address && isAddress(address);
  const queryKey = ["currentUserPoints", address];

  const query = useQuery({
    queryKey,
    enabled,
    queryFn: async () => getCurrentUserPoints(address as Address),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 5,
    retryDelay: 1000,
  });

  const refetch = () => qc.invalidateQueries({ queryKey });
  const data = useMemo(() => normalize(query.data ?? null), [query.data]);

  useEffect(() => {
    if (enabled) {
      qc.prefetchQuery({
        queryKey,
        queryFn: () => getCurrentUserPoints(address as Address),
      });
    }
  }, [enabled, address, qc]);

  return useMemo(
    () => ({
      data, // UserPoints | null
      isLoading: query.isLoading,
      isError: query.isError,
      refetch,
    }),
    [data, query.isLoading, query.isError]
  );
}

export default useAccountPoints;
