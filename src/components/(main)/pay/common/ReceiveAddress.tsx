"use client";

import { useCallback, useMemo, useState } from "react";
import type React from "react";
import dynamic from "next/dynamic";
import { Button, Input, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

// ====== QR 타입 최소 정의 ======
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

// ✅ "완성된" EVM 주소만 true
const isValidEvmAddress = (value: string) =>
  /^0x[0-9a-fA-F]{40}$/.test(value.trim());

// ✅ 입력 중 상태에서, 언제 에러를 보여줄지 결정
function getReceiverErrorMessage(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (!v.startsWith("0x")) return "Please enter a valid wallet address.";
  if (!/^0x[0-9a-fA-F]*$/.test(v))
    return "Please enter a valid wallet address.";
  if (v.length > 42) return "Please enter a valid wallet address.";
  if (v.length !== 42) return "Please enter a valid wallet address.";
  if (!/^0x[0-9a-fA-F]{40}$/.test(v))
    return "Please enter a valid wallet address.";
  return null;
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
  const [isInvalidAddressModalOpen, setIsInvalidAddressModalOpen] =
    useState(false);

  // ✅ 입력 UX용 state
  const [receiverTouched, setReceiverTouched] = useState(false);

  const controlledValue = value ?? internalValue;

  const updateValue = useCallback(
    (next: string) => {
      onChange?.(next);
      if (!onChange) setInternalValue(next);
    },
    [onChange]
  );

  // ✅ 입력값을 보고 에러 메시지 결정
  const receiverError = useMemo(() => {
    if (!receiverTouched) return null; // 아직 건드리지 않았으면 안내문구 숨김
    return getReceiverErrorMessage(controlledValue);
  }, [controlledValue, receiverTouched]);

  const handleClickScan = () => {
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
    const normalized = trimmed.replace(/^ethereum:/i, "").trim();
    // console.log("[QR] decoded:", normalized);

    // ✅ QR은 "완성 주소"여야 하니까 바로 유효성 체크
    if (!isValidEvmAddress(normalized)) {
      setIsInvalidAddressModalOpen(true);
      setReceiverTouched(true);
      updateValue(""); // QR은 실패하면 깔끔히 비우는 게 보통 UX 좋음
      setIsScannerOpen(false);
      return;
    }

    setReceiverTouched(true);
    updateValue(normalized);
    setIsScannerOpen(false);
  };

  const handleScan = (codes: IDetectedBarcode[]) => {
    if (!codes || codes.length === 0) return;
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
      <div className="flex w-full items-stretch gap-2">
        <Input
          className="flex-1"
          radius="none"
          variant="bordered"
          size="lg"
          placeholder="Enter or scan the recipient's wallet address"
          value={controlledValue}
          onValueChange={(v) => {
            if (!receiverTouched) setReceiverTouched(true);
            updateValue(v);
          }}
          classNames={{
            inputWrapper: clsx(
              "h-11 min-h-11 rounded-lg border bg-transparent px-3 py-1 shadow-none",
              receiverError
                ? "border-danger"
                : "border-default-300 dark:border-default-100",
              "data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent"
            ),
            input:
              "text-sm text-default-900 placeholder:text-default-500 dark:placeholder:text-default-200 focus:outline-none",
          }}
        />

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

      {/* ✅ reserved space (no layout shift) */}
      <div className=" min-h-[10px] px-1 text-center text-xs">
        <span
          className={clsx(
            "text-danger transition-opacity duration-150",
            receiverError ? "opacity-100" : "opacity-0"
          )}
        >
          {receiverError ?? "Please enter a valid wallet address."}
        </span>
      </div>

      {/* ===== 카메라 없음 / 미지원 모달 ===== */}
      <ModalBase
        isOpen={isNoCameraModalOpen}
        onOpenChange={(open) => setIsNoCameraModalOpen(open)}
        onClose={() => setIsNoCameraModalOpen(false)}
        className="p-6"
        classNames={{ wrapper: "items-end sm:items-center" }}
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

      {/* ===== QR 값이 잘못된 경우 모달 ===== */}
      <ModalBase
        isOpen={isInvalidAddressModalOpen}
        onOpenChange={(open) => setIsInvalidAddressModalOpen(open)}
        onClose={() => setIsInvalidAddressModalOpen(false)}
        className="p-6"
        classNames={{ wrapper: "items-end sm:items-center" }}
        closeButton={<ModalCloseButton />}
        scrollBehavior="outside"
        isDismissable
      >
        <ModalContent>
          <ModalHeader className="flex justify-center px-0 pb-5">
            <h1 className="text-xl font-semibold text-foreground">
              Invalid wallet address
            </h1>
          </ModalHeader>
          <ModalBody className="mb-5 px-2 py-3">
            <p className="text-base text-foreground">
              The scanned value is not a valid EVM wallet address.
              <br />
              Please scan again or paste a valid address.
            </p>
          </ModalBody>
          <ModalFooter className="p-0">
            <ThemedButton
              variant="MINT"
              onPress={() => setIsInvalidAddressModalOpen(false)}
            >
              CLOSE
            </ThemedButton>
          </ModalFooter>
        </ModalContent>
      </ModalBase>

      {/* ===== QR 스캐너 모달 ===== */}
      <ModalBase
        isOpen={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        size="full"
        className="bg-black/85 text-default-100 !border-none dark:!border-none shadow-none"
        classNames={{
          wrapper: "items-end justify-center sm:items-center sm:justify-center",
          backdrop: "bg-black/80",
        }}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: { duration: 0.28, ease: "easeOut" },
            },
            exit: {
              y: "100%",
              opacity: 0,
              transition: { duration: 0.28, ease: "easeIn" },
            },
          },
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-4">
              <h1 className="text-xl font-semibold text-light-primary">
                Birdieswap Pay
              </h1>

              <p className="mt-3 text-sm text-default-200">
                Align the QR code within the frame
              </p>

              <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-black">
                <QrScanner
                  formats={["qr_code"]}
                  constraints={{ facingMode: "environment" }}
                  onScan={handleScan}
                  onError={handleError}
                  components={{
                    finder: false,
                    torch: true,
                    zoom: true,
                    onOff: false,
                  }}
                  styles={{
                    container: { position: "relative", borderRadius: 16 },
                    video: { borderRadius: 16, objectFit: "cover" },
                    finderBorder: 0,
                  }}
                  classNames={{ container: "birdieswap-qr-container" }}
                >
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-3/4 w-3/4 max-w-xs">
                      <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-light-primary" />
                      <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-light-primary" />
                      <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-light-primary" />
                      <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-light-primary" />
                    </div>
                  </div>
                </QrScanner>
              </div>

              <div className="mb-2 mt-2 space-y-1 text-center text-sm text-default-300">
                <p>Scanning may be less reliable in dark mode.</p>
                <p>If detection fails, please try again in light mode.</p>
              </div>

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
      </ModalBase>
    </>
  );
}
