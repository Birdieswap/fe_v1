"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  useDisclosure,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Divider,
} from "@heroui/react";
import clsx from "clsx";

import Icons from "@/assets/icons/icons";
import "@/components/(main)/swap/MaxSlippagePopover.css";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

interface Props {
  mode: "PAY" | "ENTER";
  value: "auto" | number;
  onChange: (value: "auto" | number) => void;
}

// Auto 기본값: 5%
const DEFAULT_AUTO_STR = "3";

export function getPayTolerancePercent(value: "auto" | number): number {
  if (value === "auto") return Number(DEFAULT_AUTO_STR);
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return Number(DEFAULT_AUTO_STR);
  return Math.min(n, 99.99);
}

export default function PayToleranceSection({ mode, value, onChange }: Props) {
  const [custom, setCustom] = useState<string>(DEFAULT_AUTO_STR);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAuto = value === "auto";

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const isPay = mode === "PAY";

  // value가 "auto" 로 바뀔 때만 표시값을 5로 리셋
  useEffect(() => {
    if (value === "auto") {
      setCustom(DEFAULT_AUTO_STR);
    }
  }, [value]);

  const clampToValid = (str: string): number => {
    const n = parseFloat(str || DEFAULT_AUTO_STR);
    if (isNaN(n) || n <= 0) return Number(DEFAULT_AUTO_STR);
    return Math.min(n, 99.99);
  };

  const handleCustomChange = (v: string) => {
    // 소수점 둘째 자리까지
    const sanitized = v.replace(/^(\d+)(\.\d{0,2})?.*$/, "$1$2");
    setCustom(sanitized);

    if (!sanitized || sanitized === "0") return;

    const num = clampToValid(sanitized);
    onChange(num);
  };

  const enterCustomMode = () => {
    if (isAuto) {
      // canonical 값은 5%로 두되 표시값은 비운다 (setCustom 은 따로)
      onChange(clampToValid(DEFAULT_AUTO_STR));
    }
  };

  const InfoIconButton = ({
    className,
    onClick,
  }: {
    className?: string;
    onClick: () => void;
  }) => (
    <Button
      isIconOnly
      onPress={onClick}
      className={clsx(
        "w-4 min-w-4",
        "h-4 min-h-4",
        "rounded-full",
        "flex items-center justify-center",
        "data-[hover=true]:bg-background data-[hover=true]:opacity-100",
        className,
      )}
      variant="light"
    >
      <Icons.Info
        className={clsx(
          "fill-default-500 group-hover:fill-default-700",
          "dark:fill-default-500 dark:group-hover:fill-default-700",
          "transition-[fill]",
        )}
        fillRule="evenodd"
      />
    </Button>
  );

  return (
    <Fragment>
      {/* ====== Pay tolerance 섹션 ====== */}
      <div
        className={clsx(
          "flex w-full flex-col gap-2", // 모바일: 위아래
          "sm:flex-row sm:items-start sm:gap-3", // 데스크탑: 좌우
        )}
      >
        {/* ---- 왼쪽 라벨 영역 ---- */}
        <div className="sm:w-auto">
          {/* 모바일: Pay tolerance + i 버튼 한 줄 */}
          <div className="flex items-center gap-1 sm:hidden">
            <span className="text-sm font-semibold text-default-700">
              {isPay ? "Pay tolerance" : "Enter tolerance"}
            </span>
            <InfoIconButton onClick={onOpen} />
          </div>

          {/* 데스크탑: Pay / tolerance 두 줄 + 가운데 정렬된 i 버튼 */}
          <div className="hidden sm:flex items-center gap-1">
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-center font-semibold text-default-700">
                {isPay ? "Pay" : "Enter"}
              </span>
              <span className="text-sm text-center font-semibold text-default-700">
                tolerance
              </span>
            </div>
            <InfoIconButton className="self-center" onClick={onOpen} />
          </div>
        </div>

        {/* ---- 오른쪽 Auto/Custom + % 모듈 ---- */}
        <div className="w-full sm:flex sm:justify-end">
          <div
            className={clsx(
              "flex w-full items-center justify-between gap-2",
              "rounded-xl border border-default-300 dark:border-default-100 bg-background",
              "px-2 py-1.5",
              "sm:w-auto sm:max-w-[240px]",
            )}
          >
            {/* Auto / Custom 토글 */}
            <div className="flex flex-row gap-1">
              <Button
                size="sm"
                variant="light"
                className="max-slippage-selector px-3 text-xs"
                data-selected={isAuto}
                onPress={() => {
                  // Auto 모드 전환 + 5% 표시
                  onChange("auto");
                  setCustom(DEFAULT_AUTO_STR);
                }}
              >
                Auto
              </Button>
              <Button
                size="sm"
                variant="light"
                className="max-slippage-selector px-3 text-xs"
                data-selected={!isAuto}
                onPress={() => {
                  enterCustomMode();
                  setCustom(""); // 바로 입력할 수 있도록 비우기
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                Custom
              </Button>
            </div>

            {/* 퍼센트 입력 (폭 80px) */}
            <Input
              ref={inputRef}
              type="number"
              size="sm"
              min={0}
              max={99.99}
              step="0.01"
              value={custom}
              onFocus={() => {
                // Auto 상태에서 입력창 클릭 → Custom 모드 + 값 비우기
                if (isAuto) {
                  enterCustomMode();
                  setCustom("");
                }
              }}
              onBlur={() => {
                // 빈 값으로 나오면 다시 Auto + 5%
                if (!custom || custom === "0") {
                  onChange("auto");
                  setCustom(DEFAULT_AUTO_STR);
                }
              }}
              onValueChange={handleCustomChange}
              onKeyDown={(e) => {
                if (e.key === "-") e.preventDefault();
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className="w-20"
              classNames={{
                inputWrapper:
                  "h-7 min-h-7 border-none bg-transparent px-2 py-0 shadow-none",
                input:
                  "textfield text-right text-[13px] text-default-900 placeholder:text-default-400",
              }}
              endContent={
                <span className="pr-1 text-xs text-default-600">%</span>
              }
            />
          </div>
        </div>
      </div>

      {/* ====== Pay Tolerance Info Modal ====== */}
      <ModalBase
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
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
              {isPay ? "Pay Tolerance" : "Enter Tolerance"}
            </h1>
          </ModalHeader>

          <ModalBody className="px-0 py-3">
            {isPay ? (
              <>
                <p className="text-base text-foreground">
                  To ensure the exact amount is delivered in a Pay transaction,
                  we temporarily withdraw an additional amount based on the Pay
                  tolerance (in USD value).
                </p>
                <p className="mt-3 mb-5 text-base text-foreground">
                  Any remaining USDC after the payment is completed is returned
                  to your wallet.
                </p>
              </>
            ) : (
              <>
                <p className="text-base text-foreground">
                  Sets the maximum allowed loss (in USD) from price impact and
                  slippage during Easy Enter.
                </p>
                <p className="mt-3 mb-5 text-base text-foreground">
                  If the expected loss exceeds this tolerance, the transaction
                  is halted to protect your assets.
                </p>
              </>
            )}
          </ModalBody>
          <ModalFooter className="p-0">
            <ThemedButton variant="MINT" onPress={onClose}>
              Close
            </ThemedButton>
          </ModalFooter>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
