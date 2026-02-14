import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import type { ICurrency } from "@/const/contracts/types/tokenTypes";

export const ENTER_INPUT_TOKENS: ICurrency[] = [
  externalTokens.ETH,
  tokens.USDC,
  tokens.EURC,
];
export const PAY_INPUT_TOKENS: ICurrency[] = [tokens.USDC, tokens.EURC];
