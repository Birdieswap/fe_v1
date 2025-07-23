import { Token } from "@uniswap/sdk-core";

import { IToken } from "@/const/contracts/types/tokenTypes";

import getTokenAddress from "../assets/getTokenAddress";

export default function getUniswapTokenFromIToken(
  token?: IToken,
  chainId?: number,
) {
  if (!token || !chainId) return null;
  const tokenAddress = getTokenAddress({
    token: token,
    chainId,
  });

  if (!tokenAddress) return null;

  return new Token(
    chainId,
    tokenAddress,
    token.decimals,
    token.symbol,
    token.fullName,
  );
}
