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

  const benchmarkBlock = useMemo(() => {
    const p: any = props.transactionProps;
    if (
      transactionStatus !== TransactionStatus.SUCCESS ||
      !p?.swapBenchmarkInfo
    )
      return null;

    const info = p.swapBenchmarkInfo;
    const outSym = p?.output?.token?.symbol ?? "";

    return (
      <div className="w-full rounded-xl border border-default-200 bg-default-50 p-3 text-sm text-foreground dark:border-default-800 dark:bg-default-900/30">
        <div className="font-semibold">
          You earned an extra ${info.profitUsd}
        </div>
        <div className="mt-1 text-default-700 dark:text-default-300">
          If swapped via Uniswap (after 0.25% interface fee):{" "}
          <span className="font-medium">
            {info.benchmarkOutAfterFee} {outSym}
          </span>
        </div>
        <div className="text-default-700 dark:text-default-300">
          You received:{" "}
          <span className="font-medium">
            {info.actualOut} {outSym}
          </span>
        </div>
      </div>
    );
  }, [props.transactionProps, transactionStatus]);

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

              {/* ✅ 기본 정보(기존) */}
              <AnimatePresence initial={false}>
                {props.transactionProps &&
                  props.transactionProps.transactionStatus !==
                    TransactionStatus.FAILED &&
                  props.transactionProps.transactionStatus !==
                    TransactionStatus.CANCELED && (
                    <TransactionProgressInfo {...props.transactionProps} />
                  )}
              </AnimatePresence>

              {/* ✅ 추가 문구(이익이 $1 이상일 때만) */}
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

// "use client";

// import type { LottieRefCurrentProps } from "lottie-react";

// import { Button, ModalBody, ModalContent } from "@heroui/react";
// import { AnimatePresence, motion } from "framer-motion";
// import { useContext, useEffect, useMemo, useRef, useState } from "react";
// import Link from "next/link";
// import dynamic from "next/dynamic";
// import { useChainId, useWatchAsset } from "wagmi";

// import ThemedButton from "@/components/atoms/ThemedButton";
// import { TransactionStatusProps } from "@/app/TransactionContextProvider";
// import TransactionStatus from "@/types/TransactionStatus";
// import { WalletContext } from "@/app/WalletContextProvider";
// import { TransactionType } from "@/types/TransactionTypes";
// import { presenceTransition } from "@/const/presenceTransition";
// import { IToken } from "@/const/contracts/types/tokenTypes";

// import ModalCloseButton from "../atoms/ModalCloseButton";
// import ModalBase from "../atoms/ModalBase";

// import IconTransactionFailed from "./transactionProgress/transaction_failed.svg";
// import TransactionProgressLight from "./transactionProgress/transaction_progress_light.json";
// import TransactionProgressDark from "./transactionProgress/transaction_progress_dark.json";
// import TransactionProgressInfo from "./transactionProgress/TransactionProgressInfo";
// import IconTransactionCanceled from "./transactionProgress/transaction_canceled.svg";

// const Lottie = dynamic(
//   () => import("lottie-react").then((mod) => mod.default),
//   { ssr: false }
// );

// const transition = {
//   animate: { opacity: 1 },
//   exit: { opacity: 0 },
//   initial: { opacity: 0 },
//   transition: { duration: 0.2 },
// };

// const initialSegment: [number, number] = [0, 29];

// export type TransactionProgressModalProps = {
//   onClose: () => void;
//   isOpen: boolean;
//   transactionProps: TransactionStatusProps | null;
// };

// function AddToWallet(props: { token?: IToken }) {
//   const chainId = useChainId();
//   const { watchAsset, data, isPending, isError } = useWatchAsset();
//   const [isRequested, setIsRequested] = useState(false);
//   const { token } = props;
//   const address = useMemo(() => {
//     return token?.addresses[chainId];
//   }, [chainId, token?.addresses]);

//   useEffect(() => {
//     setIsRequested(false);
//   }, [token]);

//   const isDone = isRequested && data && !isError && !isPending;

//   return (
//     <Button
//       className="text-base font-normal data-[done=true]:pointer-events-none data-[done=true]:bg-primary data-[done=true]:text-primary-foreground"
//       data-done={isDone}
//       isDisabled={isPending}
//       size="sm"
//       variant="light"
//       onPress={() => {
//         if (address && token) {
//           setIsRequested(true);
//           watchAsset({
//             type: "ERC20",
//             options: {
//               address: address,
//               symbol: token.symbol,
//               decimals: token.decimals || 18,
//             },
//           });
//         }
//       }}
//     >
//       {isDone ? "Added to wallet!" : `Add ${token?.fullName} to wallet`}
//     </Button>
//   );
// }

// export default function TransactionProgressModal(
//   props: TransactionProgressModalProps
// ) {
//   const { selectedNetwork } = useContext(WalletContext);
//   const transactionStatus = props.transactionProps?.transactionStatus;
//   const lightAnimRef = useRef<LottieRefCurrentProps>(null);
//   const darkAnimRef = useRef<LottieRefCurrentProps>(null);
//   const [isCompleted, setIsCompleted] = useState(false);

//   useEffect(() => {
//     setIsCompleted(false);
//   }, [props.isOpen]);
//   const txHref =
//     (selectedNetwork?.blockExplorer?.url ?? "https://etherscan.io/") +
//     (props.transactionProps?.txid ? `tx/${props.transactionProps.txid}` : "");
//   const message = useMemo(() => {
//     switch (transactionStatus) {
//       case TransactionStatus.FAILED:
//         return "Transaction Failed";
//       case TransactionStatus.CANCELED:
//         return "Transaction Canceled in Wallet";
//       case TransactionStatus.SUCCESS:
//         return "Success!";
//       case TransactionStatus.PENDING:
//         return "Transaction Submitted";
//       case TransactionStatus.CONFIRM_NEEDED:
//         return "Confirm Transaction in Wallet";
//       default:
//         return "Transaction Status Unknown";
//     }
//   }, [transactionStatus]);

//   const isLinkDisabled =
//     transactionStatus === TransactionStatus.FAILED ||
//     transactionStatus === TransactionStatus.CANCELED ||
//     transactionStatus === TransactionStatus.CONFIRM_NEEDED;

//   return (
//     <ModalBase
//       closeButton={<ModalCloseButton />}
//       isOpen={props.isOpen}
//       onClose={props.onClose}
//     >
//       <ModalContent>
//         <ModalBody className="flex flex-col gap-6 p-6">
//           <motion.div layout className="flex w-full flex-col items-center">
//             <div className="relative size-[84px] pt-6">
//               <AnimatePresence initial={false}>
//                 {transactionStatus === TransactionStatus.FAILED && (
//                   <motion.div
//                     key="image_failed"
//                     className="absolute inset-0 flex flex-col items-center justify-center"
//                     {...transition}
//                   >
//                     <IconTransactionFailed />
//                   </motion.div>
//                 )}
//                 {transactionStatus === TransactionStatus.CANCELED && (
//                   <motion.div
//                     key="image_canceled"
//                     className="absolute inset-0 flex flex-col items-center justify-center"
//                     {...transition}
//                   >
//                     <IconTransactionCanceled />
//                   </motion.div>
//                 )}
//                 {(transactionStatus === TransactionStatus.CONFIRM_NEEDED ||
//                   transactionStatus === TransactionStatus.SUCCESS ||
//                   transactionStatus === TransactionStatus.PENDING) && (
//                   <motion.div
//                     key="image_pending"
//                     className="absolute inset-0 flex flex-col items-center justify-center"
//                     {...transition}
//                   >
//                     <Lottie
//                       autoPlay
//                       animationData={TransactionProgressLight}
//                       className="dark:hidden"
//                       initialSegment={initialSegment}
//                       loop={false}
//                       lottieRef={lightAnimRef}
//                       onComplete={() => {
//                         if (transactionStatus === TransactionStatus.SUCCESS) {
//                           if (!isCompleted) {
//                             lightAnimRef.current?.playSegments([85, 145], true);
//                             setIsCompleted(true);
//                           } else {
//                             lightAnimRef.current?.pause();
//                           }
//                         } else {
//                           lightAnimRef.current?.playSegments([29, 57], true);
//                         }
//                       }}
//                     />
//                     <Lottie
//                       autoPlay
//                       animationData={TransactionProgressDark}
//                       className="hidden dark:block"
//                       initialSegment={initialSegment}
//                       loop={false}
//                       lottieRef={darkAnimRef}
//                       onComplete={() => {
//                         if (transactionStatus === TransactionStatus.SUCCESS) {
//                           if (!isCompleted) {
//                             darkAnimRef.current?.playSegments([85, 145], true);
//                             setIsCompleted(true);
//                           } else {
//                             darkAnimRef.current?.pause();
//                           }
//                         } else {
//                           darkAnimRef.current?.playSegments([29, 57], true);
//                         }
//                       }}
//                     />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//             <motion.div
//               layout
//               className="flex flex-col items-center gap-6 pt-6"
//             >
//               <h1 className="text-xl font-semibold text-foreground">
//                 {message}
//               </h1>
//               <AnimatePresence initial={false}>
//                 {props.transactionProps &&
//                   props.transactionProps.transactionStatus !==
//                     TransactionStatus.FAILED &&
//                   props.transactionProps.transactionStatus !==
//                     TransactionStatus.CANCELED && (
//                     <TransactionProgressInfo {...props.transactionProps} />
//                   )}
//               </AnimatePresence>
//               <Link
//                 className={
//                   "pt-2 text-light-primary dark:text-dark-primary " +
//                   "data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-default data-[disabled=true]:text-default-500"
//                 }
//                 data-disabled={isLinkDisabled}
//                 href={txHref}
//                 target="_blank"
//                 onClick={(e) => {
//                   if (isLinkDisabled) {
//                     e.preventDefault();
//                   }
//                 }}
//               >
//                 {transactionStatus === TransactionStatus.FAILED
//                   ? "Please try again"
//                   : transactionStatus === TransactionStatus.CANCELED
//                     ? "Transaction was canceled"
//                     : transactionStatus === TransactionStatus.CONFIRM_NEEDED
//                       ? ""
//                       : "View on explorer"}
//               </Link>
//               <AnimatePresence initial={false}>
//                 {props.transactionProps?.transactionType ===
//                   TransactionType.START_FARMING &&
//                   props.transactionProps?.transactionStatus ===
//                     TransactionStatus.SUCCESS && (
//                     <motion.div {...presenceTransition}>
//                       <AddToWallet
//                         token={props.transactionProps.output.token}
//                       />
//                     </motion.div>
//                   )}
//               </AnimatePresence>
//             </motion.div>
//           </motion.div>
//           <div className="flex w-full flex-col">
//             <ThemedButton
//               variant="MINT"
//               onClick={() => {
//                 props.onClose();
//               }}
//             >
//               Close
//             </ThemedButton>
//           </div>
//         </ModalBody>
//       </ModalContent>
//     </ModalBase>
//   );
// }
