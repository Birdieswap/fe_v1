import { ContractFunctionParameters, erc20Abi } from "viem";
import { useBalance as useNativeBalance, useReadContracts } from "wagmi";
import { useEffect, useMemo, useState } from "react";

import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

export default function useBalances(
  tokens: IToken[],
  chainId: number,
  address?: `0x${string}`,
) {
  const availableTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          token.addresses &&
          token.addresses[chainId] &&
          BigInt(token.addresses[chainId]) > BigInt(0),
      ),
    [tokens, chainId],
  );

  const balanceArgs: ContractFunctionParameters<
    typeof erc20Abi,
    "view",
    "balanceOf"
  >[] = useMemo(
    () =>
      !!address
        ? availableTokens.map((token) => ({
            abi: erc20Abi,
            address: token.addresses[chainId],
            functionName: "balanceOf",
            args: [address],
          }))
        : [],
    [availableTokens, chainId, address],
  );
  const [tokenAddrToBalanceMap, setTokenAddrToBalanceMap] = useState<
    Map<`0x${string}`, BigDecimal>
  >(new Map<`0x${string}`, BigDecimal>());
  const query = useReadContracts({
    contracts: balanceArgs,
  });

  useEffect(() => {
    setTokenAddrToBalanceMap((prevMap) => {
      const newMap = new Map(prevMap);

      query.data?.forEach((item, index) => {
        const token = availableTokens[index];
        const balance = item.result;
        const decimalBalance =
          balance === undefined
            ? undefined
            : new BigDecimal(balance, token.decimals ?? 18);

        if (!decimalBalance) {
          newMap.delete(token.addresses[chainId]);
        } else {
          newMap.set(token.addresses[chainId], decimalBalance);
        }
      });

      return newMap;
    });
  }, [query.data, availableTokens, chainId]);
  const nativeToken = useMemo(
    () =>
      tokens.find(
        (token) =>
          token.addresses &&
          token.addresses[chainId] &&
          BigInt(token.addresses[chainId]) === BigInt(0),
      ),
    [tokens, chainId],
  );
  const nativeTokenBalance = useNativeBalance({
    chainId,
    address,
  });

  useEffect(() => {
    if (nativeToken && nativeTokenBalance.data) {
      setTokenAddrToBalanceMap((prevMap) => {
        const newMap = new Map(prevMap);
        const nativeBalance = new BigDecimal(
          nativeTokenBalance.data.value,
          nativeTokenBalance.data.decimals,
        );

        newMap.set(nativeToken.addresses[chainId], nativeBalance);

        return newMap;
      });
    }
  }, [nativeToken, nativeTokenBalance.data, chainId]);

  return { query, balanceMap: tokenAddrToBalanceMap };
}
