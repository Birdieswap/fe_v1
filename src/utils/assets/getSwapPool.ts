import swapPools from "@/const/contracts/tokens/swapPool";
import {
  isBirdieSingleFarm,
  IBirdieSingleFarm,
  ICurrency,
  EProvider,
} from "@/const/contracts/types/tokenTypes";

import getBToken from "./getBToken";

const swapPool = Object.values(swapPools).filter((pool) => !pool.isInternal);

export default function getSwapPool<
  T extends ICurrency | IBirdieSingleFarm,
>(props: { fromToken: T; toToken: T; chainId: number; provider?: EProvider }) {
  const { fromToken, toToken, chainId } = props;

  if (!fromToken || !toToken || !chainId) return null;
  const fromBToken = isBirdieSingleFarm(fromToken)
    ? fromToken
    : getBToken({
        token: fromToken,
        chainId,
        provider: props.provider,
      });
  const toBToken = isBirdieSingleFarm(toToken)
    ? toToken
    : getBToken({
        token: toToken,
        chainId,
        provider: props.provider,
      });
  const fromBTokenAddress = fromBToken?.addresses[chainId];
  const toBTokenAddress = toBToken?.addresses[chainId];

  if (!fromBTokenAddress || !toBTokenAddress) return null;
  const pool = swapPool.find((pool) => {
    const poolAddress0 = pool.input[0].addresses[chainId];
    const poolAddress1 = pool.input[1].addresses[chainId];

    return (
      (poolAddress0 === fromBTokenAddress &&
        poolAddress1 === toBTokenAddress) ||
      (poolAddress0 === toBTokenAddress && poolAddress1 === fromBTokenAddress)
    );
  });

  return pool ? pool : null;
}
