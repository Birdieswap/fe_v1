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
import { ALLOWED_ADDRESSES } from "@/utils/wallet/allowedWalletList"; // ← 추가
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
  setSoftBlock,
} from "@/utils/wallet/consentSession";

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

  //===========whiteList 없앨때 삭제부=============
  async function handleConnect(connect: () => Promise<void>) {
    try {
      props.onClose();
      await new Promise((r) => setTimeout(r, 0));
      // 1) 먼저 connect 시도 — 여기서 '취소'면 reject 됩니다.
      try {
        await connect();
      } catch (err) {
        // 사용자가 Metamask 연결 팝업에서 '취소'를 눌렀거나 연결 실패
        console.warn("[SelectWalletMenu] connect() cancelled or failed:", err);
        return;
      }

      // 2) 연결 성공 확인
      const { address, status, connector } = getAccount(config);
      if (!address || status !== "connected") {
        // 연결이 최종 확정되지 않은 상태 — 모달 열지 않음
        return;
      }

      // 3) 이제서야 버튼 경로 인터랙티브 락 ON (자동 가드 스킵 용도)
      if (typeof window !== "undefined") {
        (window as any).__CONSENT_INTERACTIVE_ACTIVE__ = true;
      }

      // 4) 화이트리스트 정책(있는 경우)
      if (WALLET_ACCESS_MODE === "closed" && !isWalletAllowed(address)) {
        const provider = await connector
          ?.getProvider?.()
          .catch(() => undefined);
        await safeDisconnect({
          config,
          connector,
          provider,
          hardReloadOnInjected: false, // 버튼 경로: 새로고침 없이
        });
        openDenyWalletModal(address);
        return;
      }

      // 5) 연결 '성공' 이후에만 모달 플로우 진입
      const provider = await connector?.getProvider?.().catch(() => undefined);
      const result = await verifyConsentFlow({
        config,
        address: address as `0x${string}`,
        chainId,
        mode: "interactive",
      });

      // 6) 결과 해석
      const ok = result === "already-consented" || result === "verified-now";

      if (!ok) {
        // 사용자가 모달에서 닫음/거부/실패 → 즉시 해제 (새로고침 없이)
        await safeDisconnect({
          config,
          connector,
          provider,
          hardReloadOnInjected: false,
        });
        return;
      }

      // 7) 성공 → 팝오버 닫기
      props.onClose();
    } catch (e) {
      console.error("[SelectWalletMenu] handleConnect error:", e);
    } finally {
      // 8) 락 해제 (성공/실패/취소 모두)
      if (typeof window !== "undefined") {
        (window as any).__CONSENT_INTERACTIVE_ACTIVE__ = false;
      }
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
                onClick={async () => {
                  if (canConnect) handleConnect(connect);
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
