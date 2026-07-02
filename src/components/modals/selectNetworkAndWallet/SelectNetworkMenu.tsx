"use client";

import "./SelectNetworkMenu.css";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Image,
} from "@heroui/react";
import { useContext, useRef } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { useTheme } from "next-themes";

import { NetworkInfo } from "@/types/NetworkInfo";
import { WalletContext } from "@/app/WalletContextProvider";
import clsx from "clsx";

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
            isBase ? "rounded-none" : "rounded-full",
          )}
          height={24}
          src={iconSrc}
          width={24}
        />
      ) : (
        <div className="size-6 rounded-full bg-default-300" /> // dark:bg-white
      )}
    </div>
  );
}

export function SelectNetworkListBox(props: {
  networks: NetworkInfo[];
  onClose: () => void;
}) {
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  return (
    <div className="flex flex-col gap-0 p-0">
      {props.networks.map((network) => (
        <Button
          key={network.id}
          className="select-network-list-item min-w-[172px]"
          data-disabled={network.id === chainId}
          data-selected={network.id === chainId}
          disabled={network.id === chainId}
          startContent={<NetworkIcon network={network} />}
          onPress={() => {
            switchChain(
              {
                chainId: network.id,
              },
              {
                onSettled: () => {
                  props.onClose();
                },
              },
            );
          }}
        >
          <span className="select-network-list-item-title">{network.name}</span>
        </Button>
      ))}
    </div>
  );
}

export default function SelectNetworkMenu() {
  const {
    selectedNetwork,
    networks,
    isNetworkModalOpen,
    setIsNetworkModalOpen,
  } = useContext(WalletContext);

  const popoverRef = useRef<HTMLDivElement>(null);

  const isOpen = isNetworkModalOpen;
  const isBase = selectedNetwork?.name?.toLowerCase() === "base";

  return (
    <Popover
      className="max-sm:hidden"
      isOpen={isOpen}
      offset={12}
      onOpenChange={(v) => setIsNetworkModalOpen(!!v)}
      // 항상 body 포털 사용 (z-index/overflow 영향 제거)
      portalContainer={
        typeof window !== "undefined" ? document.body : undefined
      }
      // 가려짐 방지를 위한 z-index 보정
      classNames={{ content: "z-[1000]" }}
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          // ✅ base면 radius none, 아니면 full
          radius={isBase ? "none" : "full"}
          // ✅ base면 rounded-full 제거 (또는 rounded-none으로 명시)
          className={clsx(
            "h-8 w-8 min-w-8 p-0",
            isBase ? "rounded-none" : "rounded-full",
          )}
        >
          {selectedNetwork ? (
            <div
              className={clsx(
                "flex items-center justify-center h-6 w-6 p-0 border-1 bg-white border-default-300 dark:border-default-200",
                // 아이콘 컨테이너도 같이 각지게 하려면 이것도 조건 처리
                isBase ? "rounded-none" : "rounded-full",
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
        <SelectNetworkListBox
          networks={networks}
          onClose={() => setIsNetworkModalOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
