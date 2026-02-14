// this is temporary

import { erc20_abi, birdieLpVaults_abi, birdieSingleVaults_abi } from "./abis";
import { birdieswap_router_abi } from "./contracts/abis/birdieswap_router_abi";
import networks from "./contracts/networks";
import lpVaults from "./contracts/tokens/lpVaults";
import singleVaults from "./contracts/tokens/singleVaults";
import stakingProviders from "./contracts/tokens/stakingProviders";
import swapPools from "./contracts/tokens/swapPool";
import tokens from "./contracts/tokens/tokens";
import externalTokens from "./contracts/tokens/externalTokens";

export const contracts = {
  birdieRouter: {
    address: stakingProviders.BIRDIESWAP_Router.addresses[networks.sepolia.id],
    abi: birdieswap_router_abi,
  },
  birdieVaults: {
    // WETH_USDC_HARVEST: {
    //   address:
    //     lpVaults.blpHarvestAutopilotWETHUSDC.addresses[networks.baseFork.id],
    //   abi: birdieLpVaults_abi,
    // },
    // CBBTC_USDC_HARVEST: {
    //   address:
    //     lpVaults.blpHarvestAutopilotCBBTCUSDC.addresses[networks.baseFork.id],
    //   abi: birdieLpVaults_abi,
    // },
    // WETH_DAI_HARVEST: {
    //   address: "0x0000000000000000000000000000000000000000",
    //   abi: birdieLpVaults_abi,
    // },
    // WETH_harvest_autopilot: {
    //   address:
    //     singleVaults.bHarvestAutopilotWETH.addresses[networks.baseFork.id],
    //   abi: birdieLpVaults_abi,
    // },
    // CBBTC_harvest_autopilot: {
    //   address:
    //     singleVaults.bHarvestAutopilotCBBTC.addresses[networks.baseFork.id],
    //   abi: birdieLpVaults_abi,
    // },
    USDC_harvest_autopilot: {
      address:
        singleVaults.bHarvestAutopilotUSDC.addresses[networks.baseFork.id],
      abi: birdieLpVaults_abi,
    },
  },
  uniswapPool: {
    /*
    bWETH_bUSDT: { address: "0x0000000000000000000000000000000000000000" },
    bWETH_bUSDC: {
      address: swapPools.bUniswapAaveWETHUSDC.addresses[networks.baseFork.id],
    },
    bWETH_bCBBTC: {
      address: swapPools.bUniswapAaveWETHCBBTC.addresses[networks.baseFork.id],
    },
    bCBBTC_bUSDC: {
      address: swapPools.bUniswapAaveCBBTCUSDC.addresses[networks.baseFork.id],
    },
    blpWETH_USDC: {
      address: swapPools.blpUniswapAaveWETHUSDC.addresses[networks.baseFork.id],
    },
    blpCBBTC_USDC: {
      address:
        swapPools.blpUniswapAaveCBBTCUSDC.addresses[networks.baseFork.id],
    },  
    blpWETH_USDC_harvest: {
      address:
        swapPools.blpUniswapHarvestWETHUSDC.addresses[networks.baseFork.id],
    },
    blpCBBTC_USDC_harvest: {
      address:
        swapPools.blpUniswapHarvestCBBTCUSDC.addresses[networks.baseFork.id],
    }, */
    // blpWETH_USDC_harvest_autopilot: {
    //   address:
    //     swapPools.blpUniswapHarvestAutopilotWETHUSDC.addresses[
    //       networks.baseFork.id
    //     ],
    // },
    // blpCBBTC_USDC_harvest_autopilot: {
    //   address:
    //     swapPools.blpUniswapHarvestAutopilotCBBTCUSDC.addresses[
    //       networks.baseFork.id
    //     ],
    // },
  },
  harvestVaults: {},
  // WETH: {
  //   address: externalTokens.WETH.addresses[networks.baseFork.id],
  //   abi: erc20_abi,
  // },
  // USDT: {
  //   address: "0x0000000000000000000000000000000000000000",
  //   abi: erc20_abi,
  // },
  // USDC: {
  //   address: tokens.USDC.addresses[networks.baseFork.id],
  //   abi: erc20_abi,
  // },
  // DAI: {
  //   address: "0x0000000000000000000000000000000000000000",
  //   abi: erc20_abi,
  // },
  // AAVE: {
  //   address: "0x0000000000000000000000000000000000000000",
  //   abi: erc20_abi,
  // },
  // CBBTC: {
  //   address: tokens.CBBTC.addresses[networks.baseFork.id],
  //   abi: erc20_abi,
  // },
};

/**
 * @deprecated moving to [src/const/contracts/sepolia](./contracts/sepolia/index.ts)
 */
export const contracts_sepolia = {
  birdieRouter: {
    address: "0x9b3C836203666B1578b60aeCBDCe553341cb87f5",
    abi: birdieswap_router_abi,
  },
  birdieVaults: {
    WETH_USDT_HARVEST: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieLpVaults_abi,
    },
    WETH_USDC_HARVEST: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieLpVaults_abi,
    },
    WETH_DAI_HARVEST: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieLpVaults_abi,
    },
    WETH_USDT_AAVE: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieLpVaults_abi,
    },
    WETH_USDC_AAVE: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieLpVaults_abi,
    },
    WETH_CBBTC_AAVE: {
      address: "0x9ebD24Cc0B267Ebd2a5270793C417e0940644B26",
      abi: birdieLpVaults_abi,
    },
    WETH: {
      address: "0x8282d9D38bdF36D1805738F766b171620ff2dE0D",
      abi: birdieSingleVaults_abi,
    },
    USDT: {
      address: "0xacA5eA2726bE50B9Ac77cAA20544E1Bb6c5B13Ad",
      abi: birdieSingleVaults_abi,
    },
    USDC: {
      address: "0x59dd4254A014C1C95E4174b2508C15EB95C7De27",
      abi: birdieSingleVaults_abi,
    },
    DAI: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieSingleVaults_abi,
    },
    AAVE: {
      address: "0x0000000000000000000000000000000000000000",
      abi: birdieSingleVaults_abi,
    },
    CBBTC: {
      address: "0xE9111a85056F9C7302374Bc3480E92b1c84D75Ff",
      abi: birdieSingleVaults_abi,
    },
    WETHCBBTC: {
      address: "0xBB14D5762BD7329820A029afEF171386B057F088",
      abi: erc20_abi,
    },
  },
};
