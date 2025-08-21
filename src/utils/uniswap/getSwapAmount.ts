import { ContractFunctionParameters, PublicClient } from "viem";

import { uniswapQuoterV2Abi } from "@/const/contracts/abis/uniswap_quoter_v2_abi";
import miscContracts from "@/const/contracts/tokens/others";
import { simulateContract } from "viem/actions";

type QuoteLog = {
  tag?: string;
  tokenIn?: string;
  tokenOut?: string;
  fee?: number;
  amountIn?: bigint;
  amount?: bigint;
  sqrtPriceLimitX96?: bigint;
};

export async function getMinimumAmountOut() {}

export async function quoteExactInputSingle(
  publicClient: PublicClient,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  fee: number,
  sqrtPriceLimitX96?: bigint,
  debug?: QuoteLog
) {
  const chainId = publicClient.chain?.id;

  if (!chainId) return null;
  const quoter = miscContracts.UniswapQuoterV2;
  const quoterAddress = quoter.addresses[chainId];

  if (!quoterAddress) return null;
  const args: ContractFunctionParameters<
    typeof uniswapQuoterV2Abi,
    "nonpayable",
    "quoteExactInputSingle",
    [
      {
        tokenIn: `0x${string}`; // tokenIn
        tokenOut: `0x${string}`; // tokenOut
        fee: number; // fee
        amountIn: bigint; // amountIn
        sqrtPriceLimitX96: bigint; // sqrtPriceLimitX96
      },
    ]
  > = {
    address: quoterAddress,
    abi: uniswapQuoterV2Abi,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        sqrtPriceLimitX96: sqrtPriceLimitX96 || BigInt(0), // Default to 0 if not provided
      },
    ],
  };

  if (debug) {
    console.warn("[QuoterV2 exactInput] call", {
      ...debug,
      tokenIn,
      tokenOut,
      fee,
      amountIn: amountIn.toString(),
      sqrtPriceLimitX96: (sqrtPriceLimitX96 || BigInt(0)).toString(),
    });
  }

  const data = await simulateContract(publicClient, args);

  const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
    data.result;

    if (debug) {
    console.warn("[QuoterV2 exactInput] result", {
      amountOut: amountOut.toString(),
      sqrtPriceX96After: sqrtPriceX96After.toString(),
      initializedTicksCrossed,
      gasEstimate: gasEstimate.toString(),
    });
  }

  return {
    amountOut,
    sqrtPriceX96After,
    initializedTicksCrossed,
    gasEstimate,
  };
}

export async function quoteExactOutputSingle(
  publicClient: PublicClient,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amount: bigint,
  fee: number,
  sqrtPriceLimitX96?: bigint,
  debug?: QuoteLog
) {
  const chainId = publicClient.chain?.id;

  if (!chainId) return null;
  const quoter = miscContracts.UniswapQuoterV2;
  const quoterAddress = quoter.addresses[chainId];

  if (!quoterAddress) return null;
  
  const args: ContractFunctionParameters<
    typeof uniswapQuoterV2Abi,
    "nonpayable",
    "quoteExactOutputSingle",
    [
      {
        tokenIn: `0x${string}`; // tokenIn
        tokenOut: `0x${string}`; // tokenOut
        fee: number; // fee
        amount: bigint; // amountIn
        sqrtPriceLimitX96: bigint; // sqrtPriceLimitX96
      },
    ]
  > = {
    address: quoterAddress,
    abi: uniswapQuoterV2Abi,
    functionName: "quoteExactOutputSingle",
    args: [
      {
        tokenIn,
        tokenOut,
        fee,
        amount ,
        sqrtPriceLimitX96: sqrtPriceLimitX96 || BigInt(0), // Default to 0 if not provided
      },
    ],
  };

    if (debug) {
    console.warn("[QuoterV2 exactOutput] call", {
      ...debug,
      tokenIn,
      tokenOut,
      fee,
      amount: amount.toString(),
      sqrtPriceLimitX96: (sqrtPriceLimitX96 || BigInt(0)).toString(),
    });
  }

  const data = await simulateContract(publicClient, args);

  const [amountIn, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
    data.result;

  if (debug) {
    console.warn("[QuoterV2 exactOutput] result", {
      amountIn: amountIn.toString(),
      sqrtPriceX96After: sqrtPriceX96After.toString(),
      initializedTicksCrossed,
      gasEstimate: gasEstimate.toString(),
    });
  }

  return {
    amountIn,
    sqrtPriceX96After,
    initializedTicksCrossed,
    gasEstimate,
  };
}
