"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useReadContracts } from "wagmi";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import { BigDecimal } from "@/types/BigDecimal";
import type { ContractFunctionParameters } from "viem";

type Address = `0x${string}`;

export type StakedToken = {
  fullName: string;
  inputTokenAddress: Address;
  stakingPoolAddress: Address;
  decimals: number;
  abi: typeof birdieswap_staking_abi;
  iconSrc: string;
};

export type StakedBalanceEntry = {
  token: StakedToken;
  value: BigDecimal;
};

export default function useStakedBalances(params: {
  aprList: any[];                   // ← 주입
  address?: Address;                // ← 주입(상위 useAccount에서)
}) {
  const { aprList, address } = params;

  const availableTokens: StakedToken[] = useMemo(() => {
    return (Array.isArray(aprList) ? aprList : [])
      .filter((e) => {
        const addr = e?.staking?.contractAddress ?? "";
        return !!addr && /^0x[0-9a-fA-F]{40}$/.test(addr);
      })
      .map((e) => {
        const inputAddr = (e?.contractAddress ?? "").toLowerCase() as Address;
        const poolAddr  = (e?.staking?.contractAddress ?? "").toLowerCase() as Address;
        const stakingTokenSymbol = e?.staking?.stakingToken ?? e?.symbol ?? "BLP";
        return {
          fullName: `Staked ${stakingTokenSymbol}`,
          inputTokenAddress: inputAddr,
          stakingPoolAddress: poolAddr,
          decimals: 8,
          abi: birdieswap_staking_abi,
          iconSrc: "tokens/sblp-token.svg",
        } as StakedToken;
      });
  }, [aprList]);

  const balanceArgs: ContractFunctionParameters<
    typeof birdieswap_staking_abi,
    "view",
    "balanceOf"
  >[] = useMemo(() => {
    if (!address) return [];
    return availableTokens.map((t) => ({
      abi: t.abi,
      address: t.stakingPoolAddress,
      functionName: "balanceOf",
      args: [address],
    }));
  }, [availableTokens, address]);

  const query = useReadContracts({ contracts: balanceArgs });

  const entries: StakedBalanceEntry[] = useMemo(() => {
    const data = query.data ?? [];
    const out: StakedBalanceEntry[] = [];
    for (let i = 0; i < data.length; i++) {
      const token = availableTokens[i];
      if (!token) continue;
      const raw = data[i]?.result as bigint | undefined;
      const value = new BigDecimal(raw ?? BigInt(0), token.decimals);
      out.push({ token, value });
    }
    return out;
  }, [query.data, availableTokens]);

  const byInputTokenAddress = useMemo(() => {
    const m = new Map<Address, StakedBalanceEntry>();
    for (const e of entries) m.set(e.token.inputTokenAddress, e);
    return m;
  }, [entries]);

  const byStakingPoolAddress = useMemo(() => {
    const m = new Map<Address, StakedBalanceEntry>();
    for (const e of entries) m.set(e.token.stakingPoolAddress, e);
    return m;
  }, [entries]);

  return {
    query,
    entries,
    byInputTokenAddress,
    byStakingPoolAddress,
  };
}