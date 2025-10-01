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
import { disconnect, signTypedData } from "wagmi/actions";
import { apiCheck, apiInitiate, apiVerify } from "@/utils/wallet/consentApi";
import { openRiskConsentModal } from "@/components/modals/RiskConsentModalHost";
import {
  hashTypedData,
  verifyTypedData,
  type TypedData,
  type TypedDataDomain,
} from "viem";

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
  // {
  //   id: 8453,
  //   name: "Base",
  //   iconSrc: "/networks/base.svg",
  //   blockExplorer: { name: "Basescan", url: "https://basescan.org/" },
  // },
  // {
  //   id: 42161,
  //   name: "Arbitrum",
  //   iconSrc: "/networks/arbitrum.svg",
  //   blockExplorer: { name: "Arbiscan", url: "https://arbiscan.io/" },
  // },

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

    // ⭐ 디버깅 로그 추가 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.log("=== Network Debug ===");
      console.log("Chain ID:", chainId);
      console.log("Selected Network:", network);
    }

    return network;
  }, [chainId]);

  function toRuntimeTypes(
    wireTypes: any
  ): Record<string, { name: string; type: string }[]> {
    const mapArr = (a: any[] | readonly any[]) =>
      Array.from(a ?? []).map((f: any) => ({
        name: String(f.name),
        type: String(f.type),
      }));
    return {
      EIP712Domain: mapArr(wireTypes?.EIP712Domain),
      Consent: mapArr(wireTypes?.Consent),
    };
  }

  // chainId → bigint
  function toBigIntChainId(v: string | number | bigint): bigint {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(v);
    return BigInt(v); // "1" 또는 "0x1"
  }

  // payload.message 에서 nonce 원본 타입 보존 + bigint 정규화
  function extractMessageAndNonceRaw(wireMessage: any) {
    if (wireMessage?.Consent) {
      const inner = wireMessage.Consent as { nonce: string | number } & Record<
        string,
        any
      >;
      return {
        messageNorm: { ...inner, nonce: BigInt(inner.nonce) },
        nonceRaw: inner.nonce,
      };
    }
    const m = wireMessage as Record<string, any>;
    const nonceAny = m?.nonce;
    return {
      messageNorm: {
        ...m,
        nonce: typeof nonceAny === "bigint" ? nonceAny : BigInt(nonceAny),
      },
      nonceRaw: typeof nonceAny === "bigint" ? nonceAny.toString() : nonceAny,
    };
  }

  // 중복 트리거/루프 방지
  const lastKeyRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!account.isConnected || !account.address || !chainId) return;

    const key = `${account.address.toLowerCase()}@${chainId}`;
    if (lastKeyRef.current === key) return;
    if (verifyingRef.current) return;

    verifyingRef.current = true;

    (async () => {
      try {
        // 1) 서버 동의 체크
        const resp = await apiCheck(account.address!);
        const hasConsent =
          resp?.response === true &&
          resp?.result === true &&
          !!resp?.userConsent;

        if (hasConsent) {
          lastKeyRef.current = key;
          return;
        }

        // 2) 동의 없음 → 모달 띄우고 onConfirm 안에서 initiate/sign/verify
        const confirmed = await openRiskConsentModal({
          onConfirm: async () => {
            // (a) initiate
            const init = await apiInitiate({
              address: account.address as `0x${string}`,
              chainId,
              type: "initialConsent",
            });
            if (!init?.response || !init?.result) {
              throw new Error("initiate_failed");
            }

            // (b) 정규화
            const wire = init.EIP712Payload;
            const runtimeTypes = toRuntimeTypes((wire as any).types);
            const domain = {
              name: String((wire as any).domain?.name ?? ""),
              version: String((wire as any).domain?.version ?? ""),
              chainId: toBigIntChainId((wire as any).domain?.chainId),
            };
            const { messageNorm, nonceRaw } = extractMessageAndNonceRaw(
              (wire as any).message
            );

            // (c) 서명
            const signature = await signTypedData(config, {
              domain: domain as TypedDataDomain,
              types: runtimeTypes as unknown as TypedData,
              primaryType: "Consent",
              message: messageNorm as unknown as Record<string, unknown>,
            });

            // (d) 로컬 검증
            const ok = await verifyTypedData({
              address: account.address as `0x${string}`,
              domain: domain as TypedDataDomain,
              types: runtimeTypes as unknown as TypedData,
              primaryType: "Consent",
              message: messageNorm as unknown as Record<string, unknown>,
              signature,
            });
            if (!ok) throw new Error("client_verify_failed");

            // (e) (선택) digest 확인
            const recomputed = hashTypedData({
              domain: domain as TypedDataDomain,
              types: runtimeTypes as unknown as TypedData,
              primaryType: "Consent",
              message: messageNorm as unknown as Record<string, unknown>,
            });
            if (recomputed !== init.digest) {
              console.warn("[WalletContext] digest mismatch", {
                recomputed,
                serverDigest: init.digest,
              });
            }

            // (f) 서버 verify (nonce는 원본 타입 echo)
            const v = await apiVerify({
              address: account.address as `0x${string}`,
              chainId,
              nonce: nonceRaw,
              type: (messageNorm as any).type,
              version: (messageNorm as any).version,
              signature,
              digest: init.digest,
            });
            if (!v?.response || !v?.result) {
              throw new Error(v?.message || "server_verify_failed");
            }
          },
        });

        if (confirmed) {
          lastKeyRef.current = key; // 성공 → 더 이상 재시도 안 함
        } else {
          // 사용자가 닫거나 서명 거부 → 즉시 disconnect
          if (account.connector) {
            await disconnect(config, { connector: account.connector });
          }
        }
      } catch (err) {
        console.error("[WalletContext] consent guard error:", err);
        // 에러 시 사용자 보호를 위해 연결 해제
        if (account.connector) {
          try {
            await disconnect(config, { connector: account.connector });
          } catch {}
        }
      } finally {
        verifyingRef.current = false;
      }
    })();
  }, [
    account.isConnected,
    account.address,
    account.connector,
    chainId,
    config,
  ]);

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
