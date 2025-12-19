// components/modals/TransactionProgressModal.tsx
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

function trimTrailingZeros(numStr: string): string {
  if (!numStr.includes(".")) return numStr;
  const [intPart, decPartRaw] = numStr.split(".");
  const decPart = decPartRaw.replace(/0+$/, "");
  if (decPart === "") return intPart;
  return `${intPart}.${decPart}`;
}

function formatTokenAmount(raw: any): string {
  if (raw == null) return "";

  if (
    typeof raw === "string" ||
    typeof raw === "number" ||
    typeof raw === "bigint"
  ) {
    const s = String(raw);
    if (/^-?\d+(\.\d+)?$/.test(s)) return trimTrailingZeros(s);
    return s;
  }

  if (typeof raw === "object" && "formatted" in raw) {
    return formatTokenAmount((raw as any).formatted);
  }

  if (typeof raw === "object" && "value" in raw && "decimals" in raw) {
    try {
      const v = BigInt((raw as any).value);
      const d = Number((raw as any).decimals);
      if (!Number.isFinite(d) || d < 0 || d > 36)
        return String((raw as any).value ?? "");
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

  return "";
}

/**
 * ✅ viewport(window) 기준으로, 좌/우 하단에서 동시에 안쪽(약 45도)으로
 * 더 풍성하고 더 높게 터지는 confetti
 */
function fireCornerConfettiRich() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const myConfetti = confetti.create(canvas, {
    resize: true,
    useWorker: true,
  });

  const common = {
    spread: 78,
    startVelocity: 70, // ✅ 더 높게(초기 속도↑)
    ticks: 320, // ✅ 더 오래 날아가게
    gravity: 0.8, // ✅ 조금 더 높게 유지
    decay: 0.92, // ✅ 속도 감쇠 완만
    scalar: 1.1, // ✅ 약간 더 큼(풍성)
  };

  const shootBothSides = (particleCount: number) => {
    // ✅ 왼쪽/오른쪽 "동시에" (같은 tick 안에서 2번 호출)
    myConfetti({
      ...common,
      particleCount,
      angle: 55, // 왼쪽 아래 -> 오른쪽 위
      origin: { x: 0.03, y: 0.98 },
    });
    myConfetti({
      ...common,
      particleCount,
      angle: 125, // 오른쪽 아래 -> 왼쪽 위
      origin: { x: 0.97, y: 0.98 },
    });
  };

  // ✅ 더 풍성하게: 짧은 간격으로 3연발 (각 연발은 좌/우 동시)
  shootBothSides(160);
  window.setTimeout(() => shootBothSides(140), 120);
  window.setTimeout(() => shootBothSides(120), 240);

  // cleanup
  window.setTimeout(() => {
    try {
      myConfetti.reset();
    } finally {
      canvas.remove();
    }
  }, 4500);
}

function AddToWallet(props: { token?: IToken }) {
  const chainId = useChainId();
  const { watchAsset, data, isPending, isError } = useWatchAsset();
  const [isRequested, setIsRequested] = useState(false);
  const { token } = props;

  const address = useMemo(
    () => token?.addresses[chainId],
    [chainId, token?.addresses]
  );

  useEffect(() => setIsRequested(false), [token]);

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
              address,
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

  // ✅ 커스텀 info 노드 선택 (PAY/ENTER에서 쓰는 핵심)
  const customInfoNode = useMemo(() => {
    const p = props.transactionProps;
    if (!p) return null;

    if (
      transactionStatus === TransactionStatus.CONFIRM_NEEDED ||
      transactionStatus === TransactionStatus.PENDING
    ) {
      return p.onSubmittedInfo ?? null;
    }

    if (transactionStatus === TransactionStatus.SUCCESS) {
      return p.onConfirmedInfo ?? null;
    }

    return null;
  }, [props.transactionProps, transactionStatus]);

  // ✅ SUCCESS + fireConfetti + swapBenchmarkInfo 있을 때: viewport 기준 좌/우 동시 풍성 confetti
  useEffect(() => {
    const p: any = props.transactionProps;
    if (
      transactionStatus === TransactionStatus.SUCCESS &&
      p?.fireConfetti &&
      p?.swapBenchmarkInfo &&
      !didConfettiRef.current
    ) {
      didConfettiRef.current = true;
      fireCornerConfettiRich();
    }
  }, [transactionStatus, props.transactionProps]);

  const hasBenchmark =
    transactionStatus === TransactionStatus.SUCCESS &&
    (props.transactionProps as any)?.swapBenchmarkInfo;

  const benchmarkBlock = useMemo(() => {
    const p: any = props.transactionProps;
    if (!hasBenchmark || !p) return null;

    const info = p.swapBenchmarkInfo;

    const fromToken = p.input?.token;
    const fromAmountRaw = p.input?.amount;
    const fromAmount = formatTokenAmount(fromAmountRaw);
    const fromSymbol = fromToken?.symbol ?? "";
    const fromLogo = fromToken?.iconSrc;

    const toToken = p.output?.token;
    const toSymbol = toToken?.symbol ?? "";
    const toLogo = toToken?.iconSrc;

    const profitUsd = formatTokenAmount(info.profitUsd);
    const actualOut = formatTokenAmount(info.actualOut);
    const benchmarkOut = formatTokenAmount(info.benchmarkOutAfterFee);

    return (
      <div className="w-full rounded-2xl border border-default-200 dark:border-default-100 bg-background p-4 text-foreground shadow-sm">
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

        <div className="mt-4 rounded-xl p-3 text-base bg-default-100 dark:bg-dark-popup-bg">
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
              className="flex flex-col items-center gap-4 pt-6 w-full"
            >
              {/* ✅ benchmark가 있을 땐 message 숨김 */}
              {!hasBenchmark && message ? (
                <h1 className="text-xl font-semibold text-foreground">
                  {message}
                </h1>
              ) : null}

              {/* ✅ 우선순위: (1) Swap benchmark (2) PAY/ENTER custom node (3) 기존 TransactionProgressInfo */}
              {benchmarkBlock}

              {!hasBenchmark && customInfoNode && (
                <div className="w-full">{customInfoNode}</div>
              )}

              {!hasBenchmark && !customInfoNode && (
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
            <ThemedButton variant="MINT" onClick={props.onClose}>
              Close
            </ThemedButton>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
