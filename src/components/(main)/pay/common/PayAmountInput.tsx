// components/(main)/pay/common/PayAmountInput.tsx
"use client";

import { useMemo, useState } from "react";
import { Button, Image, Input } from "@heroui/react";
import { useChainId } from "wagmi";
import clsx from "clsx";

import tokens from "@/const/contracts/tokens/tokens";
import lpVaults from "@/const/contracts/tokens/lpVaults";
import Icons from "@/assets/icons/icons";

import PayToleranceSection from "./PayToleranceSection";
import PayPoolSelector from "./PayPoolSelector";

export type PayMode = "PAY" | "ENTER";
type LpVault = (typeof lpVaults)[keyof typeof lpVaults];

interface PayAmountInputProps {
  mode: PayMode;
}

/**
 * PAY / ENTER 공용 금액 입력 + 토큰 / 풀 선택 UI
 * - PAY: USDC 고정 + Pay tolerance + Select a Pool
 * - ENTER: ETH/WETH 토글 + Select a Pool
 */
export default function PayAmountInput({ mode }: PayAmountInputProps) {
  const [amount, setAmount] = useState<string>("");
  const [tolerance, setTolerance] = useState<"auto" | number>("auto");
  const [selectedPool, setSelectedPool] = useState<LpVault | undefined>();

  // ENTER 모드에서만 사용하는 ETH/WETH 토글 상태
  const [nativeSymbol, setNativeSymbol] = useState<"ETH" | "WETH">("ETH");

  const chainId = useChainId();

  // PAY → USDC 고정 / ENTER → ETH 또는 WETH
  const token =
    mode === "PAY"
      ? tokens.USDC
      : nativeSymbol === "ETH"
        ? tokens.ETH
        : tokens.WETH;

  // 현재 체인에서 사용 가능한 풀만 필터링
  const availablePools: LpVault[] = useMemo(() => {
    const all = Object.values(lpVaults) as LpVault[];
    if (!chainId) return all;
    return all.filter(
      (pool) =>
        pool.addresses[chainId as keyof typeof pool.addresses] !== undefined
    );
  }, [chainId]);

  // 단순 숫자 입력 (자리수 검증만)
  const handleAmountChange = (v: string) => {
    if (v === "" || /^(\d+(\.\d*)?)?$/.test(v)) {
      setAmount(v);
    }
  };

  // ETH ⇄ WETH 토글
  const handleToggleNative = () => {
    setNativeSymbol((prev) => (prev === "ETH" ? "WETH" : "ETH"));
  };

  return (
    <div className="flex w-full flex-col gap-4 mb-5 rounded-2xl bg-default-100 dark:bg-dark-swap-bg px-4 py-4">
      {/* 1. 헤더: PAY / ENTER 텍스트 */}
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-semibold tracking-wide text-default-600">
          {mode === "PAY" ? "PAY" : "ENTER"}
        </span>
        {mode === "PAY" && (
          <span className="text-[11px] text-default-500">
            (Exact amount the recipient receive)
          </span>
        )}
      </div>

      {/* 2. 숫자 입력 + 토큰 영역 */}
      <div className="flex items-center justify-between gap-3">
        <Input
          type="number"
          variant="bordered"
          radius="none"
          className="flex-1 bg-transparent"
          classNames={{
            inputWrapper:
              "h-auto min-h-0 border-none bg-transparent px-0 py-0 shadow-none",
            input:
              "textfield text-[40px] leading-[44px] font-semibold text-default-700 placeholder:text-default-400 focus:outline-none",
          }}
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onValueChange={handleAmountChange}
          onKeyDown={(e) => {
            if (e.key === "-") e.preventDefault();
          }}
          onWheel={(e) => e.currentTarget.blur()}
        />

        {/* 토큰 아이콘 + 심볼 + (ENTER에서만) Change 버튼 */}
        <div className="flex items-center gap-2">
          {token.iconSrc && (
            <Image
              src={token.iconSrc}
              alt={token.symbol}
              width={32}
              height={32}
              classNames={{ img: "object-contain" }}
            />
          )}
          <span className="text-base font-semibold text-default-900">
            {token.symbol}
          </span>

          {mode === "ENTER" && (
            <Button
              type="button"
              isIconOnly
              radius="full"
              variant="light"
              onPress={handleToggleNative}
              aria-label={`Switch to ${nativeSymbol === "ETH" ? "WETH" : "ETH"}`}
              title="Change ETH/WETH"
              className="
                min-w-0 size-8 p-0
                bg-transparent shadow-none
                data-[hover=true]:bg-transparent
                data-[pressed=true]:bg-transparent
                data-[disabled=true]:bg-transparent
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
              "
            >
              <Icons.Change className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* 3. Pay tolerance (PAY 에서만) */}
      {mode === "PAY" && (
        <PayToleranceSection value={tolerance} onChange={setTolerance} />
      )}

      {/* 4. Select a Pool 버튼 (공통) */}
      <PayPoolSelector
        pools={availablePools}
        selected={selectedPool}
        onSelect={setSelectedPool}
      />
    </div>
  );
}
