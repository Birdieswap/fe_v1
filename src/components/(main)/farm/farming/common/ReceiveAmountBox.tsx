"use client";

import { Image } from "@heroui/react";
import { motion } from "framer-motion";
import { useContext, useMemo } from "react";

import { BigDecimal } from "@/types/BigDecimal";
import { setPrecisionString } from "@/utils/setPrecision";
import { presenceTransition } from "@/const/presenceTransition";
import { IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import { AssetsContext } from "@/app/AssetsContextProvider";
import suffixNumbers from "@/utils/suffixNumbers";

export default function ReceiveAmountBox({
  amount,
  bToken: bToken,
}: {
  amount: BigDecimal;
  bToken: IBirdieSingleFarm;
}) {
  const { assetValues } = useContext(AssetsContext);
  const activePrice = useMemo(() => {
    if (bToken?.input.symbol && assetValues?.chainLinkPriceMap) {
      return assetValues.chainLinkPriceMap.get(
        `LINK:${bToken?.input.symbol}_USD`
      )?.price;
    }

    return undefined;
  }, [bToken?.input.symbol, assetValues?.chainLinkPriceMap]);

  // 표시용 소수 자릿수 (displayDecimals > decimals > fallback)
  const tokenDecimals =
    bToken?.input?.displayDecimals ??
    bToken?.input?.decimals ??
    bToken?.decimals ??
    8;

  // 토큰 수량 표기 (예: 123.45K / 1.23M ...)
  const formattedAmount = useMemo(
    () => suffixNumbers(amount, 100_000, 2, true, true),
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
      className="flex w-full flex-row items-center gap-1.5"
    >
      <Image
        alt={bToken.input.symbol}
        height={24}
        src={bToken.input.iconSrc}
        width={24}
      />
      <p className="grow text-[15px] font-semibold text-foreground">
        {bToken.input.symbol}
      </p>
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
