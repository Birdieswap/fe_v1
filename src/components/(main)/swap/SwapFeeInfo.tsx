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
    fromPrice,
    exchangeRate,
    rExchangeRate,
    priceImpact,
  } = useSwapContext();

  const [showReverse, setShowReverse] = useState(false);

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

  const rExchangeRateInfo = useMemo(() => {
    if (!rExchangeRate || !fromPrice || !toToken || !fromToken) return "";
    const rExchangeRateValue = new BigDecimal(rExchangeRate || "0");
    const fromValueString = fromPrice
      .mul(rExchangeRateValue)
      .roundToDecimals(2)
      .toPrecisionString(false, false);
    const rExchangeRateString = rExchangeRateValue
      .roundToDecimals(fromToken.displayDecimals ?? fromToken.decimals ?? 3)
      .toPrecisionString(false, false);

    return `1 ${toToken?.symbol} = ${rExchangeRateString} ${fromToken?.symbol} ($\u00A0${fromValueString})`;
  }, [rExchangeRate, fromToken, toPrice, toToken]);

  if (!fromToken || !toToken) {
    return; //<div>Select tokens to see fee information</div>;
  }

  return (
    <motion.section className="w-full" {...defaultTransition}>
      <div className="flex w-full flex-col gap-2.5 pb-4">
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
          <div className="flex w-full flex-col gap-2.5">
            <div className="flex w-full max-w-full flex-row items-center justify-between">
              <span
                className={cn("inline-flex font-medium cursor-pointer")}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReverse((prev) => !prev);
                }}
              >
                {showReverse ? rExchangeRateInfo : exchangeRateInfo}
              </span>
              <div className="flex flex-row items-center gap-0.5">
                <div className="flex flex-row items-center gap-0.5 opacity-100 transition-opacity group-data-[open=true]:opacity-0">
                  <Icons.Gas />
                  0.5%
                </div>
                <Icons.Dropdown className="rotate-180 transition-transform group-data-[open=true]:rotate-0" />
              </div>
            </div>
          </div>
        </Button>
      </div>
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

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="accordion"
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
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
