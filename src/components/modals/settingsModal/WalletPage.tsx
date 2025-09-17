"use client";

import {
  ModalHeader,
  Button,
  ModalBody,
  cn,
  ButtonGroup,
  Divider,
} from "@heroui/react";
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
import { useReferral } from "@/app/ReferralContextProvider";

function TabSelector(props: {
  selected: "History" | "Assets";
  value: "History" | "Assets";
  setTab: (value: "History" | "Assets") => void;
  name: string;
}) {
  return (
    <Button
      className={cn(
        "flex h-9 border-1 text-center text-[14px] font-normal md:w",
        "border-default-400 bg-transparent text-default-600 data-[hover=true]:bg-default-400/20",
        "dark:border-default-100 dark:text-default-400 data-[hover=true]:opacity-100 ",
        "data-[selected=true]:border-light_primary dark:data-[selected=true]:border-dark_green_key data-[selected=true]:bg-light_primary dark:data-[selected=true]:bg-dark_green_key  data-[selected=true]:text-white  dark:data-[selected=true]:text-white"
      )}
      data-selected={props.value === props.selected}
      //radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={cn(
          "text-[14px] font-semibold leading-[17px]",
          "dark:group-data-[selected=false]:text-default-400"
        )}
      >
        {props.name}
      </h2>
    </Button>
  );
}

function SwapDisplay({
  address,
}: Pick<UseAccountReturnType<Config>, "address">) {
  const { referralAddress, setReferralAddress } = useReferral();

  const isSelfReferral = address === referralAddress;

  return (
    <div>
      <Divider></Divider>
      <div className="my-2 px-2">
        <div className="text-[11px] font-light text-foreground">
          Your Referrer Address
        </div>
        <div className="flex flex-row w-full justify-between items-center gap-4">
          <div className="text-[13px] font-semibold break-all flex items-center flex-1 min-w-0">
            {isSelfReferral ? "No Referrer" : referralAddress}
          </div>
          <div className="shrink-0">
            <Button
              isIconOnly
              className="size-[18px] min-w-[18px] max-w-[18px] rounded-[4px]"
              variant="light"
              isDisabled={isSelfReferral}
              onPress={() => {
                if (address) {
                  setReferralAddress(address);
                }
              }}
            >
              <Icons.Subtract className="fill-foreground" />
            </Button>
          </div>
        </div>
        <div className="text-[11px] text-light_primary dark:text-dark_green_key">
          Prefer not to share rewards with a referrer? Opt out anytime.
        </div>
      </div>
    </div>
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

  const ReferralLink = `https://birdieswap.vercel.app/?ref=${wallet?.address}`;

  const { referralAddress, setReferralAddress } = useReferral();
  const isSelfReferral = wallet?.address === referralAddress;

  return (
    <div
      className={cn(
        "flex h-auto min-h-[140px] w-full rounded-xl bg-primary/10 py-0 my-0 px-2 dark:bg-dark_mid_mint max-sm:h-[104px]",
        "flex-col items-stretch gap-0",
        "max-sm:flex-col max-sm:gap-1 max-sm:py-2 max-sm:items-start"
      )}
    >
      <div className="flex-row flex justify-between items-center sm:grow mt-1 py-1">
        <div className="flex flex-row items-center gap-2 sm:grow">
          <WalletIcon provider={provider} size="lg" />
          <div className="flex grow flex-col gap-0">
            <span className="text-[12px] font-semibold leading-[15px]">
              {provider?.name ?? "unknown"}
            </span>
            <div className="flex flex-row items-center gap-[5px]">
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
          className="flex flex-row items-center gap-0.5 text-[12px] font-medium leading-[15px] max-sm:w-full max-sm:justify-end pr-2"
          href={
            (network?.blockExplorer?.url ?? "https://etherscan.io/") +
            (wallet?.address ? `address/${wallet.address}` : "")
          }
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="whitespace-nowrap max-[360px]:whitespace-normal">
            View on
          </span>
          <span className="inline-flex items-center gap-0.5 whitespace-nowrap max-[360px]:whitespace-normal break-words">
            {network?.blockExplorer?.name ?? "Etherscan"}
            {/* <Icons.WalletArrowRU className="ml-0.5 max-[360px]:hidden fill-default-800 stroke-default-800 stroke-[1px] dark:fill-foreground dark:stroke-foreground" /> */}
          </span>
          {/* View on {network?.blockExplorer?.name ?? "Etherscan"} */}
          <Icons.WalletArrowRU className="fill-default-800 stroke-default-800 stroke-[1px] dark:fill-foreground dark:stroke-foreground" />
        </Link>
      </div>
      <Divider></Divider>
      <div className="mt-0 py-2 px-2 flex-grow">
        <div className="text-[11px] font-light text-foreground">
          Your Referral link to share
        </div>
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="text-[13px] font-semibold break-all">
            {ReferralLink}
          </div>
          <div className="shrink-0">
            <Button
              isIconOnly
              className="size-[18px] min-w-[18px] max-w-[18px] rounded-[4px]"
              variant="light"
              onPress={() => {
                navigator.clipboard.writeText(ReferralLink ?? "");
              }}
            >
              <Icons.WalletCopy className="fill-foreground" />
            </Button>
          </div>
        </div>
        <div className="text-[11px] text-light_primary dark:text-dark_green_key">
          Join our referral program : share, invite, and be rewarded.
        </div>
      </div>
      {!isSelfReferral ? <SwapDisplay address={wallet?.address} /> : null}
    </div>
  );
}

export default function WalletPage(props: {
  toSettings: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"History" | "Assets">("History");
  // const { hideSmallBalances, hideUnknownTokens } = useContext(SettingsContext);

  const {
    selectedProvider,
    account,
    setIsConnectModalOpen,
    selectedNetwork,
    walletData,
  } = useContext(WalletContext);

  console.log("WalletPage walletData", walletData);

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
        <div className="flex max-h-full w-full grow flex-col items-center overflow-hidden max-sm:gap-0">
          <div className="flex w-full flex-col items-center px-3 max-sm:px-6">
            <WalletDisplay
              network={selectedNetwork}
              provider={selectedProvider}
              wallet={account}
            />
            <div className="flex w-full rounded-t-xl flex-row justify-start pt-4">
              <ButtonGroup
                fullWidth={true}
                className={cn(
                  // 1) 자식 버튼의 라운딩을 기본적으로 모두 제거
                  "[&>button]:rounded-none",
                  // 2) 첫 번째 버튼: 좌상단만 둥글게, 좌하단은 각지게
                  "[&>button:first-child]:rounded-tl-xl",
                  "[&>button:first-child]:rounded-bl-none",
                  // 3) 마지막 버튼: 우상단만 둥글게, 우하단은 각지게
                  "[&>button:last-child]:rounded-tr-xl",
                  "[&>button:last-child]:rounded-br-none"
                )}
              >
                <TabSelector
                  name="History"
                  selected={tab}
                  setTab={setTab}
                  value="History"
                />
                <TabSelector
                  name="Assets"
                  selected={tab}
                  setTab={setTab}
                  value="Assets"
                />
              </ButtonGroup>
            </div>
          </div>
          <div className="flex max-h-full w-full grow flex-col gap-0 overflow-auto">
            {tab === "History" && <WalletTransactions />}
            {tab === "Assets" && <WalletTokens />}
          </div>
        </div>
      </ModalBody>
    </Fragment>
  );
}
