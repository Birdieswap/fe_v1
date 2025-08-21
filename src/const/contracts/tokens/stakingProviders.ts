import { aave_pool_abi } from "../abis/aave_pool_abi";
import { birdieswap_router_abi } from "../abis/birdieswap_router_abi";
import { uniswap_factory_v3_abi } from "../abis/uniswap_factory_v3_abi";
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
    [networks.baseFork.id]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    [networks.bsc.id]: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
    [networks.optimism.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [networks.polygon.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [networks.scroll.id]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  },
  abi: uniswap_factory_v3_abi,
} as const);

const AAVE = StakingProviderGuard({
  name: "AAVE",
  provider: EProvider.AAVE,
  addresses: {
    [networks.sepolia.id]: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    [networks.arbitrum.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    [networks.base.id]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    [networks.baseFork.id]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    [networks.bsc.id]: "0x6807dc923806fE8Fd134338EABCA509979a7e0cB",
    [networks.optimism.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    [networks.polygon.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    [networks.scroll.id]: "0x11fCfe756c05AD438e312a7fd934381537D3cFfe",
  },
  abi: aave_pool_abi,
} as const);

const HARVEST = StakingProviderGuard({
  name: "Autopilot",
  provider: EProvider.AUTOPILOT,
  addresses: {},
  abi: [],
} as const);

const BIRDIE = StakingProviderGuard({
  name: "AutoPilot", //"Birdie",
  provider: EProvider.BIRDIE,
  addresses: {
    [networks.sepolia.id]: "0xF14185752E4B64c230BcB4735B1ebE854d6f6F81",
    [networks.base.id]: "0x82917daD62e1a3D32E5f8a70B5664e941B20A3a3",
    [networks.baseFork.id]: "0x82917daD62e1a3D32E5f8a70B5664e941B20A3a3",
  },
  abi: birdieswap_router_abi,
} as const);

const stakingProviders = {
  UNISWAP,
  AAVE,
  HARVEST,
  BIRDIE,
};

export default stakingProviders;
