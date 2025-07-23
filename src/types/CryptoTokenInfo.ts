import { IToken } from "@/const/contracts/types/tokenTypes";

export type HexString = `0x${string}`;

export type CryptoTokenInfo = {
  decimals: number;
  wip_token?: IToken;
  /**
   * The number of decimals to display
   */
  displayDecimals?: number;
  symbol: string;
  iconSrc?: string;
};
