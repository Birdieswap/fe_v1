"use client";

import type { LottieRefCurrentProps } from "lottie-react";

import { Button, ModalBody, ModalContent } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useChainId, useWatchAsset } from "wagmi";
import confetti from "canvas-confetti";

import ThemedButton from "@/components/atoms/ThemedButton";
import { TransactionStatusProps } from "@/app/TransactionContextProvider";
import TransactionStatus from "@/types/TransactionStatus";
import { WalletContext } from "@/app/WalletContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { presenceTransition } from "@/const/presenceTransition";
import { IToken } from "@/const/contracts/types/tokenTypes";

import ModalCloseButton from "../atoms/ModalCloseButton";
import ModalBase from "../atoms/ModalBase";

import IconTransactionFailed from "./transactionProgress/transaction_failed.svg";
import TransactionProgressLight from "./transactionProgress/transaction_progress_light.json";
import TransactionProgressDark from "./transactionProgress/transaction_progress_dark.json";
import TransactionProgressInfo from "./transactionProgress/TransactionProgressInfo";
import IconTransactionCanceled from "./transactionProgress/transaction_canceled.svg";

const Lottie = dynamic(
  () => import("lottie-react").then((mod) => mod.default),
  { ssr: false }
);

const transition = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
  transition: { duration: 0.2 },
};

const initialSegment: [number, number] = [0, 29];

export type TransactionProgressModalProps = {
  onClose: () => void;
  isOpen: boolean;
  transactionProps: TransactionStatusProps | null;
};

/**
 * "123.45000" -> "123.45"
 * "5.000" -> "5"
 */
function trimTrailingZeros(numStr: string): string {
  if (!numStr.includes(".")) return numStr;
  const [intPart, decPartRaw] = numStr.split(".");
  const decPart = decPartRaw.replace(/0+$/, "");
  if (decPart === "") return intPart;
  return `${intPart}.${decPart}`;
}

/**
 * 다양한 형태의 amount 객체를 문자열로 포맷
 * - string / number / bigint
 * - { formatted }
 * - { value, decimals }
 */
function formatTokenAmount(raw: any): string {
  if (raw == null) return "";

  // 이미 문자열/숫자/bigint
  if (
    typeof raw === "string" ||
    typeof raw === "number" ||
    typeof raw === "bigint"
  ) {
    const s = String(raw);
    // 숫자 형태면 의미 없는 0 제거
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      return trimTrailingZeros(s);
    }
    return s;
  }

  // wagmi/viem 스타일: { formatted }
  if (typeof raw === "object" && "formatted" in raw) {
    return formatTokenAmount((raw as any).formatted);
  }

  // { value, decimals } 형태
  if (typeof raw === "object" && "value" in raw && "decimals" in raw) {
    try {
      const v = BigInt((raw as any).value);
      const d = Number((raw as any).decimals);
      if (!Number.isFinite(d) || d < 0 || d > 36) {
        return String((raw as any).value ?? "");
      }
      const base = 10n ** BigInt(d);
      const whole = v / base;
      const frac = v % base;
      if (d === 0) return whole.toString();
      let fracStr = frac.toString().padStart(d, "0");
      const combined = `${whole.toString()}.${fracStr}`;
      return trimTrailingZeros(combined);
    } catch {
      return String((raw as any).value ?? "");
    }
  }

  // fallback
  return "";
}

function AddToWallet(props: { token?: IToken }) {
  const chainId = useChainId();
  const { watchAsset, data, isPending, isError } = useWatchAsset();
  const [isRequested, setIsRequested] = useState(false);
  const { token } = props;
  const address = useMemo(() => {
    return token?.addresses[chainId];
  }, [chainId, token?.addresses]);

  useEffect(() => {
    setIsRequested(false);
  }, [token]);

  const isDone = isRequested && data && !isError && !isPending;

  return (
    <Button
      className="text-base font-normal data-[done=true]:pointer-events-none data-[done=true]:bg-primary data-[done=true]:text-primary-foreground"
      data-done={isDone}
      isDisabled={isPending}
      size="sm"
      variant="light"
      onPress={() => {
        if (address && token) {
          setIsRequested(true);
          watchAsset({
            type: "ERC20",
            options: {
              address: address,
              symbol: token.symbol,
              decimals: token.decimals || 18,
            },
          });
        }
      }}
    >
      {isDone ? "Added to wallet!" : `Add ${token?.fullName} to wallet`}
    </Button>
  );
}

export default function TransactionProgressModal(
  props: TransactionProgressModalProps
) {
  const { selectedNetwork } = useContext(WalletContext);
  const transactionStatus = props.transactionProps?.transactionStatus;
  const lightAnimRef = useRef<LottieRefCurrentProps>(null);
  const darkAnimRef = useRef<LottieRefCurrentProps>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // ✅ confetti 1회만
  const didConfettiRef = useRef(false);

  useEffect(() => {
    setIsCompleted(false);
    didConfettiRef.current = false;
  }, [props.isOpen]);

  const txHref =
    (selectedNetwork?.blockExplorer?.url ?? "https://etherscan.io/") +
    (props.transactionProps?.txid ? `tx/${props.transactionProps.txid}` : "");

  const message = useMemo(() => {
    switch (transactionStatus) {
      case TransactionStatus.FAILED:
        return "Transaction Failed";
      case TransactionStatus.CANCELED:
        return "Transaction Canceled in Wallet";
      case TransactionStatus.SUCCESS:
        return "Success!";
      case TransactionStatus.PENDING:
        return "Transaction Submitted";
      case TransactionStatus.CONFIRM_NEEDED:
        return "Confirm Transaction in Wallet";
      default:
        return "Transaction Status Unknown";
    }
  }, [transactionStatus]);

  const isLinkDisabled =
    transactionStatus === TransactionStatus.FAILED ||
    transactionStatus === TransactionStatus.CANCELED ||
    transactionStatus === TransactionStatus.CONFIRM_NEEDED;

  // ✅ SUCCESS + fireConfetti + swapBenchmarkInfo 있을 때 폭죽
  useEffect(() => {
    const p: any = props.transactionProps;
    if (
      transactionStatus === TransactionStatus.SUCCESS &&
      p?.fireConfetti &&
      p?.swapBenchmarkInfo &&
      !didConfettiRef.current
    ) {
      didConfettiRef.current = true;
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.72 },
      });
    }
  }, [transactionStatus, props.transactionProps]);

  const hasBenchmark =
    transactionStatus === TransactionStatus.SUCCESS &&
    (props.transactionProps as any)?.swapBenchmarkInfo;

  // if (typeof window !== "undefined" && props.transactionProps) {
  //   const p: any = props.transactionProps;
  //   console.log("tx props", p);
  //   console.log("input", p.input);
  //   console.log("output", p.output);
  //   console.log("swapBenchmarkInfo", p.swapBenchmarkInfo);
  //   console.log("input.token", p.input?.token);
  //   console.log("output.token", p.output?.token);
  // }

  const benchmarkBlock = useMemo(() => {
    const p: any = props.transactionProps;
    if (!hasBenchmark || !p) return null;

    const info = p.swapBenchmarkInfo;

    // 🔹 from token (input)
    const fromToken = p.input?.token;
    const fromAmountRaw = p.input?.amount; // BigDecimal { value, decimals }
    const fromAmount = formatTokenAmount(fromAmountRaw);
    const fromSymbol = fromToken?.symbol ?? "";
    const fromLogo = fromToken?.iconSrc; //  여기!

    // 🔹 to token (output)
    const toToken = p.output?.token;
    const toSymbol = toToken?.symbol ?? "";
    const toLogo = toToken?.iconSrc; //  여기!

    // 🔹 benchmark / profit 수치
    const profitUsd = formatTokenAmount(info.profitUsd);
    const actualOut = formatTokenAmount(info.actualOut);
    const benchmarkOut = formatTokenAmount(info.benchmarkOutAfterFee);

    return (
      <div className="w-full rounded-2xl border border-default-200 dark:border-default-100 bg-background p-4 text-foreground shadow-sm  ">
        {/* Hero + Birdie 아이콘 */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">
              You just outplayed Uniswap.
            </p>
            <p className="mt-1 text-3xl font-bold text-light-primary dark:text-dark-green-key">
              +${profitUsd}
            </p>
            <p className="mt-1 text-sm text-default-700 dark:text-default-300">
              Big brain move. This trade hit different.
            </p>
          </div>

          <div className="h-20 w-20 shrink-0">
            <img
              src="/CelebrationIcon.png"
              alt="Birdieswap celebrating bird"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* 🔹 from token 정보 + 비교 카드 */}
        <div className="mt-4 rounded-xl  p-3 text-base bg-default-100 dark:bg-dark-popup-bg">
          {/* 위쪽: 넌 이번 거래에 XXX를 사용했어 */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-default-700 dark:text-default-300">
              You kicked this trade off with
            </span>
            {fromLogo && (
              <img
                src={fromLogo}
                alt={fromSymbol || "From token"}
                className="h-4 w-4 rounded-full object-contain"
              />
            )}
            <span className="text-sm font-semibold text-foreground">
              {fromAmount} {fromSymbol}
            </span>
          </div>

          {/* 아래: You earned / Uniswap 좌우 배치 + to token 아이콘 */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-default-800 dark:text-default-800">
                Birdieswap
              </p>
              <div className="mt-2 flex items-center gap-2">
                {toLogo && (
                  <img
                    src={toLogo}
                    alt={toSymbol || "Output token"}
                    className="h-4 w-4 rounded-full object-contain"
                  />
                )}
                <p className="text-sm font-semibold text-foreground">
                  {actualOut} {toSymbol}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-default-600 dark:text-default-400">
                Uniswap
              </p>
              <div className="mt-2 flex items-center justify-end gap-2">
                {toLogo && (
                  <img
                    src={toLogo}
                    alt={toSymbol || "Output token"}
                    className="h-4 w-4 rounded-full object-contain"
                  />
                )}
                <p className="text-sm font-semibold text-default-500 dark:text-default-400">
                  {benchmarkOut} {toSymbol}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 카드 아래 한 줄 문구 */}
        <p className="mt-3 text-center text-base text-default-700 dark:text-default-600">
          Can’t wait to see your next smart trade.
        </p>
      </div>
    );
  }, [hasBenchmark, props.transactionProps, transactionStatus]);

  return (
    <ModalBase
      closeButton={<ModalCloseButton />}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <ModalContent>
        <ModalBody className="flex flex-col gap-6 p-6">
          <motion.div layout className="flex w-full flex-col items-center">
            <div className="relative size-[84px] pt-6">
              <AnimatePresence initial={false}>
                {transactionStatus === TransactionStatus.FAILED && (
                  <motion.div
                    key="image_failed"
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    {...transition}
                  >
                    <IconTransactionFailed />
                  </motion.div>
                )}
                {transactionStatus === TransactionStatus.CANCELED && (
                  <motion.div
                    key="image_canceled"
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    {...transition}
                  >
                    <IconTransactionCanceled />
                  </motion.div>
                )}
                {(transactionStatus === TransactionStatus.CONFIRM_NEEDED ||
                  transactionStatus === TransactionStatus.SUCCESS ||
                  transactionStatus === TransactionStatus.PENDING) && (
                  <motion.div
                    key="image_pending"
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    {...transition}
                  >
                    <Lottie
                      autoPlay
                      animationData={TransactionProgressLight}
                      className="dark:hidden"
                      initialSegment={initialSegment}
                      loop={false}
                      lottieRef={lightAnimRef}
                      onComplete={() => {
                        if (transactionStatus === TransactionStatus.SUCCESS) {
                          if (!isCompleted) {
                            lightAnimRef.current?.playSegments([85, 145], true);
                            setIsCompleted(true);
                          } else {
                            lightAnimRef.current?.pause();
                          }
                        } else {
                          lightAnimRef.current?.playSegments([29, 57], true);
                        }
                      }}
                    />
                    <Lottie
                      autoPlay
                      animationData={TransactionProgressDark}
                      className="hidden dark:block"
                      initialSegment={initialSegment}
                      loop={false}
                      lottieRef={darkAnimRef}
                      onComplete={() => {
                        if (transactionStatus === TransactionStatus.SUCCESS) {
                          if (!isCompleted) {
                            darkAnimRef.current?.playSegments([85, 145], true);
                            setIsCompleted(true);
                          } else {
                            darkAnimRef.current?.pause();
                          }
                        } else {
                          darkAnimRef.current?.playSegments([29, 57], true);
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              layout
              className="flex flex-col items-center gap-4 pt-6"
            >
              <h1 className="text-xl font-semibold text-foreground">
                {message}
              </h1>

              {/* ✅ 기본 정보(기본 블럭) - benchmarkBlock 없을 때만 */}
              {!hasBenchmark && (
                <AnimatePresence initial={false}>
                  {props.transactionProps &&
                    props.transactionProps.transactionStatus !==
                      TransactionStatus.FAILED &&
                    props.transactionProps.transactionStatus !==
                      TransactionStatus.CANCELED && (
                      <TransactionProgressInfo {...props.transactionProps} />
                    )}
                </AnimatePresence>
              )}

              {/* ✅ 추가 문구(벤치마크 있을 때) */}
              {benchmarkBlock}

              <Link
                className={
                  "pt-2 text-light-primary dark:text-dark-primary " +
                  "data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-default data-[disabled=true]:text-default-500"
                }
                data-disabled={isLinkDisabled}
                href={txHref}
                target="_blank"
                onClick={(e) => {
                  if (isLinkDisabled) e.preventDefault();
                }}
              >
                {transactionStatus === TransactionStatus.FAILED
                  ? "Please try again"
                  : transactionStatus === TransactionStatus.CANCELED
                    ? "Transaction was canceled"
                    : transactionStatus === TransactionStatus.CONFIRM_NEEDED
                      ? ""
                      : "View on explorer"}
              </Link>

              <AnimatePresence initial={false}>
                {props.transactionProps?.transactionType ===
                  TransactionType.START_FARMING &&
                  props.transactionProps?.transactionStatus ===
                    TransactionStatus.SUCCESS && (
                    <motion.div {...presenceTransition}>
                      <AddToWallet
                        token={props.transactionProps.output.token}
                      />
                    </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          <div className="flex w-full flex-col">
            <ThemedButton
              variant="MINT"
              onClick={() => {
                props.onClose();
              }}
            >
              Close
            </ThemedButton>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
