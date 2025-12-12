import { birdieLpVaults_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieLPFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import swapPools from "./swapPool";
import { contractAddresses } from "../contractAddresses";

const blpHarvestAutopilotETHUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .USDC_WETH_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .USDC_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Wrapper,
  swap: swapPools.blpUniswapHarvestAutopilotETHUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotETHUSDC,
  decimals: 8,
  displayDecimals: 6,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotWETHUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .USDC_WETH_VAULT as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .USDC_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  swap: swapPools.blpUniswapHarvestAutopilotWETHUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotWETHUSDC,
  decimals: 8,
  displayDecimals: 6,
  iconSrc: "/tokens/blp-token.svg",
} as const);

// const blpHarvestAutopilotCBBTCUSDC = BirdieLPFarmGuard({
//   type: EContractType.BIRDIE_LP,
//   symbol: "bcbBTCUSDC",
//   fullName: "Birdieswap cbBTC 500 USDC",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_USDC_VAULT as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_USDC_VAULT as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_USDC_VAULT as `0x${string}`,
//   },
//   abi: birdieLpVaults_abi,
//   provider: stakingProviders.BIRDIE,
//   swap: swapPools.blpUniswapHarvestAutopilotCBBTCUSDC,
//   lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCUSDC,
//   decimals: 8,
//   displayDecimals: 4,
//   iconSrc: "/tokens/blp-token.svg",
// } as const);

// const blpHarvestAutopilotCBBTCWETH = BirdieLPFarmGuard({
//   type: EContractType.BIRDIE_LP,
//   symbol: "bcbBTCWETH",
//   fullName: "Birdieswap cbBTC 3000 WETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_WETH_VAULT as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_WETH_VAULT as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_VAULT as `0x${string}`,
//   },
//   abi: birdieLpVaults_abi,
//   provider: stakingProviders.BIRDIE,
//   swap: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
//   lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
//   decimals: 8,
//   displayDecimals: 4,
//   iconSrc: "/tokens/blp-token.svg",
// } as const);

// const blpHarvestAutopilotCBBTCETH = BirdieLPFarmGuard({
//   type: EContractType.BIRDIE_LP,
//   symbol: "bcbBTCWETH",
//   fullName: "Birdieswap cbBTC 3000 WETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_WETH_VAULT as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_WETH_VAULT as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_VAULT as `0x${string}`,
//   },
//   abi: birdieLpVaults_abi,
//   provider: stakingProviders.BIRDIE,
//   swap: swapPools.blpUniswapHarvestAutopilotCBBTCETH,
//   lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCETH,
//   decimals: 8,
//   displayDecimals: 4,
//   iconSrc: "/tokens/blp-token.svg",
// } as const);

const blpHarvestAutopilotUSDCWBTC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bUSDCWBTC",
  fullName: "Birdieswap USDC 3000 WBTC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .WBTC_USDC_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .WBTC_USDC_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  swap: swapPools.blpUniswapHarvestAutopilotUSDCWBTC,
  lpPool: swapPools.blpUniswapHarvestAutopilotUSDCWBTC,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotWBTCWETH = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bWBTCWETH",
  fullName: "Birdieswap WBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .WBTC_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .WBTC_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  swap: swapPools.blpUniswapHarvestAutopilotWBTCWETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotWBTCWETH,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotWBTCETH = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bWBTCWETH",
  fullName: "Birdieswap WBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .WBTC_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .WBTC_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Wrapper,
  swap: swapPools.blpUniswapHarvestAutopilotWBTCETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotWBTCETH,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotiFARMWETH = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "biFARMWETH",
  fullName: "Birdieswap iFARM 10000 WETH",
  addresses: {
    [networks.base.id]: contractAddresses.base
      .IFARM_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .IFARM_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Router,
  swap: swapPools.blpUniswapHarvestAutopilotiFARMWETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotiFARMWETH,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const blpHarvestAutopilotiFARMETH = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "biFARMETH",
  fullName: "Birdieswap iFARM 10000 ETH",
  addresses: {
    [networks.base.id]: contractAddresses.base
      .IFARM_WETH_VAULT as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum
      .IFARM_WETH_VAULT as `0x${string}`,
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIESWAP_Wrapper,
  swap: swapPools.blpUniswapHarvestAutopilotiFARMETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotiFARMETH,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

// const blpHarvestAutopilotEURCUSDC = BirdieLPFarmGuard({
//   type: EContractType.BIRDIE_LP,
//   symbol: "bEURCUSDC",
//   fullName: "Birdieswap EURC 500 USDC",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.EURC_USDC_VAULT as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.EURC_USDC_VAULT as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.EURC_USDC_VAULT as `0x${string}`,
//   },
//   abi: birdieLpVaults_abi,
//   provider: stakingProviders.BIRDIE,
//   swap: swapPools.blpUniswapHarvestAutopilotEURCUSDC,
//   lpPool: swapPools.blpUniswapHarvestAutopilotEURCUSDC,
//   decimals: 8,
//   displayDecimals: 4,
//   iconSrc: "/tokens/blp-token.svg",
// } as const);

const lpVaults = {
  blpHarvestAutopilotWETHUSDC,
  blpHarvestAutopilotETHUSDC,
  blpHarvestAutopilotUSDCWBTC,
  blpHarvestAutopilotWBTCWETH,
  blpHarvestAutopilotWBTCETH,
  blpHarvestAutopilotiFARMWETH,
  blpHarvestAutopilotiFARMETH,
  // blpHarvestAutopilotCBBTCUSDC,
  // blpHarvestAutopilotCBBTCWETH,
  // blpHarvestAutopilotCBBTCETH,
  // blpHarvestAutopilotEURCUSDC,
};

export default lpVaults;
