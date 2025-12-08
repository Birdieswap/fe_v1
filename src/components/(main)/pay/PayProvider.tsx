// components/(main)/pay/PayProvider.tsx
"use client";

import { createContext, useContext } from "react";
import useSwap from "@/hooks/swap/useSwap";

export type PayContextType = ReturnType<typeof useSwap>;

export const PayContext = createContext<PayContextType | null>(null);

export const usePayContext = () => {
  const context = useContext(PayContext);

  if (!context) {
    throw new Error("usePayContext must be used within a PayProvider");
  }

  return context;
};

export function PayProvider({ children }: { children: React.ReactNode }) {
  // 일단은 swap 페이지와 동일한 훅을 재사용해 둠.
  // 이후에 usePay 훅을 만들면 이 부분만 교체하면 됨.
  const pay = useSwap();

  return <PayContext.Provider value={pay}>{children}</PayContext.Provider>;
}
