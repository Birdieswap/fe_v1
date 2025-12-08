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

// 👇 라이브러리에서 공식 타입 import
import type { IDetectedBarcode, IScannerProps } from "@yudiel/react-qr-scanner";

// Next.js 에서 SSR 끄고 Scanner 컴포넌트를 동적 import
const QrScanner = dynamic<IScannerProps>(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
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

  // 👇 라이브러리에서 넘겨주는 공식 타입 그대로 사용
  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;

    const first = detectedCodes[0];
    if (!first?.rawValue) return;

    // 디버깅 해보고 싶으면 한 번 찍어보면 됨
    // console.log("DETECTED:", first);

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

      {/* ===== 카메라 없음 / 미지원 모달 ===== */}
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
                  // ✅ 인식 콜백
                  onScan={handleScan}
                  // ✅ 에러 콜백
                  onError={(error) => {
                    console.error(error);
                    onClose();
                    setIsNoCameraModalOpen(true);
                  }}
                  // ✅ 카메라 옵션: 후면 + 적당한 해상도
                  constraints={{
                    facingMode: "environment",
                    aspectRatio: 1,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                  }}
                  // ✅ QR 코드만 탐지 (성능/안정성 ↑)
                  formats={["qr_code"]}
                  // 필요하면 조금 더 자주/덜 자주 스캔
                  scanDelay={500}
                  components={{
                    finder: true,
                    torch: true,
                  }}
                  styles={{
                    container: { width: "100%", aspectRatio: "1 / 1" },
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
