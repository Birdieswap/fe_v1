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

import ModalBase from "@/components/atoms/ModalBase";
import Icons from "@/assets/icons/icons";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

import VaultInfoIcon from "./vaultInfoIcon.svg";
import type { VaultRowItem } from "../../InfoCards/VaultInfo";
import { useChainId } from "wagmi";
import { getBlockExplorerUrl } from "@/utils/farm/getBlockExplorerURL";
import { getTimeAgoLinux } from "@/utils/farm/getTimeAgoLinux";

const toNum = (v: unknown) => {
  const n = typeof v === "bigint" ? Number(v) : Number(v ?? NaN);
  return Number.isFinite(n) ? n : NaN;
};

const isStakeVault = (s: any): s is {
  stakingToken: string;
  contractAddress: `0x${string}`;
  extraRewards?: { contractAddress: `0x${string}`; symbol?: string; name?: string }[];
} => s && typeof s === "object" && "stakingToken" in s;

const isAprVaultSingle = (
  s: any
): s is { singleVaultContract: string; singleStrategyContract: string } =>
  s &&
  typeof s === "object" &&
  "singleVaultContract" in s &&
  "singleStrategyContract" in s;

const isAprVaultDual = (
  s: any
): s is { dualVaultContract: string; dualStrategyContract: string } =>
  s &&
  typeof s === "object" &&
  "dualVaultContract" in s &&
  "dualStrategyContract" in s;

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

  const titleText = isStakeVault(src)
    ? "Staking information"
    : (src as any)?.type === "single" || (src as any)?.type === "dual"
      ? "Farming information"
      : "Information";

  const nameText = isStakeVault(src)
    ? `Birdieswap ${src.stakingToken} Staking`
    : ((src as any)?.name ?? "—");

  const noticeText = (src as any)?.notice as string | undefined;

  const underlyingText = isStakeVault(src)
    ? "Birdieswap"
    : (src as any)?.underlyingProtocolText;

  const underlyingUrl = isStakeVault(src)
    ? undefined
    : (src as any)?.underlyingProtocolUrl;

  const lastHarvestSec = useMemo(() => toNum((src as any)?.lastHarvest), [src]);

  const timeAgoText = useMemo(() => {
    if (!Number.isFinite(lastHarvestSec) || lastHarvestSec <= 0) return;
    return getTimeAgoLinux(String(lastHarvestSec));
  }, [lastHarvestSec]);

  const handleOpenChange = (open: boolean) => {
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
                  {titleText}
                </h1>
                <p className="text-sm font-normal text-default-800">
                  {nameText}
                </p>
                {Number.isFinite(lastHarvestSec) &&
                  lastHarvestSec > 0 &&
                  timeAgoText && (
                  <p className="text-sm font-normal text-default-500 dark:text-default-300">
                    {`Harvested ${timeAgoText} ago`}
                  </p>
                  )}
              </div>
            </div>
          </ModalHeader>
          <Divider />
          <ModalBody className="px-0 py-3">
            {noticeText && (
              <h2 className="text-sm text-foreground">
                <span className="font-medium">{noticeText}</span>
                <div className="pb-3"></div>
                <Divider />
              </h2>
            )}
            <div className="flex flex-col gap-4 break-all">
              <div className="flex flex-col gap-1.5 text-sm">
                <h2 className="text-sm text-foreground">
                  <span className="font-medium">Underlying protocol: </span>
                  <span className="font-normal">{underlyingText || "—"}</span>
                </h2>
                {typeof underlyingUrl === "string" && underlyingUrl.length > 0 && (
                  <Link
                    className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 underline transition-colors hover:text-default-800"
                    href={underlyingUrl}
                    target="_blank"
                  >
                    <p>{underlyingUrl}</p>
                  </Link>
                )}
              </div>
              {isAprVaultSingle(src) ? (
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
              ) : isAprVaultDual(src) ? (
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
              ) : isStakeVault(src) ? (
                <div>
                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Staking contract :
                    </h2>
                    <Link
                      className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.contractAddress}`}
                      target="_blank"
                    >
                      <p>{src.contractAddress}</p>
                    </Link>
                  </div>
                  {src.extraRewards?.map((er, idx) => {
                    const addr = er?.contractAddress;
                    if (!addr) return null;
                    const label = er?.symbol || er?.name || `#${idx + 1}`;

                    return (
                      <div key={addr} className="flex flex-col gap-2.5 pb-2">
                        <h2 className="text-sm font-medium text-foreground">
                          Extra reward token contract : {label}
                        </h2>
                        <Link
                          className="text-xs text-default-500 dark:text-default-200 dark:hover:text-default-400 transition-colors hover:text-default-800"
                          href={`${explorerURL}/address/${addr}`}
                          target="_blank"
                        >
                          <p>{addr}</p>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : null}
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
