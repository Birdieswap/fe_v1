import { uniswapQuoterV2Abi } from "../abis/uniswap_quoter_v2_abi"
import networks from "../networks";

const UniswapQuoterV2 = {
  addresses: {
    [networks.sepolia.id]: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
    [networks.arbitrum.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    [networks.base.id]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    [networks.baseFork.id]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    [networks.bsc.id]: "0x78D78E420Da98ad378D7799bE8f4AF69033EB077",
    [networks.optimism.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    [networks.polygon.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    [networks.scroll.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  },
  abi: uniswapQuoterV2Abi,
} as const;

const miscContracts = {
  UniswapQuoterV2,
};

export default miscContracts;
