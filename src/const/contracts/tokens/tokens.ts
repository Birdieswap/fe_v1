import { erc20_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { CurrencyGuard } from "../types/typeGuards";
import networks from "../networks";
import { contractAddresses } from "../contractAddresses";

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
    [networks.sepolia.id]: contractAddresses.sepolia.WETH as `0x${string}`,
    [networks.base.id]: contractAddresses.base.WETH as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WETH as `0x${string}`,
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 6,
  iconSrc: "/tokens/WETH.svg",
} as const);

const USDC = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "USDC",
  fullName: "USD Coin",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.USDC as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.USDC as `0x${string}`,
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
    [networks.sepolia.id]: contractAddresses.sepolia.CBBTC as `0x${string}`,
    [networks.base.id]: contractAddresses.base.CBBTC as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC as `0x${string}`,
  },
  abi: erc20_abi,
  decimals: 8,
  displayDecimals: 6,
  iconSrc: "/tokens/CBBTC.svg",
} as const);

const tokens = {
  ETH,
  WETH,
  USDC,
  CBBTC,
};

export default tokens;
