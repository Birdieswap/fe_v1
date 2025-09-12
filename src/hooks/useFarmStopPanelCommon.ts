import { useCallback } from "react";


import {
  StopFarmingTransactionProps,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { FarmPair, FarmSingle, Farm } from "@/types/FarmListTableRowProps";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";

import useFarmPanelCommon from "./useFarmPanelCommon";

import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";

import { ADDRESS, contractAddresses } from "@/const/contracts/contractAddresses";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";

import useAllowance from "./useAllowance";
import useApprove from "./useApprove";
import { getFromContracts } from "@/utils/farm/getAddressHelpers";

type AnyFarm = FarmPair | FarmSingle;

/** 단일/페어 공통 stop 실행 라우트 */
export type StopRoute =
  | "ROUTER_SINGLE"
  | "WRAPPER_SINGLE"
  | "ROUTER_PAIR"
  | "WRAPPER_PAIR";

export default function useFarmStopPanelCommon(item: Farm) {
  const base = useFarmPanelCommon(item);
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
  } = base;

  const { allowance, query: allowanceQuery } = useAllowance({
    token: stakeToken,
    spender: stakeToken.provider,
  });

  // 공통: Approve 핸들러 복구 (refetch는 allowanceQuery.refetch 사용)
  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: routerAddress as `0x${string}`,
    transactionContext,
    refetch: allowanceQuery.refetch,
    writeContract,
  });

  // 실제 트랜잭션 실행은 여기서만!
  const performStop = useCallback(
    (args: {
      route: StopRoute;
      blpAmount: bigint; // decimals 반영된 BLP 수량
      onSuccess?: () => void;
      txLabel?: string;
    }) => {
      const { route, blpAmount, onSuccess } = args;

      const transactionProps =
        ({
          chainId,
          transactionType: TransactionType.STOP_FARMING,
          input: [], // Stop에서는 표시용 토큰 배열이 필요하면 상위 UI에서 처리 (여긴 최소화)
          output: [],
          address,
        } as unknown) as TransactionStatusProps & StopFarmingTransactionProps;

      const handlers = getWriteTransactionHandlers({
        client,
        transactionContext,
        transactionProps,
        refetch: async () => {
          await Promise.all([assetsContext.refetchAll()]);
        },
      });

      const WRAPPER_ADDRESS =
        getFromContracts(ADDRESS.WRAPPER, chainId) as `0x${string}` | null;

      if (route === "WRAPPER_SINGLE") {
        if (!WRAPPER_ADDRESS) {
          console.error("[performStop] Missing WRAPPER_ADDRESS for chain:", chainId);
          return;
        }
        // wrapper: singleRedeemToETH(bToken, bAmount)

        console.log("useFarmStopPanelCommon WrapperSingleCall",WRAPPER_ADDRESS, stakeTokenAddress ,blpAmount)

        writeContract(
          {
            address: WRAPPER_ADDRESS,
            abi: birdieswap_wrapper_abi,
            functionName: "singleRedeemToETH",
            args: [stakeTokenAddress as `0x${string}`, blpAmount],
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              onSuccess?.();
            },
          }
        );
        return;
      }

      if (route === "WRAPPER_PAIR") {
        if (!WRAPPER_ADDRESS) {
          console.error("[performStop] Missing WRAPPER_ADDRESS for chain:", chainId);
          return;
        }
        // wrapper: dualRedeemToETH(blpToken, blpAmount)
        console.log("useFarmStopPanelCommon WrapperPairCall",WRAPPER_ADDRESS,stakeTokenAddress,blpAmount)

        writeContract(
          {
            address: WRAPPER_ADDRESS,
            abi: birdieswap_wrapper_abi,
            functionName: "dualRedeemToETH",
            args: [stakeTokenAddress as `0x${string}`, blpAmount],
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              onSuccess?.();
            },
          }
        );
        return;
      }

      if (route === "ROUTER_SINGLE") {
        console.log("useFarmStopPanelCommon routerSingleCall",routerAddress,stakeTokenAddress)

        writeContract(
          {
            address: routerAddress as `0x${string}`,
            abi: birdieswap_router_abi,
            functionName: "singleRedeem" as any,
            args: [stakeTokenAddress as `0x${string}`, blpAmount] as any,
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              onSuccess?.();
            },
          }
        );
        return;
      }

      if (route === "ROUTER_PAIR") {
        console.log("useFarmStopPanelCommon routerPairCall",routerAddress,stakeTokenAddress)
        writeContract(
          {
            address: routerAddress as `0x${string}`,
            abi: birdieswap_router_abi,
            functionName: "dualRedeem" as any,
            args: [stakeTokenAddress as `0x${string}`, blpAmount] as any,
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              onSuccess?.();
            },
          }
        );
        return;
      }
    },
    [
      address,
      chainId,
      client,
      transactionContext,
      assetsContext,
      writeContract,
      routerAddress,
      stakeToken,
      stakeTokenAddress,
    ]
  );

  // 공통으로 내려주는 것들: 싱글/페어 훅이 그대로 사용
  return {
    ...base,
    performStop,
    client,
    approve,
    allowance,
    allowanceQuery,
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
  };
}

