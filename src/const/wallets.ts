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
  key: "coinbase",
  name: "Coinbase Wallet",
  iconSrc: "/wallets/coinbase.svg",
};
export const phantom: WalletProviderInfo = {
  key: "phantom",
  name: "Phantom",
  iconSrc: "/wallets/phantom.svg",
};
export const keplr: WalletProviderInfo = {
  key: "keplr",
  name: "Keplr",
  iconSrc: "/wallets/keplr.svg",
};
export const trust: WalletProviderInfo = {
  key: "trust",
  name: "Trust Wallet",
  iconSrc: "/wallets/trust.svg",
};
export const brave: WalletProviderInfo = {
  key: "brave",
  name: "Brave Wallet",
  iconSrc: "/wallets/brave.svg",
};
export const rabbyWallet: WalletProviderInfo = {
  key: "rabby",
  name: "Rabby Wallet",
  iconSrc: "/wallets/rabby.svg",
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
  rabbyWallet,
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
  rabbyWallet,
};

export default wallets;
