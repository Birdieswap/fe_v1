import { erc20_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieSingleFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import tokens from "./tokens";
import { contractAddresses } from "../contractAddresses";

const bHarvestAutopilotETH = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bWETH",
  fullName: "Birdieswap WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.ETH_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.ETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .ETH_VAULT as `0x${string}`,
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIESWAP_Wrapper,
  input: tokens.ETH,
  decimals: 18,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const bHarvestAutopilotWETH = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bWETH",
  fullName: "Birdieswap WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .WETH_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .WETH_VAULT as `0x${string}`,
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  input: tokens.WETH,
  decimals: 18,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

// const bHarvestAutopilotCBBTC = BirdieSingleFarmGuard({
//   type: EContractType.BIRDIE_SINGLE,
//   symbol: "bcbBTC",
//   fullName: "Birdieswap cbBTC",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_VAULT as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_VAULT as `0x${string}`,
//   },
//   abi: erc20_abi,
//   provider: stakingProviders.BIRDIE,
//   input: tokens.CBBTC,
//   decimals: 8,
//   displayDecimals: 4,
//   iconSrc: "/tokens/b-token.svg",
// } as const);

const bHarvestAutopilotWBTC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bWBTC",
  fullName: "Birdieswap WBTC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .WBTC_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .WBTC_VAULT as `0x${string}`,
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  input: tokens.WBTC,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const bHarvestAutopilotUSDC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bUSDC",
  fullName: "Birdieswap USDC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .USDC_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .USDC_VAULT as `0x${string}`,
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  input: tokens.USDC,
  decimals: 6,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const bHarvestAutopilotFARM = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bFARM",
  fullName: "Birdieswap FARM",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .FARM_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.FARM_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .FARM_VAULT as `0x${string}`,
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  input: tokens.FARM,
  decimals: 18,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const bHarvestAutopilotEURC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bEURC",
  fullName: "Birdieswap EURC",
  addresses: {
    // [networks.sepolia.id]: contractAddresses.sepolia
    //   .EURC_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.EURC_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .EURC_VAULT as `0x${string}`,
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  input: tokens.EURC,
  decimals: 6,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const singleVaults = {
  bHarvestAutopilotETH,
  bHarvestAutopilotWETH,
  // bHarvestAutopilotCBBTC,
  bHarvestAutopilotWBTC,
  bHarvestAutopilotUSDC,
  bHarvestAutopilotEURC,
  bHarvestAutopilotFARM,
};

export default singleVaults;
