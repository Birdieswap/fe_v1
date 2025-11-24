"use client";

import "./SelectNetworkMenu.css";

import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useContext, useRef } from "react";

import ModalBase from "@/components/atoms/ModalBase";
import Icons from "@/assets/icons/icons";
import { WalletContext } from "@/app/WalletContextProvider";
import { walletProviders } from "@/const/wallets";

import { SelectWalletHelp, SelectWalletListBox } from "./SelectWalletMenu";

export default function SelectWalletModal() {
  const { isConnectModalOpen, setIsConnectModalOpen } =
    useContext(WalletContext);

  const modalRef = useRef<HTMLButtonElement>(null);

  const isOpen = isConnectModalOpen;

  return (
    <Fragment>
      <Button
        ref={modalRef}
        className="connect-btn"
        onPress={() => setIsConnectModalOpen(true)}
      >
        <Icons.Wallet className="w=5 h=5 stroke-background" />
        {/* <span>Connect Wallet</span> */}
      </Button>
      <ModalBase
        portalContainer={
          typeof window !== "undefined" ? document.body : undefined
        }
        hideCloseButton
        className="sm:hidden"
        isOpen={isOpen}
        scrollBehavior="inside"
        // iOS 16 화이트스크린 회피: backdrop blur 제거 + opacity 위주 애니메이션
        classNames={{
          backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
          wrapper: "items-end justify-center",
          base: "m-0 max-h-[60vh] overflow-hidden",
          body: "p-0 h-full flex flex-col",
        }}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: { duration: 0.3, ease: "easeOut" },
            },
            exit: {
              y: "100%",
              opacity: 0,
              transition: { duration: 0.3, ease: "easeIn" },
            },
          },
        }}
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
          <ModalBody className="p-0 h-full flex flex-col">
            {/* ✅ 이 DIV만 스크롤 */}
            <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              <SelectWalletListBox
                providers={walletProviders}
                onClose={() => setIsConnectModalOpen(false)}
              />
              <SelectWalletHelp />
              <div className="h-4" />
            </div>
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
