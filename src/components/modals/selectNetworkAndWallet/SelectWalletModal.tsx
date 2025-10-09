"use client";

import "./SelectNetworkMenu.css";

import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useContext, useMemo, useRef } from "react";

import ModalBase from "@/components/atoms/ModalBase";
import Icons from "@/assets/icons/icons";
import { WalletContext } from "@/app/WalletContextProvider";
import { walletProviders } from "@/const/wallets";

import { SelectWalletHelp, SelectWalletListBox } from "./SelectWalletMenu";

//ios16 white screen issue
function useIsIOS16() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPhone + iOS 16.x 탐지 (간단 버전)
  return /iPhone/.test(ua) && /OS 16_/.test(ua);
}

export default function SelectWalletModal() {
  const { isConnectModalOpen, setIsConnectModalOpen } =
    useContext(WalletContext);

  const isIOS16 = useIsIOS16();

  const modalRef = useRef<HTMLButtonElement>(null);

  const isOpen = isConnectModalOpen;
  // useMemo(() => {
  //   return isConnectModalOpen && (modalRef.current?.checkVisibility() ?? false);
  // }, [isConnectModalOpen, modalRef]);

  return (
    <Fragment>
      <Button
        ref={modalRef}
        className="connect-btn"
        onPress={() => setIsConnectModalOpen(true)}
      >
        <Icons.Wallet className="stroke-background" />
        {/* <span>Connect Wallet</span> */}
      </Button>
      <ModalBase
        hideCloseButton
        className="sm:hidden"
        isOpen={isOpen}
        scrollBehavior="inside"
        // iOS 16 화이트스크린 회피: backdrop blur 제거 + opacity 위주 애니메이션
        classNames={{
          backdrop: "bg-black/70 backdrop-blur-none",
          base: "m-0 h-[60vh] overflow-hidden", // 바깥 스크롤 금지 + 고정 높이
          body: "p-0 h-full flex flex-col", // 전체 높이 채우기
        }}
        motionProps={{
          variants: isIOS16
            ? {
                enter: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.2, ease: "easeOut" },
                },
                exit: {
                  opacity: 0,
                  y: 0,
                  transition: { duration: 0.2, ease: "easeIn" },
                },
              }
            : {
                // iOS 외엔 기존 y 슬라이드 써도 OK (필요 없으면 동일하게 opacity만)
                enter: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3, ease: "easeOut" },
                },
                exit: {
                  opacity: 0,
                  y: "6%",
                  transition: { duration: 0.25, ease: "easeIn" },
                },
              },
        }}
        onClose={() => {
          if (isOpen) setIsConnectModalOpen(false);
        }}
      >
        <ModalContent className="h-full overflow-hidden">
          <ModalHeader className="px-6 py-[18px]">
            <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
              Connect a wallet
            </p>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] p-0 pb-6 overflow-y-auto [-webkit-overflow-scrolling:touch]">
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
