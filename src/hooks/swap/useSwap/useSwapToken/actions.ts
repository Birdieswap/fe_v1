import { Config } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { WriteContractMutate } from "wagmi/query";
import { TransactionContextType } from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { contracts } from "@/const/contracts";
import tokens from "@/const/contracts/tokens/tokens";
import { BigDecimal } from "@/types/BigDecimal";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { weth_abi } from "@/const/contracts/abis/weth_abi";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";
import { getFromContracts } from "@/utils/farm/getAddressHelpers";
import { finalizeAfterTxSuccess } from "./finalizeAfterTxSuccess";

function isUserRejected(e: any) {
  if (e?.code === 4001 || e?.cause?.code === 4001) return true;
  const msg = (e?.shortMessage || e?.message || "").toLowerCase?.() || "";
  return msg.includes("user rejected") || msg.includes("user denied");
}

export function approve(params: {
  chainId: number;
  fromToken: any;
  fromTokenAddress?: `0x${string}` | null;
  writeContract: WriteContractMutate<Config, unknown>;
  client?: any;
  transactionContext: TransactionContextType;
  refetchAllowance: () => Promise<unknown>;
  spenderAddress?: `0x${string}`;
}): Promise<void> {
  const {
    chainId,
    fromToken,
    fromTokenAddress,
    writeContract,
    client,
    transactionContext,
    refetchAllowance,
    spenderAddress,
  } = params;

  const transactionProps = {
    transactionType: TransactionType.APPROVE,
    input: fromToken,
    chainId,
  } as const;

  const handlers = getWriteTransactionHandlers({
    client,
    transactionContext,
    transactionProps,
    refetch: () => {
      const safeRefetch = () => {
        try {
          return refetchAllowance?.();
        } catch {
          return undefined;
        }
      };
      safeRefetch();
      const delaysMs = [1500, 6000];
      delaysMs.forEach((ms) => {
        setTimeout(() => safeRefetch(), ms);
      });
    },
  });

  const spender =
    spenderAddress ??
    (getFromContracts("ROUTER", chainId) as `0x${string}` | null) ??
    (contracts.birdieRouter.address as `0x${string}`);

  return new Promise<void>((resolve, reject) => {
    writeContract(
      {
        address: fromTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          spender,
          BigInt(
            "115792089237316195423570985008687907853269984665640564039457584007913129639935"
          ),
        ],
      },
      {
        onError: (e: any) => {
          try {
            (handlers as any)?.onError?.(e);
          } finally {
            reject(e);
          }
        },
        onSuccess: async (h: any) => {
          try {
            await (handlers as any)?.onSuccess?.(h);
          } finally {
            resolve();
          }
        },
      }
    );
  });
}

export async function swap(params: {
  chainId: number;
  userAddress?: `0x${string}`;
  fromToken: any;
  toToken: any;
  fromAmount: string;
  toAmount: string;
  writeContract: WriteContractMutate<Config, unknown>;
  client?: any;
  publicClient?: any;
  transactionContext: TransactionContextType;
  referralAddress?: `0x${string}`;
  swapPool: any;
  sqrtPriceLimitX96: bigint;
  receiveAtLeast: bigint;
  addrLower: (t?: any) => string;
  lastInputRef: React.MutableRefObject<any>;
  curFromTokenRef: React.MutableRefObject<any>;
  curToTokenRef: React.MutableRefObject<any>;
  curFromAmountRef: React.MutableRefObject<string>;
  curToAmountRef: React.MutableRefObject<string>;
  updateAmountCommon: (
    a: string,
    s: "in" | "out",
    t?: any,
    f?: any
  ) => Promise<void>;
  setToAmount: (v: string) => void;
  balances?: any;

  benchmarkOut?: string | null;
  toTokenUsd?: number | null;
}) {
  const {
    chainId,
    userAddress,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    writeContract,
    client,
    publicClient,
    transactionContext,
    referralAddress,
    swapPool,
    sqrtPriceLimitX96,
    receiveAtLeast,
    addrLower,
    lastInputRef,
    curFromTokenRef,
    curToTokenRef,
    curFromAmountRef,
    curToAmountRef,
    updateAmountCommon,
    setToAmount,
    balances,

    benchmarkOut,
    toTokenUsd,
  } = params;

  const inputAmountBD = new BigDecimal(fromAmount, fromToken?.decimals);
  const outputAmountBD = new BigDecimal(toAmount, toToken?.decimals);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
  const routerAddress =
    (getFromContracts("ROUTER", chainId) as `0x${string}` | null) ??
    (contracts.birdieRouter.address as `0x${string}`);

  const transactionProps = {
    transactionType: TransactionType.SWAP,
    address: userAddress,
    input: { token: fromToken, amount: inputAmountBD },
    output: { token: toToken, amount: outputAmountBD },
    chainId,
  } as const;

  const handlers = getWriteTransactionHandlers({
    client,
    transactionContext,
    transactionProps,
    refetch: async () => {},
  });

  const writeWithHandlers = (cfg: any): Promise<`0x${string}`> =>
    new Promise((resolve, reject) => {
      writeContract(cfg, {
        onError: (e: any) => {
          try {
            (handlers as any)?.onError?.(e);
          } finally {
            reject(e);
          }
        },
        onSuccess: (h: any) => resolve(h as `0x${string}`),
      });
    });

  // ✅ (A) tx 직전 toToken balance 스냅샷
  let preToBalance: bigint | null = null;
  try {
    if (publicClient && userAddress) {
      if (toToken?.symbol === "ETH") {
        preToBalance = await publicClient.getBalance({ address: userAddress });
      } else {
        const toAddr = getTokenAddress({ token: toToken, chainId }) as
          | `0x${string}`
          | null;
        if (toAddr) {
          preToBalance = await publicClient.readContract({
            address: toAddr,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [userAddress],
          });
        }
      }
    }
  } catch {
    preToBalance = null;
  }

  // WETH 입출금
  const isDeposit = fromToken?.symbol === "ETH" && toToken?.symbol === "WETH";
  const isWithdraw = fromToken?.symbol === "WETH" && toToken?.symbol === "ETH";

  if (isDeposit) {
    const amount = new BigDecimal(fromAmount);
    const tokenAddress = tokens.WETH.addresses?.[chainId] as `0x${string}`;

    const hash = await writeWithHandlers({
      address: tokenAddress,
      abi: weth_abi,
      functionName: "deposit",
      value: parseUnits(amount.toString(), tokens.WETH.decimals ?? 18),
    } as any);

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      chainId,
      userAddress,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
      transactionContext,
      benchmarkOut,
      toTokenUsd,
      preToBalance,
    });

    return;
  }

  if (isWithdraw) {
    const amount = new BigDecimal(toAmount);
    const tokenAddress = tokens.WETH.addresses?.[chainId] as `0x${string}`;

    const hash = await writeWithHandlers({
      address: tokenAddress,
      abi: weth_abi,
      functionName: "withdraw",
      args: [parseUnits(amount.toString(), tokens.WETH.decimals ?? 18)],
    } as any);

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      chainId,
      userAddress,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
      transactionContext,
      benchmarkOut,
      toTokenUsd,
      preToBalance,
    });

    return;
  }

  // Wrapper: ETH -> Token
  const isWrapperIn =
    fromToken?.symbol === "ETH" && toToken?.symbol !== "WETH" && !!toToken;

  if (isWrapperIn) {
    const wrapperAddress = getFromContracts(
      "WRAPPER",
      chainId
    ) as `0x${string}`;
    const outputTokenAddress = getTokenAddress({
      token: toToken,
      chainId,
    }) as `0x${string}`;
    const feeTier = swapPool?.fee_tier as number;
    const minReceive = receiveAtLeast;
    const sqrtPriceLimit = sqrtPriceLimitX96 * BigInt(0);

    const value = parseUnits(
      new BigDecimal(fromAmount).toString(),
      tokens.WETH.decimals ?? 18
    );

    const hash = await writeWithHandlers({
      address: wrapperAddress,
      abi: birdieswap_wrapper_abi,
      functionName: "swapFromETH",
      args: [
        feeTier,
        outputTokenAddress,
        minReceive,
        sqrtPriceLimit,
        referralAddress as `0x${string}`,
        deadline,
      ],
      value,
    } as any);

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      chainId,
      userAddress,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
      transactionContext,
      benchmarkOut,
      toTokenUsd,
      preToBalance,
    });

    return;
  }

  // Wrapper: Token -> ETH
  const isWrapperOut =
    toToken?.symbol === "ETH" && fromToken?.symbol !== "WETH" && !!fromToken;

  if (isWrapperOut) {
    const wrapperAddress = getFromContracts(
      "WRAPPER",
      chainId
    ) as `0x${string}`;
    const inputTokenAddress = getTokenAddress({
      token: fromToken,
      chainId,
    }) as `0x${string}`;
    const amountBD = new BigDecimal(fromAmount, fromToken?.decimals);
    const feeTier = swapPool?.fee_tier as number;
    const minReceive = receiveAtLeast;
    const sqrtPriceLimit = sqrtPriceLimitX96 * BigInt(0);

    const hash = await writeWithHandlers({
      address: wrapperAddress,
      abi: birdieswap_wrapper_abi,
      functionName: "swapToETH",
      args: [
        inputTokenAddress,
        feeTier,
        amountBD.value,
        minReceive,
        sqrtPriceLimit,
        referralAddress as `0x${string}`,
        deadline,
      ],
    } as any);

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      chainId,
      userAddress,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
      transactionContext,
      benchmarkOut,
      toTokenUsd,
      preToBalance,
    });

    return;
  }

  // Router swap
  const inputTokenAddress = getTokenAddress({ token: fromToken, chainId });
  const outputTokenAddress = getTokenAddress({ token: toToken, chainId });
  const amountBD = new BigDecimal(fromAmount, fromToken?.decimals);
  const feeTier = swapPool?.fee_tier as number;
  const minReceive = receiveAtLeast;
  const sqrtPriceLimit = sqrtPriceLimitX96 * BigInt(0);

  const hash = await writeWithHandlers({
    address: routerAddress,
    abi: contracts.birdieRouter.abi,
    functionName: "swap",
    args: [
      inputTokenAddress as `0x${string}`,
      feeTier as number,
      outputTokenAddress as `0x${string}`,
      amountBD.value,
      minReceive,
      sqrtPriceLimit,
      referralAddress as `0x${string}`,
      deadline,
    ],
  });

  await finalizeAfterTxSuccess({
    hash,
    publicClient,
    handlers,
    balances,
    fromToken,
    toToken,
    chainId,
    userAddress,
    refs: {
      lastInputRef,
      curFromTokenRef,
      curToTokenRef,
      curFromAmountRef,
      curToAmountRef,
    },
    updateAmountCommon,
    transactionContext,
    benchmarkOut,
    toTokenUsd,
    preToBalance,
  });
}
