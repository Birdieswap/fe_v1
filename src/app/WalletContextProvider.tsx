"use client";

import { createContext, useMemo, useState, useEffect } from "react";
import { Config, useAccount, UseAccountReturnType, useChainId } from "wagmi";

import { WalletProviderInfo } from "@/types/WalletProviderInfo";
import { NetworkInfo } from "@/types/NetworkInfo";
import { walletProviders } from "@/const/wallets";
import { useReferral } from "./ReferralContextProvider";
import useAccountWalletData from "@/hooks/wallet/useAccountWalletData";

export type WalletContextType = {
  selectedProvider?: WalletProviderInfo;
  account?: UseAccountReturnType<Config>;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (value: boolean) => void;
  isNetworkModalOpen: boolean;
  setIsNetworkModalOpen: (value: boolean) => void;
  networks: NetworkInfo[];
  chainId?: number;
  selectedNetwork?: NetworkInfo;
  walletData?: ReturnType<typeof useAccountWalletData>;
};

const networks: NetworkInfo[] = [
  {
    id: 11155111,
    name: "Sepolia",
    iconSrc: "/networks/sepolia.svg",
    blockExplorer: { name: "Etherscan", url: "https://sepolia.etherscan.io/" },
  },
  // {
  //   id: 8453,
  //   name: "Base",
  //   iconSrc: "/networks/base.svg",
  //   blockExplorer: { name: "Basescan", url: "https://basescan.org/" },
  // },
  // {
  //   id: 42161,
  //   name: "Arbitrum",
  //   iconSrc: "/networks/arbitrum.svg",
  //   blockExplorer: { name: "Arbiscan", url: "https://arbiscan.io/" },
  // },

  // {
  //   id: 10,
  //   name: "Optimism",
  //   iconSrc: "/networks/optimism.svg",
  //   blockExplorer: {
  //     name: "Optimistic Etherscan",
  //     url: "https://optimistic.etherscan.io/",
  //   },
  // },
  // {
  //   id: 56,
  //   name: "BSC",
  //   iconSrc: "/networks/bsc.svg",
  //   blockExplorer: { name: "BscScan", url: "https://bscscan.com/" },
  // },
  // {
  //   id: 137,
  //   name: "Polygon",
  //   iconSrc: "/networks/polygon.svg",
  //   blockExplorer: { name: "PolygonScan", url: "https://polygonscan.com/" },
  // },
  // {
  //   id: 534352,
  //   name: "Scroll",
  //   iconSrc: "/networks/scroll.svg",
  //   blockExplorer: {
  //     name: "Scroll Explorer",
  //     url: "https://scrollscan.com/",
  //   },
  // },
  // {
  //   id: 9998453,
  //   name: "Base Fork",
  //   blockExplorer: {
  //     name: "Tenderly Explorer",
  //     url: "https://dashboard.tenderly.co/birdie/birdie-v1-contract/testnet/c8ec9017-0ae8-462d-91d6-4ce4bd5f32de/",
  //   },
  // },
];

const fallback: WalletContextType = {
  isConnectModalOpen: false,
  setIsConnectModalOpen: () => {},
  isNetworkModalOpen: false, // ⭐ 단일 상태
  setIsNetworkModalOpen: () => {},
  networks,
};

export const WalletContext = createContext<WalletContextType>(fallback);

export default function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState<boolean>(false);

  const account = useAccount();
  const { referralAddress, setReferralAddress } = useReferral();
  const walletData = useAccountWalletData(
    (account?.address as `0x${string}`) || undefined
  );

  useEffect(() => {
    if (account.isConnected && account.address && referralAddress === "") {
      setReferralAddress(account.address);
    }
  }, [
    account.isConnected,
    account.address,
    referralAddress,
    setReferralAddress,
  ]);

  // ⭐ 이 부분을 새로운 코드로 교체
  const selectedProvider = useMemo(() => {
    if (!account?.connector?.id) return undefined;

    const connectorMapping: Record<string, string> = {
      // MetaMask 관련 모든 케이스
      "io.metamask": "metaMask",
      metamask: "metaMask",
      injected: "metaMask", // 대부분의 경우 injected = MetaMask

      // 다른 지갑들
      coinbaseWallet: "coinbase",
      walletConnect: "walletConnect",
      uniswap: "uniswap",

      // 로컬에서 제외할 지갑들 (혹시 모를 상황 대비)
      phantom: "phantom",
      brave: "brave",
      trust: "trust",
    };

    // ⭐ 1차 매핑 시도
    const mappedKey = connectorMapping[account.connector.id];

    if (mappedKey) {
      const provider = walletProviders.find((p) => p.key === mappedKey);

      return provider;
    }

    return walletProviders.find((p) => p.key === "metaMask"); //undefined;
  }, [account?.connector?.id]);

  const chainId = useChainId();

  // ⭐ 핵심 수정: selectedNetwork 로직 강화 (네트워크 아이콘 표시 문제 해결)
  const selectedNetwork = useMemo(() => {
    const network = networks.find((network) => network.id === chainId);

    // ⭐ 디버깅 로그 추가 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.log("=== Network Debug ===");
      console.log("Chain ID:", chainId);
      console.log("Selected Network:", network);
    }

    return network;
  }, [chainId]);

  const context: WalletContextType = useMemo(
    () => ({
      isConnectModalOpen,
      setIsConnectModalOpen,
      isNetworkModalOpen,
      setIsNetworkModalOpen,
      selectedProvider,
      account,
      networks,
      chainId,
      selectedNetwork,
      walletData,
    }),
    [
      isConnectModalOpen,
      setIsConnectModalOpen,
      isNetworkModalOpen,
      setIsNetworkModalOpen,
      selectedProvider,
      account,
      chainId,
      selectedNetwork,
      walletData,
    ]
  );

  return (
    <WalletContext.Provider value={context}>{children}</WalletContext.Provider>
  );
}
