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
      {/* 이름 + Info 아이콘 그룹 */}
      {/* ⬅️ 왼쪽: 내용만큼만 차지 (줄바꿈 허용) */}
      <div className="inline-flex items-center gap-0.5">
        <span
          className={clsx(
            "inline whitespace-normal break-words text-[15px] max-[351px]:max-w-[138px]", // 줄바꿈 허용 + 인라인
            "font-medium text-default-800",
            "group-hover:text-foreground",
            "dark:text-default-200 group-hover:dark:text-default-500",
            "transition-colors"
          )}
        >
          {item.name}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            disclosure.onOpen();
          }}
          aria-label="Vault info"
          title="Vault info"
          className="shrink-0"
        >
          <Icons.Info
            className={clsx(
              "shrink-0 align-middle",
              "fill-default-500 group-hover:fill-default-700",
              "dark:fill-default-300 dark:group-hover:fill-default-600",
              "transition-[fill]"
            )}
            fillRule="evenodd"
          />
        </button>

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
