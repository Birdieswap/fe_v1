import { Config } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import type { Abi, Address } from "viem";
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
    refetch: refetchAllowance,
  });

  const spender =
    spenderAddress ?? (contracts.birdieRouter.address as `0x${string}`);

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
  } = params;

  const inputAmountBD = new BigDecimal(fromAmount, fromToken?.decimals);
  const outputAmountBD = new BigDecimal(toAmount, toToken?.decimals);

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
            // swap도 approve처럼 실패로 전환
            (handlers as any)?.onError?.(e);
          } finally {
            reject(e);
          }
        },
        onSuccess: (h: any) => {
          // 성공은 finalizeAfterTxSuccess가 처리하므로 여기선 hash만 전달
          resolve(h as `0x${string}`);
        },
      });
    });

  // WETH 입출금 케이스 처리
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

    // const hash: `0x${string}` = await new Promise((resolve, reject) => {
    //   writeContract(
    //     {
    //       address: tokenAddress,
    //       abi: weth_abi,
    //       functionName: "deposit",
    //       // deposit() payable
    //       value: parseUnits(amount.toString(), tokens.WETH.decimals ?? 18),
    //     } as any,
    //     {
    //       onError: (e: any) => reject(e),
    //       onSuccess: (h: any) => resolve(h as `0x${string}`),
    //     },
    //   );
    // });

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
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

    // const hash: `0x${string}` = await new Promise((resolve, reject) => {
    //   writeContract(
    //     {
    //       address: tokenAddress,
    //       abi: weth_abi,
    //       functionName: "withdraw",
    //       args: [parseUnits(amount.toString(), tokens.WETH.decimals ?? 18)],
    //     } as any,
    //     {
    //       onError: (e: any) => reject(e),
    //   onSuccess: (h: any) => resolve(h as `0x${string}`),
    //     },
    //   );
    // });

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
    });
    return;
  }

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
    // 기존 코드와 동일하게 sqrtPriceLimitX96는 0으로 보냅니다.
    const sqrtPriceLimit = sqrtPriceLimitX96 * BigInt(0);

    // payable value = ETH 입력값(18자리)
    const value = parseUnits(
      new BigDecimal(fromAmount).toString(),
      tokens.WETH.decimals ?? 18
    );

    // 동일한 모달 핸들러 사용
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
      ],
      value,
    } as any);
    // const hash: `0x${string}` = await new Promise((resolve, reject) => {
    //   writeContract(
    //     {
    //       address: wrapperAddress,
    //       abi: birdieswap_wrapper_abi,
    //       functionName: "swapWithETH", // (payable)
    //       args: [
    //         feeTier as number,
    //         outputTokenAddress,
    //         minReceive,
    //         sqrtPriceLimit,
    //         referralAddress as `0x${string}`,
    //       ],
    //       value,
    //     } as any,
    //     {
    //       onError: (e: any) => reject(e),
    //       onSuccess: (h: any) => resolve(h as `0x${string}`),
    //     },
    //   );
    // });

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
    });

    return;
  }

  // ========== [추가 2] Wrapper 스왑: Token -> ETH (상대가 WETH가 아닌 경우) ==========
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

    console.log("wrapper-swapToETH args", sqrtPriceLimitX96);

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
      ],
    } as any);

    // const hash: `0x${string}` = await new Promise((resolve, reject) => {
    //   writeContract(
    //     {
    //       address: wrapperAddress,
    //       abi: birdieswap_wrapper_abi,
    //       functionName: "swapToETH", // (nonpayable)
    //       args: [
    //         inputTokenAddress,
    //         feeTier as number,
    //         amountBD.value,
    //         minReceive,
    //         sqrtPriceLimit,
    //         referralAddress as `0x${string}`,
    //       ],
    //     } as any,
    //     {
    //       onError: (e: any) => reject(e),
    //       onSuccess: (h: any) => resolve(h as `0x${string}`),
    //     },
    //   );
    // });

    await finalizeAfterTxSuccess({
      hash,
      publicClient,
      handlers,
      balances,
      fromToken,
      toToken,
      refs: {
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
      },
      updateAmountCommon,
    });

    return;
  }

  // Birdie Router 일반 스왑
  const inputTokenAddress = getTokenAddress({ token: fromToken, chainId });
  const outputTokenAddress = getTokenAddress({ token: toToken, chainId });
  const amountBD = new BigDecimal(fromAmount, fromToken?.decimals);
  const feeTier = swapPool?.fee_tier as number;
  const minReceive = receiveAtLeast;
  const sqrtPriceLimit = sqrtPriceLimitX96 * BigInt(0); // 기존 코드 그대로 보존

  const hash = await writeWithHandlers({
    address: contracts.birdieRouter.address as `0x${string}`,
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
    ],
  });

  // const hash: `0x${string}` = await new Promise((resolve, reject) => {
  //   writeContract(
  //     {
  //       address: contracts.birdieRouter.address as `0x${string}`,
  //       abi: contracts.birdieRouter.abi,
  //       functionName: "swap",
  //       args: [
  //         inputTokenAddress as `0x${string}`,
  //         feeTier as number,
  //         outputTokenAddress as `0x${string}`,
  //         amountBD.value,
  //         minReceive,
  //         sqrtPriceLimit,
  //         referralAddress as `0x${string}`,
  //       ],
  //     },
  //     {
  //       onError: (e: any) => reject(e),
  //       onSuccess: (h: any) => resolve(h as `0x${string}`),
  //     },
  //   );
  // });

  await finalizeAfterTxSuccess({
    hash,
    publicClient,
    handlers,
    balances,
    fromToken,
    toToken,
    refs: {
      lastInputRef,
      curFromTokenRef,
      curToTokenRef,
      curFromAmountRef,
      curToAmountRef,
    },
    updateAmountCommon,
  });
}
