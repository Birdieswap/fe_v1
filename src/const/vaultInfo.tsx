import { Vault } from "@/types/FarmListTableRowProps";

const BUSDC_harvest_autopilot_V1: Vault = {
  name: "bUSDC_Harvest_Autopilot_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "Harvest Autopilot-USDC",
    underlyingProtocolName: "Harvest",
    underlyingProtocolInfo:
      "https://app.harvest.finance/base/0x0d877Dc7C8Fa3aD980DfDb18B48eC9F8768359C4",
    vaultContract: "0xAD472D7a314Ef6fA8268f34BFE27e282047BE1F8",
    receiptToken: "0xAD472D7a314Ef6fA8268f34BFE27e282047BE1F8",
  },
  apy: 8.82,
};

const BCBBTC_harvest_autopilot_V1: Vault = {
  name: "bcbBTC_Harvest_Autopilot_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "Harvest Autopilot-bcBTC",
    underlyingProtocolName: "Harvest",
    underlyingProtocolInfo:
      "https://app.harvest.finance/base/0x31A421271414641cb5063B71594b642D2666dB6B",
    vaultContract: "0x6cdA51ee2061fd000D6bD6e6e357d546b172B5DA",
    receiptToken: "0x6cdA51ee2061fd000D6bD6e6e357d546b172B5DA",
  },
  apy: 0.93,
};

const BWETH_harvest_autopilot_V1: Vault = {
  name: "bWETH_Harvest_Autopilot_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "Harvest Autopilot-WETH",
    underlyingProtocolName: "Harvest",
    underlyingProtocolInfo:
      "https://app.harvest.finance/base/0x7872893e528Fe2c0829e405960db5B742112aa97",
    vaultContract: "0x0f48a4Be8E0Cbd49E7144BB95906BEf75ad34c3c",
    receiptToken: "0x0f48a4Be8E0Cbd49E7144BB95906BEf75ad34c3c",
  },
  apy: 2.88,
};

const BLP_autopilot_USDC_WETH_V1: Vault = {
  name: "blp_autopilot_USDbC-WETH_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Pair token vault information",
    subtitle: "Uniswap V3",
    underlyingProtocolName: "Uniswap V3",
    underlyingProtocolInfo:
      "https://app.uniswap.org/explore/pools/ethereum/0xCBCdF9626bC03E24f779434178A73a0B4bad62eD",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 9.41,
};

const BLP_autopilot_USDC_CBBTC_V1: Vault = {
  name: "blp_autopilot_USDbC-CBBTC_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Pair token vault information",
    subtitle: "Uniswap V3",
    underlyingProtocolName: "Uniswap V3",
    underlyingProtocolInfo:
      "https://app.uniswap.org/explore/pools/ethereum/0xCBCdF9626bC03E24f779434178A73a0B4bad62eD",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 9.41,
};

const BLP_autopilot_WETH_CBBTC_V1: Vault = {
  name: "blp_autopilot_WETH-CBBTC_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Pair token vault information",
    subtitle: "Uniswap V3",
    underlyingProtocolName: "Uniswap V3",
    underlyingProtocolInfo:
      "https://app.uniswap.org/explore/pools/ethereum/0xCBCdF9626bC03E24f779434178A73a0B4bad62eD",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 9.41,
};

/*
const BUSDBC_V1: Vault = {
  name: "bUSDbC_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "AAVE-USDbC",
    underlyingProtocolName: "AAVE",
    underlyingProtocolInfo:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 4.06,
};

const BDAI_V1: Vault = {
  name: "bDAI_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "AAVE-DAI",
    underlyingProtocolName: "AAVE",
    underlyingProtocolInfo:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 4.06,
};

const BWETH_V1: Vault = {
  name: "bWETH_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "AAVE-WETH",
    underlyingProtocolName: "AAVE",
    underlyingProtocolInfo:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 1.87,
};

const BCBBTC_V1: Vault = {
  name: "bCBBTC_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "AAVE-CBBTC",
    underlyingProtocolName: "AAVE",
    underlyingProtocolInfo:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 1.87,
};

const BUSDC_V1: Vault = {
  name: "bUDSC_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Single token vault information",
    subtitle: "AAVE-USDC",
    underlyingProtocolName: "AAVE",
    underlyingProtocolInfo:
      "https://app.aave.com/reserve-overview/?underlyingAsset=0x4200000000000000000000000000000000000006&marketName=proto_base_v3",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 1.87,
}; 

const BLPUSDBC_WETH_V1: Vault = {
  name: "blpUSDbC-WETH_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Pair token vault information",
    subtitle: "Uniswap V3",
    underlyingProtocolName: "Uniswap V3",
    underlyingProtocolInfo:
      "https://app.uniswap.org/explore/pools/ethereum/0xCBCdF9626bC03E24f779434178A73a0B4bad62eD",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 9.41,
};

const BLPDAI_WETH_V1: Vault = {
  name: "blpDAI-WETH_v1",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Pair token vault information",
    subtitle: "Uniswap V3",
    underlyingProtocolName: "Uniswap V3",
    underlyingProtocolInfo:
      "https://app.uniswap.org/explore/pools/ethereum/0xCBCdF9626bC03E24f779434178A73a0B4bad62eD",
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 9.41,
};   */

const REWARD_AAVE: Vault = {
  name: "Reward - AAVE",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Caging reward information",
    subtitle: "AAVE",
    underlyingProtocolName: "AAVE",
    underlyingProtocolInfo: {
      rewardToken: "WETH",
      rewardTokenContract: "0x0000000000000000000000000000000000000000",
      rewardAPR: "12.3%",
    },
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 11.34,
};

const REWARD_BIRDIE: Vault = {
  name: "Reward - Birdie",
  details: {
    summary:
      "This Vault offers users a streamlined way to earn competitive returns on their assets by utilizing automated, low-risk strategies across multiple DeFi protocols.",
    title: "Caging reward information",
    subtitle: "Crypttempo",
    underlyingProtocolName: "Crypttempo",
    underlyingProtocolInfo: {
      rewardToken: "WETH",
      rewardTokenContract: "0x0000000000000000000000000000000000000000",
      rewardAPR: "12.3%",
    },
    vaultContract: "0x0000000000000000000000000000000000000000",
    receiptToken: "0x0000000000000000000000000000000000000000",
  },
  apy: 1.17,
};

export const VaultInfo: {
  // BUSDBC_V1: Vault;
  // BUSDC_V1: Vault;
  // BDAI_V1: Vault;
  // BWETH_V1: Vault;
  // BCBBTC_V1: Vault;
  // BLPUSDBC_WETH_V1: Vault;
  // BLPDAI_WETH_V1: Vault;
  REWARD_AAVE: Vault;
  REWARD_BIRDIE: Vault;
  BUSDC_harvest_autopilot_V1: Vault;
  BWETH_harvest_autopilot_V1: Vault;
  BCBBTC_harvest_autopilot_V1: Vault;
  BLP_autopilot_USDC_WETH_V1: Vault;
  BLP_autopilot_USDC_CBBTC_V1: Vault;
  BLP_autopilot_WETH_CBBTC_V1: Vault;
} = {
  // BUSDBC_V1,
  // BUSDC_V1,
  // BDAI_V1,
  // BWETH_V1,
  // BCBBTC_V1,
  // BLPUSDBC_WETH_V1,
  // BLPDAI_WETH_V1,
  REWARD_AAVE,
  REWARD_BIRDIE,
  BUSDC_harvest_autopilot_V1,
  BWETH_harvest_autopilot_V1,
  BCBBTC_harvest_autopilot_V1,
  BLP_autopilot_USDC_WETH_V1,
  BLP_autopilot_USDC_CBBTC_V1,
  BLP_autopilot_WETH_CBBTC_V1,
};

export default VaultInfo;
