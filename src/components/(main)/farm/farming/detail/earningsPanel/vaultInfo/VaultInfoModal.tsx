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
import { Fragment } from "react";

import { Vault } from "@/types/FarmListTableRowProps";
import ModalBase from "@/components/atoms/ModalBase";
import Icons from "@/assets/icons/icons";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import ThemedButton from "@/components/atoms/ThemedButton";

import VaultInfoIcon from "./vaultInfoIcon.svg";
import VaultChatBubble from "./vaultChatBubble.svg";
import { VaultRowItem } from "../../EarningsPanel";

export default function VaultInfoModal({
  item,
  disclosure,
}: {
  item: VaultRowItem;
  disclosure: ReturnType<typeof useDisclosure>;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = disclosure;

  return (
    <Fragment>
      {/* <Tooltip
        classNames={{
          base: "max-w-64 group mt-2.5",
          content: "bg-default-200 text-xs text-white px-3 py-2.5",
        }}
        content={
          <p>
            <VaultChatBubble className="absolute -left-2 top-px size-4" />
            {item.details.summary}
          </p>
        }
        offset={2}
        placement="right-start"
        showArrow={false}
      >
        <Button
          isIconOnly
          className={clsx(
            "w-6 min-w-6",
            "h-6 min-h-6",
            "flex items-center justify-center",
            "data-[hover=true]:bg-background data-[hover=true]:opacity-100"
          )}
          variant="light"
          onPress={onOpen}
        >
          <Icons.Info
            className={clsx(
              "fill-default-500 group-hover:fill-default-700",
              "dark:fill-default-800 dark:group-hover:fill-default-600",
              "transition-[fill]"
            )}
            fillRule="evenodd"
          />
        </Button>
      </Tooltip> */}
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
          <ModalHeader className="px-0 pb-4 pt-2">
            <div className="flex flex-row items-center gap-1">
              <VaultInfoIcon className="[&>path]:themed-fill-primary" />
              <div className="flex flex-col gap-1">
                <h1 className="text-sm font-semibold text-foreground">
                  {/* {item.details.title} */}
                </h1>
                <p className="text-sm font-normal text-default-600">
                  {/* {item.details.subtitle} */}
                </p>
              </div>
            </div>
          </ModalHeader>
          <Divider />
          <ModalBody className="px-0 py-6">
            <div className="flex flex-col gap-4 break-all">
              <div className="flex flex-col gap-1.5 text-sm">
                <h2 className="text-sm text-foreground">
                  <span className="font-medium">Underlying protocol: </span>
                  <span className="font-normal">
                    {/* {item.details.underlyingProtocolName} */}
                  </span>
                </h2>
                {/* {typeof item.details.underlyingProtocolInfo === "string" && (
                  <Link
                    className="text-xs text-foreground underline transition-colors hover:text-default-800"
                    href={item.details.underlyingProtocolInfo}
                  >
                    <p>{item.details.underlyingProtocolInfo}</p>
                  </Link>
                )}
                {typeof item.details.underlyingProtocolInfo === "object" && (
                  <div className="flex flex-col gap-0 pt-2.5 font-normal text-foreground">
                    <h2 className="pb-0.5 text-[13px]">
                      Reward Token:{" "}
                      {item.details.underlyingProtocolInfo.rewardToken}
                    </h2>
                    <Link
                      className="pb-2 text-xs transition-colors hover:text-default-800"
                      href={`https://etherscan.io/address/${item.details.underlyingProtocolInfo.rewardTokenContract}#code`}
                    >
                      {item.details.underlyingProtocolInfo.rewardTokenContract}
                    </Link>
                    <h2 className="text-[13px]">
                      Reward APR:{" "}
                      {item.details.underlyingProtocolInfo.rewardAPR}
                    </h2>
                  </div>
                )} */}
              </div>
              <div className="flex flex-col gap-1.5">
                {/* <h2 className="text-sm font-medium text-foreground">
                  Crypttempo Vault Contract:
                </h2>
                <Link
                  className="text-xs text-foreground transition-colors hover:text-default-800"
                  href={`https://etherscan.io/address/${item.details.vaultContract}#code`}
                >
                  <p>{item.details.vaultContract}</p>
                </Link>
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-sm font-medium text-foreground">
                  Crypttempo Receipt Token:
                </h2>
                <Link
                  className="text-xs text-foreground transition-colors hover:text-default-800"
                  href={`https://etherscan.io/token/${item.details.receiptToken}`}
                >
                  <p>{item.details.receiptToken}</p>
                </Link> */}
              </div>
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
