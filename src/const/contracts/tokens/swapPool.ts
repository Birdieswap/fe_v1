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

const blpUniswapHarvestAutopilotCBBTCUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bcbBTCUSDC",
  fullName: "Birdieswap cbBTC 3000 USDC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_USDC_POOL as `0x${string}`,
    [networks.base.id]: contractAddresses.base.CBBTC_USDC_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_USDC_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotUSDC,
    singleVaults.bHarvestAutopilotCBBTC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);

const blpUniswapHarvestAutopilotCBBTCWETH = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bcbBTCWETH",
  fullName: "Birdieswap cbBTC 500 WETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.CBBTC_WETH_POOL as `0x${string}`,
    [networks.base.id]: contractAddresses.base.CBBTC_WETH_POOL as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.CBBTC_WETH_POOL as `0x${string}`,
  },
  decimals: 8,
  fee_tier : 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: true,
  input: [
    singleVaults.bHarvestAutopilotWETH,
    singleVaults.bHarvestAutopilotCBBTC,
  ],
} as const satisfies ISwapPool<IBirdieSingleFarm>);



const swapPools = {

  blpUniswapHarvestAutopilotWETHUSDC,
  blpUniswapHarvestAutopilotCBBTCUSDC,
  blpUniswapHarvestAutopilotCBBTCWETH,
};

export default swapPools;
