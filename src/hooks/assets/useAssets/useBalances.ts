import { ContractFunctionParameters, erc20Abi } from "viem";
import { useBalance as useNativeBalance, useReadContracts } from "wagmi";
import { useMemo } from "react";

import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

export default function useBalances(
  tokens: IToken[],
  chainId: number,
  address?: `0x${string}`,
  refreshKey?: string
) {
  // 1) 사용할 토큰만 추림 (주소 유효한 것)
  const availableTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          token.addresses &&
          token.addresses[chainId] &&
          BigInt(token.addresses[chainId]) > BigInt(0)
      ),
    [tokens, chainId]
  );

  // 2) wagmi 다중 읽기용 contracts 인자
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
    [availableTokens, chainId, address]
  );

  // 3) ERC-20 읽기
  const erc20Query = useReadContracts({
    contracts: balanceArgs,
    scopeKey: refreshKey,
  });

  // 4) 네이티브 토큰 탐색 (주소가 0인 항목)
  const nativeToken = useMemo(
    () =>
      tokens.find(
        (token) =>
          token.addresses &&
          token.addresses[chainId] &&
          BigInt(token.addresses[chainId]) === BigInt(0)
      ),
    [tokens, chainId]
  );

  // 5) 네이티브 잔고
  const nativeTokenBalance = useNativeBalance({
    chainId,
    address,
  });

  // 6) ERC-20 결과 → Map으로 파생 (상태 X)
  const erc20Map = useMemo(() => {
    const m = new Map<`0x${string}`, BigDecimal>();
    const data = erc20Query.data ?? [];
    for (let i = 0; i < data.length; i++) {
      const token = availableTokens[i];
      if (!token) continue;
      const raw = data[i]?.result as bigint | undefined;
      if (raw !== undefined) {
        m.set(
          token.addresses[chainId],
          new BigDecimal(raw, token.decimals ?? 18)
        );
      }
    }
    return m;
  }, [erc20Query.data, availableTokens, chainId]);

  // 7) 네이티브 결과를 병합한 최종 Map (상태 X)
  const balanceMap = useMemo(() => {
    if (!nativeToken || !nativeTokenBalance.data) return erc20Map;

    const merged = new Map(erc20Map);
    merged.set(
      nativeToken.addresses[chainId],
      new BigDecimal(
        nativeTokenBalance.data.value,
        nativeTokenBalance.data.decimals
      )
    );
    return merged;
  }, [erc20Map, nativeToken, nativeTokenBalance.data, chainId]);

  // 8) 두 쿼리 동시 refetch/상태 노출 합치기
  const queryWithNative = useMemo(() => {
    const refetchErc20 = (erc20Query as any)?.refetch;
    const refetchNative = (nativeTokenBalance as any)?.refetch;
    const isFetchingAny =
      Boolean((erc20Query as any)?.isFetching) ||
      Boolean((nativeTokenBalance as any)?.isFetching);

    const mergedRefetch = async () => {
      await Promise.all([
        typeof refetchErc20 === "function" ? refetchErc20() : Promise.resolve(),
        typeof refetchNative === "function"
          ? refetchNative()
          : Promise.resolve(),
      ]);
    };

    return {
      ...(erc20Query as any),
      refetch: mergedRefetch,
      isFetching: isFetchingAny,
    };
  }, [erc20Query, nativeTokenBalance]);

  // ✅ 상태 없이 파생값을 반환 → 불필요한 setState 제거, 루프 차단
  return { query: queryWithNative, balanceMap };
}

// import { ContractFunctionParameters, erc20Abi } from "viem";
// import { useBalance as useNativeBalance, useReadContracts } from "wagmi";
// import { useEffect, useMemo, useState } from "react";

// import { BigDecimal } from "@/types/BigDecimal";
// import { IToken } from "@/const/contracts/types/tokenTypes";

// export default function useBalances(
//   tokens: IToken[],
//   chainId: number,
//   address?: `0x${string}`,
// ) {
//   const availableTokens = useMemo(
//     () =>
//       tokens.filter(
//         (token) =>
//           token.addresses &&
//           token.addresses[chainId] &&
//           BigInt(token.addresses[chainId]) > BigInt(0),
//       ),
//     [tokens, chainId],
//   );

//   const balanceArgs: ContractFunctionParameters<
//     typeof erc20Abi,
//     "view",
//     "balanceOf"
//   >[] = useMemo(
//     () =>
//       !!address
//         ? availableTokens.map((token) => ({
//             abi: erc20Abi,
//             address: token.addresses[chainId],
//             functionName: "balanceOf",
//             args: [address],
//           }))
//         : [],
//     [availableTokens, chainId, address],
//   );
//   const [tokenAddrToBalanceMap, setTokenAddrToBalanceMap] = useState<
//     Map<`0x${string}`, BigDecimal>
//   >(new Map<`0x${string}`, BigDecimal>());
//   const query = useReadContracts({
//     contracts: balanceArgs,
//   });

//   useEffect(() => {
//     setTokenAddrToBalanceMap((prevMap) => {
//       const newMap = new Map(prevMap);

//       query.data?.forEach((item, index) => {
//         const token = availableTokens[index];
//         const balance = item.result;
//         const decimalBalance =
//           balance === undefined
//             ? undefined
//             : new BigDecimal(balance, token.decimals ?? 18);

//         if (!decimalBalance) {
//           newMap.delete(token.addresses[chainId]);
//         } else {
//           newMap.set(token.addresses[chainId], decimalBalance);
//         }
//       });

//       return newMap;
//     });
//   }, [query.data, availableTokens, chainId]);

//   const nativeToken = useMemo(
//     () =>
//       tokens.find(
//         (token) =>
//           token.addresses &&
//           token.addresses[chainId] &&
//           BigInt(token.addresses[chainId]) === BigInt(0),
//       ),
//     [tokens, chainId],
//   );
//   const nativeTokenBalance = useNativeBalance({
//     chainId,
//     address,
//   });

//   useEffect(() => {
//     if (nativeToken && nativeTokenBalance.data) {
//       setTokenAddrToBalanceMap((prevMap) => {
//         const newMap = new Map(prevMap);
//         const nativeBalance = new BigDecimal(
//           nativeTokenBalance.data.value,
//           nativeTokenBalance.data.decimals,
//         );

//         newMap.set(nativeToken.addresses[chainId], nativeBalance);

//         return newMap;
//       });
//     }
//   }, [nativeToken, nativeTokenBalance.data, chainId]);

//   const queryWithNative = useMemo(() => {
//   const refetchErc20   = (query as any)?.refetch;
//   const refetchNative  = (nativeTokenBalance as any)?.refetch;
//   const isFetchingAny  =
//     Boolean((query as any)?.isFetching) || Boolean((nativeTokenBalance as any)?.isFetching);

//   // refetch를 오버라이드해서 두 쿼리를 동시에 갱신
//   const mergedRefetch = async () => {
//     await Promise.all([
//       typeof refetchErc20  === "function" ? refetchErc20()  : Promise.resolve(),
//       typeof refetchNative === "function" ? refetchNative() : Promise.resolve(),
//     ]);
//   };

//   return {
//     ...(query as any),
//     refetch: mergedRefetch,
//     isFetching: isFetchingAny,
//   };
// }, [query, nativeTokenBalance]);

//   return { query: queryWithNative, balanceMap: tokenAddrToBalanceMap };
// }
