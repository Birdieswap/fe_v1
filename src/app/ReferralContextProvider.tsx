// context/ReferralContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isAddress } from "viem";

interface ReferralContextValue {
  referralAddress: string;
  setReferralAddress: (value: string) => void;
  clearReferralAddress: () => void;
}

const ReferralContext = createContext<ReferralContextValue>({
  referralAddress: "",
  setReferralAddress: () => {},
  clearReferralAddress: () => {},
});

export const ReferralProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [referralAddress, setReferralAddressState] = useState<string>("");

  // 초기 진입 시 URL 파라미터 확인
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      if (isAddress(ref)) {  
        localStorage.setItem("referralAddress", ref);
        setReferralAddressState(ref);
      } else {
        console.warn("Invalid referral address:", ref);
        localStorage.setItem("referralAddress", "");
        setReferralAddressState("");
      }
    } else {
      const stored = localStorage.getItem("referralAddress");

      if (stored === null) {
        localStorage.setItem("referralAddress", "");
        setReferralAddressState("");
      } else {
        setReferralAddressState(stored);
      }
    }
  }, []);

  const setReferralAddress = (value: string) => {
    localStorage.setItem("referralAddress", value);
    setReferralAddressState(value);
  };

  const clearReferralAddress = () => {
    localStorage.setItem("referralAddress", "");
    setReferralAddressState("");
  };

  return (
    <ReferralContext.Provider
      value={{ referralAddress, setReferralAddress, clearReferralAddress }}
    >
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferral = () => useContext(ReferralContext);
