import { WalletProviderInfo } from "@/types/WalletProviderInfo";

export const metaMask: WalletProviderInfo = {
  key: "metaMask",
  name: "MetaMask",
  iconSrc: "/wallets/metaMask.svg",
};
export const walletConnect: WalletProviderInfo = {
  key: "walletConnect",
  name: "WalletConnect",
  iconSrc: "/wallets/walletConnect.svg",
};
export const uniswap: WalletProviderInfo = {
  key: "uniswap",
  name: "Uniswap Wallet",
  iconSrc: "/wallets/uniswap.svg",
};
export const coinbase: WalletProviderInfo = {
  key: "coinbaseWallet",
  name: "Coinbase Wallet",
  iconSrc: "/wallets/coinbase.svg",
};
export const phantom: WalletProviderInfo = {
  key: "phantomWallet",
  name: "Phantom",
  iconSrc: "/wallets/phantom.svg",
};
export const keplr: WalletProviderInfo = {
  key: "keplr",
  name: "Keplr",
  iconSrc: "/wallets/keplr.svg",
};
export const trust: WalletProviderInfo = {
  key: "trustWallet",
  name: "Trust Wallet",
  iconSrc: "/wallets/trust.svg",
};
export const brave: WalletProviderInfo = {
  key: "braveWallet",
  name: "Brave Wallet",
  iconSrc: "/wallets/brave.svg",
};

export const walletProviders: WalletProviderInfo[] = [
  metaMask,
  walletConnect,
  uniswap,
  coinbase,
  phantom,
  // keplr,
  trust,
  brave,
];

const wallets = {
  metaMask,
  walletConnect,
  uniswap,
  coinbase,
  phantom,
  // keplr,
  trust,
  brave,
};

export default wallets;
