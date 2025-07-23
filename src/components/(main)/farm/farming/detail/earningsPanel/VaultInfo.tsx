import clsx from "clsx";
import { useDisclosure } from "@heroui/react";

import { Vault } from "@/types/FarmListTableRowProps";

import VaultInfoModal from "./vaultInfo/VaultInfoModal";

export default function VaultInfo({ item }: { item: Vault }) {
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
            "transition-colors",
          )}
        >
          {item.name}
        </p>
        <VaultInfoModal disclosure={disclosure} item={item} />
      </div>
      <div className="grow" />
      <p className="whitespace-nowrap font-normal">
        {item.apy.toFixed(2)}% APY
      </p>
    </div>
  );
}
