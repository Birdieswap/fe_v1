import { CryptoTokenInfo } from "@/types/CryptoTokenInfo";

import tokens from "./contracts/tokens/tokens";

const AAVE: CryptoTokenInfo = {
  iconSrc: "/tokens/AAVE.svg",
  symbol: "AAVE",
  decimals: 18,
  displayDecimals: 2,
};

const BIRDIE: CryptoTokenInfo = {
  iconSrc: "/tokens/Birdie.svg",
  symbol: "Birdie",
  decimals: 18,
  displayDecimals: 2,
};

export const TokenInfo = {
  AAVE,
  BIRDIE,
};

export const SwapTokens = [
  tokens.WETH,
  tokens.USDC,
  tokens.ETH,
  //tokens.USDT,
  //tokens.AAVE,
  tokens.CBBTC,
  //tokens.DAI,
];

export default TokenInfo;
