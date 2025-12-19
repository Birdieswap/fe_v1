"use client";

import "../selectNetworkAndWallet/SelectNetworkMenu.css";
import { Button, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Fragment, useMemo } from "react";
import clsx from "clsx";

import ModalBase from "@/components/atoms/ModalBase";
import type { NetworkInfo } from "@/types/NetworkInfo";
import { useLandingNetwork } from "@/app/(landing)/LandingNetworkProvider";
import { NetworkIcon } from "./SelectNetworkMenuLanding";

export default function SelectNetworkModalLanding() {
  const {
    networks,
    selectedNetwork,
    selectedChainId,
    setSelectedChainId,
    isOpen,
    setIsOpen,
  } = useLandingNetwork();

  const isBase = selectedNetwork?.name?.toLowerCase() === "base";

  return (
    <Fragment>
      <Button
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
            className={clsx(
              "flex items-center justify-center h-6 w-6 p-0 border-1 bg-white border-default-300 dark:border-default-200",
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
        portalContainer={
          typeof window !== "undefined" ? document.body : undefined
        }
        className="sm:hidden"
        classNames={{
          backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
          wrapper: "items-end justify-center",
          base: "m-0 max-h-[65vh] overflow-hidden",
          body: "p-0 h-full flex flex-col",
        }}
        isOpen={isOpen}
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
                  className="select-network-list-item min-w-[172px]"
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
