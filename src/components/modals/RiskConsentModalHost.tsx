"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModalContent, ModalBody, Checkbox, Link } from "@heroui/react";
import ModalBase from "../atoms/ModalBase";
import ThemedButton from "../atoms/ThemedButton";

export const OPEN_RISK_CONSENT_EVENT = "app/riskConsentModal/open";
export const CLOSE_RISK_CONSENT_EVENT = "app/riskConsentModal/close";

type Resolver = (ok: boolean) => void;
type OnConfirm = () => Promise<void> | void;
type OpenEventDetail = {
  onConfirm?: OnConfirm;
  resolve: Resolver;
  // statement?: string; // ← 더이상 사용하지 않음
};
type OpenEvent = CustomEvent<OpenEventDetail>;

const TERMS_URL = "https://docs.birdieswap.com/legal/terms-of-service";
const PRIVACY_URL = "https://docs.birdieswap.com/legal/privacy-policy";
const RISK_URL = "https://docs.birdieswap.com/security/general-risks";

function StaticConsentContent() {
  return (
    <div className="text-base leading-6 space-y-3 max-h-[55vh] overflow-auto p-3">
      <h1 className="text-xl font-semibold pb-3">
        Get started with Birdieswap!
      </h1>
      <p className="pb-3">
        Before continuing, please review and agree to the following documents:
      </p>
      <ul className="list-disc pl-5 pb-3 space-y-3">
        <li>
          <Link
            href={TERMS_URL}
            target="_blank"
            className="text-default-600 underline"
          >
            Terms of Service
          </Link>
        </li>
        <li>
          <Link
            href={PRIVACY_URL}
            target="_blank"
            className="text-default-600 underline"
          >
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link
            href={RISK_URL}
            target="_blank"
            className="text-default-600 underline"
          >
            Risk disclosure
          </Link>
        </li>
      </ul>
      <p>
        Birdieswap is a decentralized protocol. By continuing, you acknowledge
        usage at your own risk.
      </p>
    </div>
  );
}

export default function RiskConsentModalHost() {
  const [isOpen, setIsOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState<OnConfirm | null>(null);

  useEffect(() => {
    (window as any).__RISK_HOST_MOUNTED__ = true;
    console.log("[RiskModal] mounted");
  }, []);

  const [resolver, setResolver] = useState<Resolver | null>(null);
  const resolvedRef = useRef(false);

  const safeResolveAndReset = (ok: boolean) => {
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      resolver?.(ok);
    }
    setResolver(null);
    setIsOpen(false);
    setOnConfirm(null);
  };

  useEffect(() => {
    const open = (e: Event) => {
      console.log("[RiskModal] OPEN event received", e);
      const ce = e as OpenEvent;
      const detail = ce?.detail;
      if (!detail || typeof detail.resolve !== "function") {
        safeResolveAndReset(false);
        return;
      }
      if (resolver) safeResolveAndReset(false);
      resolvedRef.current = false;
      setOnConfirm(() => detail.onConfirm ?? null);
      setResolver(() => detail.resolve);
      setIsOpen(true);
    };

    const close = () => {
      console.log("[RiskModal] CLOSE event received");
      safeResolveAndReset(false);
    };

    window.addEventListener(OPEN_RISK_CONSENT_EVENT, open as EventListener);
    window.addEventListener(CLOSE_RISK_CONSENT_EVENT, close as EventListener);
    return () => {
      window.removeEventListener(
        OPEN_RISK_CONSENT_EVENT,
        open as EventListener
      );
      window.removeEventListener(
        CLOSE_RISK_CONSENT_EVENT,
        close as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolver]);

  return (
    <ModalBase
      hideCloseButton={false}
      classNames={{
        closeButton: "w-9 h-9 text-foreground", // ★ 크기/색
      }}
      isOpen={isOpen}
      motionProps={{}}
      // ★ 추가: 최상단 보장
      className="!z-[9999]"
      onOpenChange={(open) => {
        if (!open) safeResolveAndReset(false);
      }}
    >
      <ModalContent className="w-[80vw] max-w-[500px]">
        <ModalBody className="flex flex-col gap-3 p-6 text-foreground">
          <StaticConsentContent />

          <div className="flex gap-3 justify-end pt-2">
            <ThemedButton
              variant="MINT"
              onPress={async () => {
                try {
                  await onConfirm?.();
                  safeResolveAndReset(true);
                } catch {
                  safeResolveAndReset(false);
                }
              }}
            >
              Sign
            </ThemedButton>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}

const HOST_READY_FLAG = "__RISK_HOST_MOUNTED__";

/** RiskConsentModalHost가 마운트될 때까지 대기 (최대 800ms) */
function waitForRiskHost(timeout = 800): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if ((window as any)[HOST_READY_FLAG]) return resolve();
      if (Date.now() - start > timeout) return resolve(); // 타임아웃 시에도 진행
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** 아주 짧은 지연 (인앱에서 지갑 시트 → DApp 포커스 전환 안정화) */
function tinyDelay(ms = 10) {
  return new Promise((r) => setTimeout(r, ms));
}

// 오버로드: 과거(onConfirm만) & 현재(객체 인자)
export function openRiskConsentModal(onConfirm: OnConfirm): Promise<boolean>;
export function openRiskConsentModal(arg: {
  onConfirm?: OnConfirm;
}): Promise<boolean>;
export async function openRiskConsentModal(
  arg: OnConfirm | { onConfirm?: OnConfirm }
): Promise<boolean> {
  const detail = typeof arg === "function" ? { onConfirm: arg } : arg ?? {};

  // 1) 호스트가 아직이면 기다림 (메타마스크 인앱에서 특히 중요)
  await waitForRiskHost();
  // 2) 시트/포커스 타이밍 안정화를 위해 한 프레임/수 ms 양보
  await tinyDelay(10); // <- 1~10ms 권장

  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent<OpenEventDetail>(OPEN_RISK_CONSENT_EVENT, {
        detail: { ...detail, resolve },
      })
    );
  });
}

export function closeRiskConsentModal() {
  window.dispatchEvent(new Event(CLOSE_RISK_CONSENT_EVENT));
}
