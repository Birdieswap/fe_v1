import clsx from "clsx";
import { useDisclosure } from "@heroui/react";

import { Vault } from "@/types/FarmListTableRowProps";

import VaultInfoModal from "./vaultInfo/VaultInfoModal";
import { VaultRowItem } from "../EarningsPanel";
import Icons from "@/assets/icons/icons";
type PeriodKey = "apr1d" | "apr7d" | "apr30d";

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
  return (
    <div
      className="group flex w-full cursor-pointer flex-row items-center gap-1.5"
      onClick={() => disclosure.onOpen()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          disclosure.onOpen();
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
        <VaultInfoModal disclosure={disclosure} item={item} />
      </div>
      <div className="grow" />
      <p className="whitespace-nowrap font-normal">
        {item.apy.toFixed(2)}% APR
      </p>
    </div>
  );
}
