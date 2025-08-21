import { erc20_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { CurrencyGuard } from "../types/typeGuards";
import networks from "../networks";

// TODO: handle ETH as a special case
const ETH = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "ETH",
  fullName: "Ethereum",
  addresses: {
    [networks.sepolia.id]: "0x0000000000000000000000000000000000000000",
    [networks.base.id]: "0x0000000000000000000000000000000000000000",
    [networks.baseFork.id]: "0x0000000000000000000000000000000000000000",
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 3,
  iconSrc: "/tokens/ETH.svg",
} as const);

const WETH = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "WETH",
  fullName: "Wrapped ETH",
  addresses: {
    [networks.sepolia.id]: "0x2f7fFe5C83EC900B7138197CB72C75bCAa5CA54e",
    [networks.base.id]: "0x4200000000000000000000000000000000000006",
    [networks.baseFork.id]: "0x4200000000000000000000000000000000000006",
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 3,
  iconSrc: "/tokens/WETH.svg",
} as const);

const USDC = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "USDC",
  fullName: "USD Coin",
  addresses: {
    [networks.sepolia.id]: "0x5b1B56533128A23b8908d58f32Ee05b65ecF9FFF",
    [networks.base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    [networks.baseFork.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  abi: erc20_abi,
  decimals: 6,
  displayDecimals: 2,
  iconSrc: "/tokens/USDC.svg",
} as const);

const CBBTC = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "cbBTC",
  fullName: "Coinbase Wrapped BTC",
  addresses: {
    [networks.sepolia.id]: "0x25554f552a72D1263a868D8BE2BC50096b2953Eb",
    [networks.base.id]: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    [networks.baseFork.id]: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  },
  abi: erc20_abi,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/CBBTC.svg",
} as const);





const tokens = {
  ETH,
  WETH,
  USDC,
  CBBTC,
};

export default tokens;
