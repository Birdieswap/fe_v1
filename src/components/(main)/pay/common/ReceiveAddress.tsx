// components/(main)/pay/common/ReceiveAddress.tsx
"use client";

import { useCallback, useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

// ====== @yudiel/react-qr-scanner 타입 최소 정의 ======

type IDetectedBarcode = {
  rawValue: string;
};

interface QrScannerProps {
  onScan: (codes: IDetectedBarcode[]) => void;
  onError?: (error: unknown) => void;
  constraints?: MediaTrackConstraints;
  formats?: string[];
  scanDelay?: number;
  components?: {
    finder?: boolean;
    torch?: boolean;
    zoom?: boolean;
    onOff?: boolean;
    audio?: boolean;
    tracker?: (
      detectedCodes: IDetectedBarcode[],
      ctx: CanvasRenderingContext2D
    ) => void;
  };
  styles?: {
    container?: React.CSSProperties;
    video?: React.CSSProperties;
    finderBorder?: number;
  };
  classNames?: {
    container?: string;
    video?: string;
  };
  children?: React.ReactNode;
}

// Next.js 에서 SSR 끄고 Scanner 컴포넌트를 동적 import
const QrScanner = dynamic<QrScannerProps>(
  () =>
    import("@yudiel/react-qr-scanner").then(
      (mod) => mod.Scanner as React.ComponentType<QrScannerProps>
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-default-300">
        Opening camera…
      </div>
    ),
  }
);

type ReceiveAddressProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function ReceiveAddress({
  value,
  onChange,
}: ReceiveAddressProps) {
  const [internalValue, setInternalValue] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNoCameraModalOpen, setIsNoCameraModalOpen] = useState(false);

  const controlledValue = value ?? internalValue;

  const updateValue = useCallback(
    (next: string) => {
      onChange?.(next);
      if (!onChange) setInternalValue(next);
    },
    [onChange]
  );

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

  const handleDecoded = (raw: string) => {
    if (!raw) return;
    const trimmed = raw.trim();

    // ethereum:0x... 형식이면 prefix 제거
    const normalized = trimmed.replace(/^ethereum:/i, "");
    console.log("[QR] decoded:", normalized);

    updateValue(normalized);
    setIsScannerOpen(false);
  };

  const handleScan = (codes: IDetectedBarcode[]) => {
    if (!codes || codes.length === 0) return;
    console.log("[QR] onScan:", codes);

    const first = codes[0];
    if (!first?.rawValue) return;

    handleDecoded(first.rawValue);
  };

  const handleError = (error: unknown) => {
    console.error("[QR] onError:", error);
    setIsScannerOpen(false);
    setIsNoCameraModalOpen(true);
  };

  return (
    <>
      {/* ===== 입력창 + 스캔 아이콘 ===== */}
      <div className="mb-3 flex w-full items-stretch gap-2">
        <Input
          className="flex-1"
          radius="none"
          variant="bordered"
          size="lg"
          placeholder="Enter or scan the recipient's wallet address"
          value={controlledValue}
          onValueChange={updateValue}
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

      {/* ===== 카메라 없음 / 미지원 모달 (공통 포맷) ===== */}
      <ModalBase
        isOpen={isNoCameraModalOpen}
        onOpenChange={(open) => {
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
          <ModalHeader className="flex justify-center px-0 pb-5">
            <h1 className="text-xl font-semibold text-foreground">
              Camera not available
            </h1>
          </ModalHeader>

          <ModalBody className="mb-5 px-2 py-3">
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

      {/* ===== QR 스캐너 모달 ===== */}
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
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-4">
              {/* 상단 타이틀 */}
              <h1 className="text-xl font-semibold text-light-primary">
                Birdieswap Pay
              </h1>

              {/* 안내 문구 */}
              <p className="text-sm mt-3 text-default-200">
                Align the QR code within the frame
              </p>

              {/* 스캐너 영역 */}
              <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                <QrScanner
                  // QR만 인식하게 포맷 좁히기
                  formats={["qr_code"]}
                  // 뒷면 카메라 우선
                  constraints={{ facingMode: "environment" }}
                  // 스캔 결과 / 에러 핸들러
                  onScan={handleScan}
                  onError={handleError}
                  // 기본 finder 제거 (빨간 점선 없애기)
                  components={{
                    finder: false,
                    torch: true,
                    zoom: true,
                    onOff: false,
                  }}
                  // 스타일 커스터마이징
                  styles={{
                    container: {
                      position: "relative",
                      borderRadius: 16,
                    },
                    video: {
                      borderRadius: 16,
                      objectFit: "cover",
                    },
                    finderBorder: 0,
                  }}
                  // 내부 컨트롤에 색 입히기 위한 className
                  classNames={{
                    container: "birdieswap-qr-container",
                  }}
                >
                  {/* 커스텀 finder (네 귀퉁이 light-primary) */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-3/4 w-3/4 max-w-xs">
                      {/* top-left */}
                      <span className="absolute left-0 top-0 h-6 w-6 border-t-2 border-l-2 border-light-primary rounded-tl-lg" />
                      {/* top-right */}
                      <span className="absolute right-0 top-0 h-6 w-6 border-t-2 border-r-2 border-light-primary rounded-tr-lg" />
                      {/* bottom-left */}
                      <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-light-primary rounded-bl-lg" />
                      {/* bottom-right */}
                      <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-light-primary rounded-br-lg" />
                    </div>
                  </div>
                </QrScanner>
              </div>

              {/* 다크 모드 안내 문구 */}
              <p className="mt-2 text-center text-sm text-default-300">
                Scanning may be less reliable in dark mode.
              </p>
              <p className="mb-2 text-center text-sm text-default-300">
                If detection fails, please try again in light mode.
              </p>

              {/* Cancel 버튼 (MINT 테마) */}
              <div className="mt-2 w-full max-w-sm">
                <ThemedButton
                  variant="MINT"
                  className="h-11 w-full grow-0 text-base"
                  onPress={() => {
                    onClose();
                    setIsScannerOpen(false);
                  }}
                >
                  Cancel
                </ThemedButton>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
