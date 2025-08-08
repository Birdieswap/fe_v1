import { erc20_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { BirdieSingleFarmGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import tokens from "./tokens";

/*
const bAaveWETH = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "b0001",
  fullName: "bWETH_v1",
  addresses: {
    [networks.sepolia.id]: "0x8282d9D38bdF36D1805738F766b171620ff2dE0D",
    [networks.baseFork.id]: "0x069921B553f981c0a919d8F053e75332E94F8fd1",
  },
  abi: birdieswap_router_abi,
  provider: stakingProviders.AAVE,
  input: tokens.WETH,
  decimals: 18,
  displayDecimals: 3,
} as const);

const bAaveUSDT = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bAaveUSDT",
  fullName: "bUSDT_v1",
  addresses: {
    [networks.sepolia.id]: "0xacA5eA2726bE50B9Ac77cAA20544E1Bb6c5B13Ad",
  },
  abi: birdieswap_router_abi,
  provider: stakingProviders.AAVE,
  input: tokens.USDT,
  decimals: 6,
  displayDecimals: 2,
} as const);

const bAaveUSDC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "b0003",
  fullName: "bUSDC_v1",
  addresses: {
    [networks.sepolia.id]: "0x59dd4254A014C1C95E4174b2508C15EB95C7De27",
    [networks.baseFork.id]: "0x50DEd3477f61550Bed9Fc75f2427343C3805b9a4",
  },
  abi: birdieswap_router_abi,
  provider: stakingProviders.AAVE,
  input: tokens.USDC,
  decimals: 6,
  displayDecimals: 2,
} as const);

const bAaveDAI = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bAaveDAI",
  fullName: "bDAI_v1",
  addresses: {
    [networks.sepolia.id]: "0x0000000000000000000000000000000000000000",
  },
  abi: birdieswap_router_abi,
  provider: stakingProviders.AAVE,
  input: tokens.DAI,
  decimals: 18,
  displayDecimals: 4,
} as const);

const bAaveAAVE = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "bAaveAAVE",
  fullName: "bAAVE_v1",
  addresses: {
    [networks.sepolia.id]: "0x0000000000000000000000000000000000000000",
  },
  abi: birdieswap_router_abi,
  provider: stakingProviders.AAVE,
  input: tokens.AAVE,
  decimals: 18,
  displayDecimals: 4,
} as const);

const bAaveCBBTC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "b0002",
  fullName: "bCBBTC_v1",
  addresses: {
    [networks.sepolia.id]: "0xE9111a85056F9C7302374Bc3480E92b1c84D75Ff",
    [networks.baseFork.id]: "0x0976959ff542d08FBa63fF59AeeF9bbef0B08914",
  },
  abi: birdieswap_router_abi,
  provider: stakingProviders.AAVE,
  input: tokens.CBBTC,
  decimals: 8,
  displayDecimals: 4,
} as const);        */   //aave pool 미사용

const bHarvestAutopilotWETH = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "b0004",
  fullName: "bWETH_harvest_autopilot_v1",
  addresses: {
    [networks.sepolia.id]: "0x0f48a4Be8E0Cbd49E7144BB95906BEf75ad34c3c",
    [networks.baseFork.id]: "0x195fF461bDDbd672F0f6F2e0D86a7e53D05288da",
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIE,
  input: tokens.WETH,
  decimals: 18,
  displayDecimals: 4,
} as const);

const bHarvestAutopilotCBBTC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "b0005",
  fullName: "bCBBTC_harvest_autopilot_v1",
  addresses: {
    [networks.sepolia.id]: "0x6cdA51ee2061fd000D6bD6e6e357d546b172B5DA",
    [networks.baseFork.id]: "0xB5b48036F263D449aA7d98013DB62b098DB11e13",
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIE,
  input: tokens.CBBTC,
  decimals: 8,
  displayDecimals: 4,
} as const);

const bHarvestAutopilotUSDC = BirdieSingleFarmGuard({
  type: EContractType.BIRDIE_SINGLE,
  symbol: "b0006",
  fullName: "bUSDC_harvest_autopilot_v1",
  addresses: {
    [networks.sepolia.id]: "0xAD472D7a314Ef6fA8268f34BFE27e282047BE1F8",
    [networks.baseFork.id]: "0xeBA7f095ba93E573E5F979Ef6620906Ec85F6C66",
  },
  abi: erc20_abi,
  provider: stakingProviders.BIRDIE,
  input: tokens.USDC,
  decimals: 6,
  displayDecimals: 4,
} as const);

const singleVaults = {
  // bAaveWETH,
  // bAaveUSDT,
  // bAaveUSDC,
  // bAaveDAI,
  // bAaveAAVE,
  // bAaveCBBTC,
  bHarvestAutopilotWETH,
  bHarvestAutopilotCBBTC,
  bHarvestAutopilotUSDC,
};

export default singleVaults;
