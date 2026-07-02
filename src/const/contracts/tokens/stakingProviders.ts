import { aave_pool_abi } from "../abis/aave_pool_abi";
import { birdieswap_router_abi } from "../abis/birdieswap_router_abi";
import { birdieswap_wrapper_abi } from "../abis/birdieswap_wrapper_abi";
import { uniswap_factory_v3_abi } from "../abis/uniswap_factory_v3_abi";
import { contractAddresses } from "../contractAddresses";
import networks from "../networks";
import { EProvider } from "../types/tokenTypes";
import { StakingProviderGuard } from "../types/typeGuards";

const UNISWAP = StakingProviderGuard({
  name: "Uniswap",
  provider: EProvider.UNISWAP,
  addresses: {
    [networks.sepolia.id]: "0x65669fe35312947050c450bd5d36e6361f85ec12",
    [networks.arbitrum.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [networks.base.id]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    [networks.giwa.id]: "0xCCbE80c0bffb61Dc5f99179051c89107b648c80F",
    [networks.baseFork.id]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    [networks.bsc.id]: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
    [networks.optimism.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [networks.polygon.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [networks.scroll.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  },
  abi: uniswap_factory_v3_abi,
} as const);

const HARVEST = StakingProviderGuard({
  name: "Autopilot",
  provider: EProvider.AUTOPILOT,
  addresses: {},
  abi: [],
} as const);

const BIRDIESWAP_Router = StakingProviderGuard({
  name: "Birdieswap Router",
  provider: EProvider.BIRDIESWAP,
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.ROUTER as `0x${string}`,
    [networks.giwa.id]: contractAddresses.giwa.ROUTER as `0x${string}`,
    [networks.base.id]: contractAddresses.base.ROUTER as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.ROUTER as `0x${string}`,
  },
  abi: birdieswap_router_abi,
} as const);

const BIRDIESWAP_Wrapper = StakingProviderGuard({
  name: "Birdieswap Wrapper",
  provider: EProvider.BIRDIESWAP,
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.WRAPPER as `0x${string}`,
    [networks.giwa.id]: contractAddresses.giwa.WRAPPER as `0x${string}`,
    [networks.base.id]: contractAddresses.base.WRAPPER as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WRAPPER as `0x${string}`,
  },
  abi: birdieswap_wrapper_abi,
} as const);

const BIRDIESWAP_Staking = StakingProviderGuard({
  name: "Birdieswap Staking",
  provider: EProvider.BIRDIESWAP,
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.WRAPPER as `0x${string}`,
    [networks.giwa.id]: contractAddresses.giwa.WRAPPER as `0x${string}`,
    [networks.base.id]: contractAddresses.base.WRAPPER as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WRAPPER as `0x${string}`,
  },
  abi: birdieswap_wrapper_abi,
} as const);

const stakingProviders = {
  UNISWAP,
  HARVEST,
  BIRDIESWAP_Router,
  BIRDIESWAP_Wrapper,
  BIRDIESWAP_Staking,
};

export default stakingProviders;
