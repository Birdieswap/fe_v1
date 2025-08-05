"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button, cn } from "@heroui/react";
import clsx from "clsx";

import Icons from "@/assets/icons/icons";
import { defaultTransition } from "@/const/presenceTransition";
import { BigDecimal } from "@/types/BigDecimal";

import { useSwapContext } from "./SwapProvider";
import SwapError from "./SwapError";

export default function SwapFeeInfo() {
  const [open, setOpen] = useState(false);
  const {
    fromToken,
    maxSlippage,
    toToken,
    toAmount,
    toPrice,
    exchangeRate,
    priceImpact,
  } = useSwapContext();

  const exchangeRateInfo = useMemo(() => {
    if (!exchangeRate || !toPrice || !toToken || !fromToken) return "";
    const exchangeRateValue = new BigDecimal(exchangeRate || "0");
    const toValueString = toPrice
      .mul(exchangeRateValue)
      .roundToDecimals(2)
      .toPrecisionString(false, false);
    const exchangeRateString = exchangeRateValue
      .roundToDecimals(toToken.displayDecimals ?? toToken.decimals ?? 3)
      .toPrecisionString(false, false);

    return `1 ${fromToken?.symbol} = ${exchangeRateString} ${toToken?.symbol} ($\u00A0${toValueString})`;
  }, [exchangeRate, fromToken, toPrice, toToken]);

  if (!fromToken || !toToken) {
    return; //<div>Select tokens to see fee information</div>;
  }

  return (
    <motion.section layout className="w-full" {...defaultTransition}>
      <motion.div
        layout
        className="flex w-full flex-col gap-2.5 pb-4"
        {...defaultTransition}
      >
        <Button
          className={cn(
            "group h-fit max-h-fit w-full rounded-none px-0 text-left",
            "border-none bg-none",
            "text-foreground data-[hover=true]:bg-background data-[hover=true]:opacity-80",
          )}
          data-open={open}
          variant="light"
          onPress={() => setOpen((v) => !v)}
        >
          <motion.div layout className="flex w-full flex-col gap-2.5">
            <div className="flex w-full max-w-full flex-row items-center gap-1">
              <span className="grow self-start text-wrap break-words font-medium">
                {exchangeRateInfo}
              </span>
              <div className="flex flex-row items-center gap-0.5 opacity-100 transition-opacity group-data-[open=true]:opacity-0">
                <Icons.Gas />
                {/*<Icons.ArrowRL />*/}
                0.5%
              </div>
              <Icons.Dropdown className="rotate-180 transition-transform group-data-[open=true]:rotate-0" />
            </div>
          </motion.div>
        </Button>
        <AnimatePresence>
          {priceImpact && priceImpact.abs().gt(0.05) && (
            <SwapError>
              <Icons.Error />
              <span>
                High price impact! More than{" "}
                {priceImpact?.abs().mul(100).toFixed(2) ?? "-"}% drop!
              </span>
            </SwapError>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            layout
            animate={{
              opacity: 1,
              scaleY: 1,
              height: "auto",
              originY: 0,
            }}
            exit={{
              opacity: 0,
              padding: 0,
              margin: 0,
              height: 0,
            }}
            initial={{
              opacity: 0,
              originY: 0,
              height: 0,
            }}
          >
            <div
              className={clsx(
                "grid w-full grid-cols-2 grid-rows-4 gap-2 text-sm font-normal",
                "[&>*]:flex [&>*]:flex-row [&>*]:items-center [&>*]:gap-1",
                "[&>*:nth-child(even)]:justify-self-end",
                "[&>*:nth-child(even)]:text-foreground",
                "[&>*:nth-child(odd)]:text-default-700",
              )}
            >
              <span>Max slippage</span>
              <span>{maxSlippage === "auto" ? "Auto" : `${maxSlippage}%`}</span>
              <span>Receive at least</span>
              <span>
                {toAmount} {toToken?.symbol}
              </span>
              <span>Fee (0.3%)</span>
              <span>
                {toAmount && toPrice
                  ? `$${new BigDecimal(toAmount).mul(toPrice).mul(0.003).roundToDecimals(2).toPrecisionString(false, true)}`
                  : ""}
              </span>
              <span>Network cost</span>
              <span>
                <Icons.Gas />
                0.5%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
