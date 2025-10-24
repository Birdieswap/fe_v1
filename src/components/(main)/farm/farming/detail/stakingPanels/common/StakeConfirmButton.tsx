"use client";

import { AnimatePresence, motion } from "framer-motion";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import StakeThemedButton, {
  ThemedButtonVariant,
  ThemedButtonProps,
} from "@/components/atoms/StakeThemedButton";
import {
  Fragment,
  useCallback,
  useContext,
  useMemo,
  PropsWithoutRef,
} from "react";
import { WalletContext } from "@/app/WalletContextProvider";

/**
 * @see SwapConfirmButton
 */
export function ButtonWithPresence(props: PropsWithoutRef<ThemedButtonProps>) {
  return (
    <motion.div key="1" {...presenceTransition} className="w-full">
      <StakeThemedButton {...props} />
    </motion.div>
  );
}
export function StakeDisabledButtons(props: {
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

export default function StakeConfirmButton({
  isConnected,
  isWrongNetwork,
  isPending,
  isDisabled,
  variant,
  onPress,
  text,
}: {
  isConnected: boolean;
  isWrongNetwork: boolean;
  isPending: boolean;
  isDisabled: boolean;
  variant?: ThemedButtonVariant;
  onPress: () => void;
  text: string;
}) {
  const isCommonDisabled = !isConnected || isWrongNetwork || isPending;

  return (
    <motion.div
      layout
      className="flex w-full flex-col items-center"
      {...defaultTransition}
    >
      <AnimatePresence initial={false}>
        {isCommonDisabled ? (
          <StakeDisabledButtons
            isConnected={isConnected}
            isPending={isPending}
            isWrongNetwork={isWrongNetwork}
            excuteText={text}
          />
        ) : (
          <StakeThemedButton
            className="flex w-full items-center"
            isDisabled={isDisabled}
            variant={variant ?? "MINT"}
            onPress={onPress}
          >
            {text}
          </StakeThemedButton>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
