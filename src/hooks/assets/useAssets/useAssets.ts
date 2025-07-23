import { useCallback, useMemo } from "react";

import useAccountBalances from "./useAccountBalances";
import { useAssetValues } from "./useAssetValues";

export default function useAssets() {
  const assetValues = useAssetValues();
  const balances = useAccountBalances();
  const refetchAll = useCallback(async () => {
    await Promise.all([
      assetValues?.uniswapBaseTokenData?.refetch(),
      assetValues?.uniswapQuoteTokenData?.refetch(),
      assetValues?.chainLinkData?.refetch(),
      balances?.lpVaultBalances.query.refetch(),
      balances?.singleVaultBalances.query.refetch(),
      balances?.tokenBalances.query.refetch(),
    ]);
  }, [
    assetValues?.uniswapBaseTokenData,
    assetValues?.uniswapQuoteTokenData,
    assetValues?.chainLinkData,
    balances?.lpVaultBalances.query,
    balances?.singleVaultBalances.query,
    balances?.tokenBalances.query,
  ]);

  const assets = useMemo(
    () => ({
      assetValues,
      balances,
      refetchAll,
      isFetching: assetValues.isFetching || balances.isFetching,
    }),
    [assetValues, balances, refetchAll],
  );

  return assets;
}
