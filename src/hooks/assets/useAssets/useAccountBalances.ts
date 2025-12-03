import { useChainId, useAccount } from "wagmi";
import { useMemo } from "react";

import lpVaults from "@/const/contracts/tokens/lpVaults";
import singleVaults from "@/const/contracts/tokens/singleVaults";
import tokens from "@/const/contracts/tokens/tokens";
import useBalances from "./useBalances";
import useStakedBalances from "./useStakedBalances";
import { externalTokens } from "@/const/contracts/tokens/externalTokens";

type AprLike = {
  contractAddress?: `0x${string}` | string;
  staking?: { contractAddress?: `0x${string}` | string; stakingToken?: string };
  symbol?: string;
};

export type UseAccountBalancesReturnType = ReturnType<
  typeof useAccountBalances
>;

/**
 * balances 훅: wallet(single/lp) + staked 까지 모두 여기서 책임
 * @param aprList  /apr에서 파싱된 리스트(필요한 필드만)
 */

export default function useAccountBalances(aprList?: AprLike[]) {
  const chainId = useChainId();
  const { address } = useAccount();
  // 지갑 보유
  //const tokenList = useMemo(() => Object.values(tokens), []);
  const tokenList = useMemo(() => {
    const list = [...Object.values(tokens), ...Object.values(externalTokens)];

    const seen = new Set<string>();
    return list.filter((t: any) => {
      const addr = (t.address ?? t.contractAddress ?? "").toLowerCase();
      if (!addr) return true; // 주소 없는 토큰은 일단 통과(원하면 제외)
      if (seen.has(addr)) return false;
      seen.add(addr);
      return true;
    });
  }, []);

  const singleVaultList = useMemo(() => Object.values(singleVaults), []);
  const lpVaultList = useMemo(() => Object.values(lpVaults), []);

  const tokenBalances = useBalances(tokenList, chainId, address);
  const singleVaultBalances = useBalances(singleVaultList, chainId, address);
  const lpVaultBalances = useBalances(lpVaultList, chainId, address);

  // 스테이킹 잔고 (여기는 aprKey 최적화가 useStakedBalances 안에 있음)
  const stakedBalances = useStakedBalances({
    aprList: aprList ?? [],
    address: address as `0x${string}` | undefined,
  });

  // 통합 isFetching / refetch
  const isFetching =
    tokenBalances.query.isFetching ||
    singleVaultBalances.query.isFetching ||
    lpVaultBalances.query.isFetching ||
    Boolean(stakedBalances.query?.isFetching);

  const refetch = async () => {
    const calls: Array<Promise<any>> = [];
    calls.push(tokenBalances.query.refetch?.() ?? Promise.resolve());
    calls.push(singleVaultBalances.query.refetch?.() ?? Promise.resolve());
    calls.push(lpVaultBalances.query.refetch?.() ?? Promise.resolve());
    if (stakedBalances.query?.refetch)
      calls.push(stakedBalances.query.refetch());
    await Promise.all(calls);
  };

  return useMemo(
    () => ({
      tokenBalances,
      singleVaultBalances,
      lpVaultBalances,

      // 💡 이제 여기서 stakedBalances를 표준 노출
      stakedBalances,

      isFetching,
      query: { isFetching, refetch },
    }),
    [
      tokenBalances,
      singleVaultBalances,
      lpVaultBalances,
      stakedBalances,
      isFetching,
    ]
  );
}
