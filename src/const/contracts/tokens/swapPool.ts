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

/*
const bUniswapAaveWETHUSDT = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUniswapAaveWETHUSDT",
  fullName: "bUniswapAaveWETHUSDT",
  addresses: {
    [networks.sepolia.id]: "0xB2D57566F1A094f7a92A02ceB923af66c159d8AE",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [singleVaults.bAaveWETH, singleVaults.bAaveUSDT],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const bUniswapAaveWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUniswapAaveWETHUSDC",
  fullName: "bUniswapAaveWETHUSDC",
  addresses: {
    [networks.sepolia.id]: "0xEbb6910c2d4858EF1F954E9331C7899B8AAb8f94",
    [networks.baseFork.id]: "0x93b95e8e7afb03c51f058326795fcba5a7dfd414",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [singleVaults.bAaveWETH, singleVaults.bAaveUSDC],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const bUniswapAaveCBBTCUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUniswapAaveCBBTCUSDC",
  fullName: "bUniswapAaveCBBTCUSDC",
  addresses: {
    [networks.baseFork.id]: "0x2ce42c94d452a695d0479805967ec436743744ce",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [singleVaults.bAaveCBBTC, singleVaults.bAaveUSDC],
} as const);

const bUniswapAaveWETHCBBTC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUniswapAaveWETHCBBTC",
  fullName: "bUniswapAaveWETHCBBTC",
  addresses: {
    [networks.sepolia.id]: "0xcB8F55BfD90fE6D09eA76d9Fd6a1E693BAa8c7Ec",
    [networks.baseFork.id]: "0x43F723c8Ca791D87512e1E93bb22d9302Ca71B39",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [singleVaults.bAaveWETH, singleVaults.bAaveCBBTC],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapAaveWETHCBBTC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapAaveWETHCBBTC",
  fullName: "blpUniswapAaveWETHCBBTC",
  addresses: {
    [networks.sepolia.id]: "0xBB14D5762BD7329820A029afEF171386B057F088",
    [networks.baseFork.id]: "0x0Fb81d08A1a204379f80d58830D3717369beD911",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [singleVaults.bAaveWETH, singleVaults.bAaveCBBTC],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapAaveWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapAaveWETHUSDC",
  fullName: "blpUniswapAaveWETHUSDC",
  addresses: {
    [networks.baseFork.id]: "0x7a8450C8EFb2e3bD45E3fd8952e2f7c8473e40b6",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [singleVaults.bAaveWETH, singleVaults.bAaveUSDC],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapAaveCBBTCUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapAaveCBBTCUSDC",
  fullName: "blpUniswapAaveCBBTCUSDC",
  addresses: {
    [networks.baseFork.id]: "0xaB99364C0b81881A0d4Bcb39503C4E7c5fc8F58d",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [singleVaults.bAaveCBBTC, singleVaults.bAaveUSDC],
} as const satisfies ISwapPool<IBirdieSingleFarm>);   */

const blpUniswapHarvestAutopilotWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapHarvestAutopilotWETHUSDC",
  fullName: "blpUniswapHarvestAutopilotWETHUSDC",
  addresses: {
    [networks.baseFork.id]: "0xd5e09e37f49af3563E3556e157E4d986D6708536",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotWETH,
    singleVaults.bHarvestAutopilotUSDC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotCBBTCUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapHarvestAutopilotCBBTCUSDC",
  fullName: "blpUniswapHarvestAutopilotCBBTCUSDC",
  addresses: {
    [networks.baseFork.id]: "0xBc6aF90b0C82c9ecAa051c04F76842989e765070",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotCBBTC,
    singleVaults.bHarvestAutopilotUSDC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotCBBTCWETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapHarvestAutopilotCBBTCWETH",
  fullName: "blpUniswapHarvestAutopilotCBBTCWETH",
  addresses: {
    [networks.baseFork.id]: "0xBc6aF90b0C82c9ecAa051c04F76842989e765070",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotCBBTC,
    singleVaults.bHarvestAutopilotWETH,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapHarvestWETHUSDC",
  fullName: "blpUniswapHarvestWETHUSDC",
  addresses: {
    [networks.baseFork.id]: "0x7E4A53c8B7F7112fFd8f52D54E296143B0Be9E21",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [
    singleVaults.bHarvestAutopilotWETH,
    singleVaults.bHarvestAutopilotUSDC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestCBBTCUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapHarvestCBBTCUSDC",
  fullName: "blpUniswapHarvestCBBTCUSDC",
  addresses: {
    [networks.baseFork.id]: "0xa673272e0c6d9F4330c9a5D03aa5ff43EB87B8F2",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [
    singleVaults.bHarvestAutopilotCBBTC,
    singleVaults.bHarvestAutopilotUSDC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestCBBTCWETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "blpUniswapHarvestCBBTCWETH",
  fullName: "blpUniswapHarvestCBBTCWETh",
  addresses: {
    [networks.baseFork.id]: "0xa673272e0c6d9F4330c9a5D03aa5ff43EB87B8F2",
  },
  decimals: 18,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  input: [
    singleVaults.bHarvestAutopilotCBBTC,
    singleVaults.bHarvestAutopilotWETH,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);


const swapPools = {
  // bUniswapAaveWETHUSDT,
  // bUniswapAaveWETHUSDC,
  // bUniswapAaveWETHCBBTC,
  // bUniswapAaveCBBTCUSDC,
  // blpUniswapAaveWETHCBBTC,
  // blpUniswapAaveWETHUSDC,
  // blpUniswapAaveCBBTCUSDC,
  blpUniswapHarvestWETHUSDC,
  blpUniswapHarvestCBBTCUSDC,
  blpUniswapHarvestCBBTCWETH,
  blpUniswapHarvestAutopilotWETHUSDC,
  blpUniswapHarvestAutopilotCBBTCUSDC,
  blpUniswapHarvestAutopilotCBBTCWETH,
};

export default swapPools;
