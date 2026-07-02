"use client";

import "../selectNetworkAndWallet/SelectNetworkMenu.css";
import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import type { NetworkInfo } from "@/types/NetworkInfo";
import { useLandingNetwork } from "@/app/(landing)/LandingNetworkProvider";
import { NetworkIcon } from "./SelectNetworkMenuLand";

// ✅ 케이스 주의 (Vercel에서 중요)

export default function SelectNetworkModalLand() {
  const {
    networks,
    selectedNetwork,
    selectedChainId,
    setSelectedChainId,
    isOpen,
    setIsOpen,
  } = useLandingNetwork();

  const modalRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement>();
  const isBase = selectedNetwork?.name?.toLowerCase() === "base";

  // (선택) 데스크탑 전환 시 닫기 – app 모달과 동일한 UX
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && isOpen) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  return (
    <Fragment>
      <Button
        ref={modalRef}
        isIconOnly
        radius={isBase ? "none" : "full"}
        className={clsx(
          "h-8 w-8 min-w-8 p-0",
          isBase ? "rounded-none" : "rounded-full"
        )}
        size="sm"
        variant="light"
        onPress={() => setIsOpen(true)}
      >
        {selectedNetwork ? (
          <div
            suppressHydrationWarning
            className={clsx(
              "flex items-center justify-center h-6 w-6 p-0 border-1 border-default-300 dark:border-default-200",
              isBase ? "rounded-none" : "rounded-full"
            )}
          >
            <NetworkIcon network={selectedNetwork as NetworkInfo} />
          </div>
        ) : (
          <span>Select Network</span>
        )}
      </Button>

      <ModalBase
        hideCloseButton
        portalContainer={portalContainer}
        className="sm:hidden"
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
        onClose={() => setIsOpen(false)}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-[18px]">
            <p className="w-full text-[14px] font-medium leading-[20px] text-default-800 dark:text-foreground">
              Select a network
            </p>
          </ModalHeader>

          <ModalBody className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              {networks.map((network) => (
                <Button
                  key={network.id}
                  // ✅ 핵심: 행 전체 폭으로 늘려서 app처럼 보이게
                  fullWidth
                  className="select-network-list-item w-full"
                  disabled={network.id === selectedChainId}
                  data-disabled={network.id === selectedChainId}
                  data-selected={network.id === selectedChainId}
                  startContent={<NetworkIcon network={network} />}
                  onPress={() => {
                    setSelectedChainId(network.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="select-network-list-item-title">
                    {network.name}
                  </span>
                </Button>
              ))}
              <div className="h-4" />
            </div>
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
