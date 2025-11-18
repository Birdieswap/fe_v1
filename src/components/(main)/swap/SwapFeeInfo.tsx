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
    swapPool,
    exchangeRate,
    rExchangeRate,
    priceImpact,
  } = useSwapContext();

  const [showReverse, setShowReverse] = useState(false);
  const { referralAddress } = useReferral();
  const { address } = useAccount();
  const { aprDataState } = useContext(AssetsContext);
  const chainId = useChainId();

  const getSwapPointAddress = (
    token: typeof fromToken,
    chainId: number
  ): `0x${string}` | null => {
    if (!token) return null;

    // ETH → WETH 주소로 치환
    if (token.symbol === "ETH") {
      const wethAddress = tokens.WETH?.addresses?.[chainId];
      if (wethAddress) return wethAddress as `0x${string}`;
      return null;
    }

    // 일반 ERC20 토큰 주소
    const address =
      typeof token.addresses === "string"
        ? token.addresses
        : token.addresses?.[chainId];

    return (address ?? null) as `0x${string}` | null;
  };

  const swapPointValue = useMemo(() => {
    if (!aprDataState?.SwapPointsDistributionSpeed || !fromToken) return null;

    // fromToken 구조에 맞게 address 를 꺼내 주세요
    const tokenAddress = getSwapPointAddress(fromToken, chainId);

    if (!tokenAddress) return null;

    const value = aprDataState.SwapPointsDistributionSpeed[tokenAddress];

    // console.log("swapPointValue in SwapFeeInfo:", tokenAddress, value);

    return value ?? null;
  }, [aprDataState, fromToken, chainId]);

  // 10^n 을 문자열로 만드는 헬퍼 (예: n=6 -> "1000000")
  const pow10String = (decimals: number) =>
    decimals <= 0 ? "1" : "1" + "0".repeat(decimals);

  const estimatedSwapPoints = useMemo(() => {
    if (swapPointValue == null) return null;
    if (!fromAmount || !fromToken) return null;

    try {
      const decimals = fromToken.decimals ?? 18;

      // fromAmount: 이미 위에서 Number(...) 로 쓰고 있지만,
      // 여기선 문자열 그대로 넣는 편이 BigDecimal 에 안전합니다.
      const amountBD = new BigDecimal(String(fromAmount));

      const tokenScaleBD = new BigDecimal(pow10String(decimals)); // 10^fromToken.decimals
      const swapPointBD = new BigDecimal(swapPointValue);
      const scale1e18BD = new BigDecimal("1000000000000000000"); // 10^18

      const result = amountBD
        .mul(tokenScaleBD)
        .mul(swapPointBD)
        .div(scale1e18BD);

      // 화면에는 깔끔하게 포맷된 문자열로
      return result.roundToDecimals(4).toPrecisionString(true, false);
    } catch (e) {
      console.warn("failed to calc estimatedSwapPoints", e);
      return null;
    }
  }, [swapPointValue, fromAmount, fromToken]);

  // console.log(
  //   "From Token in SwapFeeInfo:",
  //   fromToken,
  //   aprDataState,
  //   swapPointValue
  // );

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
                {isWrap ? `0%` : `-${priceImpact?.abs().mul(100).toFixed(2)}%`}
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
              {estimatedSwapPoints !== null && (
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
                      {/* 아이콘 */}
                      <Icons.PointIcon className="h-5 w-5 shrink-0 ml-4" />

                      {/* 텍스트 – SwapPointsDistributionSpeed 의 value 표시 */}
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
