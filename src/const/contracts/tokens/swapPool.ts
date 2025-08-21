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

const blpUniswapHarvestAutopilotWETHUSDC = SwapPoolGuard({
  type: EContractType.SWAP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: "0x5591cE4E6AA6F951BD07092Cb3D7b6db1401bAED",
    [networks.baseFork.id]: "0xd5e09e37f49af3563E3556e157E4d986D6708536",
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
    [networks.sepolia.id]: "0x029Bfb17c0d345Aa119C0f6FCf3E968b13E2FF47",
    [networks.baseFork.id]: "0xBc6aF90b0C82c9ecAa051c04F76842989e765070",
  },
  decimals: 8,
  fee_tier : 3000,
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
  symbol: "bcbBTCWETH",
  fullName: "Birdieswap cbBTC 500 WETH",
  addresses: {
    [networks.sepolia.id]: "0x6e6a72D245C20D33581d35257ebf2431b769abeA",
    [networks.baseFork.id]: "0xBc6aF90b0C82c9ecAa051c04F76842989e765070",
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
