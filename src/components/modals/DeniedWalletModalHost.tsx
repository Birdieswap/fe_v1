"use client";

import { useEffect, useState } from "react";
import { ModalContent, ModalBody, Link } from "@heroui/react";
import ModalBase from "../atoms/ModalBase";
import ThemedButton from "../atoms/ThemedButton";
import Image from "next/image";
import Icons from "@/assets/icons/icons";

export const OPEN_DENY_WALLET_EVENT = "app/denyWalletModal/open";
export const CLOSE_DENY_WALLET_EVENT = "app/denyWalletModal/close";

type DenyWalletModalDetail = {
  address?: string;
  title?: string;
  body?: string[];

  // ✅ null이면 CTA 숨김 (커스텀 모달에서 default CTA 방지)
  cta?: { label: string; href: string } | null;

  supportEmail?: string;
  supportLink?: { label: string; href: string };
};

const DEFAULT_TITLE = "You are not a Beta Tester.";
const DEFAULT_BODY = [
  "We’re currently in a closed beta period. To participate, please visit the Birdieswap prelaunch page and leave an email address under “Stay in the Loop.”",
];
const DEFAULT_CTA = {
  label: "Visit Birdieswap Pre-Launch Page",
  href: "https://www.birdieswap.com/",
};

export default function DeniedWalletModalHost() {
  const [isOpen, setIsOpen] = useState(false);

  const [address, setAddress] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [body, setBody] = useState<string[]>(DEFAULT_BODY);

  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [supportLink, setSupportLink] = useState<{
    label: string;
    href: string;
  } | null>(null);

  // ✅ 중요: 초기값을 null로 (default CTA가 남아 렌더되는 문제 차단)
  const [cta, setCta] = useState<{ label: string; href: string } | null>(null);

  // ✅ 커스텀 모달이면 default CTA 영역 렌더 금지
  const [isCustomModal, setIsCustomModal] = useState(false);

  function resetToDefault() {
    setIsOpen(false);
    setAddress(null);

    setTitle(DEFAULT_TITLE);
    setBody(DEFAULT_BODY);

    setSupportEmail(null);
    setSupportLink(null);

    // 닫힐 때는 CTA를 null로 초기화 (다음 오픈 시 onOpen에서 결정)
    setCta(null);
    setIsCustomModal(false);
  }

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent)?.detail as
        | DenyWalletModalDetail
        | undefined;

      setAddress(detail?.address ?? null);

      const custom =
        !!detail?.title ||
        !!detail?.body?.length ||
        !!detail?.supportEmail ||
        !!detail?.supportLink ||
        "cta" in (detail ?? {}); // cta 키가 있으면( null 포함 ) 커스텀으로 판단

      setIsCustomModal(custom);

      if (!custom) {
        // ✅ 기존 베타 모달
        setTitle(DEFAULT_TITLE);
        setBody(DEFAULT_BODY);
        setSupportEmail(null);
        setSupportLink(null);
        setCta(DEFAULT_CTA);
        setIsOpen(true);
        return;
      }

      // ✅ 커스텀 모달(TRM 등)
      setTitle(detail?.title ?? DEFAULT_TITLE);
      setBody(detail?.body ?? DEFAULT_BODY);

      setSupportEmail(detail?.supportEmail ?? null);
      setSupportLink(detail?.supportLink ?? null);

      // ✅ 커스텀에서는 DEFAULT_CTA 자동 부착 금지
      // - detail.cta 키가 있으면 그 값을 사용 (null이면 숨김)
      // - 키 자체가 없으면 null (숨김)
      if ("cta" in (detail ?? {})) {
        setCta(detail?.cta ?? null);
      } else {
        setCta(null);
      }

      setIsOpen(true);
    }

    function onClose() {
      resetToDefault();
    }

    window.addEventListener(OPEN_DENY_WALLET_EVENT, onOpen as any);
    window.addEventListener(CLOSE_DENY_WALLET_EVENT, onClose);

    return () => {
      window.removeEventListener(OPEN_DENY_WALLET_EVENT, onOpen as any);
      window.removeEventListener(CLOSE_DENY_WALLET_EVENT, onClose);
    };
  }, []);

  return (
    <ModalBase
      hideCloseButton
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) resetToDefault();
      }}
    >
      <ModalContent>
        <ModalBody className="flex flex-col gap-6 p-6">
          <div className="flex w-full flex-col items-center">
            <div className="flex w-full flex-row mt-3 mb-5 justify-center items-center">
              <Image
                alt="error"
                className="pb-6"
                height={28}
                src="/images/error.svg"
                width={28}
              />
              <h1 className="pl-2 pb-5 text-xl font-semibold text-foreground">
                {title}
              </h1>
            </div>

            <div className="w-full">
              {body.map((line, idx) => (
                <p
                  key={idx}
                  className="break text-base font-normal p-1 text-foreground"
                >
                  {line}
                </p>
              ))}
            </div>

            {(supportEmail || supportLink) && (
              <div className="w-full rounded-lg border border-default-200 dark:border-default-100 p-4 mt-3">
                <div className="flex flex-col items-center text-center gap-3">
                  {/* support link */}
                  {supportLink && (
                    <Link
                      className="rounded-md hover:bg-default-200 dark:hover:bg-default-100 gap-2 px-3 py-2 inline-flex items-center justify-center"
                      href={supportLink.href}
                      target="_blank"
                    >
                      {supportLink.label}
                      <Icons.WalletArrowRU className="fill-primary-500 stroke-primary-500 stroke-[1px] dark:fill-primary-default dark:stroke-primary-default" />
                    </Link>
                  )}

                  {/* 이메일 나중 */}
                  {supportEmail && (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">E-mail:</span>{" "}
                      <a className="underline" href={`mailto:${supportEmail}`}>
                        {supportEmail}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ✅ 핵심: 커스텀 모달이면 default CTA를 절대 렌더하지 않음 */}
            {!isCustomModal && cta && (
              <div className="flex justify-center items-center gap-2 p-4">
                <Link
                  className="w-full rounded-md hover:bg-default-200 dark:hover:bg-default-100 gap-2 p-3"
                  href={cta.href}
                  target="_blank"
                >
                  {cta.label}
                  <Icons.WalletArrowRU className="fill-primary-500 stroke-primary-500 stroke-[1px] dark:fill-primary-default dark:stroke-primary-default" />
                </Link>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col">
            <ThemedButton variant="MINT" onPress={resetToDefault}>
              Close
            </ThemedButton>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
