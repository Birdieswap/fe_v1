"use client";

import "./settingsModal.css";

import { Button, Modal, ModalContent, useDisclosure } from "@heroui/react";
import { Fragment, useContext, useMemo, useState } from "react";

import { WalletContext } from "@/app/WalletContextProvider";

import { WalletIcon } from "../selectNetworkAndWallet/SelectWalletMenu";

import WalletPage from "./WalletPage";
import { SettingsPage } from "./SettingsPage";

export default function SettingsModal() {
  const disclosure = useDisclosure();
  const [page, setPage] = useState<"settings" | "wallet">("wallet");

  const { selectedProvider, account } = useContext(WalletContext);

  const addressDisplay = useMemo(() => {
    const address =
      account?.address ?? "0x123412341234123412341234123412341234";

    return `${address.slice(0, 6)}...${address.slice(-7)}`;
  }, [account]);

  return (
    <Fragment>
      {/* 데스크톱 전용 */}
      <div className="hidden sm:block">
        <Button
          variant="light"
          onPress={disclosure.onOpen}
          className="wallet-btn"
        >
          <WalletIcon provider={selectedProvider} />
          <span>{addressDisplay}</span>
        </Button>
      </div>

      {/* 모바일 전용 — 아이콘만 */}
      <div className="sm:hidden">
        <Button
          variant="light"
          isIconOnly
          onPress={disclosure.onOpen}
          className="h-10 w-10 min-w-10 rounded-full p-1 border-0 bg-transparent"
        >
          <WalletIcon provider={selectedProvider} />
        </Button>
      </div>

      <Modal
        hideCloseButton
        classNames={{
          wrapper: "max-sm:justify-end sm:justify-end sm:p-2",
          backdrop:
            "bg-transparent max-sm:bg-foreground/40 max-sm:dark:bg-background/50",
          base: "drawer-base sm:max-w-[406px]",
          header: "p-4",
        }}
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
      >
        <ModalContent>
          {page === "wallet" && (
            <WalletPage
              toSettings={() => {
                setPage("settings");
              }}
              onClose={disclosure.onClose}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              onBack={() => {
                setPage("wallet");
              }}
            />
          )}
        </ModalContent>
      </Modal>
    </Fragment>
  );
}
