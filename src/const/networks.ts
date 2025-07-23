import { base } from "viem/chains";
import { defineChain } from "viem/utils";

// BSC chain provided by viem throws a warning on MetaMask
// as it uses a different name and rpcUrl
export const bsc = defineChain({
  id: 56,
  name: "BNB Smart Chain Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "BNB",
    symbol: "BNB",
  },
  rpcUrls: {
    default: { http: ["https://bsc-dataseed3.bnbchain.org"] },
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
