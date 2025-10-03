"use client";

import "./SelectNetworkMenu.css";

import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import Image from "next/image";
import { useContext, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WalletButton } from "@rainbow-me/rainbowkit";

import { WalletProviderInfo } from "@/types/WalletProviderInfo";
import Icons from "@/assets/icons/icons";
import { WalletContext } from "@/app/WalletContextProvider";
import { walletProviders } from "@/const/wallets";
//import { getAvailableWalletKeys } from "@/app/providers"; // ⭐ 추가
import { useChainId, useConfig } from "wagmi"; // 🔥 이 import 추가
import { disconnect, getAccount } from "wagmi/actions"; // ← 추가
import { openDenyWalletModal } from "@/utils/wallet/denyWalletModal";
import {
  isWalletAllowed,
  WALLET_ACCESS_MODE,
} from "@/utils/wallet/connectPolicy";

import { verifyConsentFlow } from "@/utils/wallet/verifyConsentFlow";
import { safeDisconnect } from "@/utils/wallet/safeDisconnect";
import {
  addConsentDoneKey,
  clearSoftBlock,
} from "@/utils/wallet/consentSession";
import { isInjectedLike } from "@/utils/wallet/connectorUtils";
import { isMetaMaskInAppEnv } from "@/utils/wallet/detectMetaMaskInApp";
import { waitForRiskHost } from "@/utils/wallet/waitForRiskHost";

declare global {
  interface Window {
    __CONSENT_INTERACTIVE_ACTIVE__?: boolean;
  }
}

export function WalletIcon({
  provider,
  size,
}: {
  provider?: WalletProviderInfo;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn("box-border size-6 rounded-full", "data-[size=lg]:size-9")}
      data-size={size}
    >
      {provider?.iconSrc && (
        <Image
          alt={provider.name}
          className="size-full rounded-full"
          height={size === "lg" ? 36 : 24}
          src={provider.iconSrc}
          width={size === "lg" ? 36 : 24}
        />
      )}
    </div>
  );
}

export function SelectWalletListBox(props: {
  providers: WalletProviderInfo[];
  onClose: () => void;
}) {
  // 사용 가능한 지갑만 필터링
  //const availableWalletKeys = useMemo(() => getAvailableWalletKeys(), []);

  // 실제 등록된 Connector 동적 감지
  const inFlightRef = useRef(false);
  const chainId = useChainId();
  const config = useConfig();

  const availableWallets = useMemo(
    () =>
      [
        "metaMask",
        "walletConnect",
        "uniswap",
        "coinbase", // ⭐ 수정: "coinbaseWallet" → "coinbase"로 통일
        "trust",
        "phantom",
        "brave",
      ] as const,
    []
  );

  const filteredProviders = useMemo(() => {
    const filtered = props.providers.filter((provider) =>
      availableWallets.includes(provider.key as any)
    );

    // 디버깅 로그 추가
    console.log("=== 필터링 디버그 ===");
    console.log("Available Keys:", availableWallets);
    console.log(
      "Provider Keys:",
      props.providers.map((p) => p.key)
    );
    console.log("Filtered Count:", filtered.length);
    console.log(
      "Filtered Keys:",
      filtered.map((p) => p.key)
    );

    return filtered;
  }, [props.providers, availableWallets]);

  if (filteredProviders.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No wallets available</div>
    );
  }

  function clearRKRecent() {
    try {
      localStorage.removeItem("rk-last-connector");
      localStorage.removeItem("rainbowkit.connectedWallets");
      localStorage.removeItem("rainbowkit:connectedWallets");
    } catch {}
  }

  //===========whiteList 없앨때 삭제부=============
  async function handleConnect(connect: () => Promise<void>) {
    // re-entrancy guard (render 간 유지)
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const w = typeof window !== "undefined" ? (window as any) : undefined;
    // 버튼 경로 시작: 가드 스킵 플래그 ON + 소프트블록 해제
    if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = true;

    try {
      props.onClose();
      await new Promise((r) => setTimeout(r, 10));
      // ★★★ 프리플러시: '서명 안 하고 닫음' 직후 첫 재시도일 수 있음
      const softBlocked =
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("__CONSENT_BLOCKED_UNTIL_SIGN__") === "1";

      if (softBlocked) {
        // 1) RainbowKit 최근 커넥터 캐시 제거
        clearRKRecent();

        // 2) wagmi/connector 세션 정리 (리로드 없이)
        const acc0 = getAccount(config);
        const provider0 = await acc0.connector
          ?.getProvider?.()
          .catch(() => undefined);
        await safeDisconnect({
          config,
          connector: acc0.connector,
          provider: provider0,
          hardReloadOnInjected: false, // 버튼 경로 프리플러시는 리로드 금지
        });

        // 3) 짧은 플러시(펜딩 제거)
        await new Promise((r) => setTimeout(r, 10));

        // 4) 소프트블록 해제 – 이제 connect()가 정상 팝업 뜸
        clearSoftBlock();
      }

      // 1) 사용자 제스처 컨텍스트에서 즉시 connect() — 팝업 보장
      try {
        await connect();
      } catch (err: any) {
        const code = err?.code ?? err?.data?.originalError?.code;
        if (code === -32002) {
          console.warn("[SelectWalletMenu] request already pending (-32002)");
          return; // 지갑 시트에서 사용자가 처리할 수 있도록 모달 유지
        }
        console.warn("[SelectWalletMenu] connect() cancelled or failed:", err);
        return;
      }

      // 3) 연결 확인
      const { address, status, connector } = getAccount(config);
      if (!address || status !== "connected") return;

      // 메타마스크 인앱 감지
      const provider = await connector?.getProvider?.().catch(() => undefined);

      // 4) 화이트리스트(있다면)
      if (WALLET_ACCESS_MODE === "closed" && !isWalletAllowed(address)) {
        const provider = await connector
          ?.getProvider?.()
          .catch(() => undefined);
        const doHardReload = isInjectedLike(connector?.id, provider);
        await safeDisconnect({
          config,
          connector,
          provider,
          hardReloadOnInjected: doHardReload,
        });
        await new Promise((r) => setTimeout(r, 10)); // flush
        openDenyWalletModal(address);
        return;
      }

      //  메타마스크 인앱이면 silent를 건너뛰고 곧바로 interactive 모달
      if (isMetaMaskInAppEnv(connector, provider)) {
        // 시트 닫힘/포커스 반환 타이밍 고려: 아주 짧게 대기
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r()))
        );
        await new Promise((r) => setTimeout(r, 10));
        // 2) 모달 호스트 준비 보장 (최대 500ms)
        const waitHost = async () => {
          for (let i = 0; i < 50; i++) {
            if ((window as any).__RISK_HOST_MOUNTED__) return true;
            await new Promise((r) => setTimeout(r, 10));
          }
          return false;
        };
        await waitHost();

        await waitForRiskHost();
        const inter = await verifyConsentFlow({
          config,
          address: address as `0x${string}`,
          chainId,
          mode: "interactive",
        });
        const ok = inter === "already-consented" || inter === "verified-now";
        if (!ok) {
          // 인앱은 true → 완전끊기
          await safeDisconnect({
            config,
            connector,
            provider,
            hardReloadOnInjected: true,
          });
          await new Promise((r) => setTimeout(r, 10));
          return;
        }
        addConsentDoneKey(`${address.toLowerCase()}@${chainId}`);
        clearSoftBlock();
        return; // 인앱 경로 끝
      }

      // 일반 브라우저 경로: 기존대로 silent → 필요 시 interactive
      const silent = await verifyConsentFlow({
        config,
        address: address as `0x${string}`,
        chainId,
        mode: "silent",
      });
      if (silent === "already-consented") {
        addConsentDoneKey(`${address.toLowerCase()}@${chainId}`);
        clearSoftBlock();
        return;
      }

      await waitForRiskHost();
      const inter = await verifyConsentFlow({
        config,
        address: address as `0x${string}`,
        chainId,
        mode: "interactive",
      });
      const ok = inter === "already-consented" || inter === "verified-now";
      if (!ok) {
        const doHardReload = isInjectedLike(connector?.id, provider);
        await safeDisconnect({
          config,
          connector,
          provider,
          hardReloadOnInjected: doHardReload,
        });
        await new Promise((r) => setTimeout(r, 120));
        return;
      }

      addConsentDoneKey(`${address.toLowerCase()}@${chainId}`);
      clearSoftBlock();
    } finally {
      if (w) w.__CONSENT_INTERACTIVE_ACTIVE__ = false;
      inFlightRef.current = false;
    }
  }
  //===================삭제부=========================

  return (
    <div className="flex flex-col gap-0 p-0">
      {filteredProviders.map((provider) => (
        <WalletButton.Custom key={provider.key} wallet={provider.key}>
          {({ connector, connect }) => {
            const canConnect = typeof connect === "function";
            if (!canConnect) {
              // 키가 안 맞으면 connect가 바인딩되지 않습니다.
              console.warn(
                "[SelectWalletMenu] connect not available for key:",
                provider.key,
                connector?.name
              );
            }
            return (
              <Button
                className="select-network-list-item min-w-[200px]"
                startContent={<WalletIcon provider={provider} />}
                onClick={() => {
                  if (canConnect) void handleConnect(connect);
                }}
              >
                <span className="select-network-list-item-title">
                  {connector.name}
                </span>
              </Button>
            );
          }}
        </WalletButton.Custom>
      ))}
    </div>
  );
}

export function SelectWalletHelp() {
  return (
    <Link
      className="flex w-full flex-row items-center gap-2 text-[13px] leading-[16px] text-default-800 dark:text-default-700 max-sm:px-6 max-sm:py-5 sm:pl-3"
      href="https://crypttempo.gitbook.io/birdie"
      target="_blank"
    >
      Learn how to connect
      <Icons.WalletArrowRU20
        className="fill-default-800 stroke-default-800 stroke-[1px] dark:fill-default-700 dark:stroke-default-300 max-sm:hidden"
        fillRule="evenodd"
      />
      <Icons.WalletArrowRU
        className="fill-default-800 stroke-default-800 stroke-[1px] dark:fill-default-700 dark:stroke-default-300 sm:hidden"
        fillRule="evenodd"
      />
    </Link>
  );
}

export default function SelectWalletMenu() {
  const { isConnectModalOpen, setIsConnectModalOpen } =
    useContext(WalletContext);

  const popoverRef = useRef<HTMLSpanElement>(null);

  const isOpen = useMemo(() => {
    return (
      isConnectModalOpen && (popoverRef.current?.checkVisibility() ?? false)
    );
  }, [isConnectModalOpen, popoverRef]);

  return (
    <Popover
      className="max-sm:hidden"
      isOpen={isOpen}
      offset={12}
      placement="bottom-end"
      onOpenChange={(v) => setIsConnectModalOpen(!!v)}
    >
      <PopoverTrigger>
        <Button className="connect-btn">
          <Icons.Wallet className="stroke-background" />
          <span ref={popoverRef}>Connect Wallet</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="gap-4 border-default-200 bg-background p-4 dark:border-1 dark:border-default-100 dark:bg-dark_popup_bg">
        <p className="w-full text-[16px] font-medium leading-[19px] text-foreground">
          Connect a wallet
        </p>
        <SelectWalletListBox
          providers={walletProviders}
          onClose={() => {
            setIsConnectModalOpen(false);
          }}
        />
        <SelectWalletHelp />
      </PopoverContent>
    </Popover>
  );
}
