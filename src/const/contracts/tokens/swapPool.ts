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
import { contractAddresses, pool_tokenIds } from "../contractAddresses";

const blpUniswapHarvestAutopilotWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .USDC_WETH_POOL as `0x${string}`,
    [networks.giwa.id]: contractAddresses.giwa
      .USDC_WETH_POOL as `0x${string}`,
    // [networks.base.id]: contractAddresses.base.USDC_WETH_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum
    //   .USDC_WETH_POOL as `0x${string}`,
  },
  decimals: 18,
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotWETH,
    singleVaults.bHarvestAutopilotUSDC,
  ],
  lpVaultKey: "blpHarvestAutopilotWETHUSDC",
  tokenId: {
    [networks.sepolia.id]: pool_tokenIds.sepolia.USDC_WETH_TOKEN_ID as
      | string
      | number,
    [networks.giwa.id]: pool_tokenIds.giwa.USDC_WETH_TOKEN_ID as
      | string
      | number,
    // [networks.base.id]: pool_tokenIds.base.USDC_WETH_TOKEN_ID as
    //   | string
    //   | number,
  },
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .USDC_WETH_POOL as `0x${string}`,
    [networks.giwa.id]: contractAddresses.giwa
      .USDC_WETH_POOL as `0x${string}`,
    // [networks.base.id]: contractAddresses.base.USDC_WETH_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum
    //   .USDC_WETH_POOL as `0x${string}`,
  },
  decimals: 18,
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotETH,
    singleVaults.bHarvestAutopilotUSDC,
  ],
  lpVaultKey: "blpHarvestAutopilotWETHUSDC",
  tokenId: {
    [networks.sepolia.id]: pool_tokenIds.sepolia.USDC_WETH_TOKEN_ID as
      | string
      | number,
    [networks.giwa.id]: pool_tokenIds.giwa.USDC_WETH_TOKEN_ID as
      | string
      | number,
    // [networks.base.id]: pool_tokenIds.base.USDC_WETH_TOKEN_ID as
    //   | string
    //   | number,
  },
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

const blpUniswapHarvestAutopilotCBBTCWETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bcbBTCWETH",
  fullName: "Birdieswap cbBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .CBBTC_WETH_POOL as `0x${string}`,
    // [networks.base.id]: contractAddresses.base.CBBTC_WETH_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotCBBTC,
    singleVaults.bHarvestAutopilotWETH,
  ],
  lpVaultKey: "blpHarvestAutopilotCBBTCWETH",
  tokenId: {
    [networks.sepolia.id]: pool_tokenIds.sepolia.CBBTC_WETH_TOKEN_ID as
      | string
      | number,
    // [networks.base.id]: pool_tokenIds.base.CBBTC_WETH_TOKEN_ID as
    //   | string
    //   | number,
  },
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotCBBTCETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bcbBTCWETH",
  fullName: "Birdieswap cbBTC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .CBBTC_WETH_POOL as `0x${string}`,
    // [networks.base.id]: contractAddresses.base.CBBTC_WETH_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_POOL as `0x${string}`,
  },
  decimals: 18,
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotCBBTC,
    singleVaults.bHarvestAutopilotETH,
  ],
  lpVaultKey: "blpHarvestAutopilotCBBTCWETH",
  tokenId: {
    [networks.sepolia.id]: pool_tokenIds.sepolia.CBBTC_WETH_TOKEN_ID as
      | string
      | number,
    // [networks.base.id]: pool_tokenIds.base.CBBTC_WETH_TOKEN_ID as
    //   | string
    //   | number,
  },
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotEURCUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bEURCUSDC",
  fullName: "Birdieswap EURC 500 USDC",
  addresses: {
    // [networks.sepolia.id]: contractAddresses.sepolia
    //   .EURC_USDC_POOL as `0x${string}`,
    [networks.base.id]: contractAddresses.base.EURC_USDC_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum
    //   .EURC_USDC_POOL as `0x${string}`,
  },
  decimals: 18,
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotEURC,
    singleVaults.bHarvestAutopilotUSDC,
  ],
  lpVaultKey: "blpHarvestAutopilotEURCUSDC",
  tokenId: {
    [networks.base.id]: pool_tokenIds.base.EURC_USDC_TOKEN_ID as
      | string
      | number,
  },
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotEURCWETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bEURCWETH",
  fullName: "Birdieswap EURC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .EURC_WETH_POOL as `0x${string}`,
    // [networks.base.id]: contractAddresses.base.EURC_WETH_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum.EURC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotEURC,
    singleVaults.bHarvestAutopilotWETH,
  ],
  lpVaultKey: "blpHarvestAutopilotEURCWETH",
  tokenId: {
    [networks.sepolia.id]: pool_tokenIds.sepolia.EURC_WETH_TOKEN_ID as
      | string
      | number,
    // [networks.base.id]: pool_tokenIds.base.EURC_WETH_TOKEN_ID as
    //   | string
    //   | number,
  },
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotEURCETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bEURCETH",
  fullName: "Birdieswap EURC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia
      .EURC_WETH_POOL as `0x${string}`,
    // [networks.base.id]: contractAddresses.base.EURC_WETH_POOL as `0x${string}`,
    // [networks.arbitrum.id]: contractAddresses.arbitrum.EURC_WETH_POOL as `0x${string}`,
  },
  decimals: 18,
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotEURC,
    singleVaults.bHarvestAutopilotETH,
  ],
  lpVaultKey: "blpHarvestAutopilotEURCWETH",
  tokenId: {
    [networks.sepolia.id]: pool_tokenIds.sepolia.EURC_WETH_TOKEN_ID as
      | string
      | number,
    // [networks.base.id]: pool_tokenIds.base.EURC_WETH_TOKEN_ID as
    //   | string
    //   | number,
  },
} as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotUSDCWBTC = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bUSDCWBTC",
//   fullName: "Birdieswap USDC 3000 WBTC",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia
//       .WBTC_USDC_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum
//       .WBTC_USDC_POOL as `0x${string}`,
//   },
//   decimals: 18,
//   fee_tier: 3000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotUSDC,
//     singleVaults.bHarvestAutopilotWBTC,
//   ],
//   lpVaultKey: "blpHarvestAutopilotUSDCWBTC",
//   tokenId: {
//     [networks.sepolia.id]: pool_tokenIds.sepolia.WBTC_USDC_TOKEN_ID as
//       | string
//       | number,
//   },
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotWBTCWETH = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bWBTCWETH",
//   fullName: "Birdieswap WBTC 3000 WETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia
//       .WBTC_WETH_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum
//       .WBTC_WETH_POOL as `0x${string}`,
//   },
//   decimals: 18,
//   fee_tier: 3000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotWBTC,
//     singleVaults.bHarvestAutopilotWETH,
//   ],
//   lpVaultKey: "blpHarvestAutopilotWBTCWETH",
//   tokenId: {
//     [networks.sepolia.id]: pool_tokenIds.sepolia.WBTC_WETH_TOKEN_ID as
//       | string
//       | number,
//   },
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotWBTCETH = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bWBTCWETH",
//   fullName: "Birdieswap WBTC 3000 WETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia
//       .WBTC_WETH_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum
//       .WBTC_WETH_POOL as `0x${string}`,
//   },
//   decimals: 18,
//   fee_tier: 3000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotWBTC,
//     singleVaults.bHarvestAutopilotETH,
//   ],
//   lpVaultKey: "blpHarvestAutopilotWBTCWETH",
//   tokenId: {
//     [networks.sepolia.id]: pool_tokenIds.sepolia.WBTC_WETH_TOKEN_ID as
//       | string
//       | number,
//   },
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotFARMWETH = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bFARMETH",
//   fullName: "Birdieswap FARM 10000 ETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia
//       .FARM_WETH_POOL as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.FARM_WETH_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum
//       .FARM_WETH_POOL as `0x${string}`,
//   },
//   decimals: 18,
//   fee_tier: 10000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotFARM,
//     singleVaults.bHarvestAutopilotWETH,
//   ],
//   lpVaultKey: "blpHarvestAutopilotFARMWETH",
//   tokenId: {
//     [networks.sepolia.id]: pool_tokenIds.sepolia.FARM_WETH_TOKEN_ID as
//       | string
//       | number,
//     [networks.base.id]: pool_tokenIds.base.FARM_WETH_TOKEN_ID as
//       | string
//       | number,
//   },
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

// const blpUniswapHarvestAutopilotFARMETH = SwapPoolGuard({
//   type: EContractType.SWAP,
//   symbol: "bFARMETH",
//   fullName: "Birdieswap FARM 10000 ETH",
//   addresses: {
//     [networks.sepolia.id]: contractAddresses.sepolia
//       .FARM_WETH_POOL as `0x${string}`,
//     [networks.base.id]: contractAddresses.base.FARM_WETH_POOL as `0x${string}`,
//     [networks.arbitrum.id]: contractAddresses.arbitrum
//       .FARM_WETH_POOL as `0x${string}`,
//   },
//   decimals: 18,
//   fee_tier: 10000,
//   abi: erc20Abi,
//   provider: stakingProviders.UNISWAP,
//   protocol: "Uniswap V3",
//   isInternal: true,
//   input: [
//     singleVaults.bHarvestAutopilotFARM,
//     singleVaults.bHarvestAutopilotETH,
//   ],
//   lpVaultKey: "blpHarvestAutopilotFARMWETH",
//   tokenId: {
//     [networks.sepolia.id]: pool_tokenIds.sepolia.FARM_WETH_TOKEN_ID as
//       | string
//       | number,
//     [networks.base.id]: pool_tokenIds.base.FARM_WETH_TOKEN_ID as
//       | string
//       | number,
//   },
// } as const satisfies ISwapPool<IBirdieSingleFarm>);

const swapPools = {
  blpUniswapHarvestAutopilotWETHUSDC,
  blpUniswapHarvestAutopilotETHUSDC,
  // blpUniswapHarvestAutopilotCBBTCUSDC,
  blpUniswapHarvestAutopilotCBBTCWETH,
  blpUniswapHarvestAutopilotCBBTCETH,
  blpUniswapHarvestAutopilotEURCUSDC,
  blpUniswapHarvestAutopilotEURCWETH,
  blpUniswapHarvestAutopilotEURCETH,
  // blpUniswapHarvestAutopilotUSDCWBTC,
  // blpUniswapHarvestAutopilotWBTCWETH,
  // blpUniswapHarvestAutopilotWBTCETH,
  // blpUniswapHarvestAutopilotFARMWETH,
  // blpUniswapHarvestAutopilotFARMETH,
};

export default swapPools;
