"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type SettingsContextType = {
  hideSmallBalances: boolean;
  setHideSmallBalances: (value: boolean) => void;
  hideUnknownTokens: boolean;
  setHideUnknownTokens: (value: boolean) => void;
};

const settingsContextValue: SettingsContextType = {
  hideSmallBalances: false,
  setHideSmallBalances: () => {},
  hideUnknownTokens: false,
  setHideUnknownTokens: () => {},
};

export const SettingsContext = createContext(settingsContextValue);

export default function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideSmallBalances, _setHideSmallBalances] = useState(false);
  const [hideUnknownTokens, _setHideUnknownTokens] = useState(false);

  const setHideSmallBalances = useCallback((value: boolean) => {
    _setHideSmallBalances(value);
    localStorage.setItem("hideSmallBalances", String(value));
  }, []);
  const setHideUnknownTokens = useCallback((value: boolean) => {
    _setHideUnknownTokens(value);
    localStorage.setItem("hideUnknownTokens", String(value));
  }, []);

  const context: SettingsContextType = useMemo(() => {
    return {
      hideSmallBalances,
      setHideSmallBalances,
      hideUnknownTokens,
      setHideUnknownTokens,
    };
  }, [
    hideSmallBalances,
    hideUnknownTokens,
    setHideSmallBalances,
    setHideUnknownTokens,
  ]);

  useEffect(() => {
    const hideSmallBalances = localStorage.getItem("hideSmallBalances");
    const hideUnknownTokens = localStorage.getItem("hideUnknownTokens");

    if (hideSmallBalances) {
      _setHideSmallBalances(hideSmallBalances === "true");
    }
    if (hideUnknownTokens) {
      _setHideUnknownTokens(hideUnknownTokens === "true");
    }
  }, []);

  return (
    <SettingsContext.Provider value={context}>
      {children}
    </SettingsContext.Provider>
  );
}
