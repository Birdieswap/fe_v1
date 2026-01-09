"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { NetworkInfo } from "@/types/NetworkInfo";
import {
  sepolia,
  arbitrum,
  base_custom,
  optimism_custom,
  bsc,
  polygon,
  scroll,
} from "@/const/networks";

// landing에서 보여줄 네트워크 목록(원하는 것만)
const LANDING_NETWORKS: NetworkInfo[] = [
  { id: base_custom.id, name: base_custom.name, iconSrc: "/networks/base.svg" },
  { id: sepolia.id, name: sepolia.name, iconSrc: "/networks/sepolia.svg" },
  // { id: arbitrum.id, name: arbitrum.name, iconSrc: "/icons/arbitrum.svg" },
  // {
  //   id: optimism_custom.id,
  //   name: optimism_custom.name,
  //   iconSrc: "/icons/optimism.svg",
  // },
  // { id: bsc.id, name: bsc.name, iconSrc: "/icons/bsc.svg" },
  // { id: polygon.id, name: polygon.name, iconSrc: "/icons/polygon.svg" },
  // { id: scroll.id, name: scroll.name, iconSrc: "/icons/scroll.svg" },
];

const STORAGE_KEY = "birdieswap:landing:selectedChainId";
const DEFAULT_CHAIN_ID = base_custom.id;

type LandingNetworkContextValue = {
  networks: NetworkInfo[];
  selectedChainId: number;
  selectedNetwork?: NetworkInfo;
  setSelectedChainId: (id: number) => void;

  // ✅ landing 전용 open 상태(모달/팝오버)
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

const LandingNetworkContext = createContext<LandingNetworkContextValue | null>(
  null
);

export function LandingNetworkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const networks = LANDING_NETWORKS;

  const [selectedChainId, setSelectedChainIdState] = useState<number>(
    networks[0]?.id ?? DEFAULT_CHAIN_ID
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;

    if (Number.isFinite(parsed) && networks.some((n) => n.id === parsed)) {
      setSelectedChainIdState(parsed);
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(selectedChainId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSelectedChainId = (id: number) => {
    setSelectedChainIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    }
  };

  const selectedNetwork = useMemo(
    () => networks.find((n) => n.id === selectedChainId) ?? networks[0],
    [networks, selectedChainId]
  );

  const value = useMemo(
    () => ({
      networks,
      selectedChainId,
      selectedNetwork,
      setSelectedChainId,
      isOpen,
      setIsOpen,
    }),
    [networks, selectedChainId, selectedNetwork, isOpen]
  );

  return (
    <LandingNetworkContext.Provider value={value}>
      {children}
    </LandingNetworkContext.Provider>
  );
}

export function useLandingNetwork() {
  const ctx = useContext(LandingNetworkContext);
  if (!ctx)
    throw new Error(
      "useLandingNetwork must be used within <LandingNetworkProvider />"
    );
  return ctx;
}
