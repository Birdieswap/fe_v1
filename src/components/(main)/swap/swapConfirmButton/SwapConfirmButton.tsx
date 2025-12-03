"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Fragment,
  PropsWithoutRef,
  useCallback,
  useContext,
  useMemo,
} from "react";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import ThemedButton, {
  ThemedButtonProps,
} from "@/components/atoms/ThemedButton";
import { useSwapContext } from "@/components/(main)/swap/SwapProvider";
import { WalletContext } from "@/app/WalletContextProvider";
import { BigDecimal } from "@/types/BigDecimal";

export function ButtonWithPresence(props: PropsWithoutRef<ThemedButtonProps>) {
  return (
    <motion.div key="1" {...presenceTransition} className="w-full">
      <ThemedButton {...props} />
    </motion.div>
  );
}

export function CommonDisabledButtons(props: {
  isConnected: boolean;
  isWrongNetwork: boolean;
  isPending: boolean;
  excuteText: string;
}) {
  const { setIsConnectModalOpen, setIsNetworkModalOpen } =
    useContext(WalletContext);
  const onPress = useCallback(() => {
    if (!props.isConnected) {
      return setIsConnectModalOpen(true);
    } else if (props.isWrongNetwork) {
      return setIsNetworkModalOpen(true);
    } else if (props.isPending) {
      return;
    }
  }, [
    props.isConnected,
    props.isWrongNetwork,
    props.isPending,
    setIsConnectModalOpen,
    setIsNetworkModalOpen,
  ]);

  const isDisabled = props.isPending;
  const buttonText = useMemo(() => {
    if (props.isPending) return props.excuteText;
    if (!props.isConnected) return "Connect Wallet";
    if (props.isWrongNetwork) return "Wrong Network";

    return "";
  }, [props.isConnected, props.isWrongNetwork, props.isPending]);
  const buttonVariant = useMemo(() => {
    if (!props.isConnected) return "MINT";
    if (props.isWrongNetwork) return "PINK";

    return undefined;
  }, [props.isConnected, props.isWrongNetwork]);

  const ariaBusy: true | undefined =
    props.isPending && !buttonVariant ? true : undefined;

  return (
    <Fragment>
      <ButtonWithPresence
        fullWidth
        isDisabled={isDisabled}
        variant={buttonVariant}
        onPress={onPress}
        aria-busy={ariaBusy}
      >
        {buttonText}
      </ButtonWithPresence>
    </Fragment>
  );
}

export default function SwapConfirmButton() {
  const {
    isConnected,
    chainId,
    isPending,
    fromAmount,
    isZeroAmount,
    fromToken,
    toToken,
    fromBalance,
    swap,
    approve,
    isApproved,
    isLoadingFrom,
    isLoadingTo,
    isApprovePending,
  } = useSwapContext();
  const { setIsConnectModalOpen, setIsNetworkModalOpen } =
    useContext(WalletContext);

  const isInsufficientBalance = useMemo(() => {
    if (!fromToken) return false;

    return new BigDecimal(fromAmount, fromToken.decimals).gt(fromBalance);
  }, [fromAmount, fromToken, fromBalance]);
  const isWrongNetwork = chainId !== 11155111 && chainId !== 8453;
  const { onPress, isDisabled, buttonText, buttonVariant } = useMemo(() => {
    const isLoading =
      isLoadingFrom || isLoadingTo || isPending || isApprovePending;

    if (!isConnected) {
      return {
        onPress: () => setIsConnectModalOpen(true),
        isDisabled: false,
        buttonText: "Connect Wallet",
        buttonVariant: "MINT" as const,
      };
    } else if (isWrongNetwork) {
      return {
        onPress: () => setIsNetworkModalOpen(true),
        isDisabled: false,
        buttonText: "Wrong Network",
        buttonVariant: "PINK" as const,
      };
    } else if (!fromToken) {
      return {
        onPress: () => {},
        isDisabled: true,
        buttonText: "Select a token",
        buttonVariant: "MINT" as const,
      };
    } else if (!toToken) {
      return {
        onPress: () => {},
        isDisabled: true,
        buttonText: "Select a token",
        buttonVariant: "MINT" as const,
      };
    } else if (isZeroAmount) {
      return {
        onPress: () => {},
        isDisabled: true,
        buttonText: "Enter an amount",
        buttonVariant: "MINT" as const,
      };
    } else if (isInsufficientBalance) {
      return {
        onPress: () => {},
        isDisabled: true,
        buttonText: `Insufficient ${fromToken?.symbol} balance`,
        buttonVariant: "MINT" as const,
      };
    } else {
      return {
        onPress: swap,
        isDisabled: isLoading || !isApproved || false,
        buttonText: "Swap",
        buttonVariant: "MINT" as const,
      };
    }
  }, [
    fromToken,
    isApproved,
    isConnected,
    isInsufficientBalance,
    isLoadingFrom,
    isLoadingTo,
    isPending,
    isApprovePending,
    isWrongNetwork,
    isZeroAmount,
    setIsConnectModalOpen,
    setIsNetworkModalOpen,
    swap,
    toToken,
  ]);

  return (
    <motion.div
      layout
      className="flex w-full flex-col items-center"
      {...defaultTransition}
    >
      <AnimatePresence initial={false}>
        {isConnected && !isWrongNetwork && !isZeroAmount && !isApproved && (
          <Fragment key={"approve-button"}>
            <ButtonWithPresence
              fullWidth
              variant="MINT"
              onPress={isApprovePending ? () => {} : approve}
              isDisabled={isApprovePending}
              aria-busy={isApprovePending ? true : undefined}
            >
              {isApprovePending
                ? `Approving ${fromToken?.symbol}…`
                : `Approve ${fromToken?.symbol}`}
            </ButtonWithPresence>
            <motion.div className="h-6 w-full" {...presenceTransition} />
          </Fragment>
        )}
        <ButtonWithPresence
          key="swap-button"
          fullWidth
          isDisabled={isDisabled}
          variant={buttonVariant}
          onPress={onPress}
        >
          {buttonText}
        </ButtonWithPresence>
      </AnimatePresence>
    </motion.div>
  );
}
