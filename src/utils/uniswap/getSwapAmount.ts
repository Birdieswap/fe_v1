import { ContractFunctionParameters, PublicClient } from "viem";

import { uniswapQuoterV2Abi } from "@/const/contracts/abis/uniswap_quoter_v2_abi";
import miscContracts from "@/const/contracts/tokens/others";
import { simulateContract } from "viem/actions";

export async function getMinimumAmountOut() {}

export async function quoteExactInputSingle(
  publicClient: PublicClient,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  fee: number,
  sqrtPriceLimitX96?: bigint,
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

  const data = await simulateContract(publicClient, args);

  const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
    data.result;

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
        amount,
        sqrtPriceLimitX96: sqrtPriceLimitX96 || BigInt(0), // Default to 0 if not provided
      },
    ],
  };

  const data = await simulateContract(publicClient, args);

  const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
    data.result;

  return {
    amountOut,
    sqrtPriceX96After,
    initializedTicksCrossed,
    gasEstimate,
  };
}
