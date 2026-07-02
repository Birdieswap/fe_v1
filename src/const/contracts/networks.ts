import * as chains from "viem/chains";

import { baseFork, bsc, giwaSepolia, sepolia } from "@/const/networks";

import { IBaseNetwork, ViemChainToBaseNetwork } from "./types/tokenTypes";

const Sepolia: IBaseNetwork = ViemChainToBaseNetwork(
  sepolia,
  "/networks/sepolia.svg"
);
const GiwaSepolia: IBaseNetwork = ViemChainToBaseNetwork(
  giwaSepolia,
  "/networks/giwa.svg"
);
const Arbitrum: IBaseNetwork = ViemChainToBaseNetwork(
  chains.arbitrum,
  "/networks/arbitrum.svg"
);
const Base: IBaseNetwork = ViemChainToBaseNetwork(
  chains.base,
  "/networks/base.svg"
);
const Optimism: IBaseNetwork = ViemChainToBaseNetwork(
  chains.optimism,
  "/networks/optimism.svg"
);
const BSC: IBaseNetwork = ViemChainToBaseNetwork(bsc, "/networks/bsc.svg");
const Polygon: IBaseNetwork = ViemChainToBaseNetwork(
  chains.polygon,
  "/networks/polygon.svg"
);
const Scroll: IBaseNetwork = ViemChainToBaseNetwork(
  chains.scroll,
  "/networks/scroll.svg"
);
const BaseFork: IBaseNetwork = ViemChainToBaseNetwork(baseFork);

const networks = {
  sepolia: Sepolia,
  giwa: GiwaSepolia,
  arbitrum: Arbitrum,
  base: Base,
  optimism: Optimism,
  bsc: BSC,
  polygon: Polygon,
  scroll: Scroll,
  baseFork: BaseFork,
};

export default networks;
