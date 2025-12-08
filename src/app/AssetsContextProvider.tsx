"use client";

import { createContext, useMemo } from "react";

import useAssets from "@/hooks/assets/useAssets/useAssets";
import { useAssetValues } from "@/hooks/assets/useAssets/useAssetValues";
import useAccountBalances from "@/hooks/assets/useAssets/useAccountBalances";
import { BigDecimal } from "@/types/BigDecimal";
import { UserPoints } from "@/hooks/assets/useAssets/useAccountPoints";

export type FarmValues = {
  apyMap: Map<string, BigDecimal>;
  priceMap: Map<string, BigDecimal | null>;
  tvlMap: Map<string, BigDecimal | null>;
};

// 추가: SwapPointsDistributionSpeed 타입
export type SwapPointsDistributionSpeedMap = Record<string, number>;
// 값이 string 이면 number 대신 string | number 로

export type aprDataState = {
  response: boolean;
  result: boolean;
  apr: AprEntry[];
  SwapPointsDistributionSpeed?: SwapPointsDistributionSpeedMap; // ✅ 추가
};

export type AprEntry = {
  chainId: string;
  feeTier: string;
  contractAddress: string;
  name: string;
  underlyingProtocolText: string;
  underlyingProtocolUrl: string;
  vaults: AprVault[];
  staking?: StakeVault;
};

export type AprVault = {
  type?: string;
  notice?: string;
  name: string;
  underlyingProtocolText: string;
  underlyingProtocolUrl: string;
  singleVaultContract?: `0x${string}`;
  singleStrategyContract?: `0x${string}`;
  dualVaultContract?: `0x${string}`;
  dualStrategyContract?: `0x${string}`;
  apr1d: string;
  apr7d: string;
  apr30d: string;
  timeStamp: string;
  lastHarvest?: string;
};

export type StakeVault = {
  notice?: string;
  stakingToken: string;
  dailyPoint: string;
  contractAddress: `0x${string}`;
  extraRewards?: ExtraRewards[];
};

export type ExtraRewards = {
  symbol: string;
  name: string;
  indexNumber: number;
  displayName: string;
  contractAddress: `0x${string}`;
  decimals: number;
  dailyRewardPerTokenX18: string;
  priceUSD: number;
};

export const AssetsContext = createContext<{
  assetValues?: ReturnType<typeof useAssetValues>;
  balances?: ReturnType<typeof useAccountBalances>;
  farmValues?: FarmValues;
  aprDataState?: aprDataState | null;

  userPoints?: UserPoints | null; // 정확한 타입 있으면 교체
  isPointsLoading?: boolean;
  refetchPoints?: () => Promise<any> | void;

  forceRefresh: () => Promise<void>; // [수정] 추가
  refetchAll: () => Promise<void>;
  isFetching: boolean;
}>({
  forceRefresh: async () => {}, // [수정] 추가
  refetchAll: async () => {},
  isFetching: true,

  userPoints: undefined,
  isPointsLoading: true,
  refetchPoints: async () => {},
});

export default function AssetsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const assets = useAssets();
  // 수정: Context value를 useMemo로 감싸서 참조 안정화
  const value = useMemo(
    () => ({
      assetValues: assets.assetValues,
      balances: assets.balances,
      farmValues: assets.farmValues,
      aprDataState: assets.aprDataState,

      userPoints: assets.userPoints,
      isPointsLoading: assets.isPointsLoading,
      refetchPoints: assets.refetchPoints,

      refetchAll: assets.refetchAll,
      forceRefresh: assets.forceRefresh, // [수정] 추가
      isFetching: assets.isFetching,
    }),
    [
      assets.assetValues,
      assets.balances,
      assets.farmValues,
      assets.aprDataState,

      assets.userPoints,
      assets.isPointsLoading,
      assets.refetchPoints,

      assets.refetchAll,
      assets.forceRefresh,
      assets.isFetching,
    ]
  );

  return (
    <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
  );
}
