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

import { verifyConsentFlow } from "@/utils/wallet/verifyConsentFlow";
import { safeDisconnect } from "@/utils/wallet/safeDisconnect";
import {
  addConsentDoneKey,
  clearSoftBlock,
  hasConsentDoneKey,
  isSoftBlocked,
  setSoftBlock,
} from "@/utils/wallet/consentSession";
import { isInjectedLike } from "@/utils/wallet/connectorUtils";

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

    //  디버깅 로그 추가 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.log("=== Network Debug ===");
      console.log("Chain ID:", chainId);
      console.log("Selected Network:", network);
    }

    return network;
  }, [chainId]);

  // ===== 최소 자동 가드 =====
  const prevKeyRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  // 기준키 베이스라인(처음 연결 시 1회 세팅)
  useEffect(() => {
    if (!account.isConnected || !account.address || !chainId) {
      prevKeyRef.current = null;
      return;
    }
    const currentKey = `${account.address.toLowerCase()}@${chainId}`;
    if (hasConsentDoneKey(currentKey)) {
      prevKeyRef.current = currentKey;
    } else if (!prevKeyRef.current) {
      prevKeyRef.current = currentKey;
    }
  }, [account.isConnected, account.address, chainId]);

  // 주소/체인 변경 시: 간단/단일 경로
  useEffect(() => {
    if (!account.isConnected || !account.address || !chainId) return;

    const nextKey = `${account.address.toLowerCase()}@${chainId}`;
    const prevKey = prevKeyRef.current;
    const changed = prevKey !== null && prevKey !== nextKey;

    // 버튼 경로 모달 중이면 자동 개입 금지
    const busy =
      typeof window !== "undefined" &&
      (window as any).__CONSENT_INTERACTIVE_ACTIVE__;
    if (busy) return;

    // 사용자 거절 이후 자동 재개입 금지
    if (isSoftBlocked()) return;

    if (!changed || verifyingRef.current) return;
    verifyingRef.current = true;

    (async () => {
      // ★ 인터랙션 락 ON: 가드 인터랙티브 중엔 다른 해제/가드 진입 금지
      const w = typeof window !== "undefined" ? (window as any) : undefined;
      if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = true;

      try {
        const result = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "interactive", // 변경은 모달
        });

        const ok = result === "already-consented" || result === "verified-now";
        if (ok) {
          addConsentDoneKey(nextKey);
          prevKeyRef.current = nextKey;
          clearSoftBlock();
        } else {
          const provider = await account.connector
            ?.getProvider?.()
            .catch(() => undefined);
          setSoftBlock(); // 자동 경로 재진입 차단
          const doHardReload = isInjectedLike(account.connector?.id, provider);
          await safeDisconnect({
            config,
            connector: account.connector,
            provider,
            hardReloadOnInjected: doHardReload, // 자동 경로: 리로드 금지 (레이스/루프 차단)
          });
          // ★ 해제 후 한 틱 비워줘야 버튼 경로 재시도 시 provider pending이 안 남음
          await new Promise((r) => setTimeout(r, 120));
          prevKeyRef.current = nextKey;
        }
      } catch (e) {
        const provider = await account.connector
          ?.getProvider?.()
          .catch(() => undefined);
        setSoftBlock();
        const doHardReload = isInjectedLike(account.connector?.id, provider);
        await safeDisconnect({
          config,
          connector: account.connector,
          provider,
          hardReloadOnInjected: doHardReload,
        });
        await new Promise((r) => setTimeout(r, 120)); // ★ 동일
        prevKeyRef.current = nextKey;
      } finally {
        // ★ 인터랙션 락 OFF
        if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = false;
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

  // 초기 연결 시 1회 확인: silent → 필요 시 interactive
  const initializingRef = useRef(false);
  useEffect(() => {
    if (!account.isConnected || !account.address || !chainId) return;

    const currentKey = `${account.address.toLowerCase()}@${chainId}`;
    const busy =
      typeof window !== "undefined" &&
      (window as any).__CONSENT_INTERACTIVE_ACTIVE__;
    if (busy) return; // 버튼 경로 중엔 스킵
    if (hasConsentDoneKey(currentKey)) {
      prevKeyRef.current = currentKey;
      return;
    }
    if (isSoftBlocked()) return; // 사용자 거절 이후 자동 재개입 금지
    if (prevKeyRef.current === currentKey) return;
    if (initializingRef.current) return;

    initializingRef.current = true;

    (async () => {
      try {
        const silent = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "silent",
        });
        if (silent === "already-consented") {
          addConsentDoneKey(currentKey);
          prevKeyRef.current = currentKey;
          clearSoftBlock();
          return;
        }

        const interactive = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "interactive",
        });
        const ok =
          interactive === "already-consented" || interactive === "verified-now";
        if (ok) {
          addConsentDoneKey(currentKey);
          prevKeyRef.current = currentKey;
          clearSoftBlock();
        } else {
          const provider = await account.connector
            ?.getProvider?.()
            .catch(() => undefined);
          setSoftBlock();
          const doHardReload = isInjectedLike(account.connector?.id, provider);
          await safeDisconnect({
            config,
            connector: account.connector,
            provider,
            hardReloadOnInjected: doHardReload, // 자동 경로는 리로드 금지
          });
        }
      } catch {
        const provider = await account.connector
          ?.getProvider?.()
          .catch(() => undefined);
        setSoftBlock();
        const doHardReload = isInjectedLike(account.connector?.id, provider);
        await safeDisconnect({
          config,
          connector: account.connector,
          provider,
          hardReloadOnInjected: doHardReload,
        });
      } finally {
        initializingRef.current = false;
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
