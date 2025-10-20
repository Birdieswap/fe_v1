"use client";

import type { LottieRefCurrentProps } from "lottie-react";

import { Button, ModalBody, ModalContent } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useChainId, useWatchAsset } from "wagmi";

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

const Lottie = dynamic(
  () => import("lottie-react").then((mod) => mod.default),
  { ssr: false },
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
  props: TransactionProgressModalProps,
) {
  const { selectedNetwork } = useContext(WalletContext);
  const transactionStatus = props.transactionProps?.transactionStatus;
  const lightAnimRef = useRef<LottieRefCurrentProps>(null);
  const darkAnimRef = useRef<LottieRefCurrentProps>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setIsCompleted(false);
  }, [props.isOpen]);
  const txHref =
    (selectedNetwork?.blockExplorer?.url ?? "https://etherscan.io/") +
    (props.transactionProps?.txid ? `tx/${props.transactionProps.txid}` : "");
  const message = useMemo(() => {
    switch (transactionStatus) {
      case TransactionStatus.FAILED:
        return "Transaction Failed";
      case TransactionStatus.SUCCESS:
        return "Success!";
      case TransactionStatus.PENDING:
        return "Transaction Submitted";
      case TransactionStatus.CONFIRM_NEEDED:
        return "Confirm transaction in wallet";
      default:
        return "Transaction Status Unknown";
    }
  }, [transactionStatus]);

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
              className="flex flex-col items-center gap-6 pt-6"
            >
              <h1 className="text-xl font-semibold text-foreground">
                {message}
              </h1>
              <AnimatePresence initial={false}>
                {props.transactionProps &&
                  props.transactionProps.transactionStatus !==
                    TransactionStatus.FAILED && (
                    <TransactionProgressInfo {...props.transactionProps} />
                  )}
              </AnimatePresence>
              <Link
                className={
                  "pt-2 text-light-primary data-[failed=true]:pointer-events-none data-[failed=true]:cursor-default dark:text-dark-primary"
                }
                data-failed={transactionStatus === TransactionStatus.FAILED}
                href={txHref}
                target="_blank"
                onClick={(e) => {
                  if (
                    transactionStatus === TransactionStatus.FAILED ||
                    transactionStatus === TransactionStatus.CONFIRM_NEEDED
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                {transactionStatus === TransactionStatus.FAILED
                  ? "Please try again"
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
