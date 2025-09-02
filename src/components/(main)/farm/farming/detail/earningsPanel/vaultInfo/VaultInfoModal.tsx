import {
  Button,
  Divider,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import clsx from "clsx";
import Link from "next/link";
import { Fragment, useMemo } from "react";

import { Vault } from "@/types/FarmListTableRowProps";
import ModalBase from "@/components/atoms/ModalBase";
import Icons from "@/assets/icons/icons";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

import VaultInfoIcon from "./vaultInfoIcon.svg";
import { VaultRowItem } from "../../EarningsPanel";
import { useChainId } from "wagmi";
import { getBlockExplorerUrl } from "@/utils/farm/getBlockExplorerURL";
import { getTimeAgoLinux } from "@/utils/farm/getTimeAgoLinux";

const toNum = (v: unknown) => {
  const n = typeof v === "bigint" ? Number(v) : Number(v ?? NaN);
  return Number.isFinite(n) ? n : NaN;
};

export default function VaultInfoModal({
  item,
  disclosure,
  onJustClosed,
}: {
  item: VaultRowItem;
  disclosure: ReturnType<typeof useDisclosure>;
  onJustClosed?: () => void;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = disclosure;

  const chainId = useChainId();
  const explorerURL = getBlockExplorerUrl(chainId);
  const src = item.aprSource;
  const lastHarvestSec = useMemo(
    () => toNum(src?.lastHarvest),
    [src?.lastHarvest]
  );

  const timeAgoText = useMemo(() => {
    if (!Number.isFinite(lastHarvestSec) || lastHarvestSec <= 0) return;
    return getTimeAgoLinux(String(lastHarvestSec));
  }, [lastHarvestSec]);

  const handleOpenChange = () => {
    // [ADD]
    if (!open) onJustClosed?.();
    onOpenChange();
  };

  return (
    <Fragment>
      <ModalBase
        isOpen={isOpen}
        onOpenChange={handleOpenChange} // [UNCHANGED] 인자 없이 그대로
        onClose={() => {
          // [ADD] 닫힐 때 부모에게 알림
          onJustClosed?.();
          onClose(); // disclosure의 onClose 호출
        }}
        className="p-6"
        classNames={{
          wrapper: "items-end sm:items-center",
        }}
        closeButton={<ModalCloseButton />}
        scrollBehavior="outside"
        isDismissable
      >
        <ModalContent>
          <ModalHeader className="px-0 pb-3">
            <div className="flex flex-row items-center gap-1">
              <VaultInfoIcon className="[&>path]:themed-fill-primary" />
              <div className="flex flex-col gap-1 pl-1">
                <h1 className="text-sm font-semibold text-foreground">
                  {src.type === "single"
                    ? "Farming information"
                    : src.type === "dual"
                    ? "Pair token vault information"
                    : "Farming information"}
                </h1>
                <p className="text-sm font-normal text-default-800">
                  {src.name}
                </p>
                {lastHarvestSec > 0 && timeAgoText && (
                  <p className="text-sm font-normal text-default-500 dark:text-default-300">
                    {`Harvested ${timeAgoText} ago`}
                  </p>
                )}
              </div>
            </div>
          </ModalHeader>
          <Divider />
          <ModalBody className="px-0 py-3">
            {src.notice && (
              <h2 className="text-sm text-foreground">
                <span className="font-medium">{src.notice}</span>
                <div className="pb-3"></div>
                <Divider />
              </h2>
            )}
            <div className="flex flex-col gap-4 break-all">
              <div className="flex flex-col gap-1.5 text-sm">
                <h2 className="text-sm text-foreground">
                  <span className="font-medium">Underlying protocol: </span>
                  <span className="font-normal">
                    {src.underlyingProtocolText}
                  </span>
                </h2>
                {typeof src.underlyingProtocolUrl === "string" && (
                  <Link
                    className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 underline transition-colors hover:text-default-800"
                    href={src.underlyingProtocolUrl}
                    target="_blank"
                  >
                    <p>{src.underlyingProtocolUrl}</p>
                  </Link>
                )}
              </div>
              {"singleVaultContract" in src &&
              "singleStrategyContract" in src ? (
                <div>
                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Vault contract :
                    </h2>
                    <Link
                      className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.singleVaultContract}`}
                      target="_blank"
                    >
                      <p>{src.singleVaultContract}</p>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Strategy contract :
                    </h2>
                    <Link
                      className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.singleStrategyContract}#code`}
                      target="_blank"
                    >
                      <p>{src.singleStrategyContract}</p>
                    </Link>
                  </div>
                </div>
              ) : "dualVaultContract" in src &&
                "dualStrategyContract" in src ? (
                <div>
                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Vault contract :
                    </h2>
                    <Link
                      className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.dualVaultContract}`}
                      target="_blank"
                    >
                      <p>{src.dualVaultContract}</p>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Strategy contract :
                    </h2>
                    <Link
                      className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.dualStrategyContract}#code`}
                      target="_blank"
                    >
                      <p>{src.dualStrategyContract}</p>
                    </Link>
                  </div>
                </div>
              ) : (
                // ── ③ REWARD (컨트랙트 정보 없을 수 있음) ───────────────
                <div>
                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Reward token contract :
                    </h2>
                    <Link
                      className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.dualVaultContract}`}
                      target="_blank"
                    >
                      <p>{src.dualVaultContract}</p>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="p-0">
            <ThemedButton variant="MINT" onPress={onClose}>
              Close
            </ThemedButton>
          </ModalFooter>
        </ModalContent>
      </ModalBase>
    </Fragment>
  );
}
