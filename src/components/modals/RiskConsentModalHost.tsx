"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModalContent, ModalBody, Checkbox, Link } from "@heroui/react";
import ModalBase from "../atoms/ModalBase";
import ThemedButton from "../atoms/ThemedButton";
import { dbg } from "@/debug/dbg";
import Icons from "@/assets/icons/icons";
import ModalCloseButton from "../atoms/ModalCloseButton";

export const OPEN_RISK_CONSENT_EVENT = "app/riskConsentModal/open";
export const CLOSE_RISK_CONSENT_EVENT = "app/riskConsentModal/close";

const DBG = true;

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
    <div className="flex flex-col items-center max-h-[55vh] overflow-auto px-4 max-sm:px-0 py-6 space-y-6">
      {/* 상단: 로고 + 제목 */}
      <div className="flex flex-col items-center text-center gap-6">
        <Icons.Birdie56 className="w-14 h-14" />
        <h1 className="text-[20px] font-sans font-semibold leading-[24px] text-foreground">
          Get started with Birdieswap!
        </h1>
      </div>

      {/* 하단: 안내문 + 리스트 + 문구 */}
      <div className="flex flex-col items-start font-sans text-left gap-6 w-full px-2">
        <div>
          <p className="font-regular text-[16px] leading-[20px] text-foreground">
            Before continuing, please review and agree to the following
            documents:
          </p>

          <ul className="list-disc pl-5 mt-6 font-medium text-[14px] leading-[20px] text-foreground">
            <li className="pb-4">
              <Link
                href={TERMS_URL}
                target="_blank"
                className=" text-foreground underline underline-offset-2 hover:opacity-80"
              >
                Terms of Service
              </Link>
            </li>
            <li className="pb-4">
              <Link
                href={PRIVACY_URL}
                target="_blank"
                className=" text-foreground underline underline-offset-2 hover:opacity-80"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href={RISK_URL}
                target="_blank"
                className=" text-foreground underline underline-offset-2 hover:opacity-80"
              >
                Risk disclosure
              </Link>
            </li>
          </ul>
        </div>

        <p className="font-regular text-[16px] leading-[18px] text-foreground">
          Birdieswap is a decentralized protocol. By continuing, you acknowledge
          usage at your own risk.
        </p>
      </div>
    </div>
  );
}

const HOST_READY_FLAG = "__RISK_HOST_MOUNTED__";
const HOST_OPEN_FN = "__OPEN_RISK_MODAL__";

export default function RiskConsentModalHost() {
  const [isOpen, setIsOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState<OnConfirm | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (window as any)[HOST_READY_FLAG] = true;
    (window as any).__RISK_HOST_Z = 9999;
    dbg("riskHost:mounted", { ua: navigator.userAgent });

    // === [ADD] 전역 오프너: 이벤트가 유실될 때 직접 호출 경로 확보 ===
    (window as any)[HOST_OPEN_FN] = (detail: OpenEventDetail) => {
      dbg("riskHost:HOST_OPEN_FN", {
        detail: !!detail,
        hasResolve: typeof detail?.resolve === "function",
      }); // [DBG]
      // detail.resolve, detail.onConfirm 를 그대로 넘겨받아 상태 세팅
      const { resolve, onConfirm } = detail || {};
      if (typeof resolve !== "function") return;

      // 이전 요청이 살아있으면 안전 종료
      try {
        resolver?.(false);
      } catch {}
      resolvedRef.current = false;

      setErrMsg(null); // 🔹 새 오픈 시 에러 초기화
      setSubmitting(false);
      setOnConfirm(() => onConfirm ?? null);
      setResolver(() => resolve);
      setIsOpen(true);

      try {
        (window as any).__CONSENT_INTERACTIVE_ACTIVE__ = true;
      } catch {}
    };

    return () => {
      try {
        delete (window as any)[HOST_OPEN_FN];
      } catch {}
      try {
        delete (window as any)[HOST_READY_FLAG];
      } catch {}
    };
  }, []);

  const [resolver, setResolver] = useState<Resolver | null>(null);
  const resolverRef = useRef<Resolver | null>(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    resolverRef.current = resolver;
  }, [resolver]);

  const safeResolveAndReset = (ok: boolean, fromEvent = false) => {
    dbg("riskHost:safeResolve", { ok, fromEvent });

    //  내부(사용자 취소)에서만 close 이벤트를 1회 발행
    if (!ok && !fromEvent) {
      try {
        window.dispatchEvent(new Event(CLOSE_RISK_CONSENT_EVENT));
        document.dispatchEvent(new Event(CLOSE_RISK_CONSENT_EVENT));
      } catch {}
    }

    if (!resolvedRef.current) {
      resolvedRef.current = true;
      try {
        resolverRef.current?.(ok);
      } catch {}
    }

    setResolver(null);
    resolverRef.current = null;
    setIsOpen(false);
    setOnConfirm(null);

    try {
      (window as any).__CONSENT_INTERACTIVE_ACTIVE__ = false;
    } catch {}
  };

  useEffect(() => {
    const open = (e: Event) => {
      dbg("riskHost:OPEN(event)", {
        src: "window/document",
        eType: (e as any)?.type,
      }); // [DBG]
      console.log("[RiskModal] OPEN event received", e);
      if (DBG) console.log("[RiskModal] OPEN event received:", e);
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

      try {
        (window as any).__CONSENT_INTERACTIVE_ACTIVE__ = true;
      } catch {}
    };

    const close = () => {
      dbg("riskHost:CLOSE(event)");
      safeResolveAndReset(false, /* fromEvent */ true);
    };

    window.addEventListener(OPEN_RISK_CONSENT_EVENT, open as EventListener);
    window.addEventListener(CLOSE_RISK_CONSENT_EVENT, close as EventListener);
    // 인앱 WebView 호환: document에도 동일 리스너 바인딩
    document.addEventListener(OPEN_RISK_CONSENT_EVENT, open as EventListener);
    document.addEventListener(CLOSE_RISK_CONSENT_EVENT, close as EventListener);
    return () => {
      window.removeEventListener(
        OPEN_RISK_CONSENT_EVENT,
        open as EventListener
      );
      window.removeEventListener(
        CLOSE_RISK_CONSENT_EVENT,
        close as EventListener
      );
      document.removeEventListener(
        OPEN_RISK_CONSENT_EVENT,
        open as EventListener
      );
      document.removeEventListener(
        CLOSE_RISK_CONSENT_EVENT,
        close as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolver]);

  const handleClose = () => {
    safeResolveAndReset(false);
  };

  return (
    <ModalBase
      portalContainer={
        typeof window !== "undefined" ? document.body : undefined
      }
      isDismissable={false}
      hideCloseButton={false}
      closeButton={<ModalCloseButton />}
      placement="bottom"
      classNames={{
        backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
        wrapper: "items-end justify-center",
        base: "m-0 max-h-[85vh] overflow-hidden", // base엔 max-h + overflow-hidden
        body: "p-0 h-full flex flex-col", // 내부에서만 스크롤
      }}
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
          exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
        },
      }}
      // ★ 추가: 최상단 보장
      className="!z-[9999]"
      onClose={() => safeResolveAndReset(false, /* fromEvent */ false)}
      onOpenChange={(open) => {
        dbg("riskHost:onOpenChange", { open });
        if (!open) {
          safeResolveAndReset(false, /* fromEvent */ false);
        }
      }}
    >
      <ModalContent className="w-[80vw] max-w-[500px]">
        <ModalBody className="p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 [-webkit-overflow-scrolling:touch]">
            <StaticConsentContent />

            {/* 에러 메시지 표시 */}
            {/* {errMsg && (
              <div className="mt-3 rounded-md border border-danger-300 bg-danger-50 px-3 py-2 text-danger-700 text-sm">
                {errMsg}
              </div>
            )} */}

            <div className="flex gap-3 justify-end ">
              <ThemedButton
                variant="MINT"
                isDisabled={submitting}
                onPress={async () => {
                  dbg("riskHost:pressSign"); // [DBG]
                  try {
                    setErrMsg(null);
                    setSubmitting(true);
                    await onConfirm?.();
                    // ✅ 여기까지 왔으면 initiate → sign → verify 성공
                    safeResolveAndReset(true);
                  } catch (e: any) {
                    // ❗️닫지 말고 에러를 보여주고 멈춰두기
                    const msg =
                      e?.message ||
                      (typeof e === "string" ? e : "Something went wrong.");
                    dbg("riskHost:onConfirmError", { msg, raw: String(e) });
                    setErrMsg(msg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {/* Sign */}
                {submitting ? "Signing..." : "Sign"}
              </ThemedButton>
            </div>
            <div className="h-0" />
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}

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

/** 인앱에서 지갑 시트 닫힘→포커스 복귀 직후 렌더 타이밍 안정화 (1~10ms 권장) */
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
  const detail = typeof arg === "function" ? { onConfirm: arg } : (arg ?? {});
  dbg("riskHost:openFn:start"); // [DBG]

  // 1) 호스트 준비까지 대기 (인앱에서 특히 중요)
  await waitForRiskHost();
  dbg("riskHost:openFn:hostReady"); // [DBG]
  // 2) 지갑 시트 → DApp 포커스 전환 안정화를 위해 1~10ms 양보
  await tinyDelay(10);
  dbg("riskHost:openFn:afterTinyDelay"); // [DBG]

  // 3) 전역 오프너가 있으면 직접 호출 (이 경로가 인앱에서 가장 튼튼)
  const openFn = (window as any)[HOST_OPEN_FN];
  if (typeof openFn === "function") {
    dbg("riskHost:openFn:useHostOpenFn"); // [DBG]
    return new Promise<boolean>((resolve) => openFn({ ...detail, resolve }));
  }

  // 4) 폴백: 커스텀 이벤트로 오픈
  dbg("riskHost:openFn:dispatchEvent"); // [DBG]
  return new Promise<boolean>((resolve) => {
    const ev = new CustomEvent<OpenEventDetail>(OPEN_RISK_CONSENT_EVENT, {
      detail: { ...detail, resolve },
    });
    // 인앱 호환: window + document 양쪽으로 디스패치
    try {
      window.dispatchEvent(ev);
    } catch {}
    try {
      document.dispatchEvent(ev);
    } catch {}
  });
}

export function closeRiskConsentModal() {
  dbg("riskHost:closeFn:dispatch"); // [DBG]
  window.dispatchEvent(new Event(CLOSE_RISK_CONSENT_EVENT));
}
