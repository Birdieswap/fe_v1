import { erc20_abi } from "@/const/abis";

import { EContractType } from "../types/tokenTypes";
import { CurrencyGuard } from "../types/typeGuards";
import networks from "../networks";
import { contractAddresses } from "../contractAddresses";

export const VIRTUAL = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
  },
  symbol: "VIRTUAL",
  fullName: "Virtuals Protocol",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/34057/large/LOGOMARK.png?1708356054",
} as const);

export const MAG7_SSI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x9E6A46f294bB67c20F1D1E7AfB0bBEf614403B55",
  },
  symbol: "MAG7.SSI",
  fullName: "MAG7.ssi",
  decimals: 8,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52962/large/mag7.png?1734863745",
} as const);

export const ZORA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x1111111111166b7FE7bd91427724B487980aFc69",
  },
  symbol: "ZORA",
  fullName: "Zora",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54693/large/zora.jpg?1741094751",
} as const);

export const SOSO = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x624e2e7fDc8903165F64891672267AB0FCB98831",
  },
  symbol: "SOSO",
  fullName: "SoSoValue",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53919/large/soso.jpg?1737717378",
} as const);

export const AERO = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.sepolia.id]: "0xCB18847f92B98380811D78d76F1D359D98Afe5fd",
    [networks.base.id]: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
  },
  symbol: "AERO",
  fullName: "Aerodrome Finance",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/31745/large/token.png?1696530564",
} as const);

export const DEFI_SSI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x164ffdaE2fe3891714bc2968f1875ca4fA1079D0",
  },
  symbol: "DEFI.SSI",
  fullName: "DEFI.ssi",
  decimals: 8,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53090/large/defi.png?1735214136",
} as const);

export const LMTS = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x9EadbE35F3Ee3bF3e28180070C429298a1b02F93",
  },
  symbol: "LMTS",
  fullName: "Limitless",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/69506/large/limitless.png?1758786338",
} as const);

export const CLANKER = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb",
  },
  symbol: "CLANKER",
  fullName: "tokenbot",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/51440/large/CLANKER.png?1731232869",
} as const);

export const BNKR = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b",
  },
  symbol: "BNKR",
  fullName: "BankrCoin",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52626/large/bankr-static.png?1736405365",
} as const);

export const NOICE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x9Cb41FD9dC6891BAe8187029461bfAADF6CC0C69",
  },
  symbol: "NOICE",
  fullName: "noice",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/55981/large/tCtKSYL3_400x400.jpg?1747925133",
} as const);

export const BRETT = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
  },
  symbol: "BRETT",
  fullName: "Brett",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/35529/large/1000050750.png?1709031995",
} as const);

export const MEME_SSI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xdd3acDBDc7b358Df453a6CB6bCA56C92aA5743aA",
  },
  symbol: "MEME.SSI",
  fullName: "MEME.ssi",
  decimals: 8,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53091/large/meme.png?1735214704",
} as const);

export const KTA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xc0634090F2Fe6c6d75e61Be2b949464aBB498973",
  },
  symbol: "KTA",
  fullName: "Keeta",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54723/large/2025-03-05_22.53.06.jpg?1741234207",
} as const);

export const CGN = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x2e6C4BD1C947e195645d2B920b827498cfAa6766",
  },
  symbol: "CGN",
  fullName: "Cygnus",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/70232/large/cgn.png?1761130107",
} as const);

export const USSI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x3a46ed8FCeb6eF1ADA2E4600A522AE7e24D2Ed18",
  },
  symbol: "USSI",
  fullName: "USSI",
  decimals: 8,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53089/large/ussi.png?1735213864",
} as const);

export const DEGEN = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
  },
  symbol: "DEGEN",
  fullName: "Degen",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/34515/large/android-chrome-512x512.png?1706198225",
} as const);

export const XSWAP = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x8Fe815417913a93Ea99049FC0718ee1647A2a07c",
  },
  symbol: "XSWAP",
  fullName: "XSwap",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36000/large/XSwap_Icon_%282%29.png?1710320467",
} as const);

export const UXRP = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x2615a94df961278DcbC41Fb0a54fEc5f10a693aE",
  },
  symbol: "UXRP",
  fullName: "Wrapped XRP (Universal)",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/51658/large/UA-XRP_1.png?1731703523",
} as const);

export const UADA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xa3A34A0D9A08CCDDB6Ed422Ac0A28a06731335aA",
  },
  symbol: "UADA",
  fullName: "Wrapped ADA (Universal)",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/51868/large/UA-ADA.png?1732095196",
} as const);

export const FARTCOIN = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x2f6c17fa9f9bC3600346ab4e48C0701e1d5962AE",
  },
  symbol: "FARTCOIN",
  fullName: "Based Fartcoin",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53113/large/farrtcoin_logo.png?1735241861",
} as const);

export const AIXBT = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x4F9Fd6Be4a90f2620860d680c0d4d5Fb53d1A825",
  },
  symbol: "AIXBT",
  fullName: "aixbt",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/51784/large/3.png?1731981138",
} as const);

export const USOL = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x9B8Df6E244526ab5F6e6400d331DB28C8fdDdb55",
  },
  symbol: "USOL",
  fullName: "Wrapped Solana (Universal)",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/39987/large/UA-SOL_1.png?1725027946",
} as const);

export const MVTT10F = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xe8b46b116D3BdFA787CE9CF3f5aCC78dc7cA380E",
  },
  symbol: "MVTT10F",
  fullName: "MarketVector Token Terminal Fundamental Index",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54605/large/MV-logo.png?1740639926",
} as const);

export const FLUID = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x61E030A56D33e8260FdD81f03B162A79Fe3449Cd",
  },
  symbol: "FLUID",
  fullName: "Fluid",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/14688/large/Logo_1_%28brighter%29.png?1734430693",
} as const);

export const BASEISFOREVERYONE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xD769d56f479E9E72a77bB1523e866A33098Feec5",
  },
  symbol: "BASEISFOREVERYONE",
  fullName: "Base is for everyone",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/55231/large/baseisforeveryone.jpg?1744862972",
} as const);

export const AUKI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xF9569cFb8FD265e91aa478d86ae8c78b8AF55Df4",
  },
  symbol: "AUKI",
  fullName: "Auki",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/39811/large/COINGECKO-200-x-200_%281%29.png?1724166209",
} as const);

export const I = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x1F015712aa2a48085eC93F87d643bB625b668B07",
  },
  symbol: "I",
  fullName: "Indexy",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/66582/large/qczwgqkspq47mk99h5tv11kqyf6w.?1749809300",
} as const);

export const PARTI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x59264f02D301281f3393e1385c0aEFd446Eb0F00",
  },
  symbol: "PARTI",
  fullName: "Particle Network",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54955/large/parti-token-200.png?1742822558",
} as const);

export const ADS = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xb20A4Bd059F5914a2F8B9c18881c637f79efb7df",
  },
  symbol: "ADS",
  fullName: "Adshares",
  decimals: 11,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/868/large/rnO9DyJ.png?1696502001",
} as const);

export const OMI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x3792DBDD07e87413247DF995e692806aa13D3299",
  },
  symbol: "OMI",
  fullName: "ECOMI",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/4428/large/ECOMI.png?1696505023",
} as const);

export const FAIR = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x7D928816CC9c462DD7adef911De41535E444CB07",
  },
  symbol: "FAIR",
  fullName: "Faircaster",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/66928/large/3dyin0vecrn1w7frtsqhjqhclzu8.?1751094499",
} as const);

export const REI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x6B2504A03ca4D43d0D73776F6aD46dAb2F2a4cFD",
  },
  symbol: "REI",
  fullName: "Rei",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52005/large/photo_2025-08-05_23.19.12.jpeg?1754448292",
} as const);

export const XTTA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x2f299Be3B081E8cD47Dc56c1932fCAe7a91B5dcD",
  },
  symbol: "XTTA",
  fullName: "XTTA",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54021/large/hdtWTejS_400x400.jpg?1738008678",
} as const);

export const TOSHI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
  },
  symbol: "TOSHI",
  fullName: "Toshi",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/31126/large/Toshi_Logo_-_Circular.png?1721677476",
} as const);

export const LGCT = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xD38B305CaC06990c0887032A02C03D6839f770A8",
  },
  symbol: "LGCT",
  fullName: "Legacy Token",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/50673/large/token2d.jpg?1728682508",
} as const);

export const PEPE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x52b492a33E447Cdb854c7FC19F1e57E8BfA1777D",
  },
  symbol: "PEPE",
  fullName: "Based Pepe",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/39763/large/based_pepe_transparent.png?1724010222",
} as const);

export const ATTN = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x032a7252B4932c44bdE89AEE6275744376a96BFF",
  },
  symbol: "ATTN",
  fullName: "Attention Token",
  decimals: 6,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/69885/large/token_logo.png?1759940701",
} as const);

export const UDOGE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x12E96C2BFEA6E835CF8Dd38a5834fa61Cf723736",
  },
  symbol: "UDOGE",
  fullName: "Wrapped DOGE (Universal)",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/40099/large/UA-DOGE_1.png?1725632510",
} as const);

export const BRACKY = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x06f71fb90F84b35302d132322A3C90E4477333b0",
  },
  symbol: "BRACKY",
  fullName: "BRACKY",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/67973/large/original.jpeg?1754476921",
} as const);

export const DOGINME = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x6921B130D297cc43754afba22e5EAc0FBf8Db75b",
  },
  symbol: "DOGINME",
  fullName: "doginme",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/35123/large/doginme-logo1-transparent200.png?1710856784",
} as const);

export const MOEW = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x15aC90165f8B45A80534228BdCB124A011F62Fee",
  },
  symbol: "MOEW",
  fullName: "MOEW",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36737/large/moewnewlogo.jpg?1755094477",
} as const);

export const SERV = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x5576D6ed9181F2225afF5282Ac0ED29f755437Ea",
  },
  symbol: "SERV",
  fullName: "OpenServ",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/51430/large/X_Logo_Blue_%282%29.png?1747853206",
} as const);

export const FAI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xb33Ff54b9F7242EF1593d2C9Bcd8f9df46c77935",
  },
  symbol: "FAI",
  fullName: "Freysa AI",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52315/large/FAI.png?1733076295",
} as const);

export const HEU = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xEF22cb48B8483dF6152e1423b19dF5553BbD818b",
  },
  symbol: "HEU",
  fullName: "Heurist",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/51361/large/200X200.png?1733764636",
} as const);

export const NATIVE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x20DD04c17AFD5c9a8b3f2cdacaa8Ee7907385BEF",
  },
  symbol: "NATIVE",
  fullName: "Native",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52565/large/native_logo.png?1748974114",
} as const);

export const YES = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x1B68244B100A6713ca7F540697b1bE12148a8bf9",
  },
  symbol: "YES",
  fullName: "YES Money",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/35657/large/yesIcon.png?1744186761",
} as const);

export const FOOM = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x02300aC24838570012027E0A90D3FEcCEF3c51d2",
  },
  symbol: "FOOM",
  fullName: "Foom",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/31308/large/f.png?1696530127",
} as const);

export const AOE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x080212E31d4224e89BD94c1d5662452897741907",
  },
  symbol: "AOE",
  fullName: "Agentic Open Economy",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/70324/large/white.png?1761569747",
} as const);

export const LINGO = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xfb42Da273158B0F642F59F2Ba7cc1d5457481677",
  },
  symbol: "LINGO",
  fullName: "Lingo",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52647/large/Lingo_200x200.png?1733914947",
} as const);

export const IMO = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x5A7a2bf9fFae199f088B25837DcD7E115CF8E1bb",
  },
  symbol: "IMO",
  fullName: "IMO",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/14831/large/IMO_logo_rond_200.png?1729798616",
} as const);

export const HESTIA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xBC7755a153E852CF76cCCDdb4C2e7c368f6259D8",
  },
  symbol: "HESTIA",
  fullName: "Hestia",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54202/large/logo.png?1738750723",
} as const);

export const TREE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x52C2b317eb0bb61e650683D2f287f56C413E4CF6",
  },
  symbol: "TREE",
  fullName: "Tree",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/33727/large/circle_green.png?1709894067",
} as const);

export const VEIL = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x767A739D1A152639e9Ea1D8c1BD55FDC5B217D7f",
  },
  symbol: "VEIL",
  fullName: "Veil Token",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53282/large/avatar_x_fc.png?1735980729",
} as const);

export const CIRCLE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x5baBfc2F240bc5De90Eb7e19D789412dB1dEc402",
  },
  symbol: "CIRCLE",
  fullName: "Ultraround Money",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/35274/large/circle.png?1708048159",
} as const);

export const DRB = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x3ec2156D4c0A9CBdAB4a016633b7BcF6a8d68Ea2",
  },
  symbol: "DRB",
  fullName: "DebtReliefBot",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54784/large/1000143570.jpg?1759054009",
} as const);

export const BGCI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x23418De10d422AD71C9D5713a2B8991a9c586443",
  },
  symbol: "BGCI",
  fullName: "Bloomberg Galaxy Crypto Index",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54578/large/images_%282%29.png?1740538343",
} as const);

export const QR = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x2b5050F01d64FBb3e4Ac44dc07f0732BFb5ecadF",
  },
  symbol: "QR",
  fullName: "QR coin",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/66513/large/_QR_white_circle__transparent_bg_%288%29.png?1757920856",
} as const);

export const FLAY = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xF1A7000000950C7ad8Aff13118Bb7aB561A448ee",
  },
  symbol: "FLAY",
  fullName: "Flayer",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/50377/large/flay.jpg?1727401416",
} as const);

export const OHM = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x060cb087a9730E13aa191f31A6d86bFF8DfcdCC0",
  },
  symbol: "OHM",
  fullName: "Olympus",
  decimals: 9,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/14483/large/token_OHM_%281%29.png?1696514169",
} as const);

export const COCORO = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x937a1cFAF0A3d9f5Dc4D0927F72ee5e3e5F82a00",
  },
  symbol: "COCORO",
  fullName: "Cocoro",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54771/large/cocoro_imresizer.jpg?1743247934",
} as const);

export const SIMMI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x161e113B8E9BBAEfb846F73F31624F6f9607bd44",
  },
  symbol: "SIMMI",
  fullName: "Simmi Token",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52349/large/simmi.png?1733160996",
} as const);

export const SCI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x25E0A7767d03461EaF88b47cd9853722Fe05DFD3",
  },
  symbol: "SCI",
  fullName: "PoSciDonDAO Token",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52651/large/TokenUpdate.png?1750669035",
} as const);

export const MFER = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xE3086852A4B125803C815a158249ae468A3254Ca",
  },
  symbol: "MFER",
  fullName: "mfercoin",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36550/large/mfercoin-logo.png?1711876821",
} as const);

export const BONSAICOIN = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xA0aeBd4Ae5F256B72B7D43f67eD934237Adb1AeE",
  },
  symbol: "BONSAICOIN",
  fullName: "Bonsai Coin",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/39273/large/1000007690.png?1721386111",
} as const);

export const MT = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xFf45161474C39cB00699070Dd49582e417b57a7E",
  },
  symbol: "MT",
  fullName: "Mint Token",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/54790/large/mint-token.jpg?1741578876",
} as const);

export const ELONRWA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xAa6Cccdce193698D33deb9ffd4be74eAa74c4898",
  },
  symbol: "ELONRWA",
  fullName: "ElonRWA",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36970/large/elonrwa.png?1712910039",
} as const);

export const CHAOS = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x20d704099B62aDa091028bcFc44445041eD16f09",
  },
  symbol: "CHAOS",
  fullName: "Chaos",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52444/large/Chaos_agent_update.jpeg?1737275178",
} as const);

export const INT = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x968D6A288d7B024D5012c0B25d67A889E4E3eC19",
  },
  symbol: "INT",
  fullName: "Internet Token",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36593/large/internettoken_logo.png?1711949672",
} as const);

export const PANANA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x844C03892863B0e3E00E805E41B34527044d5c72",
  },
  symbol: "$PANANA",
  fullName: "Panana",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/52672/large/panana_eat.png?1734017755",
} as const);

export const GDEX = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x53Cb59D32a8d08fC6D3f81454f150946A028A44d",
  },
  symbol: "GDEX",
  fullName: "DexFi Governance",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/30671/large/gDEX-Icon.png?1738702041",
} as const);

export const TORUS = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867",
  },
  symbol: "TORUS",
  fullName: "Torus",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53678/large/Torus.jpg?1737010506",
} as const);

export const BORED = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x70737489DFDf1A29b7584d40500d3561bD4Fe196",
  },
  symbol: "BORED",
  fullName: "BORED",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/37050/large/bored.jpeg?1713340233",
} as const);

export const BALD = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8",
  },
  symbol: "BALD",
  fullName: "Bald",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/31119/large/cdjxKSjo_400x400.jpg?1696529949",
} as const);

export const BSDETH = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xCb327b99fF831bF8223cCEd12B1338FF3aA322Ff",
  },
  symbol: "BSDETH",
  fullName: "Based ETH",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/35774/large/Icon_White_on_Blue.png?1709793654",
} as const);

export const COSMIC = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x7C101A0e141517009D3138743213e3e835a809DE",
  },
  symbol: "$COSMIC",
  fullName: "COSMIC on Base",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/38759/large/Base_Cosmic.PNG?1718740331",
} as const);

export const IDRISS = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x000096630066820566162C94874A776532705231",
  },
  symbol: "IDRISS",
  fullName: "IDRISS",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53190/large/IDRISS.png?1748624096",
} as const);

export const CLUSTR = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x4b361e60CF256b926bA15f157D69cAc9cD037426",
  },
  symbol: "CLUSTR",
  fullName: "Clustr",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/53509/large/200x200.png?1736538241",
} as const);

export const DOG = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x3b916B8f6A710e9240FF08c1dD646dD8E8ED9e1e",
  },
  symbol: "DOG",
  fullName: "Base DOG",
  decimals: 8,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36703/large/200x200.png?1712119865",
} as const);

export const LTAI = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xF8B1b47AA748F5C7b5D0e80C726a843913EB573a",
  },
  symbol: "LTAI",
  fullName: "LibertAI",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/39288/large/LibertAI_FavIcon_Secondary.png?1721589002",
} as const);

export const ARCX = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x9f44218d487BFF2f81bEf45202601DF4Bd4d1055",
  },
  symbol: "ARCX",
  fullName: "Architex",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36026/large/arcx.jpeg?1710387472",
} as const);

export const NYA = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x38F9bf9dCe51833Ec7f03C9dC218197999999999",
  },
  symbol: "NYA",
  fullName: "Nya",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/40082/large/nya.jpg?1725523655",
} as const);

export const MAGIC = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xF1572d1Da5c3CcE14eE5a1c9327d17e9ff0E3f43",
  },
  symbol: "MAGIC",
  fullName: "Treasure",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/18623/large/magic.png?1696518095",
} as const);

export const TRUST = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3",
  },
  symbol: "TRUST",
  fullName: "Intuition",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/55976/large/intuition_trust.jpg?1747904133",
} as const);

export const BEBE = CurrencyGuard({
  type: EContractType.CURRENCY,
  abi: erc20_abi,
  addresses: {
    [networks.base.id]: "0xeF8a84eb92AfD22A115D5E81B2C3c605B866F044",
  },
  symbol: "BEBE",
  fullName: "Bebe on Base",
  decimals: 18,
  displayDecimals: 2,
  iconSrc:
    "https://coin-images.coingecko.com/coins/images/36839/large/logo.png?1712561707",
} as const);

const ETH = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "ETH",
  fullName: "Ethereum",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.ETH as `0x${string}`,
    [networks.base.id]: contractAddresses.base.ETH as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.ETH as `0x${string}`,
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 9,
  iconSrc: "/tokens/ETH.svg",
} as const);

const WETH = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "WETH",
  fullName: "Wrapped ETH",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.WETH as `0x${string}`,
    [networks.base.id]: contractAddresses.base.WETH as `0x${string}`,
    [networks.arbitrum.id]: contractAddresses.arbitrum.WETH as `0x${string}`,
  },
  abi: erc20_abi,
  decimals: 18,
  displayDecimals: 9,
  iconSrc: "/tokens/WETH.svg",
} as const);

const CBBTC = CurrencyGuard({
  type: EContractType.CURRENCY,
  symbol: "cbBTC",
  fullName: "Coinbase Wrapped BTC",
  addresses: {
    [networks.sepolia.id]: contractAddresses.sepolia.CBBTC as `0x${string}`,
    [networks.base.id]: contractAddresses.base.CBBTC as `0x${string}`,
  },
  abi: erc20_abi,
  decimals: 8,
  displayDecimals: 6,
  iconSrc: "/tokens/CBBTC.svg",
} as const);

export const externalTokens = {
  ETH,
  WETH,
  CBBTC,
  VIRTUAL,
  MAG7_SSI,
  ZORA,
  SOSO,
  AERO,
  DEFI_SSI,
  LMTS,
  CLANKER,
  BNKR,
  NOICE,
  BRETT,
  MEME_SSI,
  KTA,
  CGN,
  USSI,
  DEGEN,
  XSWAP,
  UXRP,
  UADA,
  FARTCOIN,
  AIXBT,
  USOL,
  MVTT10F,
  FLUID,
  BASEISFOREVERYONE,
  AUKI,
  I,
  PARTI,
  ADS,
  OMI,
  FAIR,
  REI,
  XTTA,
  TOSHI,
  LGCT,
  PEPE,
  ATTN,
  UDOGE,
  BRACKY,
  DOGINME,
  MOEW,
  SERV,
  FAI,
  HEU,
  NATIVE,
  YES,
  FOOM,
  AOE,
  LINGO,
  IMO,
  HESTIA,
  TREE,
  VEIL,
  CIRCLE,
  DRB,
  BGCI,
  QR,
  FLAY,
  OHM,
  COCORO,
  SIMMI,
  SCI,
  MFER,
  BONSAICOIN,
  MT,
  ELONRWA,
  CHAOS,
  INT,
  PANANA,
  GDEX,
  TORUS,
  BORED,
  BALD,
  BSDETH,
  COSMIC,
  IDRISS,
  CLUSTR,
  DOG,
  LTAI,
  ARCX,
  NYA,
  MAGIC,
  TRUST,
  BEBE,
};

export default externalTokens;
