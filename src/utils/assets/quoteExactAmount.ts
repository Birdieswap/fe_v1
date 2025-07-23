import { PublicClient } from "viem";

import {
  quoteExactInputSingle,
  quoteExactOutputSingle,
} from "../uniswap/getSwapAmount";

const UINT150_MAX = BigInt(2) >> (BigInt(150) - BigInt(1));

export async function quoteExactAmount(
  client: PublicClient,
  token0Address: `0x${string}`,
  token1Address: `0x${string}`,
  amountAddress: `0x${string}`,
  side: "in" | "out",
  amount: bigint,
  fee: number = 3000,
) {
  if (side === "in") {
    // getting the amount of token we can buy with the input token
    if (amountAddress === token0Address) {
      // selling token0 for token1
      return await quoteExactInputSingle(
        client,
        token0Address,
        token1Address,
        amount,
        fee,
        BigInt(0), // Default to no price limit
      ).then((v) =>
        v
          ? {
              ...v,
              amountIn: amount,
            }
          : null,
      );
    } else {
      // selling token1 for token0
      return await quoteExactInputSingle(
        client,
        token1Address,
        token0Address,
        amount,
        fee,
        UINT150_MAX, // Default to no price limit
      ).then((v) =>
        v
          ? {
              ...v,
              amountIn: amount,
            }
          : null,
      );
    }
  } else {
    // getting the amount of input token we need to buy the output token
    if (amountAddress === token0Address) {
      // buying token0 with token1
      return await quoteExactOutputSingle(
        client,
        token1Address,
        token0Address,
        amount,
        fee,
        UINT150_MAX, // Default to no price limit
      ).then((v) =>
        v
          ? {
              ...v,
              amountOut: amount,
            }
          : null,
      );
    } else {
      // buying token1 with token0
      return await quoteExactOutputSingle(
        client,
        token0Address,
        token1Address,
        amount,
        fee,
        BigInt(0), // Default to no price limit
      ).then((v) =>
        v
          ? {
              ...v,
              amountOut: amount,
            }
          : null,
      );
    }
  }
}
