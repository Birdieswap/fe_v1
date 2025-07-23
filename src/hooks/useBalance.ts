import { useChainId } from "wagmi";
import { useContext, useMemo } from "react";

import { IToken } from "@/const/contracts/types/tokenTypes";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { BigDecimal } from "@/types/BigDecimal";

export default function useBalance(token?: IToken) {
  const { balances } = useContext(AssetsContext);
  const chainId = useChainId();
  const tokenAddress = getTokenAddress({
    token,
    chainId,
  });

  return useMemo(() => {
    if (
      !tokenAddress ||
      !(
        balances?.tokenBalances.balanceMap ||
        balances?.singleVaultBalances.balanceMap ||
        balances?.lpVaultBalances.balanceMap
      )
    )
      return BigDecimal.ZERO();

    return (
      balances.tokenBalances.balanceMap.get(tokenAddress) ??
      balances.singleVaultBalances.balanceMap.get(tokenAddress) ??
      balances.lpVaultBalances.balanceMap.get(tokenAddress) ??
      BigDecimal.ZERO()
    );
  }, [
    balances?.lpVaultBalances.balanceMap,
    balances?.singleVaultBalances.balanceMap,
    balances?.tokenBalances.balanceMap,
    tokenAddress,
  ]);
}
