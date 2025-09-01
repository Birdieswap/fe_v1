import { birdieLpVaults_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieLPFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import swapPools from "./swapPool";
import { contractAddresses } from "../contractAddresses";

const blpHarvestAutopilotWETHUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 500 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.USDC_WETH_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.USDC_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIE,
  swap: swapPools.blpUniswapHarvestAutopilotWETHUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotWETHUSDC,
  decimals: 8,
  displayDecimals: 6,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotCBBTCUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bcbBTCUSDC",
  fullName: "Birdieswap cbBTC 500 USDC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_USDC_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.CBBTC_USDC_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_USDC_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIE,
  swap: swapPools.blpUniswapHarvestAutopilotCBBTCUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCUSDC,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotCBBTCWETH = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bcbBTCWETH",
  fullName: "Birdieswap cbBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_WETH_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.CBBTC_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIE,
  swap: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotEURCUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bEURCUSDC",
  fullName: "Birdieswap EURC 500 USDC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.EURC_USDC_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.EURC_USDC_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.EURC_USDC_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIE,
  swap: swapPools.blpUniswapHarvestAutopilotEURCUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotEURCUSDC,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const lpVaults = {
  blpHarvestAutopilotWETHUSDC,
  blpHarvestAutopilotCBBTCUSDC,
  blpHarvestAutopilotCBBTCWETH,
  blpHarvestAutopilotEURCUSDC,
};

export default lpVaults;
