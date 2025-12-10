// components/(main)/pay/PayProvider.tsx
"use client";

import { createContext, useContext } from "react";
import usePay from "@/hooks/pay/usePay";

export type PayContextType = ReturnType<typeof usePay>;
export const PayContext = createContext<PayContextType | null>(null);

export const usePayContext = () => {
  const ctx = useContext(PayContext);
  if (!ctx) throw new Error("usePayContext must be used within a PayProvider");
  return ctx;
};

export function PayProvider({ children }: { children: React.ReactNode }) {
  const pay = usePay();
  return <PayContext.Provider value={pay}>{children}</PayContext.Provider>;
}
