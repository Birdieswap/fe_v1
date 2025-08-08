import { birdieLpVaults_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieLPFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import swapPools from "./swapPool";

const blpAaveWETHCBBTC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "blp0004",
  fullName: "blpWETH_CBBTC_AAVE_v1",
  addresses: {
    [networks.sepolia.id]: "0x9ebD24Cc0B267Ebd2a5270793C417e0940644B26",
    [networks.baseFork.id]: "0x2BEA4c68f4438b1d810EA92cc7D2a73173e22836",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.UNISWAP,
  swap: swapPools.bUniswapAaveWETHCBBTC,
  lpPool: swapPools.blpUniswapAaveWETHCBBTC,
  decimals: 12,
  displayDecimals: 6,
} as const);

const blpAaveWETHUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "blp0001",
  fullName: "blpWETH_USDC_AAVE_v1",
  addresses: {
    [networks.baseFork.id]: "0x5f1359079669D560e81A75cE1fe69508Ed75aDDa",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.UNISWAP,
  swap: swapPools.bUniswapAaveWETHUSDC,
  lpPool: swapPools.blpUniswapAaveWETHUSDC,
  decimals: 12,
  displayDecimals: 6,
} as const);

const blpAaveCBBTCUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "blp0002",
  fullName: "blpCBBTC_USDC_AAVE_v1",
  addresses: {
    [networks.sepolia.id]: "0x4678c7f22c96cdd20cef96280403ec91893e9f6c",
    [networks.baseFork.id]: "0xc4a74652F5f4bd7732C4Aa086bf038DF03D27429",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.UNISWAP,
  swap: swapPools.bUniswapAaveCBBTCUSDC,
  lpPool: swapPools.bUniswapAaveCBBTCUSDC,
  decimals: 12,
  displayDecimals: 6,
} as const);

const blpHarvestAutopilotWETHUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "blp0003",
  fullName: "blpWETH_USDC_harvest_autopilot_v1",
  addresses: {
    [networks.baseFork.id]: "0xF28c5912Fd17345636bd3Ee855a9F8C440cE261E", // "0xd5e09e37f49af3563E3556e157E4d986D6708536",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.UNISWAP,
  swap: swapPools.blpUniswapHarvestWETHUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotWETHUSDC,
  decimals: 12,
  displayDecimals: 6,
} as const);

const blpHarvestAutopilotCBBTCUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "blp0004",
  fullName: "blpCBBTC_USDC_harvest_autopilot_v1",
  addresses: {
    [networks.baseFork.id]: "0x3B9a19d0688CEFe422CF58e8231E64Aeb6C29A57", //"0xd5e09e37f49af3563E3556e157E4d986D6708536",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.UNISWAP,
  swap: swapPools.blpUniswapHarvestCBBTCUSDC,
  lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCUSDC,
  decimals: 7,
  displayDecimals: 4,
} as const);

const blpHarvestAutopilotCBBTCWETH = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "blp0005",
  fullName: "blpCBBTC_WETH_harvest_autopilot_v1",
  addresses: {
    [networks.baseFork.id]: "0x3B9a19d0688CEFe422CF58e8231E64Aeb6C29A57", //"0xd5e09e37f49af3563E3556e157E4d986D6708536",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.UNISWAP,
  swap: swapPools.blpUniswapHarvestCBBTCWETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
  decimals: 7,
  displayDecimals: 4,
} as const);

const lpVaults = {
  blpAaveWETHCBBTC,
  blpAaveWETHUSDC,
  blpAaveCBBTCUSDC,
  blpHarvestAutopilotWETHUSDC,
  blpHarvestAutopilotCBBTCUSDC,
  blpHarvestAutopilotCBBTCWETH,
};

export default lpVaults;
