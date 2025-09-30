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
import { getAccount, disconnect, signTypedData } from "wagmi/actions"; // ← 추가
import { ALLOWED_ADDRESSES } from "@/utils/wallet/allowedWalletList"; // ← 추가
import { openDenyWalletModal } from "@/utils/wallet/denyWalletModal";
import {
  isWalletAllowed,
  WALLET_ACCESS_MODE,
} from "@/utils/wallet/connectPolicy";
import { openRiskConsentModal } from "../RiskConsentModalHost";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { TransactionType } from "@/types/TransactionTypes";
import {
  TransactionStatusProps,
  signTransactionProps,
} from "@/app/TransactionContextProvider";
import TransactionStatus from "@/types/TransactionStatus";
import { apiCheck, apiInitiate, apiVerify } from "@/utils/wallet/consentApi";
import {
  computePolicyHash,
  findValidLocalProof,
  saveLocalProof,
} from "@/utils/wallet/consentLocal";
import type {
  VerifyRequest,
  InitiateResponseWire,
  NormalizedEIP712Payload,
  NormalizedDomain,
  NormalizedConsentMessage,
  RuntimeEIP712Types,
} from "@/types/consent";
import { consentTypes } from "@/utils/wallet/consentSchema";
import {
  hashTypedData,
  verifyTypedData,
  type TypedData,
  type TypedDataDomain,
  type Hex,
} from "viem";

type StrictConsentDomain = {
  name: string;
  version: string;
  chainId: bigint;
};

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

function equalsTypes(a: any, b: any): boolean {
  try {
    const norm = (x: any) =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(x).map(([k, v]: any) => [
            k,
            v.map((f: any) => ({ name: f.name, type: f.type })),
          ])
        )
      );
    return norm(a) === norm(b);
  } catch {
    return false;
  }
}

async function checkServerConsent(address: string): Promise<boolean> {
  try {
    const resp = await apiCheck(address);
    console.log("selectWalletMenu handleConnect check", resp);

    return (
      resp?.response === true && resp?.result === true && !!resp?.userConsent
    );
  } catch {
    return false;
  }
}

async function startInitiate(address: `0x${string}`, chainId: number) {
  const init = await apiInitiate({ address, chainId, type: "initialConsent" });
  if (!init?.response || !init?.result) throw new Error("initiate_failed");

  const wire = init.EIP712Payload;
  const typesForSign = toRuntimeTypes(wire.types);

  const msgWire = (wire as any).message?.Consent
    ? (wire as any).message.Consent
    : wire.message;

  // ★ 원본 nonce 타입/값 보관 (string일 수도, number일 수도 있음)
  const nonceRaw = msgWire.nonce as number | string;

  const domain = {
    name: String(wire.domain?.name ?? ""),
    version: String(wire.domain?.version ?? ""),
    chainId: BigInt(wire.domain!.chainId as any),
  };

  // 서명/검증용 message는 bigint로 정규화
  const msgNorm = { ...msgWire, nonce: BigInt(msgWire.nonce) } as const;

  const payload = {
    types: typesForSign,
    domain,
    primaryType: "Consent",
    message: msgNorm,
  } as const;

  // (선택) 로컬 해시 확인 – 서버 typesForSign 사용
  const localDigest = hashTypedData({
    domain: domain as TypedDataDomain,
    types: typesForSign as unknown as TypedData,
    primaryType: "Consent",
    message: msgNorm as unknown as Record<string, unknown>,
  });
  if (localDigest !== init.digest) {
    console.warn("[consent] localDigest != server digest", {
      localDigest,
      server: init.digest,
    });
  }

  return {
    payload,
    domain,
    digest: init.digest as `0x${string}`,
    typesForSign,
    addressParam: address, // Initiate 때 쓴 주소 문자열 그대로
    chainIdParam: chainId, // Initiate 때 쓴 체인ID 그대로
    nonceRaw, // ★ 여기에 담아서 돌려줌
    rawWire: wire,
  } as const;
}

/* -------------------------------------------------------------
 *  Client sign + local verify (EOA 기준)
 * ----------------------------------------------------------- */
async function doClientSignAndVerify(params: {
  config: ReturnType<typeof useConfig>;
  address: `0x${string}`;
  domain: { name: string; version: string; chainId: bigint };
  message: { [k: string]: unknown };
  typesForSign: Record<string, { name: string; type: string }[]>;
}) {
  const { config, address, domain, message, typesForSign } = params;

  const d = domain as TypedDataDomain;
  const t = typesForSign as unknown as TypedData;
  const m = message as unknown as Record<string, unknown>;

  const signature = await signTypedData(config, {
    domain: d,
    types: t,
    primaryType: "Consent",
    message: m,
  });

  const ok = await verifyTypedData({
    address,
    domain: d,
    types: t,
    primaryType: "Consent",
    message: m,
    signature,
  });
  if (!ok) throw new Error("client_verify_failed");
  return signature as `0x${string}`;
}

async function runHandlersSafely(handlers: any): Promise<any | null> {
  if (!handlers) return null;

  if (typeof handlers.prepare === "function") {
    await handlers.prepare();
  }

  let result: any = null;

  if (typeof handlers.executeAll === "function") {
    result = await handlers.executeAll();
  } else if (typeof handlers.execute === "function") {
    result = await handlers.execute();
  } else if (typeof handlers.run === "function") {
    result = await handlers.run();
  } else if (Array.isArray(handlers.transactions)) {
    // transactions 배열 형태라면 순차 실행(첫 반환값을 result에 담음)
    for (const t of handlers.transactions) {
      if (typeof t === "function") {
        const r = await t();
        if (result == null) result = r;
      } else {
        // transaction 아이템이 객체/설정이면, 그에 맞는 실행 로직 필요 (프로젝트에 맞게 확장)
      }
    }
  }

  // 반환값이 없을 수 있으니 null 허용
  return result ?? null;
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
  // ⭐ 사용 가능한 지갑만 필터링
  //const availableWalletKeys = useMemo(() => getAvailableWalletKeys(), []);

  // 🔥 실제 등록된 Connector 동적 감지
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

    // 🔥 디버깅 로그 추가
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
      props.onClose(); // 팝오버 닫기
      await new Promise((r) => setTimeout(r));
      await connect();

      const {
        address,
        status,
        connector: activeConnector,
      } = getAccount(config);
      if (!address || status !== "connected") return;

      // closed 모드면 미허용 즉시 차단
      if (WALLET_ACCESS_MODE === "closed" && !isWalletAllowed(address)) {
        await disconnect(config, { connector: activeConnector });
        openDenyWalletModal(address);
        return;
      }

      // 1) 서버 동의 상태 조회
      let hasConsent = await checkServerConsent(address);
      console.log("[consent] hasConsent (server):", hasConsent);

      // 2) 동의 없으면 Initiate → 모달 → 서명 → Verify
      if (!hasConsent) {
        let payload: NormalizedEIP712Payload | null = null;
        let domain: StrictConsentDomain | null = null;
        let digest: `0x${string}` | null = null;

        try {
          // ★ startInitiate는 다음을 반드시 반환해야 함:
          // { payload, domain, digest, typesForSign, addressParam, chainIdParam, nonceRaw, rawWire }
          const init = await startInitiate(address, chainId);

          payload = init.payload;
          domain = init.domain as StrictConsentDomain;
          digest = init.digest;

          const typesForSign = init.typesForSign; // 서버 types를 런타임용으로 변환한 것
          const rawWire = init.rawWire; // ★ 서버 원본 EIP712Payload (echo 용)
          const nonceRaw = init.nonceRaw; // ★ 원본 nonce (number|string)
          const address0 = init.addressParam; // Initiate에 보낸 address 그대로
          const chainId0 = init.chainIdParam; // Initiate에 보낸 chainId 그대로

          const ok =
            (await openRiskConsentModal({
              onConfirm: async () => {
                // (a) 클라 서명 + 로컬 검증 (EOA)
                const signature = await doClientSignAndVerify({
                  config,
                  address, // 현재 월렛 주소
                  domain: domain!,
                  message: payload!.message,
                  typesForSign, // 서버 types
                });

                // (b) (디버그) 로컬 재해시 — 서버 digest와 일치해야 정상
                const recomputed = hashTypedData({
                  domain: domain! as TypedDataDomain,
                  types: typesForSign as unknown as TypedData,
                  primaryType: "Consent",
                  message: payload!.message as unknown as Record<
                    string,
                    unknown
                  >,
                });
                if (recomputed !== digest) {
                  console.warn("[consent] digest mismatch", {
                    recomputed,
                    serverDigest: digest,
                  });
                }

                // (c) Verify 바디 — 서버가 재계산 가능한 재료를 '원본 그대로' echo
                //    ※ rawWire.message가 { Consent: {...} } 형태면 그 형태 그대로 유지
                const body: VerifyRequest = {
                  // ---- echo: 서버가 재계산 가능한 전체 컨텍스트 제공 ----
                  // EIP712Payload: rawWire, // ← startInitiate가 돌려준 서버 원본 그대로

                  // ---- 서버가 키 매칭/로깅 등에 참고할 수 있는 필드 ----
                  address: address0, // Initiate 때 보낸 address 그대로
                  chainId: chainId0, // Initiate 때 보낸 chainId 그대로
                  nonce: nonceRaw, // 원본 타입 유지 (number|string)
                  type: payload!.message.type,
                  version: payload!.message.version,

                  // ---- 서명/다이제스트 ----
                  signature,
                  digest: digest!, // 서버가 Initiate에서 준 digest 그대로
                };

                console.log("[consent] verify body (final)", body, {
                  typeofNonce: typeof body.nonce,
                });

                // (d) 서버 Verify 호출
                let verified = false;
                try {
                  const v = await apiVerify(body);
                  console.log("[consent] verify response:", v);
                  if (!v?.response || !v?.result) {
                    console.error(
                      "[consent] server verify rejected:",
                      v?.message
                    );
                    throw new Error(v?.message || "server_verify_failed");
                  }
                  verified = true;
                } catch (e) {
                  console.error("[consent] verify POST failed:", e);
                }

                // (e) 성공 시 로컬 프루프 저장(선택)
                if (verified) {
                  const policyHash = await computePolicyHash(
                    payload!.message.statement,
                    payload!.message.version
                  );
                  await saveLocalProof({
                    address: address.toLowerCase() as `0x${string}`,
                    chainId: Number(domain!.chainId),
                    version: payload!.message.version,
                    policyHash,
                    payload: payload!,
                    digest: digest!, // 서버 digest 저장
                    signature,
                    createdAt: Date.now(),
                    offlineUntil: Date.now() + 10 * 60 * 1000,
                  });
                } else {
                  // 실패 시 모달 resolve(false)로 처리하게 throw
                  throw new Error("verify_failed");
                }
              },
            })) === true;

          if (!ok) {
            // 사용자 취소/실패 → 아래 fallback 판단으로 이동
            throw new Error("user_declined_or_failed");
          }

          hasConsent = true; // 여기까지 오면 성공
        } catch (err) {
          console.error("[consent] initiate/modal/sign/verify error:", err);

          // 3) 서버 실패 시 로컬 프루프 fallback (선택)
          try {
            if (payload && domain) {
              const local = await findValidLocalProof({
                address,
                chainId: Number(domain.chainId),
                statement: payload.message.statement,
                version: payload.message.version,
              });
              if (local) {
                hasConsent = true;
              }
            }
          } catch (e) {
            console.error("[consent] local proof check error:", e);
          }

          if (!hasConsent) {
            await disconnect(config, { connector: activeConnector });
            return;
          }
        }
      }

      // 3) 최종 통과
      props.onClose();
    } catch (e) {
      console.error("[SelectWalletMenu] handleConnect error:", e);
      return;
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
      onOpenChange={(v) => {
        if (!v && isOpen) {
          setIsConnectModalOpen(false);
        } else if (v) {
          setIsConnectModalOpen(true);
        }
      }}
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
