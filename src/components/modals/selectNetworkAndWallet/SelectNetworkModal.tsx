"use client";

import "./SelectNetworkMenu.css";

import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useContext, useMemo, useRef, useEffect } from "react";

import ModalBase from "@/components/atoms/ModalBase";
import { WalletContext } from "@/app/WalletContextProvider";

import { NetworkIcon, SelectNetworkListBox } from "./SelectNetworkMenu";

function useIsIOS16() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone/.test(ua) && /OS 16_/.test(ua);
}

export default function SelectNetworkModal() {
  const {
    selectedNetwork,
    networks,
    isNetworkModalOpen,
    setIsNetworkModalOpen,
  } = useContext(WalletContext);

  const isIOS16 = useIsIOS16();

  const modalRef = useRef<HTMLButtonElement>(null);

  // 핵심 추가: 화면 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      // 데스크탑으로 전환 시 (640px 이상) Modal 닫기
      if (window.innerWidth >= 640 && isNetworkModalOpen) {
        setIsNetworkModalOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [isNetworkModalOpen, setIsNetworkModalOpen]);

  const isOpen = isNetworkModalOpen;
  // useMemo(() => {
  //   return isNetworkModalOpen && (modalRef.current?.checkVisibility() ?? false);
  // }, [isNetworkModalOpen, modalRef]);

  return (
    <Fragment>
      <Button
        ref={modalRef}
        isIconOnly
        className="sm:hidden"
        radius="full"
        size="sm"
        variant="light"
        onPress={() => setIsNetworkModalOpen(true)}
      >
        {selectedNetwork ? (
          <NetworkIcon network={selectedNetwork} />
        ) : (
          <span>Select Network</span>
        )}
      </Button>
      <ModalBase
        hideCloseButton
        className="sm:hidden"
        //  모바일 최적화 설정
        // iOS 16: backdrop blur 제거 + 컨테이너 고정 높이 + 외부 스크롤 금지
        classNames={{
          wrapper: "items-end justify-center",
          backdrop: "bg-black/70 backdrop-blur-none",
          base: "m-0 max-h-[60vh] overflow-hidden",
          body: "p-0 flex flex-col",
        }}
        isOpen={isOpen}
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
        placement="bottom"
        scrollBehavior="inside"
        size="lg"
        onClose={() => {
          if (isOpen) setIsNetworkModalOpen(false);
        }}
      >
        <ModalContent className="overflow-hidden">
          <ModalHeader className="px-6 py-[18px]">
            <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
              Select a network
            </p>
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto p-0 pb-6 [-webkit-overflow-scrolling:touch]">
            <SelectNetworkListBox
              networks={networks}
              onClose={() => setIsNetworkModalOpen(false)}
            />
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
