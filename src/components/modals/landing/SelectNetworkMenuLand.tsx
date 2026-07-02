"use client";

import "../selectNetworkAndWallet/SelectNetworkMenu.css";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Image,
} from "@heroui/react";
import clsx from "clsx";
import { useTheme } from "next-themes";
import type { NetworkInfo } from "@/types/NetworkInfo";
import { useLandingNetwork } from "@/app/(landing)/LandingNetworkProvider";

export function NetworkIcon({ network }: { network: NetworkInfo }) {
  const { resolvedTheme } = useTheme();
  const isBase = network?.name?.toLowerCase() === "base";
  const iconSrc =
    resolvedTheme === "dark" && network.iconSrcDark
      ? network.iconSrcDark
      : network.iconSrc;

  return (
    <div className="size-6 rounded-full">
      {iconSrc ? (
        <Image
          alt={network.name}
          className={clsx(
            "size-full",
            isBase ? "rounded-none" : "rounded-full"
          )}
          height={24}
          src={iconSrc}
          width={24}
        />
      ) : (
        <div className="size-6 rounded-full bg-default-300 dark:bg-white" />
      )}
    </div>
  );
}

export default function SelectNetworkMenuLand() {
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
    <Popover
      className="max-sm:hidden"
      isOpen={isOpen}
      offset={12}
      onOpenChange={(v) => setIsOpen(!!v)}
      portalContainer={
        typeof window !== "undefined" ? document.body : undefined
      }
      classNames={{ content: "z-[1000]" }}
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          radius={isBase ? "none" : "full"}
          className={clsx(
            "h-8 w-8 min-w-8 p-0",
            isBase ? "rounded-none" : "rounded-full"
          )}
        >
          {selectedNetwork ? (
            <div
              className={clsx(
                "flex items-center justify-center h-6 w-6 p-0 border-1 bg-white border-default-300 dark:border-default-200",
                isBase ? "rounded-none" : "rounded-full"
              )}
            >
              <NetworkIcon network={selectedNetwork} />
            </div>
          ) : (
            <span>Select Network</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="gap-4 border-default-200 bg-background p-4 dark:border-1 dark:border-default-100 dark:bg-dark-popup-bg">
        <p className="w-full text-[16px] font-medium leading-[19px] text-foreground">
          Select a network
        </p>

        <div className="flex flex-col gap-0 p-0">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
