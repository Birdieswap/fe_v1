import { erc20Abi } from "viem";

import {
  IBirdieSingleFarm,
  EContractType,
  ISwapPool,
} from "../types/tokenTypes";
import { SwapPoolGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import singleVaults from "./singleVaults";
import { contractAddresses } from "../contractAddresses";

const blpUniswapHarvestAutopilotWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.USDC_WETH_POOL as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC_WETH_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.USDC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotWETH,
    singleVaults.bHarvestAutopilotUSDC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.USDC_WETH_POOL as `0x${string}`,
    [networks.base.id]: contractAddresses.base.USDC_WETH_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.USDC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotETH,
    singleVaults.bHarvestAutopilotUSDC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotCBBTCUSDC = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bcbBTCUSDC",
//   fullName: "Birdieswap cbBTC 500 USDC",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_USDC_POOL as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_USDC_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_USDC_POOL as `0x${string}`,
//   },
//   decimals: 8,
//   fee_tier : 500,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotCBBTC,
//     singleVaults.bHarvestAutopilotUSDC,
//   ],
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotCBBTCWETH = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bcbBTCWETH",
//   fullName: "Birdieswap cbBTC 3000 WETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_WETH_POOL as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_WETH_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_POOL as `0x${string}`,
//   },
//   decimals: 8,
//   fee_tier : 3000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotCBBTC,
//     singleVaults.bHarvestAutopilotWETH,
//   ],
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotCBBTCETH = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bcbBTCWETH",
//   fullName: "Birdieswap cbBTC 3000 WETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_WETH_POOL as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.CBBTC_WETH_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_POOL as `0x${string}`,
//   },
//   decimals: 8,
//   fee_tier : 3000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotCBBTC,
//     singleVaults.bHarvestAutopilotETH,
//   ],
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotEURCUSDC = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bEURCUSDC",
//   fullName: "Birdieswap EURC 500 USDC",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia.EURC_USDC_POOL as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.EURC_USDC_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum.EURC_USDC_POOL as `0x${string}`,
//   },
//   decimals: 8,
//   fee_tier : 500,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotEURC,
//     singleVaults.bHarvestAutopilotUSDC,
//   ],
// } as const satisfies ISwapPool<IBirdieSingleFarm>);
const blpUniswapHarvestAutopilotUSDCWBTC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUSDCWBTC",
  fullName: "Birdieswap USDC 3000 WBTC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.WBTC_USDC_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WBTC_USDC_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotUSDC,
    singleVaults.bHarvestAutopilotWBTC,    
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotWBTCWETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bWBTCWETH",
  fullName: "Birdieswap WBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.WBTC_WETH_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WBTC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotWBTC,
    singleVaults.bHarvestAutopilotWETH,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotWBTCETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bWBTCWETH",
  fullName: "Birdieswap WBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.WBTC_WETH_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WBTC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotWBTC,
    singleVaults.bHarvestAutopilotETH,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);



const swapPools = {

  blpUniswapHarvestAutopilotWETHUSDC,
  blpUniswapHarvestAutopilotETHUSDC,
  // blpUniswapHarvestAutopilotCBBTCUSDC,
  // blpUniswapHarvestAutopilotCBBTCWETH,
  // blpUniswapHarvestAutopilotCBBTCETH,
  // blpUniswapHarvestAutopilotEURCUSDC,
  blpUniswapHarvestAutopilotUSDCWBTC,
  blpUniswapHarvestAutopilotWBTCWETH,
  blpUniswapHarvestAutopilotWBTCETH,
};

export default swapPools;
