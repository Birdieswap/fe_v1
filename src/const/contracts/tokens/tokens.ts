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
    [networks.sepolia.id]: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
    [networks.base.id]: "0x4200000000000000000000000000000000000006",
    [networks.baseFork.id]: "0x4200000000000000000000000000000000000006",
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 3,
  iconSrc: "/tokens/WETH.svg",
} as const);

const USDT = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "USDT",
  fullName: "Tether",
  addresses: {
    [networks.sepolia.id]: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    [networks.base.id]: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    [networks.baseFork.id]: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  },
  abi: erc20_abi,
  decimals: 6,
  displayDecimals: 2,
  iconSrc: "/tokens/USDT.svg",
} as const);

const USDC = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "USDC",
  fullName: "USD Coin",
  addresses: {
    [networks.sepolia.id]: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    [networks.base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    [networks.baseFork.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  abi: erc20_abi,
  decimals: 6,
  displayDecimals: 2,
  iconSrc: "/tokens/USDC.svg",
} as const);

const DAI = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "DAI",
  fullName: "Dai",
  addresses: {
    [networks.sepolia.id]: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 4,
  iconSrc: "/tokens/DAI.svg",
} as const);

const AAVE = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "AAVE",
  fullName: "Aave",
  addresses: {
    [networks.sepolia.id]: "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a",
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 4,
  iconSrc: "/tokens/AAVE.svg",
} as const);

const CBBTC = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "cbBTC",
  fullName: "Coinbase Wrapped BTC",
  addresses: {
    [networks.sepolia.id]: "0x29f2D40B0605204364af54EC677bD022dA425d03",
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
  USDT,
  USDC,
  DAI,
  AAVE,
  CBBTC,
};

export default tokens;
