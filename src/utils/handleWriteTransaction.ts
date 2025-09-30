import { Client, formatUnits, TransactionReceipt } from "viem";
import { waitForTransactionReceipt } from "viem/actions";

import {
  TransactionContextType,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import TransactionStatus from "@/types/TransactionStatus";
import { BigDecimal } from "@/types/BigDecimal";
import { TransactionType } from "@/types/TransactionTypes";
import { IToken } from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "./assets/getTokenAddress";

function getReceivedTransfersFromReceipt(
  receipt: TransactionReceipt,
  token?: IToken,
  tokenAddress?: `0x${string}` | null,
  address?: `0x${string}`,
) {
  const transferReceive = receipt.logs.find((v) => {
    return (
      v.address &&
      tokenAddress &&
      BigInt(v.address) === BigInt(tokenAddress) &&
      // sender
      v.topics[0] &&
      BigInt(v.topics[0]) ===
        BigInt(
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ) &&
      // receiver
      address &&
      v.topics[2] &&
      BigInt(v.topics[2]) === BigInt(address)
    );
  });

  if (transferReceive) {
    return new BigDecimal(
      formatUnits(BigInt(transferReceive.data), token?.decimals ?? 18),
      token?.decimals ?? 18,
    );
  } else return undefined;
}

export function getWriteTransactionHandlers({
  client,
  transactionContext,
  transactionProps,
  refetch,
}: {
  client?: Client;
  transactionContext: TransactionContextType;
  transactionProps: TransactionStatusProps;
  refetch?: () => Promise<unknown>;
}) {
  transactionContext.setTransactionProps({
    ...transactionProps,
    transactionStatus: TransactionStatus.CONFIRM_NEEDED,
  });
  transactionContext.onOpen();

  return {
    onError: (error: Error) => {
      transactionContext.onOpen();
      transactionContext.setTransactionProps({
        ...transactionProps,
        transactionStatus: TransactionStatus.FAILED,
      });
      console.log("onError");
      console.log("e", error.message);
      // alert(`Task submit Failed. reason : ${error.message}`);
    },
    onSuccess: (tx: `0x${string}`) => {
      refetch?.();
      transactionContext.onOpen();
      transactionContext.setTransactionProps({
        ...transactionProps,
        transactionStatus: TransactionStatus.PENDING,
        txid: tx,
      });

      const chainIdNum: number = (() => {
        const v = (transactionProps as any).chainId;
        if (typeof v === "number") return v;
        if (typeof v === "bigint") return Number(v); // 주의: 안전성 — chainId는 보통 작음
        if (typeof v === "string") {
          const n = Number(v);
          return Number.isFinite(n) ? n : NaN;
        }
        return NaN; // 또는 기본값(예: 1)
      })();

      const chainId = chainIdNum ;

      if (client)
        waitForTransactionReceipt(client, {
          hash: tx,
        })
          .then((receipt) => {
            // const transferReceive = receipt.logs.find((v) => (
            // v.topics.includes("0xddf252ad1c6f8a039b4c0a7e2d3b5e9c4d3f5e8a0") &&
            // v.address ===
            // ))
            if (receipt.status === "success") {
              refetch?.();

              if (
                transactionProps.transactionType ===
                TransactionType.START_FARMING
              ) {
                const output = {
                  ...transactionProps.output,
                  amount: getReceivedTransfersFromReceipt(
                    receipt,
                    transactionProps.output.token,
                    getTokenAddress({
                      token: transactionProps.output.token,
                      chainId,
                    }),
                    transactionProps.address,
                  ),
                };

                transactionContext.setTransactionProps({
                  ...transactionProps,
                  txid: tx,
                  transactionStatus: TransactionStatus.SUCCESS,
                  output,
                });
              } else if (
                transactionProps.transactionType ===
                TransactionType.STOP_FARMING
              ) {
                const output = transactionProps.output.map((v) => ({
                  ...v,
                  amount: getReceivedTransfersFromReceipt(
                    receipt,
                    v.token,
                    getTokenAddress({
                      token: v.token,
                      chainId: transactionProps.chainId,
                    }),
                    transactionProps.address,
                  ),
                }));

                transactionContext.setTransactionProps({
                  ...transactionProps,
                  txid: tx,
                  transactionStatus: TransactionStatus.SUCCESS,
                  output,
                });
              } else if (
                transactionProps.transactionType === TransactionType.SWAP
              ) {
                const amount = getReceivedTransfersFromReceipt(
                  receipt,
                  transactionProps.output.token,
                  getTokenAddress({
                    token: transactionProps.output.token,
                    chainId,
                  }),
                  transactionProps.address,
                );
                const output = {
                  ...transactionProps.output,
                  amount: amount ?? transactionProps.output.amount,
                };

                transactionContext.setTransactionProps({
                  ...transactionProps,
                  txid: tx,
                  transactionStatus: TransactionStatus.SUCCESS,
                  output,
                });
              } else {
                transactionContext.setTransactionProps({
                  ...transactionProps,
                  txid: tx,
                  transactionStatus: TransactionStatus.SUCCESS,
                });
              }
            } else {
              transactionContext.setTransactionProps({
                ...transactionProps,
                txid: tx,
                transactionStatus: TransactionStatus.FAILED,
              });
            }
            transactionContext.onOpen();
          })
          .catch((error) => {
            transactionContext.setTransactionProps({
              ...transactionProps,
              transactionStatus: TransactionStatus.FAILED,
            });
            transactionContext.onOpen();
            console.log("onError");
            console.log("e", error);
            // alert(`Task submit Failed. reason : ${error}`);
          });

      console.log("onSettled");
      console.log("tx", tx);
    },
  };
}
