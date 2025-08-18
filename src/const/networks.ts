import { base, optimism } from "viem/chains";
import { defineChain } from "viem/utils";

// BSC chain provided by viem throws a warning on MetaMask
// as it uses a different name and rpcUrl
export const baseFork = defineChain({
  id: 9998453,
  name: base.name,
  nativeCurrency: base.nativeCurrency,
  rpcUrls: {
    default: {
      http: [
        "https://virtual.base.rpc.tenderly.co/64a14043-b80e-4895-aeb2-bedc0d6b61ee",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Base",
      url: "https://dashboard.tenderly.co/explorer/vnet/c55df2ba-d77f-4e5f-a4fe-31715a09b181/",
    },
  },
  contracts: base.contracts,
});

export const sepolia = defineChain({
  id: 11_155_111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_ALCHEMY || "",
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_INFURA || "",
        "https://sepolia.drpc.org"
      ].filter(Boolean),
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
      apiUrl: 'https://api-sepolia.etherscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 751532,
    },
    ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
    ensUniversalResolver: {
      address: '0xc8Af999e38273D658BE1b921b88A9Ddf005769cC',
      blockCreated: 5_317_080,
    },
  },
  testnet: true,
})

export const arbitrum = defineChain({
  id: 42_161,
  name: 'Arbitrum One',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_ALCHEMY || "",
        process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_INFURA || "",
        "https://arb1.arbitrum.io/rpc"
      ].filter(Boolean),
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
      apiUrl: 'https://api.arbiscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 7654707,
    },
  },
})

export const base_custom = defineChain({
  id: base.id,
  name: base.name,
  nativeCurrency: base.nativeCurrency,
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_BASE_RPC_URL_ALCHEMY || "",
        process.env.NEXT_PUBLIC_BASE_RPC_URL_INFURA || "",
        "https://mainnet.base.org",
      ].filter(Boolean),
    },
  },
  blockExplorers: base.blockExplorers,
  contracts: base.contracts,
});

export const optimism_custom = defineChain({
  id: optimism.id,
  name: optimism.name,
  nativeCurrency: optimism.nativeCurrency,
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_ALCHEMY || "",
        process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_INFURA || "",
        "https://mainnet.optimism.io",
      ].filter(Boolean),
    },
  },
  blockExplorers: optimism.blockExplorers,
  contracts: optimism.contracts,
});

export const bsc = defineChain({
  id: 56,
  name: "BNB Smart Chain Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "BNB",
    symbol: "BNB",
  },
  rpcUrls: {
    default: { http: [
      process.env.NEXT_PUBLIC_BSC_RPC_URL_ALCHEMY || "",
      process.env.NEXT_PUBLIC_BSC_RPC_URL_INFURA || "",
      "https://bsc-dataseed3.bnbchain.org"
    ].filter(Boolean)
   },
  },
  blockExplorers: {
    default: {
      name: "BscScan",
      url: "https://bscscan.com",
      apiUrl: "https://api.bscscan.com/api",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 15921452,
    },
  },
});

export const polygon = defineChain({
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_POLYGON_RPC_URL_ALCHEMY || "",
        process.env.NEXT_PUBLIC_POLYGON_RPC_URL_INFURA || "",
        "https://polygon-rpc.com"
      ].filter(Boolean),
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
      apiUrl: 'https://api.polygonscan.com/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 25770160,
    },
  },
})

export const scroll = defineChain({
  id: 534_352,
  name: 'Scroll',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_SCROLL_RPC_URL_ALCHEMY || "",
        process.env.NEXT_PUBLIC_SCROLL_RPC_URL_INFURA || "",
        "https://rpc.scroll.io"
      ].filter(Boolean),
      webSocket: ['wss://wss-rpc.scroll.io/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Scrollscan',
      url: 'https://scrollscan.com',
      apiUrl: 'https://api.scrollscan.com/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 14,
    },
  },
  testnet: false,
}) 