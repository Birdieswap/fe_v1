"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useContext, useMemo, useState } from "react";
import { Button, cn } from "@heroui/react";
import clsx from "clsx";

import Icons from "@/assets/icons/icons";
import { defaultTransition } from "@/const/presenceTransition";
import { BigDecimal } from "@/types/BigDecimal";

import { useSwapContext } from "./SwapProvider";
import SwapError from "./SwapError";
import { useReferral } from "@/app/ReferralContextProvider";
import { useAccount, useChainId } from "wagmi";
import { isEthOnlyOneSide, isWrapPair } from "@/utils/swap/swapMode";
import { AssetsContext } from "@/app/AssetsContextProvider";
import tokens from "@/const/contracts/tokens/tokens";

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

    activeSwapPool,

    swapPool,
    exchangeRate,
    rExchangeRate,
    priceImpact,

    isExternalSwapPool,
  } = useSwapContext();

  const [showReverse, setShowReverse] = useState(false);
  const { referralAddress } = useReferral();
  const { address } = useAccount();
  const { aprDataState } = useContext(AssetsContext);
  const chainId = useChainId();

  // ✅ pool 변수 하나로 통일
  const pool = activeSwapPool ?? null;

  // ✅ 내부 풀일 때만 포인트 관련 UI/계산 수행
  const showSwapPointUI = !!pool && !isExternalSwapPool;

  // 10^n 을 문자열로 만드는 헬퍼 (예: n=6 -> "1000000")
  const pow10String = (decimals: number) =>
    decimals <= 0 ? "1" : "1" + "0".repeat(decimals);

  /**
   * ✅ Swap Point 조회용 주소:
   * - ETH면 WETH 주소로 치환
   * - 그 외는 token.addresses에서 chainId에 맞춰 추출
   */
  const swapPointTokenAddress = useMemo((): `0x${string}` | null => {
    if (!showSwapPointUI || !fromToken) return null;

    const isEth = fromToken.symbol?.toUpperCase?.() === "ETH";
    if (isEth) {
      const weth = tokens.WETH?.addresses?.[chainId];
      return (weth ?? null) as `0x${string}` | null;
    }

    const addr =
      typeof (fromToken as any).addresses === "string"
        ? ((fromToken as any).addresses as string)
        : ((fromToken as any).addresses?.[chainId] as string | undefined);

    return (addr ?? null) as `0x${string}` | null;
  }, [showSwapPointUI, fromToken, chainId]);

  const swapPointValue = useMemo(() => {
    if (!showSwapPointUI) return null;
    if (!aprDataState?.SwapPointsDistributionSpeed) return null;
    if (!swapPointTokenAddress) return null;

    return (
      aprDataState.SwapPointsDistributionSpeed[swapPointTokenAddress] ?? null
    );
  }, [showSwapPointUI, aprDataState, swapPointTokenAddress]);

  const estimatedSwapPoints = useMemo(() => {
    if (!showSwapPointUI) return null;
    if (swapPointValue == null) return null;
    if (!fromAmount || !fromToken) return null;

    try {
      // ✅ ETH면 WETH decimals 기준으로 스케일 맞춤
      const isEth = fromToken.symbol?.toUpperCase?.() === "ETH";
      const decimals = isEth
        ? (tokens.WETH?.decimals ?? 18)
        : (fromToken.decimals ?? 18);

      const amountBD = new BigDecimal(String(fromAmount));
      const tokenScaleBD = new BigDecimal(pow10String(decimals)); // 10^decimals
      const swapPointBD = new BigDecimal(swapPointValue);
      const scale1e18BD = new BigDecimal("1000000000000000000"); // 10^18

      const result = amountBD
        .mul(tokenScaleBD)
        .mul(swapPointBD)
        .div(scale1e18BD);
      return result.roundToDecimals(4).toPrecisionString(true, false);
    } catch (e) {
      console.warn("failed to calc estimatedSwapPoints", e);
      return null;
    }
  }, [showSwapPointUI, swapPointValue, fromAmount, fromToken]);

  const RewardRatio = () => {
    if (!referralAddress || !address) return 0;

    if (referralAddress.toLowerCase() === address.toLowerCase()) {
      return 1;
    } else {
      return 0.8;
    }
  };

  const feeTier = pool?.fee_tier ? pool.fee_tier / 10000 : 0;

  const feeFractionBD = useMemo(() => {
    if (!pool?.fee_tier) return new BigDecimal(0);
    return new BigDecimal(Number(pool.fee_tier)).div(new BigDecimal(1000000));
  }, [pool?.fee_tier]);

  // 간단한 포맷 함수: round 후 trailing zero 제거
  const formatBD = (bd: BigDecimal, decimals: number) => {
    return bd.roundToDecimals(decimals).toPrecisionString(true, false);
  };

  const isWrap = isWrapPair(fromToken, toToken);
  const isWrapper = isEthOnlyOneSide(fromToken, toToken);

  const exchangeRateInfo = useMemo(() => {
    // wrap: 항상 1:1
    if (isWrap && fromToken && toToken) {
      const usd = fromPrice
        ? ` ($ ${fromPrice.roundToDecimals(2).toPrecisionString(false, false)})`
        : "";
      return `1 ${fromToken.symbol} = 1 ${toToken.symbol}${usd}`;
    }

    if (!exchangeRate || !toToken || !fromToken) return "";

    const rateBD = new BigDecimal(exchangeRate || "0");
    const rateStr = rateBD
      .roundToDecimals(toToken.displayDecimals ?? toToken.decimals ?? 6)
      .toPrecisionString(false, false);

    // ✅ 외부토큰이면 toPrice가 없을 수 있음 → USD 생략
    if (!toPrice) {
      return `1 ${fromToken.symbol} = ${rateStr} ${toToken.symbol}`;
    }

    const usdStr = toPrice
      .mul(rateBD)
      .roundToDecimals(2)
      .toPrecisionString(false, false);

    return `1 ${fromToken.symbol} = ${rateStr} ${toToken.symbol} ($ ${usdStr})`;
  }, [isWrap, exchangeRate, fromToken, toToken, toPrice, fromPrice]);

  const rExchangeRateInfo = useMemo(() => {
    if (isWrap && fromToken && toToken) {
      const usd = toPrice
        ? ` ($ ${toPrice.roundToDecimals(2).toPrecisionString(false, false)})`
        : "";
      return `1 ${toToken.symbol} = 1 ${fromToken.symbol}${usd}`;
    }

    if (!rExchangeRate || !toToken || !fromToken) return "";

    const rBD = new BigDecimal(rExchangeRate || "0");
    const rStr = rBD
      .roundToDecimals(fromToken.displayDecimals ?? fromToken.decimals ?? 6)
      .toPrecisionString(false, false);

    // ✅ 외부토큰이면 fromPrice가 없을 수 있음 → USD 생략
    if (!fromPrice) {
      return `1 ${toToken.symbol} = ${rStr} ${fromToken.symbol}`;
    }

    const usdStr = fromPrice
      .mul(rBD)
      .roundToDecimals(2)
      .toPrecisionString(false, false);

    return `1 ${toToken.symbol} = ${rStr} ${fromToken.symbol} ($ ${usdStr})`;
  }, [isWrap, rExchangeRate, fromToken, toToken, fromPrice, toPrice]);

  if (!fromToken || !toToken) {
    return null;
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
                  {showSwapPointUI && <Icons.PointIcon className="h-5 w-5" />}
                </div>

                <Icons.Dropdown className="rotate-180 transition-transform group-data-[open=true]:rotate-0" />
              </div>
            </div>
          </div>
        </Button>
      </div>

      <AnimatePresence>
        {!isWrap && priceImpact && priceImpact.negate().gt(0.05) && (
          <SwapError>
            <Icons.Error className="dark:fill-[#ff3f3f]" />
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
                "grid w-full grid-cols-2 grid-rows-4 gap-2 text-sm font-sans",
                "[&>*]:flex [&>*]:flex-row [&>*]:items-center [&>*]:gap-1",
                "[&>*:nth-child(even)]:justify-self-end",
                "text-foreground"
              )}
            >
              <span className="text-default-700 dark:text-default-300">
                Max slippage
              </span>
              <span>
                {isWrap
                  ? `0%`
                  : maxSlippage === "auto"
                    ? `Auto(0.5%)`
                    : `${maxSlippage}%`}
              </span>

              <span className="text-default-700 dark:text-default-300">
                Price Impact
              </span>
              <span>
                {isWrap ? `0%` : `${priceImpact?.mul(100).toFixed(2)}%`}
              </span>

              <span className="text-default-700 dark:text-default-300">
                Fee ({feeTier}%)
              </span>
              <span className="justify-self-end">
                <span className="grid grid-cols-[1.25rem,1fr] items-start gap-1 text-right">
                  <span className="col-start-2 row-start-1 min-w-0 tabular-nums">
                    {fromAmount && fromPrice
                      ? (() => {
                          const fromBD = new BigDecimal(Number(fromAmount));
                          const feeTokenBD = fromBD.mul(feeFractionBD);
                          const feeUSDBD = fromBD
                            .mul(fromPrice)
                            .mul(feeFractionBD);
                          return (
                            <>
                              {fromToken?.symbol} {formatBD(feeTokenBD, 8)}{" "}
                              <span className="whitespace-nowrap">
                                (${formatBD(feeUSDBD, 4)})
                              </span>
                            </>
                          );
                        })()
                      : ""}
                  </span>
                </span>
              </span>

              {showSwapPointUI && estimatedSwapPoints !== null && (
                <>
                  <span className="text-default-700 dark:text-default-300">
                    Estimated Swap Point
                  </span>
                  <span className="justify-self-end">
                    <span
                      className="
                        inline-flex
                        flex-row
                        items-center
                        justify-end
                        gap-1
                        text-right
                        max-[320px]:flex-wrap
                        max-[320px]:gap-x-1
                        max-[320px]:text-[13px]
                      "
                    >
                      <Icons.PointIcon className="h-5 w-5 shrink-0 ml-4" />
                      <span
                        className="
                          tabular-nums
                          leading-tight
                          whitespace-nowrap
                          max-[356px]:whitespace-normal
                          max-[321px]:text-right
                        "
                      >
                        {estimatedSwapPoints}
                      </span>
                    </span>
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
