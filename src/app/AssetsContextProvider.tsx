"use client";

import { createContext, useMemo } from "react";

import useAssets from "@/hooks/assets/useAssets/useAssets";
import { useAssetValues } from "@/hooks/assets/useAssets/useAssetValues";
import useAccountBalances from "@/hooks/assets/useAssets/useAccountBalances";
import { BigDecimal } from "@/types/BigDecimal";
import { Farm } from "@/types/FarmListTableRowProps";

export type FarmValues = {
  apyMap: Map<string, BigDecimal>;
  priceMap: Map<string, BigDecimal | null>;
  tvlMap: Map<string, BigDecimal | null>;
};

export type aprDataState = {
  response: boolean;
  result: boolean;
  apr: AprEntry[];
};

export type AprEntry = {
  chainId: string;
  feeTier: string;
  contractAddress: string;
  name: string;
  underlyingProtocolText: string;
  underlyingProtocolUrl: string;
  vaults: AprVault[];
  extraRewards?: AprVault[];
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

export const AssetsContext = createContext<{
  assetValues?: ReturnType<typeof useAssetValues>;
  balances?: ReturnType<typeof useAccountBalances>;
  farmValues?: FarmValues;
  aprDataState?: aprDataState;
  forceRefresh: () => Promise<void>; // [수정] 추가
  refetchAll: () => Promise<void>;
  isFetching: boolean;
}>({
  forceRefresh: async () => {}, // [수정] 추가
  refetchAll: async () => {},
  isFetching: true,
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
      refetchAll: assets.refetchAll,
      forceRefresh: assets.forceRefresh, // [수정] 추가
      isFetching: assets.isFetching,
    }),
    [
      assets.assetValues,
      assets.balances,
      assets.farmValues,
      assets.aprDataState,
      assets.refetchAll,
      assets.forceRefresh,
      assets.isFetching,
    ]
  );

  return (
    <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
  );
}
