"use client";

import { Button, Image } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { BigDecimal } from "@/types/BigDecimal";
import { presenceTransition } from "@/const/presenceTransition";
import { IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import suffixNumbers from "@/utils/suffixNumbers";
import Icons from "@/assets/icons/icons";
import useTokenUsdPrice from "@/hooks/useTokenUsdPrice";

export default function ReceiveAmountBox({
  amount,
  bToken: bToken,
  nativeToggle,
}: {
  amount: BigDecimal;
  bToken: IBirdieSingleFarm;
  nativeToggle?: { value: "ETH" | "WETH"; onToggle: () => void };
}) {
  const { priceUsd } = useTokenUsdPrice(bToken?.input as any);
  const activePrice = useMemo(
    () => (priceUsd != null ? new BigDecimal(String(priceUsd), 8) : undefined),
    [priceUsd]
  );

  // 표시용 소수 자릿수 (displayDecimals > decimals > fallback)
  const tokenDecimals =
    bToken?.input?.displayDecimals ??
    bToken?.input?.decimals ??
    bToken?.decimals ??
    8;

  // 토큰 수량 표기 (예: 123.45K / 1.23M ...)
  const formattedAmount = useMemo(
    () => suffixNumbers(amount, 100_000, 4, true, true),
    [amount, tokenDecimals]
  );

  // USD 표기 (예: $12.3K / $1.2M ...)
  const formattedUsd = useMemo(() => {
    if (!activePrice) return "...";
    const usd = amount.mul(activePrice);
    return suffixNumbers(usd, 100_000, 2, true, true);
  }, [amount, activePrice]);

  return (
    <motion.div
      {...presenceTransition}
      className="flex w-full items-center gap-2" // row 기본, 아이템 간격
    >
      <Image
        alt={bToken.input.symbol}
        height={24}
        src={bToken.input.iconSrc}
        width={24}
      />

      {/* ⬇️ symbol + toggle 묶음 (이 컨테이너가 grow) */}
      <div className="flex grow items-center gap-1.5 min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-none">
          {bToken.input.symbol}
        </p>

        {nativeToggle && ["ETH", "WETH"].includes(bToken.input.symbol) && (
          <Button
            type="button"
            isIconOnly
            radius="full"
            variant="light"
            onPress={nativeToggle.onToggle}
            aria-label={`Switch to ${nativeToggle.value === "ETH" ? "WETH" : "ETH"}`}
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
            <Icons.Change />
          </Button>
        )}
      </div>

      {/* 우측 금액 영역 */}
      <div className="flex flex-col items-end gap-0.5">
        <p className="text-right text-[14px] font-medium leading-[17px] text-foreground">
          {formattedAmount}
        </p>
        <p className="text-right text-[14px] font-medium leading-[17px] text-default-800">
          {activePrice ? `$${formattedUsd}` : "..."}
        </p>
      </div>
    </motion.div>
  );
}
