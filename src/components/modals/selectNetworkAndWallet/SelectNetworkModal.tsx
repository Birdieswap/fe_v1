"use client";

import "./SelectNetworkMenu.css";

import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useContext, useRef, useEffect } from "react";

import ModalBase from "@/components/atoms/ModalBase";
import { WalletContext } from "@/app/WalletContextProvider";

import { NetworkIcon, SelectNetworkListBox } from "./SelectNetworkMenu";

export default function SelectNetworkModal() {
  const {
    selectedNetwork,
    networks,
    isNetworkModalOpen,
    setIsNetworkModalOpen,
  } = useContext(WalletContext);

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
        className="sm:hidden h-8 w-8 min-w-8 rounded-full p-0"
        radius="full"
        size="sm"
        variant="light"
        onPress={() => setIsNetworkModalOpen(true)}
      >
        {selectedNetwork ? (
          <div className="flex items-center justify-center h-6 w-6 rounded-full p-0 border-1 bg-white border-default-300 dark:border-default-700">
            <NetworkIcon network={selectedNetwork} />
          </div>
        ) : (
          <span>Select Network</span>
        )}
      </Button>
      <ModalBase
        hideCloseButton
        portalContainer={
          typeof window !== "undefined" ? document.body : undefined
        }
        className="sm:hidden"
        //  모바일 최적화 설정
        // iOS 16: backdrop blur 제거 + 컨테이너 고정 높이 + 외부 스크롤 금지
        classNames={{
          backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
          wrapper: "items-end justify-center",
          base: "m-0 max-h-[65vh] overflow-hidden",
          body: "p-0 h-full flex flex-col",
        }}
        isOpen={isOpen}
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
        placement="bottom"
        scrollBehavior="inside"
        size="lg"
        onClose={() => {
          if (isOpen) setIsNetworkModalOpen(false);
        }}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-[18px]">
            <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
              Select a network
            </p>
          </ModalHeader>
          <ModalBody className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              <SelectNetworkListBox
                networks={networks}
                onClose={() => setIsNetworkModalOpen(false)}
              />
              <div className="h-4" />
            </div>
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
