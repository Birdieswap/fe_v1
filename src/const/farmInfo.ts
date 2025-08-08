import { Farm, FarmTag, FarmType } from "@/types/FarmListTableRowProps";

import TokenInfo from "./tokenInfo";
import VaultInfo from "./vaultInfo";
import const_contracts from "./contracts/contracts";
/*
const CBBTC: Farm = {
  type: FarmType.SINGLE,
  tags: [FarmTag.SINGLE],
  name: "cbBTC",
  wip_stakeToken: const_contracts.singleVaults.bAaveCBBTC,
  details: {
    vaults: [
      VaultInfo.BCBBTC_V1,
      VaultInfo.REWARD_AAVE,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.AAVE,
      },
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99K",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const WETH: Farm = {
  type: FarmType.SINGLE,
  tags: [FarmTag.SINGLE],
  name: "WETH",
  wip_stakeToken: const_contracts.singleVaults.bAaveWETH,
  details: {
    vaults: [
      VaultInfo.BCBBTC_V1,
      VaultInfo.REWARD_AAVE,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.AAVE,
      },
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99K",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const USDC: Farm = {
  type: FarmType.SINGLE,
  tags: [FarmTag.SINGLE],
  name: "USDC",
  wip_stakeToken: const_contracts.singleVaults.bAaveUSDC,
  details: {
    vaults: [
      VaultInfo.BUSDC_V1,
      VaultInfo.REWARD_AAVE,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.AAVE,
      },
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99K",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WETH_CBBTC_AAVE: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "WETH-cbBTC",
  wip_stakeToken: const_contracts.lpVaults.blpAaveWETHCBBTC,
  details: {
    vaults: [
      VaultInfo.BUSDBC_V1,
      VaultInfo.BWETH_V1,
      VaultInfo.BLPUSDBC_WETH_V1,
      VaultInfo.REWARD_AAVE,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.AAVE,
      },
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99M",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const WETH_USDC_AAVE: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "WETH-USDC",
  wip_stakeToken: const_contracts.lpVaults.blpAaveWETHUSDC,
  details: {
    vaults: [
      VaultInfo.BUSDBC_V1,
      VaultInfo.BWETH_V1,
      VaultInfo.BLPUSDBC_WETH_V1,
      VaultInfo.REWARD_AAVE,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.AAVE,
      },
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99M",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const CBBTC_USDC_AAVE: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "cbBTC-USDC",
  wip_stakeToken: const_contracts.lpVaults.blpAaveCBBTCUSDC,
  details: {
    vaults: [
      VaultInfo.BUSDBC_V1,
      VaultInfo.BWETH_V1,
      VaultInfo.BLPUSDBC_WETH_V1,
      VaultInfo.REWARD_AAVE,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.AAVE,
      },
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99M",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};    */

const CBBTC_harvest_autopilot: Farm = {
  type: FarmType.SINGLE,
  tags: [FarmTag.SINGLE],
  name: "cbBTC",
  wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotCBBTC,
  details: {
    vaults: [VaultInfo.BCBBTC_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
    rewards: [
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99K",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const WETH_harvest_autopilot: Farm = {
  type: FarmType.SINGLE,
  tags: [FarmTag.SINGLE],
  name: "WETH",
  wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotWETH,
  details: {
    vaults: [VaultInfo.BWETH_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
    rewards: [
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99K",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const USDC_harvest_autopilot: Farm = {
  type: FarmType.SINGLE,
  tags: [FarmTag.SINGLE, FarmTag.STABLE],
  name: "USDC",
  wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotUSDC,
  details: {
    vaults: [VaultInfo.BUSDC_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
    rewards: [
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99K",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const WETH_USDC_AAVE_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP, FarmTag.STABLE],
  name: "WETH-USDC",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotWETHUSDC,
  details: {
    vaults: [
      VaultInfo.BWETH_harvest_autopilot_V1,
      VaultInfo.BUSDC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_USDC_WETH_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99M",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const CBBTC_USDC_AAVE_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP, FarmTag.STABLE],
  name: "cbBTC-USDC",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotCBBTCUSDC,
  details: {
    vaults: [
      VaultInfo.BUSDC_harvest_autopilot_V1,
      VaultInfo.BCBBTC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_USDC_CBBTC_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99M",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

const CBBTC_WETH_AAVE_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "cbBTC-WETH",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotCBBTCWETH,
  details: {
    vaults: [
      VaultInfo.BWETH_harvest_autopilot_V1,
      VaultInfo.BCBBTC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      {
        token: TokenInfo.BIRDIE,
      },
    ],
  },
  apy: 23.8,
  tvl: "$999.99M",
  birdRate: 1234.56,
  feeTier: 0.05,
  point: 0,
};

export const FarmList = [
  // CBBTC,
  // WETH,
  // USDC,
  // WETH_USDC_AAVE,
  // CBBTC_USDC_AAVE,
  // WETH_CBBTC_AAVE,
  CBBTC_harvest_autopilot,
  WETH_harvest_autopilot,
  USDC_harvest_autopilot,
  WETH_USDC_AAVE_harvest_autopilot,
  CBBTC_USDC_AAVE_harvest_autopilot,
  CBBTC_WETH_AAVE_harvest_autopilot,
];
export const FarmInfo = {
  // CBBTC,
  // WETH,
  // USDC,
  // WETH_USDC_AAVE,
  // CBBTC_USDC_AAVE,
  // WETH_CBBTC_AAVE,
  CBBTC_harvest_autopilot,
  WETH_harvest_autopilot,
  USDC_harvest_autopilot,
  WETH_USDC_AAVE_harvest_autopilot,
  CBBTC_USDC_AAVE_harvest_autopilot,
  CBBTC_WETH_AAVE_harvest_autopilot,
};
export default FarmInfo;
