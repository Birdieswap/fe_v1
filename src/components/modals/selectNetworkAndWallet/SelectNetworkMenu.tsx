"use client";

import "./SelectNetworkMenu.css";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Image,
} from "@heroui/react";
import { useContext, useMemo, useRef } from "react";
import { useChainId, useSwitchChain } from "wagmi";

import { NetworkInfo } from "@/types/NetworkInfo";
import { WalletContext } from "@/app/WalletContextProvider";

export function NetworkIcon({ network }: { network: NetworkInfo }) {
  return (
    <div className="size-6 rounded-full">
      {network.iconSrc ? (
        <Image
          alt={network.name}
          className="size-full rounded-full"
          height={24}
          src={network.iconSrc}
          width={24}
        />
      ) : (
        <div className="size-6 rounded-full bg-default-300 dark:bg-default-900" />
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

  /* // ⭐ 핵심 추가: 화면 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      // 모바일로 전환 시 (640px 미만) Popover 닫기
      if (window.innerWidth < 640 && isNetworkModalOpen) {
        setIsNetworkModalOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [isNetworkModalOpen, setIsNetworkModalOpen]);

  const isOpen = useMemo(() => {
    return (
      isNetworkModalOpen && (popoverRef.current?.checkVisibility() ?? false)
    );
  }, [isNetworkModalOpen, popoverRef]);
*/

  // ⭐ 핵심 수정: isOpen 계산 로직 개선
  const isOpen = useMemo(() => {
    const isVisible = popoverRef.current?.checkVisibility() ?? false;
    const result = isNetworkModalOpen && isVisible;

    // ⭐ 디버깅 로그 추가 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.log("=== SelectNetworkMenu Debug ===");
      console.log("isNetworkModalOpen:", isNetworkModalOpen);
      console.log("isVisible:", isVisible);
      console.log("Final isOpen:", result);
    }

    return result;
  }, [isNetworkModalOpen, popoverRef]);

  return (
    <Popover
      className="max-sm:hidden"
      isOpen={isOpen}
      offset={12}
      onOpenChange={(v) => {
        if (!v && isOpen) setIsNetworkModalOpen(false);
        else if (v) setIsNetworkModalOpen(true);
      }}
    >
      <PopoverTrigger>
        <Button isIconOnly radius="full" variant="light">
          {selectedNetwork ? (
            <div ref={popoverRef}>
              <NetworkIcon network={selectedNetwork} />
            </div>
          ) : (
            <span>Select Network</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="gap-4 border-default-200 bg-background p-4 dark:border-1 dark:border-default-100 dark:bg-dark_popup_bg">
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
