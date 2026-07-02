import { Farm, FarmTag, FarmType } from "@/types/FarmListTableRowProps";

import TokenInfo from "./tokenInfo";
import VaultInfo from "./vaultInfo";
import const_contracts from "./contracts/contracts";

// const CBBTC_harvest_autopilot: Farm = {
//   type: FarmType.SINGLE,
//   tags: [FarmTag.SINGLE],
//   name: "cbBTC",
//   wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotCBBTC,
//   details: {
//     vaults: [VaultInfo.BCBBTC_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
//     rewards: [
//       {
//         token: TokenInfo.BIRDIE,
//       },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

// const WBTC_harvest_autopilot: Farm = {
//   type: FarmType.SINGLE,
//   tags: [FarmTag.SINGLE],
//   name: "WBTC",
//   wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotWBTC,
//   details: {
//     vaults: [VaultInfo.BCBBTC_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

// const WETH_harvest_autopilot: Farm = {
//   type: FarmType.SINGLE,
//   tags: [FarmTag.SINGLE],
//   name: "WETH",
//   wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotWETH,
//   details: {
//     vaults: [VaultInfo.BWETH_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
//     rewards: [
//       {
//         token: TokenInfo.BIRDIE,
//       },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

// const ETH_harvest_autopilot: Farm = {
//   type: FarmType.SINGLE,
//   tags: [FarmTag.SINGLE],
//   name: "ETH",
//   wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotETH,
//   details: {
//     vaults: [VaultInfo.BWETH_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
//     rewards: [
//       {
//         token: TokenInfo.BIRDIE,
//       },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

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
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.05,
  point: 0,
};

// const FARM_harvest_autopilot: Farm = {
//   type: FarmType.SINGLE,
//   tags: [FarmTag.SINGLE],
//   name: "FARM",
//   wip_stakeToken: const_contracts.singleVaults.bHarvestAutopilotFARM,
//   details: {
//     vaults: [VaultInfo.BUSDC_harvest_autopilot_V1, VaultInfo.REWARD_BIRDIE],
//     rewards: [
//       {
//         token: TokenInfo.BIRDIE,
//       },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

const WETH_USDC_harvest_autopilot: Farm = {
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
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.05,
  point: 0,
};

const ETH_USDC_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP, FarmTag.STABLE],
  name: "ETH-USDC",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotETHUSDC,
  details: {
    vaults: [
      VaultInfo.BWETH_harvest_autopilot_V1,
      VaultInfo.BUSDC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_USDC_WETH_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.05,
  point: 0,
};

// const WETH_USDC_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP, FarmTag.STABLE],
//   name: "WETH-USDC",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotWETHUSDC,
//   details: {
//     vaults: [
//       VaultInfo.BWETH_harvest_autopilot_V1,
//       VaultInfo.BUSDC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_USDC_WETH_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

// const ETH_USDC_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP, FarmTag.STABLE],
//   name: "ETH-USDC",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotETHUSDC,
//   details: {
//     vaults: [
//       VaultInfo.BWETH_harvest_autopilot_V1,
//       VaultInfo.BUSDC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_USDC_WETH_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

// const CBBTC_USDC_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP, FarmTag.STABLE],
//   name: "cbBTC-USDC",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotCBBTCUSDC,
//   details: {
//     vaults: [
//       VaultInfo.BUSDC_harvest_autopilot_V1,
//       VaultInfo.BCBBTC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_USDC_CBBTC_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

const CBBTC_WETH_harvest_autopilot: Farm = {
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
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.3,
  point: 0,
};

const CBBTC_ETH_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "cbBTC-ETH",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotCBBTCETH,
  details: {
    vaults: [
      VaultInfo.BWETH_harvest_autopilot_V1,
      VaultInfo.BCBBTC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.3,
  point: 0,
};

const EURC_USDC_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP, FarmTag.STABLE],
  name: "EURC-USDC",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotEURCUSDC,
  details: {
    vaults: [
      VaultInfo.BUSDC_harvest_autopilot_V1,
      VaultInfo.BCBBTC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_USDC_CBBTC_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.01,
  point: 0,
};

const EURC_WETH_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "EURC-WETH",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotEURCWETH,
  details: {
    vaults: [
      VaultInfo.BWETH_harvest_autopilot_V1,
      VaultInfo.BCBBTC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.3,
  point: 0,
};

const EURC_ETH_harvest_autopilot: Farm = {
  type: FarmType.PAIR,
  tags: [FarmTag.LP],
  name: "EURC-ETH",
  wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotEURCETH,
  details: {
    vaults: [
      VaultInfo.BWETH_harvest_autopilot_V1,
      VaultInfo.BCBBTC_harvest_autopilot_V1,
      VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
      VaultInfo.REWARD_BIRDIE,
    ],
    rewards: [
      // {
      //   token: TokenInfo.BIRDIE,
      // },
    ],
  },
  apy: 0,
  tvl: 0,
  MyBalance: 0,
  feeTier: 0.3,
  point: 0,
};

// const USDC_WBTC_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP, FarmTag.STABLE],
//   name: "USDC-WBTC",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotUSDCWBTC,
//   details: {
//     vaults: [
//       VaultInfo.BUSDC_harvest_autopilot_V1,
//       VaultInfo.BCBBTC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_USDC_CBBTC_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.05,
//   point: 0,
// };

// const WBTC_WETH_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP],
//   name: "WBTC-WETH",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotWBTCWETH,
//   details: {
//     vaults: [
//       VaultInfo.BWETH_harvest_autopilot_V1,
//       VaultInfo.BCBBTC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.3,
//   point: 0,
// };

// const WBTC_ETH_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP],
//   name: "WBTC-ETH",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotWBTCETH,
//   details: {
//     vaults: [
//       VaultInfo.BWETH_harvest_autopilot_V1,
//       VaultInfo.BCBBTC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 0.3,
//   point: 0,
// };

// const FARM_ETH_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP],
//   name: "FARM-ETH",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotFARMETH,
//   details: {
//     vaults: [
//       VaultInfo.BWETH_harvest_autopilot_V1,
//       VaultInfo.BCBBTC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 1.0,
//   point: 0,
// };

// const FARM_WETH_harvest_autopilot: Farm = {
//   type: FarmType.PAIR,
//   tags: [FarmTag.LP],
//   name: "FARM-WETH",
//   wip_stakeToken: const_contracts.lpVaults.blpHarvestAutopilotFARMWETH,
//   details: {
//     vaults: [
//       VaultInfo.BWETH_harvest_autopilot_V1,
//       VaultInfo.BCBBTC_harvest_autopilot_V1,
//       VaultInfo.BLP_autopilot_WETH_CBBTC_V1,
//       VaultInfo.REWARD_BIRDIE,
//     ],
//     rewards: [
//       // {
//       //   token: TokenInfo.BIRDIE,
//       // },
//     ],
//   },
//   apy: 0,
//   tvl: 0,
//   MyBalance: 0,
//   feeTier: 1.0,
//   point: 0,
// };

export const FarmList = [
  // CBBTC_harvest_autopilot,
  // ETH_harvest_autopilot,
  // USDC_harvest_autopilot,
  // FARM_harvest_autopilot,
  // WETH_USDC_harvest_autopilot,
  ETH_USDC_harvest_autopilot,
  // USDC_WBTC_harvest_autopilot,
  // WBTC_ETH_harvest_autopilot,
  // FARM_ETH_harvest_autopilot,
  // CBBTC_USDC_harvest_autopilot,
  // CBBTC_WETH_harvest_autopilot,
  CBBTC_ETH_harvest_autopilot,
  EURC_USDC_harvest_autopilot,
  // EURC_WETH_harvest_autopilot,
  EURC_ETH_harvest_autopilot,
];
export const FarmInfo = {
  // CBBTC_harvest_autopilot,
  // WETH_harvest_autopilot,
  // USDC_harvest_autopilot,
  // FARM_harvest_autopilot,
  // WETH_USDC_harvest_autopilot,
  ETH_USDC_harvest_autopilot,
  // USDC_WBTC_harvest_autopilot,
  // WBTC_WETH_harvest_autopilot,
  // WBTC_ETH_harvest_autopilot,
  // FARM_WETH_harvest_autopilot,
  // FARM_ETH_harvest_autopilot,
  // CBBTC_USDC_harvest_autopilot,
  // CBBTC_WETH_harvest_autopilot,
  CBBTC_ETH_harvest_autopilot,
  EURC_USDC_harvest_autopilot,
  // EURC_WETH_harvest_autopilot,
  EURC_ETH_harvest_autopilot,
};
export default FarmInfo;
