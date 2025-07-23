import { IToken } from "@/const/contracts/types/tokenTypes";

export default function isAmountInputValid(
  amount: string,
  token: IToken,
): boolean {
  if (!amount.match(/^\d+(\.\d+)?$/)) {
    return false;
  }
  const decimalPart = amount.split(".")[1];

  if (decimalPart && decimalPart.length > (token.decimals ?? 18)) {
    return false;
  }

  return true;
}
