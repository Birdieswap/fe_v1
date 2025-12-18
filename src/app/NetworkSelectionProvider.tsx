"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSwitchChain } from "wagmi";
import { usePathname } from "next/navigation";

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

function isLandingPath(pathname: string | null) {
  if (!pathname) return true;
  // ✅ 너희 라우팅에 맞게 랜딩 경로를 여기에 추가
  return pathname === "/" || pathname.startsWith("/landing");
}

export function NetworkSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const landingMode = isLandingPath(pathname);

  const { networks, chainId, account } = useContext(WalletContext);
  const isConnected = !!account?.address;
  const { switchChainAsync } = useSwitchChain();

  // ✅ app(스왑/팜 등)에서만 지갑 체인 lock + switchChain을 하도록
  const lockToWalletChain = !landingMode;
  const enableWalletSwitch = !landingMode;

  const defaultChainId = useMemo(() => {
    const inList = chainId && networks.some((n) => n.id === chainId);
    return inList ? (chainId as number) : (networks[0]?.id ?? 11155111);
  }, [chainId, networks]);

  const [selectedChainId, setSelectedChainId] =
    useState<number>(defaultChainId);

  const didHydrateRef = useRef(false);
  const didUserSelectRef = useRef(false);

  // ✅ localStorage는 “처음 한번만” 반영
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;

    if (Number.isFinite(parsed)) {
      setSelectedChainId(parsed);
    } else {
      setSelectedChainId(defaultChainId);
      window.localStorage.setItem(STORAGE_KEY, String(defaultChainId));
    }

    didHydrateRef.current = true;
  }, []); // 🔥 defaultChainId 넣지 않음(덮어쓰기 방지)

  // ✅ networks/chainId가 늦게 준비되어 defaultChainId가 바뀌어도,
  // 사용자가 이미 선택한 적이 있으면 덮어쓰지 않음.
  useEffect(() => {
    if (!didHydrateRef.current) return;
    if (didUserSelectRef.current) return;

    // 선택값이 “아직 초기값 상태”일 때만 defaultChainId 반영
    setSelectedChainId((prev) => {
      if (prev === defaultChainId) return prev;
      // prev가 저장된 값이면 그대로 유지
      return prev;
    });
  }, [defaultChainId]);

  // ✅ app 모드에서만 “지갑 체인 = 선택 체인” 동기화
  useEffect(() => {
    if (!lockToWalletChain) return;
    if (!isConnected) return;
    if (!chainId) return;
    if (!networks.some((n) => n.id === chainId)) return;

    if (selectedChainId !== chainId) {
      setSelectedChainId(chainId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(chainId));
      }
    }
  }, [lockToWalletChain, isConnected, chainId, networks, selectedChainId]);

  const selectedNetwork = useMemo(() => {
    return networks.find((n) => n.id === selectedChainId) ?? networks[0];
  }, [networks, selectedChainId]);

  const selectNetwork = useCallback(
    async (nextChainId: number) => {
      console.log("[selectNetwork] called", { nextChainId, landingMode });

      didUserSelectRef.current = true;

      // 1) UI는 즉시 바뀌게
      setSelectedChainId(nextChainId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(nextChainId));
      }

      // 2) 랜딩에서는 지갑 스위치 안 함
      if (!enableWalletSwitch) return;

      // 3) app + 지갑 연결된 경우만 switchChain
      if (isConnected) {
        try {
          await switchChainAsync({ chainId: nextChainId });
        } catch {
          // 실패 시 지갑 체인으로 롤백
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
    [
      enableWalletSwitch,
      isConnected,
      switchChainAsync,
      chainId,
      networks,
      defaultChainId,
    ]
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

  useEffect(() => {
    console.log("[NetworkSelectionProvider] MOUNT", { pathname });
    return () =>
      console.log("[NetworkSelectionProvider] UNMOUNT", { pathname });
  }, [pathname]);

  return (
    <NetworkSelectionContext.Provider value={value}>
      {children}
    </NetworkSelectionContext.Provider>
  );
}

export function useNetworkSelection() {
  const ctx = useContext(NetworkSelectionContext);
  if (!ctx) {
    throw new Error(
      "useNetworkSelection must be used within <NetworkSelectionProvider />"
    );
  }
  return ctx;
}
