// components/(main)/pay/common/ReceiveAddress.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type React from "react";
import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
} from "@heroui/react";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

// =====================================================
// QR 스캐너 컴포넌트 (Scanner named export를 확실히 가져오도록 캐스팅)
// =====================================================
const QrScanner = dynamic<any>(
  () =>
    import("@yudiel/react-qr-scanner").then((mod: any) => {
      // 모듈 안에서 Scanner 컴포넌트만 골라서 반환
      const Component =
        mod.Scanner || mod.QrScanner || mod.default || (() => null);
      return Component as React.ComponentType<any>;
    }),
  { ssr: false }
);

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

  // 라이브러리 버전에 따라 콜백 형태가 달라질 수 있으므로
  // 어떤 형태로 오든 문자열만 잘 추출해서 handleDecoded로 넘긴다.
  const handleScanAny = (result: any) => {
    if (!result) return;

    console.log("QR RAW:", result);

    let raw: string | undefined;

    // 1) 배열 형태 (신버전 IDetectedBarcode[])
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0] as any;
      raw =
        typeof first === "string"
          ? first
          : ((first?.rawValue as string | undefined) ??
            (first?.text as string | undefined) ??
            (first?.data as string | undefined));
    }
    // 2) 단일 객체 형태
    else if (typeof result === "object" && result !== null) {
      const anyRes = result as any;
      raw =
        (anyRes?.rawValue as string | undefined) ??
        (anyRes?.text as string | undefined) ??
        (anyRes?.data as string | undefined);
    }
    // 3) 그냥 문자열
    else if (typeof result === "string") {
      raw = result;
    }

    if (!raw) {
      console.log("QR: decoded callback fired, but no usable text");
      return;
    }

    console.log("QR DETECTED:", raw);
    handleDecoded(raw);
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
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
              <p className="text-sm text-default-200">
                Align the QR code within the frame
              </p>
              <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                <QrScanner
                  // 후면 카메라 우선
                  constraints={{ facingMode: "environment" }}
                  // 라이브러리 버전에 따라 어느 쪽으로 콜백이 올지 몰라서 전부 연결
                  onDecode={handleScanAny}
                  onScan={handleScanAny}
                  onResult={handleScanAny}
                  onError={(error: unknown) => {
                    console.error("QR SCAN ERROR:", error);
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
