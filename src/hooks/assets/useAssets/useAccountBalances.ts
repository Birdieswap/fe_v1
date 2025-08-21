import { useChainId, useAccount } from "wagmi";
import { useMemo } from "react";

import lpVaults from "@/const/contracts/tokens/lpVaults";
import singleVaults from "@/const/contracts/tokens/singleVaults";
import tokens from "@/const/contracts/tokens/tokens";

import useBalances from "./useBalances";

/**
 * List of all tokens for which we should fetch the user's balances.
 */
const tokenList = Object.values(tokens);
const singleVaultsList = Object.values(singleVaults);
const lpVaultsList = Object.values(lpVaults);

export default function useAccountBalances() {
  const chainId = useChainId();
  const { address } = useAccount();
  const tokenBalances = useBalances(tokenList, chainId, address);
  const singleVaultBalances = useBalances(singleVaultsList, chainId, address);
  const lpVaultBalances = useBalances(lpVaultsList, chainId, address);

  return useMemo(
    () => ({
      tokenBalances,
      singleVaultBalances,
      lpVaultBalances,
      isFetching:
        tokenBalances.query.isFetching ||
        singleVaultBalances.query.isFetching ||
        lpVaultBalances.query.isFetching,
    }),
    [      
      tokenBalances.query.isFetching,
      singleVaultBalances.query.isFetching,
      lpVaultBalances.query.isFetching,
      tokenBalances,
      singleVaultBalances,
      lpVaultBalances,
    ],
  );
}

export type useAccountBalancesReturnType = ReturnType<
  typeof useAccountBalances
>;
