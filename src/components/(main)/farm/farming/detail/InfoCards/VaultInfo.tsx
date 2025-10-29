import clsx from "clsx";
import { useDisclosure } from "@heroui/react";

import { AprVault, StakeVault } from "@/app/AssetsContextProvider";

import VaultInfoModal from "./vaultInfo/VaultInfoModal";
import Icons from "@/assets/icons/icons";
import { useCallback, useRef } from "react";
type PeriodKey = "apr1d" | "apr7d" | "apr30d";

export type VaultRowItem = {
  kind: "vault" | "staking";
  name: string;
  rawName: string;
  apy: number;
  aprSource: AprVault | StakeVault;
};

export default function VaultInfo({
  item,
  periodKey,
  onOpenModal,
}: {
  item: VaultRowItem;
  periodKey: PeriodKey;
  onOpenModal?: (item: VaultRowItem) => void;
}) {
  const disclosure = useDisclosure();
  const justClosedAtRef = useRef(0); // [ADD] 닫힘 시각 저장

  const handleOpen = useCallback(() => {
    // [ADD] 안전 오픈(쿨다운 250ms)
    if (Date.now() - justClosedAtRef.current < 250) return;
    disclosure.onOpen();
  }, [disclosure]);
  return (
    <div
      className="group flex w-full cursor-pointer flex-row items-center gap-1.5"
      // onClick={() => disclosure.onOpen()}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          // disclosure.onOpen();
          handleOpen();
        }
      }}
    >
      <div className="flex w-full flex-row items-center gap-0.5">
        <p
          className={clsx(
            "font-medium text-default-800",
            "group-hover:text-foreground",
            "dark:text-default-700 group-hover:dark:text-default-500",
            "transition-colors"
          )}
        >
          {item.name}
        </p>
        <Icons.Info
          className={clsx(
            "fill-default-500 group-hover:fill-default-700",
            "dark:fill-default-800 dark:group-hover:fill-default-600",
            "transition-[fill]"
          )}
          fillRule="evenodd"
        />
        <VaultInfoModal
          disclosure={disclosure}
          item={item}
          onJustClosed={() => {
            justClosedAtRef.current = Date.now();
          }}
        />
      </div>
      <div className="grow" />
      <p className="whitespace-nowrap font-normal">
        {item.apy.toFixed(2)}% APR
      </p>
    </div>
  );
}
