import { PublicClient } from "viem";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieLPFarm,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

import getTokenAddress from "../assets/getTokenAddress";
import getUniswapTokenFromIToken from "../uniswap/getUniswapTokenFromIToken";
import { getUnlockedTokenAmountsFromLiquidity } from "../uniswap/getUnlockedTokenAmountsFromLiquidity";
import previewRedeem from "./previewRedeem";
import totalDualUnderlyingTokens from "./totalDualUnderlyingTokens";

async function getPreviewRedeemAmountSingle(
  client: PublicClient,
  farm: IBirdieSingleFarm,
  amount: BigDecimal,
): Promise<{
  bTokenAmount: BigDecimal | null;
  tokenAmount: BigDecimal | null;
} | null> {
  const tokenAmount = await previewRedeem(client, farm, amount);

  return {
    bTokenAmount: amount,
    tokenAmount,
  };
}

// async function getBTokenAmountFromLP(
//   client: PublicClient,
//   swapPoolAddress: `0x${string}`,
//   bToken0: IBirdieSingleFarm,
//   bToken1: IBirdieSingleFarm,
//   lpAmount: BigDecimal | null,
//   chainId: number,
// ): Promise<[BigDecimal | null, BigDecimal | null]> {
//   const ubToken0 = getUniswapTokenFromIToken(bToken0, chainId);
//   const ubToken1 = getUniswapTokenFromIToken(bToken1, chainId);

//   if (!lpAmount) return [null, null];
//   if (!ubToken0 || !ubToken1) return [null, null];

//   return await getUnlockedTokenAmountsFromLiquidity(
//     client,
//     swapPoolAddress,
//     ubToken0,
//     ubToken1,
//     lpAmount.value,
//   ).then(({ amount0, amount1 }) => {
//     return [
//       new BigDecimal(BigInt(amount0), ubToken0.decimals),
//       new BigDecimal(BigInt(amount1), ubToken1.decimals),
//     ];
//   });
// }

async function getPreviewRedeemAmountLP(
  client: PublicClient,
  farm: IBirdieLPFarm,
): Promise<{
  data : any
} | null> {
  const chainId = client.chain?.id;

  if (!chainId) return null;
  // const farmAddress = getTokenAddress({
  //   token: farm,
  //   chainId,
  // });

  // if (!farmAddress) return null;
  // const swapPool = farm.swap;
  // const swapPoolAddress = getTokenAddress({
  //   token: swapPool,
  //   chainId,
  // });

  // if (!swapPoolAddress) return null;
  // const bToken0 = farm.swap.input[0];
  // const bToken1 = farm.swap.input[1];
  const lpAmount = await totalDualUnderlyingTokens(client, farm);

  // const bTokenAmount = await getBTokenAmountFromLP(
  //   client,
  //   swapPoolAddress,
  //   bToken0,
  //   bToken1,
  //   lpAmount,
  //   chainId,
  // );

  // const tokenAmount = await Promise.all([
  //   bTokenAmount[0]
  //     ? await previewRedeem(client, bToken0, bTokenAmount[0])
  //     : null,
  //   bTokenAmount[1]
  //     ? await previewRedeem(client, bToken1, bTokenAmount[1])
  //     : null,
  // ]);

  return lpAmount as any
  //{
    // blpAmount: amount,
    // lpAmount,
    // bTokenAmount,
    // tokenAmount,
  //};
}

// export async function getPreviewRedeemAmount(
//   client: PublicClient,
//   farm: IBirdieLPFarm,
// ):  Promise<{
//   data : any
// } | null> ;
// export async function getPreviewRedeemAmount(
//   client: PublicClient,
//   farm: IBirdieSingleFarm,
//   amount: BigDecimal,
// ): Promise<{
//   bTokenAmount: BigDecimal | null;
//   tokenAmount: BigDecimal | null;
// } | null>;

export async function getPreviewRedeemAmount(
  client: PublicClient,
  farm: IBirdieLPFarm | IBirdieSingleFarm,
  amount: BigDecimal,
) {
  if (isBirdieLPFarm(farm)) {
    return getPreviewRedeemAmountLP(client, farm);
  } else {
    return getPreviewRedeemAmountSingle(client, farm, amount);
  }
}
