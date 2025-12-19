// components/(main)/pay/common/PayPoolSelector.tsx
"use client";

import Icons from "@/assets/icons/icons";
import { Button, Image, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { useDisclosure } from "@heroui/react";
import clsx from "clsx";
import { BigDecimal } from "@/types/BigDecimal";
import ModalBase from "@/components/atoms/ModalBase";

export type PoolLike = {
  address: string; // input token address (byInputTokenAddress 의 key)
  symbol: string; // 예: bUSDCWETH
  fullName: string; // 예: Birdieswap USDC 3000 WETH
  iconSrc: string; // 여기서는 항상 "/tokens/sblp-token.svg"
  stakedBalance?: BigDecimal; // 사용자가 가진 잔고 (PAY / Easy 공통)
  usdValue?: BigDecimal; // PAY 전용: 잔고의 달러 가치
  apy7d?: BigDecimal; // Easy 전용: 7d APY (0.12 = 12%)
};

interface Props {
  mode: "PAY" | "ENTER";
  pools: PoolLike[];
  selected?: PoolLike;
  onSelect: (pool: PoolLike) => void;
}

/** 숫자 표시용 헬퍼 */
function formatAmount(v?: BigDecimal, fractionDigits = 5): string {
  if (!v) return "-";
  if (v.isZero()) return "0";
  return v.roundToDecimals(fractionDigits).toPrecisionString(true, true);
}

function formatUsd(v?: BigDecimal): string {
  if (!v) return "-";
  if (v.isZero()) return "$0.00";
  return "$" + v.roundToDecimals(2).toPrecisionString(true, true);
}

/** 0.1234 → 12.34 %  (BigDecimal로 100 곱하고 버림) */
function formatApy(v?: BigDecimal): string {
  if (!v) return "-";
  const percent = v.mul(100).roundToDecimals(2); // 정수 나눗셈이라 버림 효과
  return percent.toPrecisionString(true, true) + " %";
}

export default function PayPoolSelector({
  mode,
  pools,
  selected,
  onSelect,
}: Props) {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const hasSelection = !!selected;

  return (
    <>
      {/* 메인 Select a Pool 버튼 */}
      <Button
        fullWidth
        variant="bordered"
        onPress={onOpen}
        className={clsx(
          "flex h-11 items-center rounded-lg", // ← justify-between 제거
          "border border-default-300 dark:border-default-100 bg-background px-3 text-sm",
          "hover:bg-default-100"
        )}
      >
        {hasSelection && selected ? (
          <>
            {/* 왼쪽: 아이콘 + 심볼 */}
            <div className="flex items-center gap-2">
              <Image
                src={selected.iconSrc}
                alt={selected.symbol}
                width={24}
                height={24}
                classNames={{ img: "object-contain" }}
              />
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold">
                  {selected.symbol}
                </span>
              </div>
            </div>

            {/* 오른쪽: PAY = 잔고/달러, ENTER = APY */}
            <div className="ml-auto mr-1 flex flex-col items-end">
              {mode === "PAY" && (
                <>
                  <span className="text-xs font-semibold">
                    {formatAmount(selected.stakedBalance, 5)}
                  </span>
                  <span className="text-[11px] text-default-500">
                    {formatUsd(selected.usdValue)}
                  </span>
                </>
              )}
              {mode === "ENTER" && (
                <>
                  <span className="text-[11px] text-default-500">7d %APY</span>
                  <span className="text-xs font-semibold">
                    {formatApy(selected.apy7d)}
                  </span>
                </>
              )}
            </div>

            <Icons.SwapTokenArrow className="ml-1 shrink-0" />
          </>
        ) : (
          <>
            {/* 선택 전: flex-1 영역 안에서 완전 중앙 정렬 */}
            <div className="flex flex-1 items-center justify-center">
              <span className="text-center text-default-500">
                Select a Pool
              </span>
            </div>
            <Icons.SwapTokenArrow className="ml-1 shrink-0" />
          </>
        )}
      </Button>

      {/* 풀 선택 모달 */}
      <ModalBase
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="lg"
        scrollBehavior="inside"
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
        classNames={{
          wrapper: "items-end justify-center sm:items-center sm:justify-center",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-base font-semibold">
                Select a Pool
              </ModalHeader>
              <ModalBody>
                <div className="flex h-[40vh] flex-col overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {pools.map((pool) => (
                      <button
                        key={pool.address}
                        type="button"
                        onClick={() => {
                          onSelect(pool);
                          onClose();
                        }}
                        className={clsx(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2",
                          "hover:bg-default-100"
                        )}
                      >
                        {/* 왼쪽: 아이콘 + 심볼/풀 이름 */}
                        <Image
                          src={pool.iconSrc}
                          alt={pool.symbol}
                          width={28}
                          height={28}
                          classNames={{ img: "object-contain" }}
                        />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold">
                            {pool.symbol}
                          </span>
                          <span className="text-xs text-default-500">
                            {pool.fullName}
                          </span>
                        </div>

                        {/* 오른쪽 정보 */}
                        <div className="ml-auto flex flex-col items-end">
                          {mode === "PAY" && (
                            <>
                              <span className="text-xs font-semibold">
                                {formatAmount(pool.stakedBalance, 5)}
                              </span>
                              <span className="text-[11px] text-default-500">
                                {formatUsd(pool.usdValue)}
                              </span>
                            </>
                          )}
                          {mode === "ENTER" && (
                            <>
                              <span className="text-[11px] text-default-500">
                                7d %APY
                              </span>
                              <span className="text-xs font-semibold">
                                {formatApy(pool.apy7d)}
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                    {pools.length === 0 && (
                      <div className="py-4 text-center text-sm text-default-500">
                        No available pools.
                      </div>
                    )}
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </ModalBase>
    </>
  );
}
