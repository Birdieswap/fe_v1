"use client";

import "./SelectNetworkMenu.css";

import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useContext, useMemo, useRef } from "react";

import ModalBase from "@/components/atoms/ModalBase";
import Icons from "@/assets/icons/icons";
import { WalletContext } from "@/app/WalletContextProvider";
import { walletProviders } from "@/const/wallets";

import { SelectWalletHelp, SelectWalletListBox } from "./SelectWalletMenu";

export default function SelectWalletModal() {
  const { isConnectModalOpen, setIsConnectModalOpen } =
    useContext(WalletContext);

  const modalRef = useRef<HTMLButtonElement>(null);

  const isOpen = useMemo(() => {
    return isConnectModalOpen && (modalRef.current?.checkVisibility() ?? false);
  }, [isConnectModalOpen, modalRef]);

  return (
    <Fragment>
      <Button
        ref={modalRef}
        className="connect-btn"
        onPress={() => setIsConnectModalOpen(true)}
      >
        <Icons.Wallet className="stroke-background" />
        <span>Connect Wallet</span>
      </Button>
      <ModalBase
        hideCloseButton
        className="sm:hidden"
        isOpen={isOpen}
        scrollBehavior="inside"
        onClose={() => {
          if (isOpen) setIsConnectModalOpen(false);
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-[18px]">
            <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
              Connect a wallet
            </p>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] gap-0 overflow-y-auto p-0 pb-6">
            <SelectWalletListBox
              providers={walletProviders}
              onClose={() => setIsConnectModalOpen(false)}
            />
            <SelectWalletHelp />
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
