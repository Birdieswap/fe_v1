// components/(main)/pay/PayProvider.tsx
"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import usePay from "@/hooks/pay/usePay";

export type PayContextType = ReturnType<typeof usePay>;

// ✅ 기존 타입은 건드리지 않고 "확장 타입"을 별도로 둠
export type PayContextValueType = PayContextType & {
  resetPayForm: () => void;
  resetEnterForm: () => void;
};

export const PayContext = createContext<PayContextValueType | null>(null);

export const usePayContext = () => {
  const ctx = useContext(PayContext);
  if (!ctx) throw new Error("usePayContext must be used within a PayProvider");
  return ctx;
};

export function PayProvider({ children }: { children: React.ReactNode }) {
  const pay = usePay();

  // ✅ PAY 탭에서 쓰는 값들 초기화
  const resetPayForm = useCallback(() => {
    pay.setReceiver("");
    pay.setPayAmount("");
    pay.setPaySymbol("USDC");

    // selectedPool이 undefined 기반이면 아래처럼
    // (null 기반이면 null로 변경)
    (pay.setSelectedPool as any)?.(undefined);
  }, [pay]);

  // ✅ ENTER 탭에서 쓰는 값들 초기화
  const resetEnterForm = useCallback(() => {
    pay.setEnterAmount("");

    (pay.setSelectedPool as any)?.(undefined);

    // ENTER 토글도 초기화 원하면
    pay.setNativeSymbol("ETH");
  }, [pay]);

  const value = useMemo<PayContextValueType>(
    () => ({
      ...pay,
      resetPayForm,
      resetEnterForm,
    }),
    [pay, resetPayForm, resetEnterForm]
  );

  return <PayContext.Provider value={value}>{children}</PayContext.Provider>;
}
