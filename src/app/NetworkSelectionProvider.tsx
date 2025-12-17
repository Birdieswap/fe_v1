"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSwitchChain } from "wagmi";

import { WalletContext } from "@/app/WalletContextProvider";
import type { NetworkInfo } from "@/types/NetworkInfo";

type NetworkSelectionContextValue = {
  networks: NetworkInfo[];
  selectedChainId: number;
  selectedNetwork?: NetworkInfo;
  selectNetwork: (chainId: number) => Promise<void>;
};

const NetworkSelectionContext =
  createContext<NetworkSelectionContextValue | null>(null);

const STORAGE_KEY = "birdieswap:selectedChainId";

export function NetworkSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ “원래 필터된 목록” 그대로 가져오기
  const { networks, chainId, account } = useContext(WalletContext);
  const isConnected = !!account?.address;

  const { switchChainAsync } = useSwitchChain();

  const defaultChainId = useMemo(() => {
    // wagmi chainId가 네트워크 목록 안에 있으면 그걸 기본으로, 아니면 첫번째
    const inList = chainId && networks.some((n) => n.id === chainId);
    return inList ? (chainId as number) : (networks[0]?.id ?? 11155111);
  }, [chainId, networks]);

  const [selectedChainId, setSelectedChainId] = useState<number>(() => {
    if (typeof window === "undefined") return defaultChainId;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;
    return Number.isFinite(parsed) ? parsed : defaultChainId;
  });

  // ✅ 지갑이 연결되어 있으면 “지갑 체인”이 진짜 상태이므로 UI 선택을 거기에 맞춰 동기화
  useEffect(() => {
    if (!isConnected) return;
    if (!chainId) return;
    if (!networks.some((n) => n.id === chainId)) return;

    if (selectedChainId !== chainId) {
      setSelectedChainId(chainId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(chainId));
      }
    }
  }, [isConnected, chainId, networks, selectedChainId]);

  const selectedNetwork = useMemo(() => {
    return networks.find((n) => n.id === selectedChainId) ?? networks[0];
  }, [networks, selectedChainId]);

  const selectNetwork = useCallback(
    async (nextChainId: number) => {
      // 1) 랜딩에서도 무조건 선택 변경(=테이블 필터)
      setSelectedChainId(nextChainId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(nextChainId));
      }

      // 2) 지갑 연결된 경우에만 체인 스위치 시도(app에서의 기존 동작)
      if (isConnected) {
        try {
          await switchChainAsync({ chainId: nextChainId });
          // 성공하면 effect가 chainId로 동기화해줌
        } catch {
          // 실패 시 UX 혼란 방지: 지갑 체인(가능하면)으로 롤백
          const fallback =
            chainId && networks.some((n) => n.id === chainId)
              ? chainId
              : defaultChainId;

          setSelectedChainId(fallback);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, String(fallback));
          }
        }
      }
    },
    [isConnected, switchChainAsync, chainId, networks, defaultChainId]
  );

  const value = useMemo(
    () => ({
      networks,
      selectedChainId,
      selectedNetwork,
      selectNetwork,
    }),
    [networks, selectedChainId, selectedNetwork, selectNetwork]
  );

  return (
    <NetworkSelectionContext.Provider value={value}>
      {children}
    </NetworkSelectionContext.Provider>
  );
}

export function useNetworkSelection() {
  const ctx = useContext(NetworkSelectionContext);
  if (!ctx)
    throw new Error(
      "useNetworkSelection must be used within <NetworkSelectionProvider />"
    );
  return ctx;
}
