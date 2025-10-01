"use client";

import { createContext, useMemo, useState, useEffect, useRef } from "react";
import {
  Config,
  useAccount,
  UseAccountReturnType,
  useChainId,
  useConfig,
} from "wagmi";

import { WalletProviderInfo } from "@/types/WalletProviderInfo";
import { NetworkInfo } from "@/types/NetworkInfo";
import { walletProviders } from "@/const/wallets";
import { useReferral } from "./ReferralContextProvider";
import useAccountWalletData from "@/hooks/wallet/useAccountWalletData";
import { disconnect, signTypedData } from "wagmi/actions";
import { apiCheck, apiInitiate, apiVerify } from "@/utils/wallet/consentApi";
import { openRiskConsentModal } from "@/components/modals/RiskConsentModalHost";
import {
  hashTypedData,
  verifyTypedData,
  type TypedData,
  type TypedDataDomain,
} from "viem";
import { verifyConsentFlow } from "@/utils/wallet/verifyConsentFlow";

declare global {
  interface Window {
    __CONSENT_INTERACTIVE_ACTIVE__?: boolean; // 버튼 경로 인터랙티브 락
  }
}

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
  const chainId = useChainId();
  const config = useConfig();

  const { referralAddress, setReferralAddress } = useReferral();
  const walletData = useAccountWalletData(
    (account?.address as `0x${string}`) || undefined
  );

  // console.log(
  //   "[WalletContext] account changed",
  //   account,
  //   referralAddress,
  //   walletData
  // );

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

  const [selectedProvider, setSelectedProvider] = useState<
    WalletProviderInfo | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // connector가 없으면 초기화
        if (!account?.connector) {
          if (!cancelled) setSelectedProvider(undefined);
          return;
        }

        // wagmi connector가 실제 사용하는 EIP-1193 provider
        const raw = await account.connector.getProvider?.();
        const p = raw as any;

        /** 우선순위:
         * 1) connector id로만 판별 가능한 것들
         * 2) 개별 지갑 고유 플래그 (phantom/brave/trust/coinbase)
         * 3) isMetaMask
         * 4) injected/metaMask fallback
         */
        let key:
          | "phantom"
          | "brave"
          | "trust"
          | "coinbase"
          | "walletConnect"
          | "uniswap"
          | "metaMask"
          | "injected";

        // 1) connector id 우선 분기
        if (account.connector.id === "walletConnect") key = "walletConnect";
        else if (account.connector.id === "coinbaseWallet") key = "coinbase";
        else if (account.connector.id === "uniswap") key = "uniswap";
        // 2) 개별 플래그
        else if (p?.isPhantom) key = "phantom";
        else if (p?.isBraveWallet) key = "brave";
        else if (p?.isTrust) key = "trust";
        else if (p?.isCoinbaseWallet) key = "coinbase";
        // 3) 메타마스크 (일부 지갑이 isMetaMask를 켜기도 하므로 뒤쪽에 둠)
        else if (p?.isMetaMask) key = "metaMask";
        // 4) injected → metaMask로 보정
        else if (
          account.connector.id === "io.metamask" ||
          account.connector.id === "metamask" ||
          account.connector.id === "injected"
        ) {
          key = "metaMask";
        } else {
          key = "injected";
        }

        const info =
          walletProviders.find((w) => w.key === key) ??
          walletProviders.find((w) => w.key === "metaMask");

        if (!cancelled) setSelectedProvider(info);

        if (process.env.NODE_ENV === "development") {
          console.log("[WalletContext] detected provider", {
            connectorId: account.connector.id,
            flags: {
              isPhantom: p?.isPhantom,
              isBraveWallet: p?.isBraveWallet,
              isTrust: p?.isTrust,
              isCoinbaseWallet: p?.isCoinbaseWallet,
              isMetaMask: p?.isMetaMask,
            },
            resolvedKey: key,
            resolvedInfo: info,
          });
        }
      } catch (e) {
        if (!cancelled) {
          const fallback = walletProviders.find((w) => w.key === "metaMask");
          setSelectedProvider(fallback);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.connector]);

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

  // ===== 동의 가드: 주소/체인 변경 시 자동 체크 =====
  const prevKeyRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!account.isConnected || !account.address || !chainId) {
      // 연결 끊김/초기화 시 마지막 키 리셋
      prevKeyRef.current = null;
      return;
    }

    // 버튼 경로에서 모달 진행 중이면 자동 가드 스킵
    if (
      typeof window !== "undefined" &&
      window.__CONSENT_INTERACTIVE_ACTIVE__
    ) {
      return;
    }

    const nextKey = `${account.address.toLowerCase()}@${chainId}`;
    const prevKey = prevKeyRef.current;

    // 다음 비교를 위해 현재 키 저장
    prevKeyRef.current = nextKey;

    // 중복 실행 방지
    if (verifyingRef.current) return;

    // 최초 감지(이전 키 없음): 새로고침/자동복구 등 버튼 경로가 아닌 진입
    if (!prevKey) {
      verifyingRef.current = true;
      (async () => {
        try {
          // 1) 조용히 서버에 동의 확인
          const r1 = await verifyConsentFlow({
            config,
            address: account.address as `0x${string}`,
            chainId,
            mode: "silent",
          });

          if (r1 === "already-consented") {
            // 이미 동의 있음 → 그대로 유지
            return;
          }

          // 2) 동의 없음 → 모달 띄워서 즉시 검증
          const r2 = await verifyConsentFlow({
            config,
            address: account.address as `0x${string}`,
            chainId,
            mode: "interactive",
          });

          if (r2 === "verified-now" || r2 === "already-consented") {
            // 방금 서명 완료 or 서버상 이미 동의
            return;
          }

          // 3) 취소/실패는 즉시 disconnect
          if (account.connector) {
            await disconnect(config, { connector: account.connector });
          }
        } catch (err) {
          console.error("[WalletContext] auto-connect first guard error:", err);
          if (account.connector) {
            try {
              await disconnect(config, { connector: account.connector });
            } catch {}
          }
        } finally {
          verifyingRef.current = false;
        }
      })();

      return; // 이 분기에서는 아래 변경 감지 로직을 타지 않음
    }

    // 주소/체인 변경이 없는 경우 스킵
    if (prevKey === nextKey) return;

    // 주소/체인 변경 발생 → 동의 확인 루틴
    verifyingRef.current = true;
    (async () => {
      try {
        // 1) 먼저 silent 체크 (있으면 모달 없이 통과)
        const r1 = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "silent",
        });
        if (r1 === "already-consented") {
          return;
        }

        // 2) 동의가 없으므로 모달 띄워서 즉시 검증
        const r2 = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "interactive",
        });

        if (r2 === "verified-now" || r2 === "already-consented") {
          return;
        }

        // 3) 모달 취소/실패 → disconnect
        if (account.connector) {
          await disconnect(config, { connector: account.connector });
        }
      } catch (err) {
        console.error("[WalletContext] address-change guard error:", err);
        if (account.connector) {
          try {
            await disconnect(config, { connector: account.connector });
          } catch {}
        }
      } finally {
        verifyingRef.current = false;
      }
    })();
  }, [
    account.isConnected,
    account.address,
    account.connector,
    chainId,
    config,
  ]);

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
