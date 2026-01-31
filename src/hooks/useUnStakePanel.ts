"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { parseUnits, formatUnits, Abi } from "viem";
import { readContract } from "viem/actions";

import { BigDecimal } from "@/types/BigDecimal";
import type { IToken } from "@/const/contracts/types/tokenTypes";
import type { StakeTokenStatus } from "./farm/StakeTokenStatus";
import { makeTokenStatus } from "@/utils/farm/makeTokenStatus";

import useFarmPanelCommon from "./useFarmPanelCommon";
import { AssetsContext } from "@/app/AssetsContextProvider";

import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";

import {
  TransactionStatusProps,
  stakeTransactionProps,
} from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import TransactionStatus from "@/types/TransactionStatus";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";

type UnstakePanelState = {
  amount: BigDecimal | null;
  setAmount: (v: BigDecimal) => void;
  setMaxAmount: () => void;

  isConnected: boolean;
  isWrongNetwork: boolean;
  isPending: boolean;     // 전체 PENDING 집계
  isExecutable: boolean;  // 버튼 활성화 조건
  isInsolvency?: boolean;

  token?: IToken;                 // 표시용(언스테이킹 대상 토큰)
  tokenStatuses: StakeTokenStatus[]; // ExecuteButtons 용 (항상 승인됨)

  execute: () => void; // alias: unstaking()
  unstaking: () => void;
};

export default function useUnStakePanel(item: any): UnstakePanelState {
  const {
    client,                 // (note) 여기엔 readContract 메서드가 없을 수 있음 → viem/actions 사용
    transactionContext,
    writeContract,
    isPendingWriteContract,
    address,
    isConnected,
    chainId,
    isWrongNetwork,
    assetsContext,
    stakeToken,
    stakeTokenAddress,
  } = useFarmPanelCommon(item);

  // 표시 토큰 (LP)
  const token: IToken | undefined = item?.wip_stakeToken as IToken | undefined;

  // ---- stakingInfo (stakingAddress 획득) ----
  const assetsTotal = useContext(AssetsContext);
  const stakingAddress = useMemo(() => {
    const aprList =
      (assetsTotal as any)?.aprDataState?.apr as
        | Array<{
            contractAddress?: `0x${string}`;
            staking?: { contractAddress?: `0x${string}` };
          }>
        | undefined;
    if (!aprList || !stakeTokenAddress) return undefined;
    const found = aprList.find(
      (x) =>
        x?.contractAddress &&
        x.contractAddress.toLowerCase() === stakeTokenAddress.toLowerCase()
    );
    return found?.staking?.contractAddress as `0x${string}` | undefined;
  }, [assetsTotal, stakeTokenAddress]);

  // ---- stakedBalance: readContract(balanceOf(address)) ----
  const [stakedBalance, setStakedBalance] = useState<BigDecimal>(BigDecimal.ZERO());
  const [isFetchingBalance, setIsFetchingBalance] = useState<boolean>(false);

  const refetchStakedBalance = useCallback(async () => {
    // 안전 가드
    if (!client || !stakingAddress || !address || !stakeToken) return;
    try {
      setIsFetchingBalance(true);
      // ★ viem/actions 방식: 함수에 client를 첫 번째 인자로 넘긴다
      const raw = (await readContract(client as any, {
        address: stakingAddress,
        abi: birdieswap_staking_abi as Abi,
        functionName: "balanceOf",
        args: [address] as const,
      })) as bigint;

      const dec = (stakeToken as any).decimals ?? 18;
      const human = formatUnits(raw, dec);
      setStakedBalance(new BigDecimal(human));
    } catch (e) {
      console.error("[useUnStakePanel] balanceOf read failed:", e);
      setStakedBalance(BigDecimal.ZERO());
    } finally {
      setIsFetchingBalance(false);
    }
  }, [client, stakingAddress, address, stakeToken]);

  useEffect(() => {
    // 최상단 await 금지 → 비동기 함수 호출만
    void refetchStakedBalance();
  }, [refetchStakedBalance]);

  // 입력값
  const [amount, setAmount] = useState<BigDecimal | null>(null);

  // 잔액/부족 여부
  const isInsufficientBalance = stakedBalance.lt(amount || 0);


  const tokenStatuses: StakeTokenStatus[] = useMemo(() => {
    return token
      ? [
          makeTokenStatus(token, {
            balance: stakedBalance,
            amount,
            isApproved: true,            // 항상 승인됨
            isInsufficientBalance,
            isApprovable: false,
            approve: undefined,
          }),
        ]
      : [];
  }, [token, stakedBalance, amount, isInsufficientBalance]);

  // ---- MAX ----
  const setMaxAmount = useCallback(() => {
    setAmount(stakedBalance ?? BigDecimal.ZERO());
  }, [stakedBalance]);

  // ---- unstaking() (withdraw(uint256 amount)) ----
  const unstaking = useCallback(() => {
    if (!address || !stakingAddress || !stakeToken) return;

    const transactionProps: TransactionStatusProps & stakeTransactionProps = {
      chainId,
      transactionType:
        (TransactionType as any).UNSTAKING ?? TransactionType.STAKING, // enum에 없으면 STAKING fallback
      input: {
        token: stakeToken as any,
        amount: amount ?? undefined,
      },
      address,
    };

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: async () => {
        await Promise.all([
          refetchStakedBalance(),           // 내 스테이킹 잔액 다시 읽기
          assetsContext?.refetchAll?.(),    // 자산 전반 새로고침
        ]);
      },
      afterReceipt: assetsContext?.forceRefresh,
    });

    const parsed = parseUnits(
      (amount ?? BigDecimal.ZERO()).toString(),
      (stakeToken as any).decimals ?? 18
    );

    // NOTE: ABI가 withdraw(address token, uint256 amount)라면 args: [tokenAddr, parsed]
    writeContract(
      {
        address: stakingAddress,
        abi: birdieswap_staking_abi,
        functionName: "withdraw",
        args: [parsed] as const,
      },
      {
        onError: handlers.onError,
        onSuccess: async (v) => {
          handlers.onSuccess(v);
          setAmount(BigDecimal.ZERO());
        },
      }
    );
  }, [
    address,
    chainId,
    stakingAddress,
    stakeToken,
    amount,
    client,
    transactionContext,
    writeContract,
    assetsContext,
    refetchStakedBalance,
  ]);

  // ---- 버튼 활성화·로딩 상태 ----
  const primary = tokenStatuses[0];
  const isExecutable = Boolean(
    !!primary &&
      !!primary.amount &&
      primary.amount.gt(0) &&
      !primary.isInsufficientBalance &&
      !isWrongNetwork
  );

  const isPendingAggregated =
    isFetchingBalance ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING;

  return {
    amount,
    setAmount,
    setMaxAmount,

    // actions
    unstaking,
    execute: unstaking, // ExecuteButtons 호환

    // state
    isConnected,
    isWrongNetwork,
    isPending: isPendingAggregated,
    isExecutable,

    token,
    tokenStatuses,
  };
}
