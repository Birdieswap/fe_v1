import {
  Client,
  formatUnits,
  TransactionReceipt,
  keccak256,
  toBytes,
  UserRejectedRequestError,
} from "viem";
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
import tokens from "@/const/contracts/tokens/tokens";

// event signature topics
const TRANSFER_TOPIC = keccak256(toBytes("Transfer(address,address,uint256)"));
const WITHDRAWAL_TOPIC = keccak256(toBytes("Withdrawal(address,uint256)"));

function topicEndsWithAddress(topic?: `0x${string}`, address?: `0x${string}`) {
  if (!topic || !address) return false;
  // 32바이트 패딩된 topic 끝 40글자가 주소(0x 제외)
  return topic.toLowerCase().endsWith(address.toLowerCase().slice(2));
}

function isNativeETH(token?: IToken) {
  const sym = token?.symbol?.toUpperCase?.() ?? "";
  return sym === "ETH";
}

function isWETH(token?: IToken) {
  const sym = token?.symbol?.toUpperCase?.() ?? "";
  return sym === "WETH" || sym === "WETH9";
}

function resolveTokenAddressSafe(
  token: IToken | undefined,
  chainId: number
): `0x${string}` | null {
  if (!token) return null;
  // ETH는 네이티브로 처리해야 하므로 주소 null
  if (isNativeETH(token)) return null;

  // 우선 일반 로직
  let addr = getTokenAddress({ token, chainId });

  // 만약 WETH인데 주소가 비거나 수상하면, 공식 tokens.WETH로 보정
  if ((!addr || addr.length < 10) && isWETH(token)) {
    const fallback = getTokenAddress({ token: (tokens as any).WETH, chainId });
    if (fallback) addr = fallback;
  }

  return addr ?? null;
}

/**
 * ERC-20 → Transfer(to=user) 합산
 * ETH(네이티브) → Withdrawal(src=executor) 합산
 */
function getReceivedTransfersFromReceipt(
  receipt: TransactionReceipt,
  token?: IToken,
  tokenAddress?: `0x${string}` | null,
  address?: `0x${string}`,
  executorAddress?: `0x${string}`
) {
  const decimals = token?.decimals ?? 18;

  // 1) ERC-20 Transfer(..., to=address) 합산
  let total: bigint = BigInt(0);
  if (tokenAddress) {
    for (const v of receipt.logs) {
      if (
        v.address &&
        v.address.toLowerCase() === tokenAddress.toLowerCase() &&
        v.topics?.[0] === TRANSFER_TOPIC &&
        topicEndsWithAddress(v.topics?.[2] as `0x${string}`, address)
      ) {
        total += BigInt(v.data);
      }
    }
  } else if (executorAddress) {
    // 네이티브 ETH: Withdrawal(src=executor) 감지
    for (const v of receipt.logs) {
      if (
        v.topics?.[0] === WITHDRAWAL_TOPIC &&
        topicEndsWithAddress(v.topics?.[1] as `0x${string}`, executorAddress)
      ) {
        total += BigInt(v.data);
      }
    }
  }

  if (total > BigInt(0)) {
    return new BigDecimal(formatUnits(total, decimals), decimals);
  }
  return undefined;
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
    onError: (error: unknown) => {
      transactionContext.onOpen();

      const isUserRejected =
        error instanceof UserRejectedRequestError ||
        (typeof error === "object" &&
          error !== null &&
          // @ts-expect-error
          (error.code === 4001 ||
            // @ts-expect-error
            error?.shortMessage?.toLowerCase?.().includes("user rejected") ||
            // @ts-expect-error
            error?.message?.toLowerCase?.().includes("user rejected")));

      transactionContext.setTransactionProps({
        ...transactionProps,
        transactionStatus: isUserRejected
          ? TransactionStatus.CANCELED // 지갑에서 Cancel → CANCELED
          : TransactionStatus.FAILED, // 나머지 에러 → FAILED
      });
    },
    onSuccess: (tx: `0x${string}`) => {
      refetch?.();
      transactionContext.onOpen();
      transactionContext.setTransactionProps({
        ...transactionProps,
        transactionStatus: TransactionStatus.PENDING,
        txid: tx,
      });

      // chainId를 number로 정규화
      const chainIdNum: number = (() => {
        const v = (transactionProps as any).chainId;
        if (typeof v === "number") return v;
        if (typeof v === "bigint") return Number(v);
        if (typeof v === "string") {
          const n = Number(v);
          return Number.isFinite(n) ? n : NaN;
        }
        return NaN;
      })();

      const chainId = chainIdNum;

      if (client)
        waitForTransactionReceipt(client, { hash: tx })
          .then((receipt) => {
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
                    resolveTokenAddressSafe(
                      transactionProps.output.token,
                      chainId
                    ),
                    transactionProps.address,
                    undefined
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
                const executor = (transactionProps as any).executorAddress as
                  | `0x${string}`
                  | undefined;

                const output = (transactionProps.output ?? []).map((v) => {
                  const resolved = resolveTokenAddressSafe(v.token, chainId);

                  // 디버깅에 도움되도록 로그 남기기 (필요 시 주석 처리)
                  // console.log("[STOP_FARMING][resolve]", {
                  //   sym: (v.token as any)?.symbol,
                  //   addr: resolved,
                  //   user: transactionProps.address,
                  //   exec: executor,
                  // });

                  return {
                    ...v,
                    amount: getReceivedTransfersFromReceipt(
                      receipt,
                      v.token,
                      isNativeETH(v.token) ? null : resolved,
                      transactionProps.address,
                      executor
                    ),
                  };
                });

                // console.log("handleWriteTransaction Stop Farming (resolved output)", output);

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
                  resolveTokenAddressSafe(
                    transactionProps.output.token,
                    chainId
                  ),
                  transactionProps.address,
                  undefined
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
            // console.log("onError");
            // console.log("e", error);
          });

      // console.log("onSettled");
      // console.log("tx", tx);
    },
  };
}
