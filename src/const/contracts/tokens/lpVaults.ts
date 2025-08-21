import { birdieLpVaults_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieLPFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import swapPools from "./swapPool";

const blpHarvestAutopilotWETHUSDC = BirdieLPFarmGuard({
  type: EContractType.BIRDIE_LP,
  symbol: "bUSDCWETH",
  fullName: "Birdieswap USDC 3000 WETH",
  addresses: {
    [networks.sepolia.id]: "0xfA064E154CD30E81815Bfa4Ff7C8b1bC5EcfA266",
    [networks.baseFork.id]: "0xF28c5912Fd17345636bd3Ee855a9F8C440cE261E", // "0xd5e09e37f49af3563E3556e157E4d986D6708536",
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
  fullName: "Birdieswap cbBTC 3000 USDC",
  addresses: {
    [networks.sepolia.id]: "0x2d6De1c6CcC4fa91188773df66C357B5B2BB407c",
    [networks.baseFork.id]: "0x3B9a19d0688CEFe422CF58e8231E64Aeb6C29A57", //"0xd5e09e37f49af3563E3556e157E4d986D6708536",
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
  fullName: "Birdieswap cbBTC 500 WETH",
  addresses: {
    [networks.sepolia.id]: "0x4BD2FC09b6DB3f3Aa8cc49Ce6446ADcba348836a",
    [networks.baseFork.id]: "0x3B9a19d0688CEFe422CF58e8231E64Aeb6C29A57", //"0xd5e09e37f49af3563E3556e157E4d986D6708536",
  },
  abi: birdieLpVaults_abi,
  provider: stakingProviders.BIRDIE,
  swap: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
  lpPool: swapPools.blpUniswapHarvestAutopilotCBBTCWETH,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/blp-token.svg",
} as const);

const lpVaults = {
  blpHarvestAutopilotWETHUSDC,
  blpHarvestAutopilotCBBTCUSDC,
  blpHarvestAutopilotCBBTCWETH,
};

export default lpVaults;
