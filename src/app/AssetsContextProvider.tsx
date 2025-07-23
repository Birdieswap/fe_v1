"use client";

import { createContext } from "react";

import useAssets from "@/hooks/assets/useAssets/useAssets";
import { useAssetValues } from "@/hooks/assets/useAssets/useAssetValues";
import useAccountBalances from "@/hooks/assets/useAssets/useAccountBalances";

export const AssetsContext = createContext<{
  assetValues?: ReturnType<typeof useAssetValues>;
  balances?: ReturnType<typeof useAccountBalances>;
  refetchAll: () => Promise<void>;
  isFetching: boolean;
}>({
  refetchAll: async () => {},
  isFetching: true,
});

export default function AssetsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const assets = useAssets();

  return (
    <AssetsContext.Provider value={assets}>{children}</AssetsContext.Provider>
  );
}
