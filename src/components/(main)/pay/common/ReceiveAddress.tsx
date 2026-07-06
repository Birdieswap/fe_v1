"use client";

import type { IDetectedBarcode, IScannerProps } from "@yudiel/react-qr-scanner";
import type React from "react";

import {
  Button,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { MdOutlineQrCodeScanner } from "react-icons/md";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

// ✅ "완성된" EVM 주소만 true
const isValidEvmAddress = (value: string) =>
  /^0x[0-9a-fA-F]{40}$/.test(value.trim());

const EVM_ADDRESS_IN_TEXT =
  /(?:^|[^0-9a-fA-F])(0[xX][0-9a-fA-F]{40})(?![0-9a-fA-F])/;

function normalizeEvmAddress(value: string) {
  return value.replace(/^0X/, "0x");
}

function extractEvmAddressFromQr(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed) return null;

  const candidates = [trimmed];

  try {
    const decoded = decodeURIComponent(trimmed);

    if (decoded !== trimmed) candidates.push(decoded);
  } catch {
    // Some QR payloads can contain malformed URI escapes. Keep the raw value.
  }

  for (const candidate of candidates) {
    const direct = normalizeEvmAddress(candidate.trim());

    if (isValidEvmAddress(direct)) return direct;

    const match = candidate.match(EVM_ADDRESS_IN_TEXT);

    if (match?.[1]) return normalizeEvmAddress(match[1]);
  }

  return null;
}

const MAX_EVM_ADDRESS_LENGTH = 42;

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
const QrScanner = dynamic<IScannerProps>(
  () =>
    import("@yudiel/react-qr-scanner").then((mod) => {
      mod.prepareZXingModule({
        overrides: {
          locateFile: (path, prefix) =>
            path.endsWith(".wasm") ? "/zxing_reader.wasm" : prefix + path,
        },
      });

      return mod.Scanner as React.ComponentType<IScannerProps>;
    }),
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
    const normalized = extractEvmAddressFromQr(raw);
    // console.log("[QR] decoded:", normalized);

    if (!normalized) {
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
          maxLength={MAX_EVM_ADDRESS_LENGTH}
          onValueChange={(v) => {
            if (!receiverTouched) setReceiverTouched(true);
            updateValue(v.slice(0, MAX_EVM_ADDRESS_LENGTH));
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
        placement="bottom" // ✅ 항상 bottom
        scrollBehavior="inside" // ✅ 길면 내부 스크롤
        size="full"
        className="bg-black/85 text-default-100 !border-none dark:!border-none shadow-none !rounded-none"
        classNames={{
          // ✅ 바깥 여백/정렬 고정
          wrapper: "!items-end !justify-end !p-0",
          // ✅ full-screen base를 '진짜 화면 높이'로 (ModalBase의 --app-vh를 그대로 사용)
          base: "!m-0 !w-full !max-w-full !rounded-none !h-[calc(var(--app-vh,1vh)*100)] !max-h-none",
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
        <ModalContent className="!h-[calc(var(--app-vh,1vh)*100)] !max-h-none !rounded-none">
          {(onClose) => (
            <div
              className="
          flex h-full w-full flex-col
          px-4 pt-6
          pb-[calc(env(safe-area-inset-bottom)+16px)]
        "
            >
              {/* ✅ 위/가운데: 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center gap-4">
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
                </div>
              </div>

              {/* ✅ 아래: footer(항상 바닥에 붙음) */}
              <div className="w-full max-w-sm self-center pt-4">
                <ThemedButton
                  variant="MINT"
                  className="h-11 w-full text-base"
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
