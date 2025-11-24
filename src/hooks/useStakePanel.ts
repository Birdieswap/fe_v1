"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BigDecimal } from "@/types/BigDecimal";
import type {
  IStakingProvider,
  IToken,
} from "@/const/contracts/types/tokenTypes";
import { makeTokenStatus } from "@/utils/farm/makeTokenStatus";
import type { StakeTokenStatus } from "./farm/StakeTokenStatus";
import useFarmPanelCommon from "./useFarmPanelCommon";
import useAllowance from "./useAllowance";
import useApprove from "./useApprove";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import {
  TransactionStatusProps,
  stakeTransactionProps,
} from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { parseUnits } from "viem";
import { EProvider } from "@/const/contracts/types/tokenTypes";
import TransactionStatus from "@/types/TransactionStatus";

type StakePanelState = {
  amount: BigDecimal | null;
  setAmount: (v: BigDecimal) => void;
  setMaxAmount: () => void;

  isConnected: boolean;
  isWrongNetwork: boolean;
  isPending: boolean; // 전체 PENDING 집계 (allowance fetch / tx / approve)
  isExecutable: boolean; // 버튼 활성화 조건

  token?: IToken; // 입력창 표시에 사용할 스테이킹 토큰 (LP)
  tokenStatuses: StakeTokenStatus[]; // ExecuteButtons 용 (승인 필요 시 포함)

  execute: () => void; // alias: staking()
  staking: () => void;
  approve: (token: any) => Promise<void> | void;
};

export default function useStakePanel(item: any): StakePanelState {
  const {
    client,
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

  const assetsTotal = useContext(AssetsContext);
  const balanceMap: Map<`0x${string}`, any> = useMemo(() => {
    const balances = assetsTotal?.balances as any;
    return (
      balances?.lpVaultBalances?.balanceMap || balances?.balanceMap || new Map()
    );
  }, [assetsTotal]);

  const getBal = (addr?: `0x${string}` | string | null) => {
    if (!addr) return null;
    const lower = (addr as string).toLowerCase() as `0x${string}`;
    return (
      balanceMap.get(lower) ?? balanceMap.get(addr as `0x${string}`) ?? null
    );
  };
  const token: IToken | undefined = item?.wip_stakeToken as IToken;
  const lpBalance: BigDecimal = getBal(stakeTokenAddress);
  const [amount, setAmount] = useState<BigDecimal | null>(lpBalance);
  // const [isPending, setIsPending] = useState(false);
  useEffect(() => {
    if (lpBalance != null) setAmount(lpBalance);
  }, [lpBalance]);

  const stakingInfo = useMemo(() => {
    // total.aprDataState.apr 배열에서 contractAddress === stakeTokenAddress
    const aprList = (assetsTotal as any)?.aprDataState?.apr as
      | Array<{ contractAddress?: `0x${string}`; staking?: any }>
      | undefined;
    if (!aprList || !stakeTokenAddress) return undefined;
    const found = aprList.find(
      (x) =>
        x?.contractAddress &&
        x.contractAddress.toLowerCase() === stakeTokenAddress.toLowerCase()
    );
    return found?.staking;
  }, [assetsTotal, stakeTokenAddress]);

  const stakingAddress = stakingInfo?.contractAddress as
    | `0x${string}`
    | undefined;

  const STAKING_PROVIDER = useMemo(
    () =>
      stakingAddress
        ? {
            name: "Birdieswap Staking",
            provider: EProvider.BIRDIESWAP, // 필요 없다면 생략
            addresses: { [chainId]: stakingAddress },
            abi: birdieswap_staking_abi,
          }
        : undefined,
    [stakingAddress, chainId]
  );

  const { allowance, query: allowanceQuery } = useAllowance({
    token: stakeToken,
    spender: STAKING_PROVIDER as IStakingProvider,
  });

  const isApproved = useMemo<boolean>(() => {
    const amt = amount || BigDecimal.ZERO();
    return allowance.gte(amt);
  }, [allowance, amount]);

  // console.log("useStakePanel",stakingInfo, stakeToken, stakeTokenAddress, stakingAddress, allowance)

  // Approve 훅 (refetch 추가)
  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: stakingAddress as `0x${string}`,
    transactionContext,
    refetch: () =>
      Promise.all([allowanceQuery.refetch(), assetsContext.refetchAll?.()]),
    writeContract,
  });

  const isInsufficientBalance = lpBalance?.lt(amount || 0) ?? false;
  const [isApprovePending, setIsApprovePending] = useState(false);

  const approveWithPending = useCallback(
    async (token: any) => {
      setIsApprovePending(true);
      try {
        await approve(token); // useApprove가 Promise를 반환하지 않는다면 그대로 호출만 해도 OK
      } finally {
        setIsApprovePending(false); // 성공/실패 모두 off
      }
    },
    [approve]
  );

  const tokenStatuses: StakeTokenStatus[] = useMemo(() => {
    return token
      ? [
          makeTokenStatus(token, {
            balance: lpBalance,
            amount,
            isApproved,
            isInsufficientBalance,
            isApprovable: isConnected && !isApproved && !isApprovePending,
            approve: () => approveWithPending(stakeToken as any),
          }),
        ]
      : [];
  }, [
    token,
    lpBalance,
    amount,
    isApproved,
    isInsufficientBalance,
    isConnected,
    isApprovePending,
    approveWithPending,
    stakeToken,
  ]);

  const setMaxAmount = useCallback(() => {
    setAmount(lpBalance ?? BigDecimal.ZERO());
  }, [lpBalance]);

  const staking = useCallback(() => {
    if (!address) return;

    const transactionProps: TransactionStatusProps & stakeTransactionProps = {
      chainId,
      transactionType: TransactionType.STAKING,
      input: { token: stakeToken as IToken, amount: amount ?? undefined },
      address,
    };

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: async () => {
        await Promise.all([
          allowanceQuery.refetch(),
          assetsContext.refetchAll(),
        ]);
      },
    });

    const parsed = parseUnits(
      (amount ?? BigDecimal.ZERO()).toString(),
      (stakeToken as any).decimals
    );

    writeContract(
      {
        address: stakingAddress as `0x${string}`,
        abi: birdieswap_staking_abi,
        functionName: "deposit", // ← 기존 단일 예시. 실제 함수명과 시그니처에 맞게 조정.
        args: [parsed] as any,
      },
      {
        onError: handlers.onError,
        onSuccess: async (v) => {
          handlers.onSuccess(v);
          setAmount(BigDecimal.ZERO());
          try {
            await assetsContext.forceRefresh?.();
          } catch (e) {
            console.error("forceRefresh failed", e);
          }
        },
      }
    );
  }, [
    address,
    chainId,
    amount,
    stakeToken,
    client,
    transactionContext,
    writeContract,
    allowanceQuery,
    assetsContext,
  ]);

  const primaryStatus = tokenStatuses[0]; // 단일 입력만 사용
  const isExecutable = Boolean(
    !!primaryStatus &&
      !!primaryStatus.amount &&
      primaryStatus.amount.gt(0) &&
      primaryStatus.isApproved &&
      !primaryStatus.isInsufficientBalance &&
      !isWrongNetwork
  );

  const isPendingAggregated =
    allowanceQuery.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING ||
    isApprovePending;
  return {
    amount,
    setAmount,
    setMaxAmount,

    // actions
    staking,
    execute: staking, // ExecuteButtons 호환
    approve,

    // state
    isConnected,
    isWrongNetwork,
    isPending: isPendingAggregated,
    isExecutable,

    token,
    tokenStatuses,
  };
}
