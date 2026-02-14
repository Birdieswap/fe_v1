import { erc20Abi } from "viem";

import {
  IBirdieSingleFarm,
  EContractType,
  ISwapPool,
  ICurrency,
} from "../types/tokenTypes";
import { SwapPoolGuard } from "../types/typeGuards";
import networks from "../networks";

import stakingProviders from "./stakingProviders";
import tokens from "./tokens";
import externalTokens from "./externalTokens";

export const Uniswap_ETH_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xd0b53D9277642d899DF5C87A3966A349A798F224",
  },
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, tokens.USDC],
  symbol: "ETH_USDC",
  fullName: "Uniswap ETH 500 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_CBBTC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef",
  },
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.CBBTC],
  symbol: "USDC_CBBTC",
  fullName: "Uniswap USDC 500 cbBTC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_VIRTUAL_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x9c087Eb773291e50CF6c6a90ef0F4500e349B903",
  },
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.VIRTUAL, externalTokens.ETH],
  symbol: "VIRTUAL_ETH",
  fullName: "Uniswap VIRTUAL 500 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_MAG7_SSI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD364eb55E17700b54bd75fEB3F14582eD7A29444",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.MAG7_SSI],
  symbol: "USDC_MAG7_SSI",
  fullName: "Uniswap USDC 3000 MAG7.ssi",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ZORA_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xEdc625B74537eE3a10874f53D170E9c17A906B9c",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ZORA, tokens.USDC],
  symbol: "ZORA_USDC",
  fullName: "Uniswap ZORA 3000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_SOSO_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x29183f918920a2AEF0115A9C7374945589968aEa",
  },
  fee_tier: 100,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.SOSO, tokens.USDC],
  symbol: "SOSO_USDC",
  fullName: "Uniswap SOSO 100 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ZORA_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xA0Ca5bEbC42cDbf3623B1C09206Ae4e3975B0FC7",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ZORA, externalTokens.ETH],
  symbol: "ZORA_ETH",
  fullName: "Uniswap ZORA 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_AERO = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xE5B5f522E98B5a2baAe212d4dA66b865B781DB97",
  },
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.AERO],
  symbol: "USDC_AERO",
  fullName: "Uniswap USDC 500 AERO",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_DEFI_SSI_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xa23fAb21d0653C231166B31Cb6274ff45eBA2eE5",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.DEFI_SSI, tokens.USDC],
  symbol: "DEFI_SSI_USDC",
  fullName: "Uniswap DEFI.ssi 3000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_LMTS = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x1Ba720bEA92CbB26D1Fe1cD4E352E36a6F834f46",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.LMTS],
  symbol: "USDC_LMTS",
  fullName: "Uniswap USDC 3000 LMTS",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_CLANKER_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xC1a6FBeDAe68E1472DbB91FE29B51F7a0Bd44F97",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.CLANKER, externalTokens.ETH],
  symbol: "CLANKER_ETH",
  fullName: "Uniswap CLANKER 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_VIRTUAL_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x529d2863a1521d0b57db028168fdE2E97120017C",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.VIRTUAL, tokens.USDC],
  symbol: "VIRTUAL_USDC",
  fullName: "Uniswap VIRTUAL 3000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_BNKR_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xAEC085E5A5CE8d96A7bDd3eB3A62445d4f6CE703",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.BNKR, externalTokens.ETH],
  symbol: "BNKR_ETH",
  fullName: "Uniswap BNKR 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_NOICE = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xeFF7f8Fe083d7a446717B992bf84391253e54789",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.NOICE],
  symbol: "ETH_NOICE",
  fullName: "Uniswap ETH 10000 noice",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_BRETT = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xBA3F945812a83471d709BCe9C3CA699A19FB46f7",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.BRETT],
  symbol: "ETH_BRETT",
  fullName: "Uniswap ETH 3000 BRETT",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_MEME_SSI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x43F34A518e20B9454C94bf4026EC9024eD84a062",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.MEME_SSI],
  symbol: "USDC_MEME_SSI",
  fullName: "Uniswap USDC 3000 MEME.ssi",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_KTA = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x8d421B0D641193D67Dd1aa024DAb17fcdE0BfC89",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.KTA],
  symbol: "ETH_KTA",
  fullName: "Uniswap ETH 10000 KTA",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_AERO = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.sepolia.id]: "0x73f17d13fC9a54164258283c66A8804a6adA9EFe",
    [networks.base.id]: "0x3d5D143381916280ff91407FeBEB52f2b60f33Cf",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.AERO],
  symbol: "ETH_AERO",
  fullName: "Uniswap ETH 3000 AERO",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_CGN_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD164Ea3a559d046E694C9Ac09F80887E5906129c",
  },
  fee_tier: 100,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.CGN, tokens.USDC],
  symbol: "CGN_USDC",
  fullName: "Uniswap CGN 100 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USSI_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x12146c8E7469be19ec6c7F58B80246548144f8b8",
  },
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.USSI, tokens.USDC],
  symbol: "USSI_USDC",
  fullName: "Uniswap USSI 500 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_DEGEN = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.DEGEN],
  symbol: "ETH_DEGEN",
  fullName: "Uniswap ETH 3000 DEGEN",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_XSWAP = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xF0501988fA68361B67ce4024B9e477Af2aFeC58b",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.XSWAP],
  symbol: "ETH_XSWAP",
  fullName: "Uniswap ETH 3000 XSWAP",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_UXRP_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xc8da14d7467814A91384796Db3cA2c273b30B361",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.UXRP, externalTokens.ETH],
  symbol: "UXRP_ETH",
  fullName: "Uniswap uXRP 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_UADA = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD52ad625A19E5f258630413E374d65825D08e1dF",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.UADA],
  symbol: "ETH_UADA",
  fullName: "Uniswap ETH 3000 uADA",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_FARTCOIN_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xFdbAf04326AcC24e3d1788333826b71E3291863a",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.FARTCOIN, externalTokens.ETH],
  symbol: "FARTCOIN_ETH",
  fullName: "Uniswap Fartcoin 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ALXBT_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xf1Fdc83c3A336bdbDC9fB06e318B08EadDC82FF4",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.AIXBT, tokens.USDC],
  symbol: "AIXBT_USDC",
  fullName: "Uniswap AIXBT 3000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_USOL = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xab04A352D4EC8d0F1812A4E5EBe7807Fa67acD48",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.USOL],
  symbol: "ETH_USOL",
  fullName: "Uniswap ETH 3000 uSOL",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_MVTT10F = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xd19c0dbbC5Ba2eC4faa0e3FFf892F0E95F23D9e0",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.MVTT10F],
  symbol: "ETH_MVTT10F",
  fullName: "Uniswap ETH 3000 MVTT10F",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_FLUID = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x3b3d1a85A248b70100e95437dbeeBCAE5E7eC7a1",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.FLUID],
  symbol: "ETH_FLUID",
  fullName: "Uniswap ETH 10000 FLUID",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_BASEISFOREVERYONE = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x06D7874037E622d6eF42294Cf32EB259806Cb1C6",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.BASEISFOREVERYONE],
  symbol: "ETH_BASEISFOREVERYONE",
  fullName: "Uniswap ETH 10000 BASEISFOREVERYONE",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_AUKI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x2Fa9D6085c91151200e61a3e627D35001772C0D1",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.AUKI],
  symbol: "ETH_AUKI",
  fullName: "Uniswap ETH 10000 AUKI",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_I_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x87c0676255bE413399C9a205d9CbeB2A04814CCa",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.I, externalTokens.ETH],
  symbol: "I_ETH",
  fullName: "Uniswap i 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_PARTI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x9c42751954513c0461481a9600c9d11A059Ddd12",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.PARTI],
  symbol: "ETH_PARTI",
  fullName: "Uniswap ETH 10000 PARTI",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_ADS = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x16793Ae3a82C0F492baEF15F6c5312D06Da83D94",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.ADS],
  symbol: "ETH_ADS",
  fullName: "Uniswap ETH 3000 ADS",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_OMI_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x6E7b4416E3a2b873F6Cd4840e6bee7d88f07dA8f",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.OMI, externalTokens.ETH],
  symbol: "OMI_ETH",
  fullName: "Uniswap OMI 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_FAIR = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xFC01837343cfC2A9dDCA9e8a0a19825f6b2f0460",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.FAIR],
  symbol: "ETH_FAIR",
  fullName: "Uniswap ETH 10000 FAIR",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_REI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xA213C82265cd3D94f972f735A4f5130e34dF81Bc",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.REI],
  symbol: "ETH_REI",
  fullName: "Uniswap ETH 10000 REI",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_XTTA_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x593736011F19C80F4b9C3f3f50Eb687Ae923f614",
  },
  fee_tier: 100,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.XTTA, tokens.USDC],
  symbol: "XTTA_USDC",
  fullName: "Uniswap XTTA 100 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_TOSHI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x4b0Aaf3EBb163dd45F663b38b6d93f6093EBC2d3",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.TOSHI],
  symbol: "ETH_TOSHI",
  fullName: "Uniswap ETH 10000 TOSHI",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_ADS = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x70B1419aaa19f5071250577576E4A0adF1B7f396",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.ADS],
  symbol: "USDC_ADS",
  fullName: "Uniswap USDC 3000 ADS",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_LGCT = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xf9BB9137256193af73d2E8b3e377727756fd98be",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.LGCT],
  symbol: "USDC_LGCT",
  fullName: "Uniswap USDC 3000 LGCT",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_PEPE = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x0FB597D6cFE5bE0d5258A7f017599C2A4Ece34c7",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.PEPE],
  symbol: "ETH_PEPE",
  fullName: "Uniswap ETH 10000 PEPE",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ATTN_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xF90Bd5415E8C812Cb9a2015598193DCb11833D7c",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ATTN, tokens.USDC],
  symbol: "ATTN_USDC",
  fullName: "Uniswap ATTN 3000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ATTN_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x53D8288cE9CbcB97FFfaCFD710c866F721a2394b",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ATTN, externalTokens.ETH],
  symbol: "ATTN_ETH",
  fullName: "Uniswap ATTN 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_UDOGE_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x84a8FEDc7f310045C06bE3F9E412E58ec82448b2",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.UDOGE, externalTokens.ETH],
  symbol: "UDOGE_ETH",
  fullName: "Uniswap uDOGE 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_BRACKY_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x2E8b5Cf35680F8b7dF0957D05c6a0A4Ae1D00cde",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.BRACKY, externalTokens.ETH],
  symbol: "BRACKY_ETH",
  fullName: "Uniswap BRACKY 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_DOGINME = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xADE9BcD4b968EE26Bed102dd43A55f6A8c2416df",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.DOGINME],
  symbol: "ETH_DOGINME",
  fullName: "Uniswap ETH 10000 doginme",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_MOEW_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x8deB37B048F4b3c7Bd61EcA7dFcCbef7CbA726dE",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.MOEW, externalTokens.ETH],
  symbol: "MOEW_ETH",
  fullName: "Uniswap MOEW 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_SERV = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x393e58375cA7bCAA89ED90e661eE7cc46466eCCF",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.SERV],
  symbol: "ETH_SERV",
  fullName: "Uniswap ETH 10000 SERV",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_FAI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x68B27E9066d3aAdC6078E17C8611b37868F96A1D",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.FAI],
  symbol: "ETH_FAI",
  fullName: "Uniswap ETH 10000 FAI",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_HEU = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xB655DC66eCeaD581d1f1a5759c2c37C2dbEF2275",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.HEU],
  symbol: "ETH_HEU",
  fullName: "Uniswap ETH 10000 HEU",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_NATIVE_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x4cd15f2BC9533Bf6faC4ae33C649f138CB601935",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.NATIVE, externalTokens.ETH],
  symbol: "NATIVE_ETH",
  fullName: "Uniswap NATIVE 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_YES_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xdFCFDf5dd0569d591E0Bce28B5dA3b13dE09E3CB",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.YES, externalTokens.ETH],
  symbol: "YES_ETH",
  fullName: "Uniswap YES 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_MAGIC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x3c0AE164970Ab9eC216cF1b7Ae3118766Ab65e43",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.MAGIC],
  symbol: "ETH_MAGIC",
  fullName: "Uniswap ETH 3000 MAGIC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_FOOM_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xc5adb6F67c54D187a9FD8bA4994855e35963B69D",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.FOOM, externalTokens.ETH],
  symbol: "FOOM_ETH",
  fullName: "Uniswap FOOM 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_AOE_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x656a24D1b2AE52c039F0D6CC969d12F489e49C93",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.AOE, externalTokens.ETH],
  symbol: "AOE_ETH",
  fullName: "Uniswap AOE 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_LINGO = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x9399dA51C1a85e64CCe4b30B554875D2b89b2445",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.LINGO],
  symbol: "ETH_LINGO",
  fullName: "Uniswap ETH 3000 LINGO",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_IMO = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD8bCa82C613026b7141bc4E5826E7C910f082f39",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.IMO],
  symbol: "ETH_IMO",
  fullName: "Uniswap ETH 10000 IMO",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_HESTIA = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x1B39fC4C93EfbE733B8D2770bcfaa46885d5343a",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.HESTIA],
  symbol: "USDC_HESTIA",
  fullName: "Uniswap USDC 10000 HESTIA",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_TREE = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x58eCF9CeC06bC58FDe9280d348F79ED8f3D3046E",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.TREE],
  symbol: "ETH_TREE",
  fullName: "Uniswap ETH 3000 TREE",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_VEIL = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x7f1A5B66ba3BB56C4b68CFC353a5e041c9763A4C",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.VEIL],
  symbol: "ETH_VEIL",
  fullName: "Uniswap ETH 10000 VEIL",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_CIRCLE = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xDA679706FF21114AC9faC5198BfF24543F357a16",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.CIRCLE],
  symbol: "ETH_CIRCLE",
  fullName: "Uniswap ETH 10000 CIRCLE",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_DRB_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x5116773e18A9C7bB03EBB961b38678E45E238923",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.DRB, externalTokens.ETH],
  symbol: "DRB_ETH",
  fullName: "Uniswap DRB 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_BGCI_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD38d1AB8A150e6eE0AE70C86A8E9Fb0c83255b76",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.BGCI, externalTokens.ETH],
  symbol: "BGCI_ETH",
  fullName: "Uniswap BGCI 3000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_QR_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xF02C421e15ABDF2008Bb6577336B0F3D7aeC98F0",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.QR, externalTokens.ETH],
  symbol: "QR_ETH",
  fullName: "Uniswap QR 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_FLAY = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x7B9FDA92Bfa6FDadFdc4f6C72c0Cc8336e7d7497",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.FLAY],
  symbol: "ETH_FLAY",
  fullName: "Uniswap ETH 10000 FLAY",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_OHM_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x183ea22691c54806FE96555436dd312b6BeFAc2F",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.OHM, tokens.USDC],
  symbol: "OHM_USDC",
  fullName: "Uniswap OHM 10000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_COCORO = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD2fdfD5059A83E15bF362F094A2aE63F03b554ca",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.COCORO],
  symbol: "ETH_COCORO",
  fullName: "Uniswap ETH 10000 Cocoro",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_SIMMI_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xe9a65059E895DD5D49806f6A71B63FEd0fFffD4B",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.SIMMI, externalTokens.ETH],
  symbol: "SIMMI_ETH",
  fullName: "Uniswap SIMMI 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_SCI_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x0962a51e121aa8371Cd4bb0458B7e5A08c1cbd29",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.SCI, externalTokens.ETH],
  symbol: "SCI_ETH",
  fullName: "Uniswap SCI 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_MFER = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x7EC18ABf80E865c6799069df91073335935C4185",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.MFER],
  symbol: "ETH_MFER",
  fullName: "Uniswap ETH 10000 $mfer",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_BONSAICOIN = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x4fe87203b27a105a772f195D3F30dea714d1ECf0",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.BONSAICOIN],
  symbol: "USDC_BONSAICOIN",
  fullName: "Uniswap USDC 10000 BONSAICOIN",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_MT = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xBeaE5Ba2969C5B3f14164FC32a48fd5350C81788",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.MT],
  symbol: "ETH_MT",
  fullName: "Uniswap ETH 3000 MT",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_ELONRWA = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xD56f086E7B796b313d49f2BC926fAc4BDd2a2B0B",
  },
  fee_tier: 100,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.ELONRWA],
  symbol: "ETH_ELONRWA",
  fullName: "Uniswap ETH 100 ElonRWA",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_CHAOS_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x01A1f5758c3a53057B6C819Ec7331e39c167794A",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.CHAOS, externalTokens.ETH],
  symbol: "CHAOS_ETH",
  fullName: "Uniswap CHAOS 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_INT = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xE2DdA0911e227e73d9fD94745B851C8bC6504610",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.INT],
  symbol: "ETH_INT",
  fullName: "Uniswap ETH 10000 INT",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_PANANA = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x61928bf5f2895B682ecC9B13957AA5a5fE040cC0",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.PANANA],
  symbol: "ETH_PANANA",
  fullName: "Uniswap ETH 10000 PANANA",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_GDEX = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x65B6ee9CaC744D4eed9886406EAD6bc4E5681068",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.GDEX],
  symbol: "ETH_GDEX",
  fullName: "Uniswap ETH 10000 gDEX",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_TORUS_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x0eB7fbE43045426938dDadc11dC41338E0907659",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.TORUS, tokens.USDC],
  symbol: "TORUS_USDC",
  fullName: "Uniswap TORUS 10000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_BORED = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xcFaf75a3d292C3535eA3acdb16Ed2EE58c2Bb091",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.BORED],
  symbol: "ETH_BORED",
  fullName: "Uniswap ETH 10000 BORED",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_BALD_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x9E37cb775a047Ae99FC5A24dDED834127c4180cD",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.BALD, externalTokens.ETH],
  symbol: "BALD_ETH",
  fullName: "Uniswap BALD 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_BSDETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xdea629c5587037d0925Ff85F1961d95db62BEDD6",
  },
  fee_tier: 500,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.BSDETH],
  symbol: "ETH_BSDETH",
  fullName: "Uniswap ETH 500 bsdETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_BEBE = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x548e923281F372d28a40287D3A2d30DcE482fc66",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.BEBE],
  symbol: "ETH_BEBE",
  fullName: "Uniswap ETH 3000 BEBE",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_COSMIC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xB34a5657988dA5B9888952c439756594613507AA",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.COSMIC],
  symbol: "ETH_COSMIC",
  fullName: "Uniswap ETH 3000 COSMIC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_IDRISS_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x6F9d09253f99d2B6843b5ec62C23496c37327216",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.IDRISS, externalTokens.ETH],
  symbol: "IDRISS_ETH",
  fullName: "Uniswap IDRISS 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_CLUSTR = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xB3fB7cCF7b681E9562C6DA467db4859A8Ef0B8de",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.CLUSTR],
  symbol: "ETH_CLUSTR",
  fullName: "Uniswap ETH 10000 CLUSTR",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_DOG_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xc847CF4b917a372D9DE7960f0e3362BA9D9cd8f2",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.DOG, externalTokens.ETH],
  symbol: "DOG_ETH",
  fullName: "Uniswap DOG 10000 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_ETH_LTAI = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x30442fcEBbd75A5BB58377C0174D5CE637e297D7",
  },
  fee_tier: 10000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.ETH, externalTokens.LTAI],
  symbol: "ETH_LTAI",
  fullName: "Uniswap ETH 10000 LTAI",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_USDC_ARCX = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x10B2d5d97F703E12D2F242ce4373a5973fE3767A",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [tokens.USDC, externalTokens.ARCX],
  symbol: "USDC_ARCX",
  fullName: "Uniswap USDC 3000 ARCX",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_NYA_ETH = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0x783B62AfD1D3a82956E8306E787210F1E2A1213a",
  },
  fee_tier: 100,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.NYA, externalTokens.ETH],
  symbol: "NYA_ETH",
  fullName: "Uniswap NYA 100 ETH",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export const Uniswap_TRUST_USDC = SwapPoolGuard({
  type: EContractType.SWAP,
  addresses: {
    [networks.base.id]: "0xefF370558391e6b62bC1B3Ea816148d2BD186458",
  },
  fee_tier: 3000,
  abi: erc20Abi,
  provider: stakingProviders.UNISWAP,
  protocol: "Uniswap V3",
  isInternal: false,
  input: [externalTokens.TRUST, tokens.USDC],
  symbol: "TRUST_USDC",
  fullName: "Uniswap TRUST 3000 USDC",
  decimals: 18,
} as const satisfies ISwapPool<ICurrency>);

export default {
  Uniswap_ETH_USDC,
  Uniswap_USDC_CBBTC,
  Uniswap_VIRTUAL_ETH,
  Uniswap_USDC_MAG7_SSI,
  Uniswap_ZORA_USDC,
  Uniswap_SOSO_USDC,
  Uniswap_ZORA_ETH,
  Uniswap_USDC_AERO,
  Uniswap_DEFI_SSI_USDC,
  Uniswap_USDC_LMTS,
  Uniswap_CLANKER_ETH,
  Uniswap_VIRTUAL_USDC,
  Uniswap_BNKR_ETH,
  Uniswap_ETH_NOICE,
  Uniswap_ETH_BRETT,
  Uniswap_USDC_MEME_SSI,
  Uniswap_ETH_KTA,
  Uniswap_ETH_AERO,
  Uniswap_CGN_USDC,
  Uniswap_USSI_USDC,
  Uniswap_ETH_DEGEN,
  Uniswap_ETH_XSWAP,
  Uniswap_UXRP_ETH,
  Uniswap_ETH_UADA,
  Uniswap_FARTCOIN_ETH,
  Uniswap_ALXBT_USDC,
  Uniswap_ETH_USOL,
  Uniswap_ETH_MVTT10F,
  Uniswap_ETH_FLUID,
  Uniswap_ETH_BASEISFOREVERYONE,
  Uniswap_ETH_AUKI,
  Uniswap_I_ETH,
  Uniswap_ETH_PARTI,
  Uniswap_ETH_ADS,
  Uniswap_OMI_ETH,
  Uniswap_ETH_FAIR,
  Uniswap_ETH_REI,
  Uniswap_XTTA_USDC,
  Uniswap_ETH_TOSHI,
  Uniswap_USDC_ADS,
  Uniswap_USDC_LGCT,
  Uniswap_ETH_PEPE,
  Uniswap_ATTN_USDC,
  Uniswap_ATTN_ETH,
  Uniswap_UDOGE_ETH,
  Uniswap_BRACKY_ETH,
  Uniswap_ETH_DOGINME,
  Uniswap_MOEW_ETH,
  Uniswap_ETH_SERV,
  Uniswap_ETH_FAI,
  Uniswap_ETH_HEU,
  Uniswap_NATIVE_ETH,
  Uniswap_YES_ETH,
  Uniswap_ETH_MAGIC,
  Uniswap_FOOM_ETH,
  Uniswap_AOE_ETH,
  Uniswap_ETH_LINGO,
  Uniswap_ETH_IMO,
  Uniswap_USDC_HESTIA,
  Uniswap_ETH_TREE,
  Uniswap_ETH_VEIL,
  Uniswap_ETH_CIRCLE,
  Uniswap_DRB_ETH,
  Uniswap_BGCI_ETH,
  Uniswap_QR_ETH,
  Uniswap_ETH_FLAY,
  Uniswap_OHM_USDC,
  Uniswap_ETH_COCORO,
  Uniswap_SIMMI_ETH,
  Uniswap_SCI_ETH,
  Uniswap_ETH_MFER,
  Uniswap_USDC_BONSAICOIN,
  Uniswap_ETH_MT,
  Uniswap_ETH_ELONRWA,
  Uniswap_CHAOS_ETH,
  Uniswap_ETH_INT,
  Uniswap_ETH_PANANA,
  Uniswap_ETH_GDEX,
  Uniswap_TORUS_USDC,
  Uniswap_ETH_BORED,
  Uniswap_BALD_ETH,
  Uniswap_ETH_BSDETH,
  Uniswap_ETH_BEBE,
  Uniswap_ETH_COSMIC,
  Uniswap_IDRISS_ETH,
  Uniswap_ETH_CLUSTR,
  Uniswap_DOG_ETH,
  Uniswap_ETH_LTAI,
  Uniswap_USDC_ARCX,
  Uniswap_NYA_ETH,
  Uniswap_TRUST_USDC,
};
