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
    [networks.sepolia.id]: "0x34363A0d470da2e1b4166D3e05C4d0A2A9DF582D",
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
    [networks.sepolia.id]: "0xF14185752E4B64c230BcB4735B1ebE854d6f6F81",
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
    [networks.sepolia.id]: "0x48C311E24300f2F844d325071ACcB10044139c80",
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
