
export const isInjectedLike = (connectorId?: string, provider?: any) => {
  return (
    connectorId === "injected" ||
    connectorId === "metamask" ||
    connectorId === "io.metamask" ||
    provider?.isMetaMask === true
  );
};

export const isWalletConnectLike = (connectorId?: string) =>
  connectorId === "walletConnect" || connectorId === "walletconnect";

export const isCoinbaseLike = (connectorId?: string, provider?: any) =>
  connectorId === "coinbaseWallet" || provider?.isCoinbaseWallet === true;

// RainbowKit / WalletConnect 캐시 추정 키들
export const CLEAR_LOCAL_KEYS = [
  "rainbowkit.recentConnectorId",
  "wagmi.store",
  // WalletConnect v2 흔적들이 길어서 prefix 삭제 방식 권장
];
export const CLEAR_LOCAL_PREFIXES = ["wc@2:", "walletconnect"];
