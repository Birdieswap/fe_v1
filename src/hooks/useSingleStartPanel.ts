import { useCallback, useState, useMemo } from "react";
import { parseUnits } from "viem";

import { FarmSingle } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import TransactionStatus from "@/types/TransactionStatus";
import { birdieSingleVaults_abi } from "@/const/abis";
import {
  TransactionStatusProps,
  StartFarmingTransactionProps,
} from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import getInsolvencyAmount from "@/utils/assets/getImpermanentInsolvency";

import useFarmPanelCommon from "./useFarmPanelCommon";
import useApprove from "./useApprove";
import { FarmStartTokenStatus } from "./FarmTokenStatus";
import useBalance from "./useBalance";
import useAllowance from "./useAllowance";

export function useSingleStartPanel(item: FarmSingle) {
  const {
    client,
    transactionContext,
    writeContract,
    isPendingWriteContract,
    address,
    isConnected,
    isWrongNetwork,
    assetsContext,
    chainId,
    stakeToken,
    stakeTokenAddress,
  } = useFarmPanelCommon(item);

  const inputToken = stakeToken.input;
  const insolvency = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: inputToken,
      chainId,
    });
  }, [stakeToken, inputToken, chainId]);
  const balance = useBalance(inputToken);
  const [amount, setAmount] = useState<BigDecimal | null>(null);

  const { allowance, query: allowanceQuery } = useAllowance({
    token: inputToken,
    spender: stakeToken,
  });
  const isApproved = useMemo(() => {
    return allowance.gt(amount ?? 0);
  }, [amount, allowance]);

  const isInsufficientBalance = useMemo(() => {
    return balance.lt(amount || 0);
  }, [balance, amount]);

  const isImpermanentInsolvency = insolvency.lt(amount || 0);

  const setMaxAmount = useCallback(() => {
    setAmount(BigDecimal.min(balance, insolvency));
  }, [balance, insolvency]);

  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    transactionContext,
    refetch: allowanceQuery.refetch,
    writeContract,
  });

  const tokenStatus: FarmStartTokenStatus = useMemo(
    () => ({
      index: 0,
      input: inputToken,
      balance,
      amount,
      isApproved,
      isActive: true,
      isImpermanentInsolvency,
      isInsufficientBalance,
      isApprovable: isConnected && !isApproved,
      approve: () => approve(inputToken),
    }),
    [
      amount,
      approve,
      balance,
      inputToken,
      isApproved,
      isConnected,
      isImpermanentInsolvency,
      isInsufficientBalance,
    ],
  );

  const startFarming = useCallback(() => {
    if (!address) return;
    const transactionProps: TransactionStatusProps &
      StartFarmingTransactionProps = {
      chainId,
      transactionType: TransactionType.START_FARMING,
      input: [
        {
          token: inputToken,
          amount: amount ?? undefined,
        },
      ],
      output: {
        token: stakeToken,
      },
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

    writeContract(
      {
        address: stakeTokenAddress as `0x${string}`,
        abi: birdieSingleVaults_abi,
        functionName: "deposit",
        args: [
          parseUnits(amount?.toString() || "0", inputToken.decimals),
          address,
        ],
      },
      {
        onError: handlers.onError,
        onSuccess: async (v) => {
          handlers.onSuccess(v);
          setAmount(BigDecimal.ZERO());
        },
      },
    );
  }, [
    chainId,
    inputToken,
    amount,
    stakeToken,
    address,
    client,
    transactionContext,
    writeContract,
    stakeTokenAddress,
    allowanceQuery,
    assetsContext,
  ]);

  const isPending =
    allowanceQuery.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING;

  const isStartable = useMemo(
    () =>
      isApproved &&
      !isImpermanentInsolvency &&
      !isInsufficientBalance &&
      !!amount &&
      amount.gt(0),
    [amount, isApproved, isImpermanentInsolvency, isInsufficientBalance],
  );

  return {
    setAmount,
    setMaxAmount,
    tokenStatus,
    isPending,
    isConnected,
    isWrongNetwork,
    startFarming,
    isStartable,
  };
}

export type UseSingleStartPanelReturn = ReturnType<typeof useSingleStartPanel>;
