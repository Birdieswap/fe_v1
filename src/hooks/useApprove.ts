import { Client } from "viem";
import { useCallback } from "react";
import { WriteContractMutate } from "wagmi/query";
import { Config, useChainId } from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";

import {
  ApproveTransactionProps,
  TransactionContextType,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { TransactionType } from "@/types/TransactionTypes";
import { IContractBase, IToken } from "@/const/contracts/types/tokenTypes";
import getTokenAddress from "@/utils/assets/getTokenAddress";

export default function useApprove(props: {
  pool: IContractBase;
  poolAddress: `0x${string}`;
  routerAddress: `0x${string}`;
  client?: Client;
  transactionContext: TransactionContextType;
  writeContract: WriteContractMutate<Config, unknown>;
  refetch?: () => Promise<unknown>;
}) {
  const chainId = useChainId();
  const sleep = useCallback(
    (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    []
  );
  const refetchWithRetry = useCallback(async () => {
    if (!props.refetch) return;
    try {
      await props.refetch?.();
    } catch {
      // ignore refetch errors to avoid blocking UX
    }
  }, [props.refetch]);
  const approve = useCallback(
    (token: IToken): Promise<void> => {
      if (!token || !chainId) {
        return Promise.resolve();
      }
      const tokenAddress = getTokenAddress({
        token: token,
        chainId,
      });
      // console.log("tokenAddress",tokenAddress);
      const transactionProps: TransactionStatusProps & ApproveTransactionProps =
        {
          transactionType: TransactionType.APPROVE,
          chainId,
          input: token,
        };
      const handler = getWriteTransactionHandlers({
        client: props.client,
        transactionContext: props.transactionContext,
        transactionProps: transactionProps,
        refetch: refetchWithRetry,
      });

      // console.log(
      //   "[approve]",
      //   {
      //     token,
      //     chainId,
      //     tokenSymbol: token?.symbol,
      //     tokenAddress,
      //   }
      // );

      return new Promise<void>((resolve, reject) => {
        props.writeContract(
          {
            address: tokenAddress as `0x${string}`,
            abi: token.abi,
            functionName: "approve",
            args: [
              props.routerAddress as `0x${string}`,
              BigInt(
                "115792089237316195423570985008687907853269984665640564039457584007913129639935"
              ),
            ],
          },
          {
            onError: (e: unknown) => {
              try {
                handler.onError?.(e);
              } finally {
                reject(e);
              }
            },
            onSuccess: async (tx: `0x${string}`) => {
              try {
                handler.onSuccess?.(tx);
                if (props.client) {
                  try {
                    await waitForTransactionReceipt(props.client, {
                      hash: tx,
                    });
                  } catch {
                    // no-op: handler가 이미 상태 업데이트/실패 처리
                  }
                }
                // allowance/indexer 반영 지연을 고려해 몇 번 더 재조회
                for (const waitMs of [0, 500, 1200, 2200]) {
                  if (waitMs > 0) await sleep(waitMs);
                  await refetchWithRetry();
                }
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          }
        );
      });
    },
    [
      chainId,
      props.client,
      props.routerAddress,
      props.transactionContext,
      props.writeContract,
      refetchWithRetry,
      sleep,
    ]
  );

  return approve;
}
