"use client";

import { createContext, useContext } from "react";

import useSwap from "@/hooks/swap/useSwap";

export type SwapContextType = ReturnType<typeof useSwap>;

export const SwapContext = createContext<SwapContextType | null>(null);

export const useSwapContext = () => {
  const context = useContext(SwapContext);

  if (!context) {
    throw new Error("useSwapContext must be used within a SwapProvider");
  }

  return context;
};

export function SwapProvider({ children }: { children: React.ReactNode }) {
  const swap = useSwap();

  return <SwapContext.Provider value={swap}>{children}</SwapContext.Provider>;
}
