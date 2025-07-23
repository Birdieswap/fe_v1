"use client";

import { ModalHeader, Button, ModalBody, cn } from "@heroui/react";
import { Fragment, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { Config, UseAccountReturnType, useChains } from "wagmi";

import { WalletContext } from "@/app/WalletContextProvider";
import Icons from "@/assets/icons/icons";
import { WalletProviderInfo } from "@/types/WalletProviderInfo";
import { NetworkInfo } from "@/types/NetworkInfo";

import { WalletIcon } from "../selectNetworkAndWallet/SelectWalletMenu";

import WalletRewards from "./walletPage/WalletRewards";
import WalletTransactions from "./walletPage/WalletTransactions";
import WalletTokens from "./walletPage/WalletTokens";

function TabSelector(props: {
  selected: "extra-rewards" | "tokens" | "transaction";
  value: "extra-rewards" | "tokens" | "transaction";
  setTab: (value: "extra-rewards" | "tokens" | "transaction") => void;
  name: string;
}) {
  return (
    <Button
      className={cn(
        "group p-0 flex max-h-max min-h-min min-w-min max-w-max flex-row gap-3",
        "data-[hover=true]:bg-transparent data-[hover=true]:opacity-70",
      )}
      data-selected={props.value === props.selected}
      radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={cn(
          "text-[14px] font-semibold leading-[17px]",
          "group-data-[selected=true]:text-foreground group-data-[selected=false]:text-default-600",
          "dark:group-data-[selected=false]:text-default-400",
        )}
      >
        {props.name}
      </h2>
    </Button>
  );
}

function WalletDisplay({
  wallet,
  provider,
  network,
}: {
  wallet?: Pick<UseAccountReturnType<Config>, "address">;
  provider?: WalletProviderInfo;
  network?: NetworkInfo;
}) {
  useChains;
  const address = useMemo(() => {
    if (!wallet?.address) {
      return "0x1234...2341234";
    }

    return `${wallet.address.slice(0, 6)}...${wallet.address.slice(-7)}`;
  }, [wallet]);

  return (
    <div
      className={cn(
        "flex h-[61px] w-full rounded-xl bg-primary/10 px-4 dark:bg-dark_mid_mint max-sm:h-[104px]",
        "flex-row items-center gap-2",
        "max-sm:flex-col max-sm:gap-4 max-sm:py-4 max-sm:items-start",
      )}
    >
      <div className="flex flex-row items-center gap-2 sm:grow">
        <WalletIcon provider={provider} size="lg" />
        <div className="flex grow flex-col gap-1">
          <span className="text-[12px] font-semibold leading-[15px]">
            {provider?.name ?? "unknown"}
          </span>
          <div className="flex flex-row items-center gap-[7px]">
            <span className="text-[15px] font-semibold leading-[18px]">
              {address}
            </span>
            <Button
              isIconOnly
              className="size-[18px] min-w-[18px] max-w-[18px] rounded-[4px]"
              variant="light"
              onPress={() => {
                navigator.clipboard.writeText(wallet?.address ?? "");
              }}
            >
              <Icons.WalletCopy className="fill-foreground" />
            </Button>
          </div>
        </div>
      </div>
      <Link
        className="flex flex-row items-center gap-0.5 text-[12px] font-medium leading-[15px] max-sm:w-full max-sm:justify-end"
        href={
          (network?.blockExplorer?.url ?? "https://etherscan.io/") +
          (wallet?.address ? `address/${wallet.address}` : "")
        }
        rel="noopener noreferrer"
        target="_blank"
      >
        View on {network?.blockExplorer?.name ?? "Etherscan"}
        <Icons.WalletArrowRU className="fill-default-800 stroke-default-800 stroke-[1px] dark:fill-foreground dark:stroke-foreground" />
      </Link>
    </div>
  );
}

export default function WalletPage(props: {
  toSettings: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"extra-rewards" | "tokens" | "transaction">(
    "extra-rewards",
  );
  // const { hideSmallBalances, hideUnknownTokens } = useContext(SettingsContext);

  const { selectedProvider, account, setIsConnectModalOpen, selectedNetwork } =
    useContext(WalletContext);

  return (
    <Fragment>
      <ModalHeader className="max-sm:px-6">
        <div className="grid grow grid-cols-[1fr_24px_24px_24px] items-center gap-2">
          <h1 className="text-left text-[16px] font-medium leading-[19px]">
            My Wallet
          </h1>
          <Button
            className="m-0 size-6 min-w-0 bg-transparent p-0"
            variant="light"
            onPress={props.toSettings}
          >
            <Icons.Setting className="fill-default-700 dark:fill-default-300" />
          </Button>
          <Button
            className="m-0 size-6 min-w-0 bg-transparent p-0"
            variant="light"
            onPress={async () => {
              await account?.connector?.disconnect();
              props.onClose();
              setIsConnectModalOpen(false);
            }}
          >
            <Icons.WalletExit className="fill-default-700 stroke-default-700 stroke-[0.7px] dark:fill-default-300 dark:stroke-default-300" />
          </Button>
          <Button
            className="m-0 size-6 min-w-0 bg-transparent p-0"
            variant="light"
            onPress={props.onClose}
          >
            <Icons.Close className="fill-foreground" />
          </Button>
        </div>
      </ModalHeader>
      <ModalBody className="max-h-full overflow-hidden p-0">
        <div className="flex max-h-full w-full grow flex-col items-center gap-3 overflow-hidden max-sm:gap-0">
          <div className="flex w-full flex-col items-center gap-3 px-3 max-sm:px-6">
            <WalletDisplay
              network={selectedNetwork}
              provider={selectedProvider}
              wallet={account}
            />
            <div className="flex w-full flex-row justify-start gap-3 border-b-1 border-default-300 pb-3 pt-4 dark:border-default-100 max-sm:pb-4">
              <TabSelector
                name="Extra Rewards"
                selected={tab}
                setTab={setTab}
                value="extra-rewards"
              />
              <TabSelector
                name="Tokens"
                selected={tab}
                setTab={setTab}
                value="tokens"
              />
              <TabSelector
                name="Transaction"
                selected={tab}
                setTab={setTab}
                value="transaction"
              />
            </div>
          </div>
          <div className="flex max-h-full w-full grow flex-col gap-0 overflow-auto">
            {tab === "extra-rewards" && <WalletRewards />}
            {tab === "transaction" && <WalletTransactions />}
            {tab === "tokens" && <WalletTokens />}
          </div>
        </div>
      </ModalBody>
    </Fragment>
  );
}
