import { erc20_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieSingleFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import tokens from "./tokens";

const bHarvestAutopilotWETH = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bWETH",
  fullName: "Birdieswap WETH",
  addresses: {
    [networks.sepolia.id]: "0x0A04a857b05185c3AbE04032ca766FC01eC87204",
    [networks.baseFork.id]: "0x195fF461bDDbd672F0f6F2e0D86a7e53D05288da",
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIE,
  input: tokens.WETH,
  decimals: 18,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const bHarvestAutopilotCBBTC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bcbBTC",
  fullName: "Birdieswap cbBTC",
  addresses: {
    [networks.sepolia.id]: "0x672dB85a43408A6795fA2850F485416C70Ec0FcE",
    [networks.baseFork.id]: "0xB5b48036F263D449aA7d98013DB62b098DB11e13",
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIE,
  input: tokens.CBBTC,
  decimals: 8,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const bHarvestAutopilotUSDC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bUSDC",
  fullName: "Birdieswap USDC",
  addresses: {
    [networks.sepolia.id]: "0xfAF581313BF76776581EC31a9fEe3efC7d317c96",
    [networks.baseFork.id]: "0xeBA7f095ba93E573E5F979Ef6620906Ec85F6C66",
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIE,
  input: tokens.USDC,
  decimals: 6,
  displayDecimals: 4,
  iconSrc: "/tokens/b-token.svg",
} as const);

const singleVaults = {
  bHarvestAutopilotWETH,
  bHarvestAutopilotCBBTC,
  bHarvestAutopilotUSDC,
};

export default singleVaults;
