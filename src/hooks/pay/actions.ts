// src/hooks/pay/actions.ts
"use client";

import type React from "react";
import type { Config } from "wagmi";
import type { WriteContractMutate } from "wagmi/query";
import { erc20Abi, parseUnits } from "viem";

import type { TransactionContextType } from "@/app/TransactionContextProvider";
import type { TransactionStatusProps } from "@/app/TransactionContextProvider";

import { TransactionType } from "@/types/TransactionTypes";
import TransactionStatus from "@/types/TransactionStatus";

import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";

import tokens from "@/const/contracts/tokens/tokens";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";

const MAX_UINT256 = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

function sanitizeDecimalInput(v: string): string {
  return (v ?? "").toString().replace(/,/g, "").trim();
}

type TxPatch = {
  transactionStatus: TransactionStatus;
  txid?: `0x${string}`;
};

// ✅ 타입 세이프 공용 status updater (prev:any 없음)
export function setTxStatus(
  tx: Pick<TransactionContextType, "setTransactionProps">,
  updater: (prev: TransactionStatusProps) => TransactionStatusProps
): void;
export function setTxStatus(
  tx: Pick<TransactionContextType, "setTransactionProps">,
  patch: TxPatch
): void;
export function setTxStatus(
  tx: Pick<TransactionContextType, "setTransactionProps">,
  updaterOrPatch:
    | ((prev: TransactionStatusProps) => TransactionStatusProps)
    | TxPatch
) {
  if (typeof updaterOrPatch === "function") {
    tx.setTransactionProps((prev) => (prev ? updaterOrPatch(prev) : prev));
    return;
  }

  const patch = updaterOrPatch;
  tx.setTransactionProps((prev) =>
    prev
      ? {
          ...prev,
          transactionStatus: patch.transactionStatus,
          txid: patch.txid ?? prev.txid,
        }
      : prev
  );
}

// wagmi writeContract를 Promise로 래핑 (handlers 연동)
function writeWithHandlers(
  writeContract: WriteContractMutate<Config, unknown>,
  handlers: any,
  cfg: any
): Promise<`0x${string}`> {
  return new Promise((resolve, reject) => {
    writeContract(cfg, {
      onError: (e: any) => {
        try {
          handlers?.onError?.(e);
        } finally {
          reject(e);
        }
      },
      onSuccess: (h: any) => resolve(h as `0x${string}`),
    });
  });
}

// receipt 확인 + 실패 처리 공용
async function waitReceiptOrFail(params: {
  publicClient: any;
  transactionContext: TransactionContextType;
  hash: `0x${string}`;
}) {
  const { publicClient, transactionContext, hash } = params;
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt?.status !== "success") {
    setTxStatus(transactionContext, {
      transactionStatus: TransactionStatus.FAILED,
    });
    transactionContext.onOpen();
    return { ok: false as const, receipt };
  }
  return { ok: true as const, receipt };
}

// =====================
// PAY
// =====================
export async function pay(params: {
  chainId: number;
  userAddress: `0x${string}`;
  stakingPoolAddress: `0x${string}`;
  receiver: `0x${string}`;

  payAmount: string; // USDC units string (ex: "12.34")
  stakingSharesStr: string; // shares units string (ex: "0.12345678")
  sharesDecimals: number;

  paySummaryNode: React.ReactNode;

  writeContract: WriteContractMutate<Config, unknown>;
  publicClient: any;
  client?: any;
  transactionContext: TransactionContextType;

  onMinedSuccess?: (args: { hash: `0x${string}` }) => Promise<void> | void;
}): Promise<void> {
  const {
    chainId,
    userAddress,
    stakingPoolAddress,
    receiver,
    payAmount,
    stakingSharesStr,
    sharesDecimals,
    paySummaryNode,
    writeContract,
    publicClient,
    client,
    transactionContext,
    onMinedSuccess,
  } = params;

  const USDC = tokens.USDC;
  const usdcAddr = USDC.addresses?.[chainId] as `0x${string}` | undefined;
  if (!usdcAddr) throw new Error("USDC address not found for chain");

  const exactOut = parseUnits(
    sanitizeDecimalInput(payAmount || "0") || "0",
    USDC.decimals ?? 6
  );

  const stakingShares = parseUnits(
    sanitizeDecimalInput(stakingSharesStr || "0") || "0",
    sharesDecimals
  );

  // ✅ transactionProps (CONFIRM_NEEDED에서 시작)
  const transactionProps: TransactionStatusProps = {
    transactionType: TransactionType.PAY,
    chainId,
    address: userAddress,
    transactionStatus: TransactionStatus.CONFIRM_NEEDED,
    // PAY에서는 input=pool(staked), output=USDC(exactOut)로 보면 일관성 있음
    input: { token: undefined, amount: undefined }, // usePay에서 채워도 되고, 안 쓰면 undefined로 둬도 됨
    output: { token: USDC, amount: undefined },
    receiver,
    onSubmittedInfo: paySummaryNode,
    onConfirmedInfo: paySummaryNode,
  } as TransactionStatusProps;

  const handlers = getWriteTransactionHandlers({
    client,
    transactionContext,
    transactionProps: transactionProps as any,
    refetch: async () => {},
  });

  // write (wallet confirm -> submitted)
  const hash = await writeWithHandlers(writeContract, handlers, {
    address: stakingPoolAddress,
    abi: birdieswap_staking_abi,
    functionName: "easyPay",
    args: [stakingShares, usdcAddr, exactOut, receiver],
  });

  // handlers.onSuccess가 내부에서 txid 세팅 + status PENDING으로 바꾸는 구조를 기대
  await handlers?.onSuccess?.(hash);

  // receipt wait
  const { ok } = await waitReceiptOrFail({
    publicClient,
    transactionContext,
    hash,
  });
  if (!ok) return;

  // mined success callback (usePay에서 result node patch + onOpen 하는 흐름)
  if (onMinedSuccess) await onMinedSuccess({ hash });

  // 안전 마감 (usePay에서 SUCCESS로 덮어쓸 수도 있음)
  setTxStatus(transactionContext, {
    transactionStatus: TransactionStatus.SUCCESS,
  });
}

// =====================
// ENTER: approve (WETH)
// =====================
export async function approveWethForEnter(params: {
  chainId: number;
  userAddress: `0x${string}`;
  stakingPoolAddress: `0x${string}`;

  writeContract: WriteContractMutate<Config, unknown>;
  publicClient: any; // ✅ approve도 receipt까지 기다리려면 필요
  client?: any;
  transactionContext: TransactionContextType;
  onAllowanceRefetch?: () => Promise<void> | void;
}): Promise<void> {
  const {
    chainId,
    userAddress,
    stakingPoolAddress,
    writeContract,
    publicClient,
    client,
    transactionContext,
    onAllowanceRefetch,
  } = params;

  const WETH = tokens.WETH;
  const wethAddr = WETH.addresses?.[chainId] as `0x${string}` | undefined;
  if (!wethAddr) throw new Error("WETH address not found for chain");

  const transactionProps: TransactionStatusProps = {
    transactionType: TransactionType.APPROVE,
    chainId,
    address: userAddress,
    input: WETH,
    transactionStatus: TransactionStatus.CONFIRM_NEEDED,
  } as TransactionStatusProps;

  const handlers = getWriteTransactionHandlers({
    client,
    transactionContext,
    transactionProps: transactionProps as any,
    refetch: async () => {},
  });

  // approve tx
  const hash = await writeWithHandlers(writeContract, handlers, {
    address: wethAddr,
    abi: erc20Abi,
    functionName: "approve",
    args: [stakingPoolAddress, MAX_UINT256],
  });

  await handlers?.onSuccess?.(hash);

  const { ok } = await waitReceiptOrFail({
    publicClient,
    transactionContext,
    hash,
  });
  if (!ok) return;

  setTxStatus(transactionContext, {
    transactionStatus: TransactionStatus.SUCCESS,
  });

  try {
    await onAllowanceRefetch?.();
  } catch (e) {
    // refetch 실패는 치명적이지 않아서 그냥 로그만
    console.warn("[approveWethForEnter] allowance refetch failed", e);
  }
}

// =====================
// ENTER: ETH or WETH
// =====================
export async function enter(params: {
  chainId: number;
  userAddress: `0x${string}`;
  stakingPoolAddress: `0x${string}`;
  wrapperAddress: `0x${string}`;

  nativeSymbol: "ETH" | "WETH";
  amount: string;
  enterMinStakeAmountStr: string;
  sharesDecimals: number;
  enterSummaryNode: React.ReactNode;

  writeContract: WriteContractMutate<Config, unknown>;
  publicClient: any;
  client?: any;
  transactionContext: TransactionContextType;

  onMinedSuccess?: (args: {
    hash: `0x${string}`;
    token0Addr?: `0x${string}`;
    token1Addr?: `0x${string}`;
  }) => Promise<void> | void;
}): Promise<void> {
  const {
    chainId,
    userAddress,
    stakingPoolAddress,
    wrapperAddress,
    nativeSymbol,
    amount,
    enterMinStakeAmountStr,
    sharesDecimals,
    enterSummaryNode,
    writeContract,
    publicClient,
    client,
    transactionContext,
    onMinedSuccess,
  } = params;

  const WETH = tokens.WETH;
  const wethAddr = WETH.addresses?.[chainId] as `0x${string}` | undefined;
  if (!wethAddr) throw new Error("WETH address not found for chain");

  const minStakeAmount = parseUnits(
    sanitizeDecimalInput(enterMinStakeAmountStr || "0") || "0",
    sharesDecimals
  );

  // underlying0/1 (result 계산용)
  const [token0Addr, token1Addr] = await Promise.all([
    publicClient.readContract({
      address: stakingPoolAddress,
      abi: birdieswap_staking_abi,
      functionName: "i_underlying0",
      args: [],
    }),
    publicClient.readContract({
      address: stakingPoolAddress,
      abi: birdieswap_staking_abi,
      functionName: "i_underlying1",
      args: [],
    }),
  ]);

  const transactionProps: TransactionStatusProps = {
    transactionType: TransactionType.ENTER,
    chainId,
    address: userAddress,
    transactionStatus: TransactionStatus.CONFIRM_NEEDED,
    input: {
      token: nativeSymbol === "ETH" ? tokens.ETH : tokens.WETH,
      amount: undefined,
    },
    onSubmittedInfo: enterSummaryNode,
    onConfirmedInfo: enterSummaryNode,
    pool: {
      address: stakingPoolAddress,
    },
  } as TransactionStatusProps;

  const handlers = getWriteTransactionHandlers({
    client,
    transactionContext,
    transactionProps: transactionProps as any,
    refetch: async () => {},
  });

  let hash: `0x${string}`;

  if (nativeSymbol === "ETH") {
    const value = parseUnits(sanitizeDecimalInput(amount || "0") || "0", 18);

    hash = await writeWithHandlers(writeContract, handlers, {
      address: wrapperAddress,
      abi: birdieswap_wrapper_abi,
      functionName: "easyEnterWithETH",
      args: [stakingPoolAddress, minStakeAmount],
      value,
    });
  } else {
    const amountIn = parseUnits(sanitizeDecimalInput(amount || "0") || "0", 18);

    hash = await writeWithHandlers(writeContract, handlers, {
      address: stakingPoolAddress,
      abi: birdieswap_staking_abi,
      functionName: "easyEnter",
      args: [wethAddr, amountIn, minStakeAmount],
    });
  }

  await handlers?.onSuccess?.(hash);

  const { ok } = await waitReceiptOrFail({
    publicClient,
    transactionContext,
    hash,
  });
  if (!ok) return;

  if (onMinedSuccess) {
    await onMinedSuccess({
      hash,
      token0Addr: token0Addr as `0x${string}`,
      token1Addr: token1Addr as `0x${string}`,
    });
  }

  setTxStatus(transactionContext, {
    transactionStatus: TransactionStatus.SUCCESS,
  });
}
