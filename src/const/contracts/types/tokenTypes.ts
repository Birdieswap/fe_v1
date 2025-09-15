import { Abi } from "viem";
import * as chains from "viem/chains";

import {
  birdieLpVaults_abi,
  birdieSingleVaults_abi,
  erc20_abi,
} from "@/const/abis";

import { chainlink_aggregator_v3_abi } from "../abis/chainlink_aggregator_v3_abi";
import { birdieswap_router_abi } from "../abis/birdieswap_router_abi";

export enum EContractType {
  CURRENCY = "CURRENCY",
  SWAP = "SWAP",
  STAKING = "STAKING",
  BIRDIE_SINGLE = "BirdieSingle",
  BIRDIE_LP = "BirdieLP",
  CHAINLINK_PRICE_FEED = "CHAINLINK_PRICE_FEED",
}

export enum EProvider {
  UNISWAP = "Uniswap",
  AAVE = "AAVE",
  AUTOPILOT = "Autopilot",
  BIRDIESWAP = "Birdieswap",
}

export type IBaseNetwork<T extends chains.Chain = chains.Chain> = {
  id: number; // Network ID
  name: string; // Network name
  rpcUrl: { http: string; websocket?: string }; // RPC URL for the network
  blockExplorer: {
    name: string; // Name of the block explorer
    url: string; // URL of the block explorer
    apiUrl?: string; // Optional API URL for the block explorer
  };
  iconSrc?: string; // Optional icon for the network
  viemChain: T;
};

export function ViemChainToBaseNetwork<
  T extends chains.Chain & {
    blockExplorers: {
      default: {
        name: string;
        url: string;
      };
    };
  },
>(viemChain: T, iconSrc?: string): IBaseNetwork<T> {
  return {
    id: viemChain.id,
    name: viemChain.name,
    rpcUrl: {
      http: viemChain.rpcUrls.default.http[0],
      websocket: viemChain.rpcUrls.default.webSocket?.[0],
    },
    blockExplorer: viemChain.blockExplorers.default,
    iconSrc: iconSrc,
    viemChain: viemChain,
  };
}

export type IContractBase = {
  addresses: {
    [networkId: number]: `0x${string}`;
  };
  decimals: number;
  displayDecimals?: number;
  fullName: string;
  symbol: string;
  abi: Abi;
  iconSrc?: string;
};

export type ITokenBase = IContractBase;

export type IStakingProvider = {
  name: string;
  provider?: EProvider;
  iconSrc?: string;
  addresses: {
    [networkId: number]: `0x${string}`;
  }; // Address of the staking router
  abi?: Abi; // ABI of the staking router
};

export type ICurrency = ITokenBase & {
  type: EContractType.CURRENCY;
  abi: typeof erc20_abi;
};

export type WIP_ChainLinkPriceFeed = IContractBase & {
  type: EContractType.CHAINLINK_PRICE_FEED;
  abi: typeof chainlink_aggregator_v3_abi; // ABI for Chainlink price feed
  base: IToken; // The base token for the price feed
  quote: IToken | "USD"; // The quote token for the price feed
};

// Liquidity Pool
export type ISwapPool<T extends ITokenBase = ITokenBase> = IContractBase & {
  type: EContractType.SWAP;
  fee_tier?: number; // Fee tier for the pool, e.g., 3000 for 0.3%
  provider: string | IStakingProvider; // i.e. Uniswap, etc.
  protocol: string; // i.e. Uniswap V2, etc.
  isInternal?: boolean; // Whether this is an internal pool (e.g. Birdie LP)
  input: [T, T];
};

export type IBirdieSingleFarm<T extends IStakingProvider = IStakingProvider> =
  IContractBase & {
    type: EContractType.BIRDIE_SINGLE;
    provider: T; // i.e. AAVE, etc.
    input: ICurrency;
    abi: typeof erc20_abi;
  };

export function isBirdieSingleFarm(token: IToken): token is IBirdieSingleFarm {
  return token.type === EContractType.BIRDIE_SINGLE;
}

export type IBirdieLPFarm<T extends IStakingProvider = IStakingProvider> =
  IContractBase & {
    type: EContractType.BIRDIE_LP;
    swap: ISwapPool<IBirdieSingleFarm<T>>;
    lpPool: ISwapPool<IBirdieSingleFarm<T>>;
    abi: typeof birdieLpVaults_abi;
    provider: IStakingProvider; // Birdie
  };

export function isBirdieLPFarm(token: IToken): token is IBirdieLPFarm {
  return token.type === EContractType.BIRDIE_LP;
}

export type IToken = ICurrency | ISwapPool | IBirdieSingleFarm | IBirdieLPFarm;
