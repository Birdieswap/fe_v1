"use client";

import { Image } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo } from "react";

import { BigDecimal } from "@/types/BigDecimal";
import { setPrecisionString } from "@/utils/setPrecision";
import { presenceTransition } from "@/const/presenceTransition";
import { IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import useTokenUsdPrice from "@/hooks/useTokenUsdPrice";

export default function ReceiveAmountBox({
  amount,
  bToken: bToken,
}: {
  amount: BigDecimal;
  bToken: IBirdieSingleFarm;
}) {
  const { priceUsd } = useTokenUsdPrice(bToken?.input as any);
  const activePrice = useMemo(
    () => (priceUsd != null ? new BigDecimal(String(priceUsd), 8) : undefined),
    [priceUsd]
  );

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
          {setPrecisionString(amount, bToken.decimals || 8)}
        </p>
        <p className="text-right text-[14px] font-medium leading-[17px] text-default-800">
          $
          {activePrice
            ? amount
                .mul(activePrice)
                .roundToDecimals(2)
                .toPrecisionString(false, true)
            : "..."}
        </p>
      </div>
    </motion.div>
  );
}
