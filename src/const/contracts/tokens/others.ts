import { uniswapQuoterV2Abi } from "../abis/uniswap_quoter_v2_abi";
import { contractAddresses } from "../contractAddresses";
import networks from "../networks";

const UniswapQuoterV2 = {
  addresses: {
    [networks.sepolia.id]: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
    [networks.giwa.id]: "0xa6D1C4Bb3E0E5576c537FDD411a1228B6cd0dcc1",
    [networks.arbitrum.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    [networks.base.id]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    [networks.bsc.id]: "0x78D78E420Da98ad378D7799bE8f4AF69033EB077",
    [networks.optimism.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
    [networks.polygon.id]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  },
  abi: uniswapQuoterV2Abi,
} as const;

const UniswapNonfungiblePositionManager = {
  addresses: {
    [networks.sepolia.id]: "0x1238536071E1c677A632429e3655c799b22cDA52",
    [networks.giwa.id]: "0xF510a87b3575DcBb6559Caefb833822c879C0de0",
    [networks.arbitrum.id]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    [networks.base.id]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    [networks.bsc.id]: "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613",
    [networks.optimism.id]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    [networks.polygon.id]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  abi: uniswapQuoterV2Abi,
} as const;

const miscContracts = {
  UniswapQuoterV2,
  UniswapNonfungiblePositionManager,
};

export default miscContracts;
