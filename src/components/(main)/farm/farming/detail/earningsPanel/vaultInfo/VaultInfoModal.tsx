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

export default function VaultInfoModal({
  item,
  disclosure,
}: {
  item: VaultRowItem;
  disclosure: ReturnType<typeof useDisclosure>;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = disclosure;
  console.log("VaultInfoModal!!!!", item);

  const chainId = useChainId();
  const explorerURL = getBlockExplorerUrl(chainId);
  const src = item.aprSource;
  const timeAgoText = useMemo(() => {
    const ts = src?.last_harvest;
    if (ts == null) return;
    return getTimeAgoLinux(String(ts));
  }, [src?.last_harvest]);

  console.log("VaultInfoModal timeAgo", timeAgoText);
  return (
    <Fragment>
      <ModalBase
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="p-6"
        classNames={{
          wrapper: "items-end sm:items-center",
        }}
        closeButton={<ModalCloseButton />}
        scrollBehavior="outside"
      >
        <ModalContent>
          <ModalHeader className="px-0 pb-3">
            <div className="flex flex-row items-center gap-1">
              <VaultInfoIcon className="[&>path]:themed-fill-primary" />
              <div className="flex flex-col gap-1 pl-1">
                <h1 className="text-sm font-semibold text-foreground">
                  {src.type === "single"
                    ? "Single token vault information"
                    : src.type === "dual"
                    ? "Pair token vault information"
                    : "Reward token vault information"}
                </h1>
                <p className="text-sm font-normal text-default-600">
                  {src.name}
                </p>
                {src.last_harvest && (
                  <p className="text-sm font-normal text-default-200">
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
                    {src.underlying_protocol_text}
                  </span>
                </h2>
                {typeof src.underlying_protocol_url === "string" && (
                  <Link
                    className="text-xs text-default-400 underline transition-colors hover:text-default-800"
                    href={src.underlying_protocol_url}
                    target="_blank"
                  >
                    <p>{src.underlying_protocol_url}</p>
                  </Link>
                )}
              </div>
              {"single_vault_contract" in src &&
              "single_strategy_contract" in src ? (
                <div>
                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Single token vault contract :
                    </h2>
                    <Link
                      className="text-xs text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.single_vault_contract}`}
                      target="_blank"
                    >
                      <p>{src.single_vault_contract}</p>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Single token strategy contract :
                    </h2>
                    <Link
                      className="text-xs text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.single_strategy_contract}#code`}
                      target="_blank"
                    >
                      <p>{src.single_strategy_contract}</p>
                    </Link>
                  </div>
                </div>
              ) : "dual_vault_contract" in src &&
                "dual_strategy_contract" in src ? (
                <div>
                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Pair token vault contract :
                    </h2>
                    <Link
                      className="text-xs text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.dual_vault_contract}`}
                      target="_blank"
                    >
                      <p>{src.dual_vault_contract}</p>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-2.5 pb-2">
                    <h2 className="text-sm font-medium text-foreground">
                      Pair token strategy contract :
                    </h2>
                    <Link
                      className="text-xs text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.dual_strategy_contract}#code`}
                      target="_blank"
                    >
                      <p>{src.dual_strategy_contract}</p>
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
                      className="text-xs text-default-400 transition-colors hover:text-default-800"
                      href={`${explorerURL}/address/${src.dual_vault_contract}`}
                      target="_blank"
                    >
                      <p>{src.dual_vault_contract}</p>
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
