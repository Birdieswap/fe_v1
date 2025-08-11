import { useCallback, useMemo, useState, useContext } from "react";
import { parseUnits } from "viem";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import {
  StartFarmingTransactionProps,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { TransactionType } from "@/types/TransactionTypes";
import TransactionStatus from "@/types/TransactionStatus";
import { AssetsContext } from "@/app/AssetsContextProvider";
import getInsolvencyAmount from "@/utils/assets/getImpermanentInsolvency";

import useApprove from "./useApprove";
import { FarmStartTokenStatus } from "./FarmTokenStatus";
import useFarmPanelCommon from "./useFarmPanelCommon";
import useFarmLPBalances from "./useFarmLPBalances";
import useBalance from "./useBalance";
import useAllowance from "./useAllowance";
import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";
import getTokenAddress from "@/utils/assets/getTokenAddress";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}
export function usePairStartPanel(item: FarmPair) {
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
    routerAddress,
  } = useFarmPanelCommon(item);

  const [bToken0, bToken1] = item.wip_stakeToken.swap.input;
  const inputToken0 = bToken0.input;
  const inputToken1 = bToken1.input;
  const inputToken0Address = getTokenAddress({
           token: inputToken0,
           chainId,
         });
  const inputToken1Address = getTokenAddress({
           token: inputToken1,
           chainId,
         });

  const insolvency0 = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: inputToken0,
      chainId,
    });
  }, [stakeToken, inputToken0, chainId]);
  const insolvency1 = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: inputToken1,
      chainId,
    });
  }, [stakeToken, inputToken1, chainId]);

  const balance0 = useBalance(inputToken0);
  const balance1 = useBalance(inputToken1);
  const { allowance: allowance0, query: allowanceQuery0 } = useAllowance({
    token: inputToken0,
    spender: stakeToken.provider,
  });
  const { allowance: allowance1, query: allowanceQuery1 } = useAllowance({
    token: inputToken1,
    spender: stakeToken.provider,
  });

  const [amounts, setAmounts] = useState<
    [BigDecimal | null, BigDecimal | null]
  >([null, null]);

  const isApproved = useMemo(() => {
    return [allowance0.gte(amounts[0] || 0), allowance1.gte(amounts[1] || 0)];
  }, [allowance0, allowance1, amounts]);

  const isInsufficientBalance: [boolean, boolean] = useMemo(() => {
    return [balance0.lt(amounts[0] || 0), balance1.lt(amounts[1] || 0)];
  }, [amounts, balance0, balance1]);

  const isImpermanentInsolvency: [boolean, boolean] = useMemo(() => {
    return [
      insolvency0 !== undefined &&
        new BigDecimal(insolvency0).lt(amounts[0] || 0),
      insolvency1 !== undefined &&
        new BigDecimal(insolvency1).lt(amounts[1] || 0),
    ];
  }, [insolvency0, amounts, insolvency1]);

  const { assetValues } = useContext(AssetsContext);
  const { poolBalance0, poolBalance1 } = useFarmLPBalances(item, assetValues);

  const [isActive, _setIsActive] = useState<[boolean, boolean]>([true, true]);

  const getOtherAmount = useCallback(
    (value: BigDecimal, index: 0 | 1) => {
      const otherToken = index === 0 ? inputToken1 : inputToken0;
      const thisPoolBalance = index === 0 ? poolBalance0 : poolBalance1;
      const otherPoolBalance = index === 0 ? poolBalance1 : poolBalance0;

      if (thisPoolBalance.eq(0)) {
        return BigDecimal.ZERO();
      }

      return value
        .mul(otherPoolBalance)
        .div(thisPoolBalance)
        .roundToDecimals(otherToken.decimals ?? 18);
    },
    [inputToken0, inputToken1, poolBalance0, poolBalance1],
  );

  const getMaxAmount = useCallback(() => {
    const maxAmount = [
      BigDecimal.min(balance0, insolvency0),
      BigDecimal.min(balance1, insolvency1),
    ];
    const maxSwappedAmount = [
      getOtherAmount(maxAmount[1], 1),
      getOtherAmount(maxAmount[0], 0),
    ];

    if (!isActive[0]) {
      return [null, maxAmount[1]] as [BigDecimal | null, BigDecimal | null];
    } else if (!isActive[1]) {
      return [maxAmount[1], null] as [BigDecimal | null, BigDecimal | null];
    } else if (maxSwappedAmount[1].lt(maxAmount[1])) {
      return [maxAmount[0], maxSwappedAmount[1]] as [
        BigDecimal | null,
        BigDecimal | null,
      ];
    } else {
      return [maxSwappedAmount[0], maxAmount[1]] as [
        BigDecimal | null,
        BigDecimal | null,
      ];
    }
  }, [balance0, insolvency0, balance1, insolvency1, getOtherAmount, isActive]);

  const setMaxAmount = useCallback(() => {
    setAmounts(getMaxAmount());
  }, [getMaxAmount, setAmounts]);

  const setIsActive = useCallback(
    (state: [boolean, boolean]) => {
      _setIsActive((v) => {
        if (!state[0]) {
          setAmounts([null, amounts[1]]);
        } else if (!state[1]) {
          setAmounts([amounts[0], null]);
        } else {
          if (!v[0]) {
            const otherAmount = getOtherAmount(
              amounts[1] || BigDecimal.ZERO(),
              1,
            );

            setAmounts([otherAmount, amounts[1]]);
          } else if (!v[1]) {
            const otherAmount = getOtherAmount(
              amounts[0] || BigDecimal.ZERO(),
              0,
            );

            setAmounts([amounts[0], otherAmount]);
          }
        }

        return state;
      });
    },
    [_setIsActive, amounts, setAmounts, getOtherAmount],
  );

  const setAmount = useCallback(
    (value: BigDecimal, index: 0 | 1) => {
      if (isActive.every((v) => v)) {
        const otherAmount = getOtherAmount(value, index);

        if (otherAmount.isZero()) {
          setAmounts((v) => [
            index === 0 ? value : v[0],
            index === 1 ? value : v[1],
          ]);
        } else {
          setAmounts([
            index === 0 ? value : otherAmount,
            index === 1 ? value : otherAmount,
          ]);
        }
      } else {
        setAmounts([index === 0 ? value : null, index === 1 ? value : null]);
      }
    },
    [isActive, setAmounts, getOtherAmount],
  );

  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: routerAddress as `0x${string}`,
    transactionContext,
    refetch: () =>
      Promise.all([allowanceQuery0.refetch(), allowanceQuery1.refetch()]),
    writeContract,
  });

  const tokenStatuses = useMemo(
    () =>
      [inputToken0, inputToken1].map<FarmStartTokenStatus>((v, i) => ({
        index: i,
        input: v,
        balance: i === 0 ? balance0 : balance1,
        amount: amounts[i],
        isApproved: isApproved[i],
        isActive: isActive[i],
        isImpermanentInsolvency: isImpermanentInsolvency[i],
        impermanentInsolvency: i === 0 ? insolvency0 : insolvency1,
        isInsufficientBalance: isInsufficientBalance[i],
        isApprovable: isConnected && !isApproved[i],
        approve: () => approve(v),
      })) as [FarmStartTokenStatus, FarmStartTokenStatus],
    [
      inputToken0,
      inputToken1,
      balance0,
      balance1,
      amounts,
      isApproved,
      isActive,
      isImpermanentInsolvency,
      insolvency0,
      insolvency1,
      isInsufficientBalance,
      isConnected,
      approve,
    ],
  );

  const startFarming = useCallback(() => {
    if (!address) return;
    console.log("routerAddress",routerAddress)
    const transactionProps: TransactionStatusProps &
      StartFarmingTransactionProps = {
      chainId,
      transactionType: TransactionType.START_FARMING,
      input: tokenStatuses
        .map((v) => ({
          token: v.input,
          amount: v.amount ?? undefined,
        }))
        .filter((v) => !!v.token),
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
          allowanceQuery0.refetch(),
          allowanceQuery1.refetch(),
          assetsContext.refetchAll(),
        ]);
      },
    });

    writeContract(
      {
        address: routerAddress as `0x${string}`,
        abi: birdieswap_router_abi,
        functionName: "dualDeposit",
        args: [
          inputToken0Address as `0x${string}`,
          parseUnits(
            tokenStatuses[0].amount?.toString() || "0",
            tokenStatuses[0].input.decimals,
          ),
          inputToken1Address as `0x${string}`,
          parseUnits(
            tokenStatuses[1].amount?.toString() || "0",
            tokenStatuses[1].input.decimals,
          ),
        ],
      },
      {
        onError: handlers.onError,
        onSuccess: async (v) => {
          handlers.onSuccess(v);
          setAmounts([BigDecimal.ZERO(), BigDecimal.ZERO()]);
        },
      },
    );
  }, [
    chainId,
    tokenStatuses,
    stakeToken,
    address,
    client,
    transactionContext,
    writeContract,
    stakeTokenAddress,
    allowanceQuery0,
    allowanceQuery1,
    assetsContext,
  ]);

  const isStartable = useMemo(
    () =>
      tokenStatuses
        .filter((v) => v.isActive)
        .every(
          (v) =>
            v.isApproved &&
            !v.isImpermanentInsolvency &&
            !v.isInsufficientBalance &&
            !!v.amount &&
            v.amount.gt(0),
        ),
    [tokenStatuses],
  );

  const isPending =
    allowanceQuery0.isFetching ||
    allowanceQuery1.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING;

  return {
    setAmount,
    setMaxAmount,
    isActive,
    setIsActive,
    tokenStatuses,
    isStartable,
    approve,
    startFarming,
    isPending,
    isConnected,
    isWrongNetwork,
    chainId,
    poolBalance0,
    poolBalance1,
  };
}

export type UsePairStartPanelReturn = ReturnType<typeof usePairStartPanel>;
