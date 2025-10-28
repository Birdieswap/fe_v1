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
import { useReferral } from "@/app/ReferralContextProvider";
import { useAccount } from "wagmi";
import { isEthOnlyOneSide, isWrapPair } from "@/utils/swap/swapMode";

export default function SwapFeeInfo() {
  const [open, setOpen] = useState(false);
  const {
    fromToken,
    fromAmount,
    maxSlippage,
    toToken,
    toAmount,
    toPrice,
    fromPrice,
    swapPool,
    exchangeRate,
    rExchangeRate,
    priceImpact,
  } = useSwapContext();

  const [showReverse, setShowReverse] = useState(false);
  const { referralAddress } = useReferral();
  const { address } = useAccount();

  const RewardRatio = () => {
    if (!referralAddress || !address) return 0;

    if (referralAddress.toLowerCase() === address.toLowerCase()) {
      return 1;
    } else {
      return 0.8;
    }
  };
  //console.log("Referral Address in SwapFeeInfo:", referralAddress, "User Address:", address);
  const feeTier = swapPool?.fee_tier ? swapPool.fee_tier / 10000 : 0;
  const feeFractionBD = useMemo(() => {
    if (!swapPool?.fee_tier) return new BigDecimal(0);

    return new BigDecimal(Number(swapPool.fee_tier)).div(
      new BigDecimal(1000000)
    );
  }, [swapPool?.fee_tier]);

  // 간단한 포맷 함수: round 후 trailing zero 제거
  const formatBD = (bd: BigDecimal, decimals: number) => {
    // stripZero = true, useComma = false
    return bd.roundToDecimals(decimals).toPrecisionString(true, false);
  };
  const isWrap = isWrapPair(fromToken, toToken);
  const isWrapper = isEthOnlyOneSide(fromToken, toToken);

  const exchangeRateInfo = useMemo(() => {
    if (isWrap && fromToken && toToken && fromPrice) {
      const val = fromPrice.roundToDecimals(2).toPrecisionString(false, false);
      return `1 ${fromToken.symbol} = 1 ${toToken.symbol} ($ ${val})`;
    }

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
    if (isWrap && fromToken && toToken && toPrice) {
      const val = toPrice.roundToDecimals(2).toPrecisionString(false, false);
      return `1 ${toToken.symbol} = 1 ${fromToken.symbol} ($ ${val})`;
    }

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
  }, [rExchangeRate, fromToken, toToken, fromPrice]);

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
            "text-foreground data-[hover=true]:bg-background data-[hover=true]:opacity-80"
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
                  {swapPool && <Icons.PointIcon className="h-5 w-5" />}
                </div>

                <Icons.Dropdown className="rotate-180 transition-transform group-data-[open=true]:rotate-0" />
              </div>
            </div>
          </div>
        </Button>
      </div>
      <AnimatePresence>
        {!isWrap && priceImpact && priceImpact.abs().gt(0.05) && (
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
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className={clsx(
                "grid w-full grid-cols-2 grid-rows-4 gap-2 text-sm font-normal",
                "[&>*]:flex [&>*]:flex-row [&>*]:items-center [&>*]:gap-1",
                "[&>*:nth-child(even)]:justify-self-end",
                "[&>*:nth-child(even)]:text-foreground",
                "[&>*:nth-child(odd)]:text-default-700"
              )}
            >
              <span>Max slippage</span>
              <span>
                {isWrap
                  ? `0%`
                  : maxSlippage === "auto"
                    ? `Auto(0.5%)`
                    : `${maxSlippage}%`}
              </span>
              <span>Price Impact</span>
              <span>
                {isWrap ? `0%` : `-${priceImpact?.abs().mul(100).toFixed(2)}%`}
              </span>
              <span>Fee ({feeTier}%)</span>
              <span>
                {fromAmount && fromPrice
                  ? (() => {
                      // fromAmount may be string or number -> 숫자 기반 생성으로 decimals 확보
                      const fromBD = new BigDecimal(Number(fromAmount));
                      const feeTokenBD = fromBD.mul(feeFractionBD); // token 단위의 fee
                      const feeUSDBD = fromBD.mul(fromPrice).mul(feeFractionBD); // 달러 환산
                      return `${fromToken?.symbol} ${formatBD(
                        feeTokenBD,
                        8
                      )} ($${formatBD(feeUSDBD, 4)})`;
                    })()
                  : ""}
              </span>
              <span>Swap Point</span>
              <span>
                <Icons.PointIcon className="h-5 w-5" />
                {fromAmount && fromPrice
                  ? (() => {
                      // fromAmount may be string or number -> 숫자 기반 생성으로 decimals 확보
                      const fromBD = new BigDecimal(Number(fromAmount));
                      const RewardTokenBD = fromBD
                        .mul(feeFractionBD)
                        .div(10)
                        .mul(RewardRatio()); // token 단위의 fee
                      const RewardUSDBD = RewardTokenBD.mul(fromPrice); // 달러 환산
                      return `${fromToken?.symbol} ${formatBD(
                        RewardTokenBD,
                        8
                      )} ($${formatBD(RewardUSDBD, 5)})`;
                    })()
                  : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
