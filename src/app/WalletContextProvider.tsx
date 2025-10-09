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
import {
  disconnect,
  getAccount,
  reconnect,
  signTypedData,
} from "wagmi/actions";

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
import { isMetaMaskInAppEnv } from "@/utils/wallet/detectMetaMaskInApp";
import { waitForRiskHost } from "@/utils/wallet/waitForRiskHost";
import { dbg } from "@/debug/dbg";

declare global {
  interface Window {
    __CONSENT_INTERACTIVE_ACTIVE__?: boolean; // 버튼 경로 인터랙티브 락
    __forceConsentGuard?: (label?: string) => Promise<void>; // [DBG]
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
  {
    id: 8453,
    name: "Base",
    iconSrc: "/networks/base.svg",
    blockExplorer: { name: "Basescan", url: "https://basescan.org/" },
  },
  {
    id: 42161,
    name: "Arbitrum",
    iconSrc: "/networks/arbitrum.svg",
    blockExplorer: { name: "Arbiscan", url: "https://arbiscan.io/" },
  },

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

  // ★ RainbowKit & wagmi 최근 연결 캐시 제거
  function clearRKRecent() {
    try {
      localStorage.removeItem("rk-last-connector");
      localStorage.removeItem("rainbowkit.connectedWallets");
      localStorage.removeItem("rainbowkit:connectedWallets");
      // wagmi(v1/v2) 계열에서 쓰던 흔적들 (존재해도 무해, 있으면 제거)
      localStorage.removeItem("wagmi.connected");
      localStorage.removeItem("wagmi.recentConnectorId");
      sessionStorage.removeItem("wagmi.connected");
    } catch {}
  }

  // ===== 최소 자동 가드 =====
  const prevKeyRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  // 기준키 베이스라인(처음 연결 시 1회 세팅)
  useEffect(() => {
    if (!account.isConnected || !account.address || !chainId) {
      dbg("wcp:baseline:reset", {
        connected: account.isConnected,
        addr: account.address,
        chainId,
      }); // [DBG]
      prevKeyRef.current = null;
      return;
    }
    const currentKey = `${account.address.toLowerCase()}@${chainId}`;
    if (hasConsentDoneKey(currentKey)) {
      dbg("wcp:baseline:seen", { currentKey }); // [DBG]
      prevKeyRef.current = currentKey;
    } else if (!prevKeyRef.current) {
      dbg("wcp:baseline:set", { currentKey }); // [DBG]
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
    if (busy) {
      dbg("wcp:changeGuard:busy-skip");
      return;
    } // [DBG]

    // 사용자 거절 이후 자동 재개입 금지
    if (isSoftBlocked()) {
      dbg("wcp:changeGuard:softBlocked-skip");
      return;
    } // [DBG]
    if (!changed || verifyingRef.current) {
      dbg("wcp:changeGuard:skip", { changed, verifying: verifyingRef.current });
      return;
    }
    verifyingRef.current = true;
    dbg("wcp:changeGuard:enter", { prevKey, nextKey }); // [DBG]

    (async () => {
      // ★ 인터랙션 락 ON: 가드 인터랙티브 중엔 다른 해제/가드 진입 금지
      const w = typeof window !== "undefined" ? (window as any) : undefined;
      if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = true;

      try {
        await waitForRiskHost(); // [DBG]

        const result = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "interactive", // 변경은 모달
        });
        dbg("wcp:changeGuard:verifyResult", { result }); // [DBG]

        const ok = result === "already-consented" || result === "verified-now";
        if (ok) {
          addConsentDoneKey(nextKey);
          prevKeyRef.current = nextKey;
          clearSoftBlock();
          dbg("wcp:changeGuard:consent-ok", { nextKey }); // [DBG]
        } else {
          const provider = await account.connector
            ?.getProvider?.()
            .catch(() => undefined);

          await safeDisconnect({
            config,
            connector: account.connector,
            provider,
            hardReloadOnInjected: isMetaMaskInAppEnv(
              account.connector,
              provider
            )
              ? true
              : false, // 자동 경로: 리로드 금지 (레이스/루프 차단)
          });
          // ★ 해제 후 한 틱 비워줘야 버튼 경로 재시도 시 provider pending이 안 남음
          clearRKRecent();
          setSoftBlock();
          prevKeyRef.current = null;

          await new Promise((r) => setTimeout(r, 10));
          dbg("wcp:changeGuard:disconnected-no-consent"); // [DBG]
        }
      } catch (e) {
        const provider = await account.connector
          ?.getProvider?.()
          .catch(() => undefined);

        await safeDisconnect({
          config,
          connector: account.connector,
          provider,
          hardReloadOnInjected: isMetaMaskInAppEnv(account.connector, provider)
            ? true
            : false,
        });
        clearRKRecent();
        setSoftBlock();
        prevKeyRef.current = null;
        await new Promise((r) => setTimeout(r, 10)); // ★ 동일
        dbg("wcp:changeGuard:error-disconnected", { err: String(e) }); // [DBG]
      } finally {
        // ★ 인터랙션 락 OFF
        if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = false;
        verifyingRef.current = false;
        dbg("wcp:changeGuard:leave"); // [DBG]
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
    if (busy) {
      dbg("wcp:init:busy-skip");
      return;
    } // [DBG]
    if (hasConsentDoneKey(currentKey)) {
      prevKeyRef.current = currentKey;
      dbg("wcp:init:already-done", { currentKey });
      return;
    } // [DBG]
    if (isSoftBlocked()) {
      dbg("wcp:init:softBlocked-skip");
      return;
    } // [DBG]
    if (prevKeyRef.current === currentKey) {
      dbg("wcp:init:baseline-skip");
      return;
    } // [DBG]
    if (initializingRef.current) {
      dbg("wcp:init:already-running");
      return;
    } // [DBG]

    initializingRef.current = true;
    dbg("wcp:init:enter", { currentKey }); // [DBG]

    (async () => {
      try {
        const silent = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "silent",
        });
        dbg("wcp:init:silentResult", { silent }); // [DBG]

        if (silent === "already-consented") {
          addConsentDoneKey(currentKey);
          prevKeyRef.current = currentKey;
          clearSoftBlock();
          dbg("wcp:init:doneSilentOK");
          return;
        }

        await waitForRiskHost();
        const interactive = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "interactive",
        });
        dbg("wcp:init:interResult", { interactive }); // [DBG]

        const ok =
          interactive === "already-consented" || interactive === "verified-now";
        if (ok) {
          addConsentDoneKey(currentKey);
          prevKeyRef.current = currentKey;
          clearSoftBlock();
          dbg("wcp:init:doneInterOK");
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
            hardReloadOnInjected: false, // 자동 경로는 리로드 금지
          });
          dbg("wcp:init:disconnected-no-consent");
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
          hardReloadOnInjected: false,
        });
        dbg("wcp:init:error-disconnected", { err: String(e) }); // [DBG]
      } finally {
        initializingRef.current = false;
        dbg("wcp:init:leave"); // [DBG]
      }
    })();
  }, [
    account.isConnected,
    account.address,
    account.connector,
    chainId,
    config,
  ]);

  // ===== (메타마스크 인앱 보강) provider 이벤트 직접 바인딩 =====
  useEffect(() => {
    if (!account?.connector) return;

    let unsubscribed = false;
    let provider: any;

    (async () => {
      try {
        provider = await account.connector?.getProvider?.();
        if (!provider || unsubscribed) return;

        const waitUntilWagmiSees = async (
          nextLower: string,
          timeoutMs = 2000
        ) => {
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            const a = getAccount(config);
            const wagmiLower = (a?.address || "").toLowerCase();
            // provider 쪽 선택 계정도 함께 일치하는지 확인 (가능한 경우)
            const provLower = (
              provider?.selectedAddress ||
              provider?.accounts?.[0] ||
              ""
            ).toLowerCase();
            const provOk = provLower ? provLower === nextLower : true;
            if (a?.status === "connected" && wagmiLower === nextLower && provOk)
              return true;
            await new Promise((r) => setTimeout(r, 50));
          }
          return false;
        };

        const runInteractiveCheck = async (nextLower: string) => {
          // 버튼 경로/다른 가드와 경합 방지용 잠깐의 틱 + 락
          await new Promise((r) => setTimeout(r, 200));
          const w = typeof window !== "undefined" ? (window as any) : undefined;
          if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = true;

          try {
            // ➊ wagmi가 실제로 새 계정을 반영할 때까지 대기
            let seen = await waitUntilWagmiSees(nextLower, 2000);
            if (!seen) {
              // ➋ 여전히 반영 안 되면, 한 번 더 자극 (특히 인앱에서 효과적)
              try {
                await reconnect(config);
              } catch {}
              seen = await waitUntilWagmiSees(nextLower, 1000);
            }
            // ➌ 그래도 안 되면, verify를 건너뛰고 changeGuard(useEffect)가 처리하도록 반환
            if (!seen) {
              dbg("wcp:provEvt:wagmiNotSynced-skip", { nextLower });
              return;
            }

            // ✅ 여기서 반드시 wagmi 스냅샷을 기준으로 실행 (provider와 동일 계정)
            const snap = getAccount(config);
            const verifiedAddr = snap?.address as `0x${string}`;
            if (!verifiedAddr) return;

            await waitForRiskHost();
            const result = await verifyConsentFlow({
              config,
              address: verifiedAddr,
              chainId, // wagmi가 반영한 최신 chainId 사용
              mode: "interactive",
            });
            dbg("wcp:provEvt:interResult", { result }); // [DBG]

            const ok =
              result === "already-consented" || result === "verified-now";
            if (ok) {
              addConsentDoneKey(`${verifiedAddr.toLowerCase()}@${chainId}`);
              clearSoftBlock();
              dbg("wcp:provEvt:consent-ok");
            } else {
              await safeDisconnect({
                config,
                connector: account.connector,
                provider,
                hardReloadOnInjected: isMetaMaskInAppEnv(
                  account.connector,
                  provider
                )
                  ? true
                  : false, // 인앱(메타마스크)에서는 true가 될 것
              });
              clearRKRecent();
              setSoftBlock();
              prevKeyRef.current = null;

              dbg("wcp:provEvt:disconnected-no-consent");
            }
          } catch (e) {
            await safeDisconnect({
              config,
              connector: account.connector,
              provider,
              hardReloadOnInjected: isMetaMaskInAppEnv(
                account.connector,
                provider
              )
                ? true
                : false,
            });
            clearRKRecent();
            setSoftBlock();
            prevKeyRef.current = null;

            dbg("wcp:provEvt:error-disconnected", {
              err: String(e),
            });
          } finally {
            if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = false;
          }
        };

        const onAccountsChanged = async (accs: string[]) => {
          if (!accs || accs.length === 0) return;
          const next = (accs[0] || "").toLowerCase();
          const cur = (account.address || "").toLowerCase();
          if (!next || next === cur) return;
          dbg("wcp:provEvt:accountsChanged", { next, cur }); // [DBG]

          // 사용자가 지갑에서 계정 바꾼 즉시 모달 강제 체크
          await runInteractiveCheck(next);
        };

        const onChainChanged = async (_chainId: any) => {
          // 체인 바뀐 직후 포커스 반환/렌더 타이밍 고려해서 한 틱 대기
          await new Promise((r) => setTimeout(r, 200));
          const addr = (account.address || "").toLowerCase();
          if (!addr) return;
          dbg("wcp:provEvt:chainChanged", { chainId: _chainId }); // [DBG]
          await runInteractiveCheck(addr);
        };

        // 중복 바인딩 방지: 기존 리스너 제거 후 재바인딩
        try {
          provider.removeListener?.("accountsChanged", onAccountsChanged);
        } catch {}
        try {
          provider.removeListener?.("chainChanged", onChainChanged);
        } catch {}

        provider.on?.("accountsChanged", onAccountsChanged);
        provider.on?.("chainChanged", onChainChanged);
        dbg("wcp:provEvt:bound"); // [DBG]
      } catch (e) {
        dbg("wcp:provEvt:bindError", { err: String(e) }); // [DBG]
      }
    })();

    return () => {
      unsubscribed = true;
      try {
        provider?.removeAllListeners?.("accountsChanged");
      } catch {}
      try {
        provider?.removeAllListeners?.("chainChanged");
      } catch {}
      dbg("wcp:provEvt:unbound"); // [DBG]
    };
  }, [account.connector, account.address, chainId, config]);

  // [DBG #7] 콘솔/DebugHUD에서 수동으로 인터랙티브 모달 강제 실행해볼 수 있게
  useEffect(() => {
    (window as any).__forceConsentGuard = async (label = "manual") => {
      try {
        dbg("wcp:forceGuard:start", { label });
        if (!account?.address || !chainId) {
          dbg("wcp:forceGuard:skip-no-addr");
          return;
        }
        await waitForRiskHost();
        // 인앱 포커스 복귀 안정화: 아주 짧은 양보
        await new Promise((r) => setTimeout(r, 10));

        const res = await verifyConsentFlow({
          config,
          address: account.address as `0x${string}`,
          chainId,
          mode: "interactive",
        });
        dbg("wcp:forceGuard:result", { res });
      } catch (e) {
        dbg("wcp:forceGuard:error", { err: String(e) });
      }
    };
    return () => {
      try {
        delete (window as any).__forceConsentGuard;
      } catch {}
    };
    // 의존성: 주소/체인/컨피그 바뀌면 최신 값 반영
  }, [account?.address, chainId, config]);

  // === 모달을 서명 없이 닫았을 때: 즉시 연결 해제 (계정 변경 인터랙티브 가드 한정) ===
  useEffect(() => {
    const handler = async () => {
      // 계정 변경/버튼 경로 인터랙티브 가드 중에만 반응 (초기 silent/interactive는 기존 로직 유지)
      const w = typeof window !== "undefined" ? (window as any) : undefined;
      if (!w?.__CONSENT_INTERACTIVE_ACTIVE__) return;

      try {
        // 1) provider 확보(있으면) → safeDisconnect
        const provider =
          (await account?.connector?.getProvider?.().catch(() => undefined)) ||
          undefined;
        if (account?.connector) {
          await safeDisconnect({
            config,
            connector: account.connector,
            provider,
            hardReloadOnInjected: isMetaMaskInAppEnv(
              account.connector,
              provider
            )
              ? true
              : false,
          });
        }

        // 2) wagmi state 강제 해제 (일부 환경에서 provider.disconnect가 noop인 경우를 대비)
        try {
          await disconnect(config);
        } catch {}
        try {
          // 일부 커넥터는 자체 disconnect 메서드를 노출
          await account?.connector?.disconnect?.();
        } catch {}
        try {
          // WalletConnect/부분 지갑들: provider에 직접 disconnect가 있는 경우
          await (provider as any)?.disconnect?.();
        } catch {}

        // 3) 자동 재연결/재개입 방지
        clearRKRecent();
        setSoftBlock();
        prevKeyRef.current = null;

        dbg("wcp:modalClosed:disconnected");
      } catch (e) {
        dbg("wcp:modalClosed:disconnectError", { err: String(e) });
      }
    };

    window.addEventListener(
      "app/riskConsentModal/close",
      handler as EventListener
    );
    document.addEventListener(
      "app/riskConsentModal/close",
      handler as EventListener
    );
    return () => {
      window.removeEventListener(
        "app/riskConsentModal/close",
        handler as EventListener
      );
      document.removeEventListener(
        "app/riskConsentModal/close",
        handler as EventListener
      );
    };
  }, [account?.connector, config]);

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
