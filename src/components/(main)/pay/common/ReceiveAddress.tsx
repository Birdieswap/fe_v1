// components/(main)/pay/common/ReceiveAddress.tsx
"use client";

import { useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";
import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
  Divider,
} from "@heroui/react";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

// ====== QR 스캐너 타입 최소 정의 ======
type DetectedCode = {
  rawValue: string;
};

interface QrScannerProps {
  onScan: (detectedCodes: DetectedCode[]) => void;
  onError?: (error: unknown) => void;
  constraints?: MediaTrackConstraints;
}

// Next.js 에서 SSR 끄고 Scanner 컴포넌트를 동적 import
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false }
) as React.ComponentType<QrScannerProps>;

type ReceiveAddressProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function ReceiveAddress(props: ReceiveAddressProps) {
  const [internalValue, setInternalValue] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNoCameraModalOpen, setIsNoCameraModalOpen] = useState(false);

  const value = props.value ?? internalValue;

  const handleChange = (v: string) => {
    props.onChange?.(v);
    if (!props.onChange) setInternalValue(v);
  };

  const handleClickScan = () => {
    // 브라우저 & 카메라 API 체크
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setIsNoCameraModalOpen(true);
      return;
    }

    setIsScannerOpen(true);
  };

  const handleDecoded = (result: string) => {
    if (!result) return;
    const trimmed = result.trim();

    // ethereum:0x... 형식이면 prefix 제거
    const normalized = trimmed.replace(/^ethereum:/i, "");
    handleChange(normalized);
    setIsScannerOpen(false);
  };

  const handleScan = (detectedCodes: DetectedCode[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const first = detectedCodes[0];
    if (!first?.rawValue) return;
    handleDecoded(first.rawValue);
  };

  return (
    <>
      {/* 입력창 + 스캔 아이콘 */}
      <div className="mb-3 flex w-full items-stretch gap-2">
        <Input
          className="flex-1"
          radius="none"
          variant="bordered"
          size="lg"
          placeholder="Enter or Scan the recipient's wallet address"
          value={value}
          onValueChange={handleChange}
          classNames={{
            inputWrapper: clsx(
              "h-11 min-h-11 rounded-lg border border-default-300 dark:border-default-100 bg-transparent px-3 py-2 shadow-none",
              "data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent"
            ),
            input:
              "text-sm text-default-900 placeholder:text-default-500 dark:placeholder:text-default-200 focus:outline-none",
          }}
        />

        {/* 아이콘 자체를 버튼처럼 사용 */}
        <Button
          type="button"
          isIconOnly
          radius="full"
          variant="light"
          onPress={handleClickScan}
          aria-label="Scan QR code"
          className="
            min-w-0 size-10 p-0
            bg-transparent shadow-none
            data-[hover=true]:bg-default-100/60
            data-[pressed=true]:bg-default-200/60
            data-[disabled=true]:bg-transparent
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <MdOutlineQrCodeScanner className="h-5 w-5" />
        </Button>
      </div>

      {/* ===== 카메라 없음 / 미지원 모달 (공통 포맷 사용) ===== */}
      <ModalBase
        isOpen={isNoCameraModalOpen}
        onOpenChange={(open) => {
          // HeroUI onOpenChange는 boolean | undefined 를 넘길 수 있으므로 방어적으로 처리
          if (open === false) setIsNoCameraModalOpen(false);
          if (open === true) setIsNoCameraModalOpen(true);
        }}
        onClose={() => setIsNoCameraModalOpen(false)}
        className="p-6"
        classNames={{
          wrapper: "items-end sm:items-center",
        }}
        closeButton={<ModalCloseButton />}
        scrollBehavior="outside"
        isDismissable
      >
        <ModalContent>
          <ModalHeader className="px-0 pb-5 flex justify-center">
            <h1 className="text-xl font-semibold text-foreground">
              Camera not available
            </h1>
          </ModalHeader>

          <ModalBody className="px-2 py-3 mb-5">
            <p className="text-base text-foreground">
              This device doesn&apos;t seem to have a camera or your browser
              doesn&apos;t support camera access. Please paste the wallet
              address manually or try another device.
            </p>
          </ModalBody>
          <ModalFooter className="p-0">
            <ThemedButton
              variant="MINT"
              onPress={() => setIsNoCameraModalOpen(false)}
            >
              CLOSE
            </ThemedButton>
          </ModalFooter>
        </ModalContent>
      </ModalBase>

      {/* ===== QR 스캐너 모달 (기존 HeroUI Modal 그대로 유지) ===== */}
      <Modal
        isOpen={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        size="full"
        placement="center"
        hideCloseButton={false}
        classNames={{
          base: "bg-black/80",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
              <p className="text-sm text-default-200">
                Align the QR code within the frame
              </p>
              <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                <QrScanner
                  constraints={{ facingMode: "environment" }}
                  onScan={handleScan}
                  onError={(error: unknown) => {
                    console.error(error);
                    onClose();
                    setIsNoCameraModalOpen(true);
                  }}
                />
              </div>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
