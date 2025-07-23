import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";

import {
  StopFarmingTransactionProps,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { Farm } from "@/types/FarmListTableRowProps";
import { birdieLpVaults_abi } from "@/const/abis";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { BigDecimal } from "@/types/BigDecimal";
import TransactionStatus from "@/types/TransactionStatus";
import getInsolvencyAmount from "@/utils/assets/getImpermanentInsolvency";

import useApprove from "./useApprove";
import { FarmTokenStatus } from "./FarmTokenStatus";
import useFarmPanelCommon from "./useFarmPanelCommon";
import useBalance from "./useBalance";
import useAllowance from "./useAllowance";

export default function useFarmStopPanelCommon(item: Farm) {
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

  const balance = useBalance(stakeToken);
  const [amount, setAmount] = useState<BigDecimal | null>(null);

  const { allowance, query: allowanceQuery } = useAllowance({
    token: stakeToken,
    spender: stakeToken,
  });
  const isApproved = useMemo(() => {
    return allowance.gt(amount ?? 0);
  }, [amount, allowance]);

  const isInsufficientBalance = useMemo(() => {
    return balance.lt(amount || 0);
  }, [balance, amount]);

  const isImpermanentInsolvency = useMemo(() => {
    // ADD IMPERMANENT INSOLVENCY CHECK
    const impermanentInsolvency = getInsolvencyAmount({
      contract: stakeToken,
      token: stakeToken,
      chainId,
    });

    if (!impermanentInsolvency) {
      return false;
    }

    return new BigDecimal(impermanentInsolvency).lt(amount || 0);
  }, [amount, chainId, stakeToken]);

  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    transactionContext,
    refetch: allowanceQuery.refetch,
    writeContract,
  });

  const stopFarming = useCallback(() => {
    if (!address) return;
    const transactionProps: TransactionStatusProps &
      StopFarmingTransactionProps = {
      transactionType: TransactionType.STOP_FARMING,
      chainId,
      input: {
        token: stakeToken,
        amount: amount || BigDecimal.ZERO(),
      },
      output: ("input" in stakeToken
        ? [stakeToken.input]
        : stakeToken.swap.input.map((v) => v.input)
      ).map((token) => ({
        token,
      })),
      address,
    };
    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: async () => {
        await Promise.all([assetsContext.refetchAll()]);
      },
    });

    writeContract(
      {
        address: stakeTokenAddress as `0x${string}`,
        abi: birdieLpVaults_abi,
        functionName: "withdraw",
        args: [
          parseUnits(amount?.toString() || "0", stakeToken.decimals || 18),
          address,
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
    client,
    transactionContext,
    writeContract,
    stakeToken,
    stakeTokenAddress,
    amount,
    address,
    chainId,
    assetsContext,
  ]);

  const isInvalid = useMemo(
    () => isImpermanentInsolvency || isInsufficientBalance,
    [isImpermanentInsolvency, isInsufficientBalance],
  );

  const isPending =
    allowanceQuery.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING;

  const isAmountEditable = !isApproved;

  const isStoppable = isApproved && !isInvalid && !!amount && amount.gt(0);

  const insolvency = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: stakeToken,
      chainId,
    });
  }, [chainId, stakeToken]);

  const setMaxAmount = useCallback(() => {
    setAmount(BigDecimal.min(balance || 0, insolvency));
  }, [balance, insolvency]);

  const tokenStatus: FarmTokenStatus = useMemo(() => {
    const ret: FarmTokenStatus = {
      index: 0,
      isActive: true,
      input: stakeToken,
      balance: balance ?? null,
      amount,
      isApproved,
      isImpermanentInsolvency,
      impermanentInsolvency: insolvency,
      isInsufficientBalance,
      isApprovable: isConnected && !isApproved,
      approve: () => approve(stakeToken),
    };

    return ret;
  }, [
    amount,
    approve,
    balance,
    insolvency,
    isApproved,
    isConnected,
    isImpermanentInsolvency,
    isInsufficientBalance,
    stakeToken,
  ]);

  return {
    isConnected,
    chainId,
    amount,
    setAmount,
    balance,
    isApproved,
    tokenStatus,
    stopFarming,
    isInsufficientBalance,
    isImpermanentInsolvency,
    isPending,
    isInvalid,
    isAmountEditable,
    isWrongNetwork,
    isStoppable,
    setMaxAmount,
  };
}
