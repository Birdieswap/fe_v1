"use client";

import { ModalHeader, Button, ModalBody, cn, Divider } from "@heroui/react";
import { Fragment, useContext, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Config, UseAccountReturnType, useChains, useConfig } from "wagmi";

import { WalletContext } from "@/app/WalletContextProvider";
import Icons from "@/assets/icons/icons";
import { WalletProviderInfo } from "@/types/WalletProviderInfo";
import { NetworkInfo } from "@/types/NetworkInfo";

import { WalletIcon } from "../selectNetworkAndWallet/SelectWalletMenu";

import WalletTransactions from "./walletPage/WalletTransactions";
import WalletTokens from "./walletPage/WalletTokens";
import { useReferral } from "@/app/ReferralContextProvider";
import { safeDisconnect } from "@/utils/wallet/safeDisconnect";
import { isInjectedLike } from "@/utils/wallet/connectorUtils";
import { isMetaMaskInAppEnv } from "@/utils/wallet/detectMetaMaskInApp";
import { AnimatePresence, motion } from "framer-motion";
import Arrow from "@/assets/icons/arrow.svg";
import { copyToClipboard } from "@/utils/wallet/copyToClipboard";

function TabSelector(props: {
  selected: "History" | "Assets";
  value: "History" | "Assets";
  setTab: (value: "History" | "Assets") => void;
  name: string;
}) {
  return (
    <Button
      className={cn(
        "group p-0 flex max-h-max min-h-min min-w-min max-w-max flex-row gap-3",
        "data-[hover=true]:bg-transparent data-[hover=true]:opacity-70"
      )}
      data-selected={props.value === props.selected}
      radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={cn(
          "text-[14px] font-semibold leading-[17px]",
          "group-data-[selected=true]:text-foreground group-data-[selected=false]:text-default-600 dark:group-data-[selected=false]:text-default-400"
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
    <div
      className={cn(
        "flex h-auto min-h-[86px] mt-4 mx-3 px-4 py-3 rounded-lg max-sm:min-h-[40px] border-1 border-[#FF0000] dark:border-[#FF3F3F]",
        "max-sm:w-full",
        "flex-col items-start justify-between",
        "max-sm:flex-col max-sm:gap-4 max-sm:py-2 max-sm:items-start"
      )}
    >
      <div className="pt-0 px-0 w-full">
        <div className="text-[12px] font-light text-foreground pb-1">
          Your Referrer Address
        </div>
        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4 pb-3">
          {/* 왼쪽: 주소 (여기서 min-w-0 꼭 필요) */}
          <div className="min-w-0">
            <span className="text-[12px] font-semibold break-words">
              {isSelfReferral ? "No Referrer" : referralAddress}
            </span>
          </div>

          {/* 오른쪽: 버튼 (항상 오른쪽 끝) */}
          <div className="justify-self-end">
            <Button
              isIconOnly
              className="size-[18px] min-w-[18px] max-w-[18px] rounded-[4px]"
              variant="light"
              isDisabled={isSelfReferral}
              onPress={() => {
                if (address) setReferralAddress(address);
              }}
            >
              <Icons.Minus className="fill-foreground stroke-[#FF0000] dark:stroke-[#FF3F3F]" />
            </Button>
          </div>
        </div>
        <div className="text-[11px] text-[#FF0000] dark:text-[#FF3F3F]">
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
  const [open, setOpen] = useState(false); // 모바일에서만 사용

  const address = useMemo(() => {
    if (!wallet?.address) {
      return "0x1234...2341234";
    }

    return `${wallet.address.slice(0, 6)}...${wallet.address.slice(-7)}`;
  }, [wallet]);

  const ReferralLink = `https://birdieswap.vercel.app/?ref=${wallet?.address}`;

  const { referralAddress } = useReferral();
  const isSelfReferral = wallet?.address === referralAddress;

  const handleCopy = async (label: string, text: string) => {
    console.log("[WalletPage] copy click", { label, text });
    const ok = await copyToClipboard(text);
    console.log("[WalletPage] copy result", { label, ok });
  };

  return (
    <>
      {/* ====== 데스크톱(>=sm): 기존 레이아웃 유지 ====== */}
      <div
        className={cn(
          "hidden sm:flex h-auto min-h-[140px] w-full rounded-xl bg-primary/10 py-0 my-0 px-3 pt-3 dark:bg-dark-mid-mint",
          "flex-col items-stretch gap-3"
        )}
      >
        <div className="grid w-full items-center gap-2 sm:grid-cols-[1fr_auto] grid-cols-1">
          {/* 왼쪽 영역 (지갑 아이콘/주소) */}
          <div className="flex flex-row items-center gap-2 min-w-0">
            <WalletIcon provider={provider} size="lg" />
            <div className="flex grow flex-col gap-0 min-w-0 ">
              <span className="text-[12px] font-sans font-semibold text-default-900 dark:text-foreground leading-[15px]">
                {provider?.name ?? "unknown"}
              </span>
              <div className="flex flex-row items-center gap-[5px] min-w-0">
                <span className="text-[15px] font-semibold leading-[18px] truncate">
                  {address}
                </span>
                <button
                  type="button"
                  className="inline-flex size-[18px] min-w-[18px] max-w-[18px] items-center justify-center rounded-[4px] outline-none focus-visible:outline-none focus-visible:ring-0 hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() =>
                    handleCopy("address-desktop-click", wallet?.address ?? "")
                  }
                  aria-label="Copy wallet address"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Icons.WalletCopy className="fill-foreground" />
                </button>
              </div>
            </div>
          </div>
          {/* 오른쪽 링크: 데스크톱에선 그대로 */}
          <div className="justify-self-end">
            <Link
              className="inline-flex items-center gap-0.5 text-[12px] font-medium leading-[15px] pr-2 mt-2 sm:mt-0"
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
              </span>
              <Icons.WalletArrowRU className="fill-default-800 stroke-default-800 stroke-[1px] dark:fill-foreground dark:stroke-foreground" />
            </Link>
          </div>
        </div>

        {/* 내부 카드: 데스크톱은 항상 표시 */}
        <div className="mt-0 py-0 px-0 flex-grow">
          <div
            className={
              "rounded-xl border shadow-sm px-4 py-3 sm:px-4 sm:py-3 mb-3 font-sans bg-white border-default-200 dark:bg-default-100 dark:border-default-100"
            }
          >
            <div className="text-[12px] font-light text-foreground">
              Your Referral link to share
            </div>

            <div className="mt-1 flex items-center justify-between gap-4">
              <div className="group inline-flex items-center gap-1 text-[14px] sm:text-[14px] font-semibold text-foreground break-all">
                {ReferralLink}
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  className="inline-flex size-[20px] min-w-[20px] max-w-[20px] items-center justify-center rounded-[4px] outline-none focus-visible:outline-none focus-visible:ring-0 hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() =>
                    handleCopy("referral-desktop-click", ReferralLink ?? "")
                  }
                  aria-label="Copy referral link"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Icons.WalletCopy className="fill-foreground" />
                </button>
              </div>
            </div>
            <div className="mt-3 font-regular text-[11px] text-light-primary dark:text-dark-green-key">
              Join our referral program: share, invite, and be rewarded.
            </div>
          </div>
        </div>
      </div>

      {/* ====== 모바일(<sm): 화살표/Divider/접힘 동작 ====== */}
      <div
        className={cn(
          "sm:hidden flex h-auto w-full rounded-xl bg-primary/10 py-0 my-0 px-3 pt-3 dark:bg-dark-mid-mint",
          "flex-col items-stretch gap-0"
        )}
      >
        {/* 헤더 (모바일 전용 2행 그리드) */}
        <div className="grid w-full items-center gap-2 grid-cols-[1fr_auto] grid-rows-[auto_auto]">
          {/* 좌측: 아이콘/주소 (row1 col1) */}
          <div className="flex flex-row items-center gap-2 min-w-0 row-start-1 col-start-1">
            <WalletIcon provider={provider} size="lg" />
            <div className="flex grow flex-col gap-0 min-w-0">
              <span className="text-[12px] font-medium  text-default-900 dark:text-foreground leading-[15px]">
                {provider?.name ?? "unknown"}
              </span>
              <div className="flex flex-row items-center gap-[5px] min-w-0">
                <span className="text-[15px] font-semibold leading-[18px] truncate">
                  {address}
                </span>
                <button
                  type="button"
                  className="inline-flex size-[18px] min-w-[18px] max-w-[18px] items-center justify-center rounded-[4px] outline-none focus-visible:outline-none focus-visible:ring-0 hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() =>
                    handleCopy("address-mobile-click", wallet?.address ?? "")
                  }
                  aria-label="Copy wallet address"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Icons.WalletCopy className="fill-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 토글 버튼 (row1 col2) */}
          <div className="row-start-1 col-start-2 justify-self-end">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="wallet-referral-mobile"
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ transformOrigin: "50% 50%" }}
              >
                <Arrow className="[&>*]:fill-default-700 dark:[&>*]:fill-foreground" />
              </motion.div>
            </button>
          </div>
        </div>

        {/* 링크: 2행 전체 차지 (항상 새 줄) */}
        <div className="row-start-2 col-span-2 flex pb-3 text-default-900 dark:text-foreground">
          <Link
            className="ml-auto inline-flex items-center gap-0.5 text-[12px] font-regular leading-[15px] pr-2 mt-0.5"
            href={
              (network?.blockExplorer?.url ?? "https://etherscan.io/") +
              (wallet?.address ? `address/${wallet.address}` : "")
            }
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="whitespace-nowrap">View on</span>
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              {network?.blockExplorer?.name ?? "Etherscan"}
            </span>
            <Icons.WalletArrowRU className="fill-default-800 stroke-default-800 stroke-[1px] dark:fill-foreground dark:stroke-foreground" />
          </Link>
        </div>

        {/* 아코디언: Divider 포함해서 접힘 */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="referral-mobile-wrap"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden w-full"
            >
              <Divider className="mb-3 border-default-500" />

              <div className="rounded-xl border shadow-sm px-4 py-3 mb-3 font-sans bg-white border-default-200 dark:bg-default-100 dark:border-default-100">
                <div className="text-[12px] font-light text-foreground">
                  Your Referral link to share
                </div>
                <div className="mt-1 flex items-center justify-between gap-4">
                  <div className="group inline-flex items-center gap-1 text-[12px] font-semibold text-foreground break-all">
                    {ReferralLink}
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      className="inline-flex size-[20px] min-w-[20px] max-w-[20px] items-center justify-center rounded-[4px] outline-none focus-visible:outline-none focus-visible:ring-0 hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() =>
                        handleCopy("referral-mobile-click", ReferralLink ?? "")
                      }
                      aria-label="Copy referral link"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <Icons.WalletCopy className="fill-foreground" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-regular text-light-primary dark:text-dark-green-key">
                  Join our referral program: share, invite, and be rewarded.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function WalletPage(props: {
  toSettings: () => void;
  onClose: () => void;
}) {
  const config = useConfig();
  const [tab, setTab] = useState<"History" | "Assets">("Assets");

  const {
    selectedProvider,
    account,
    setIsConnectModalOpen,
    selectedNetwork,
    walletData,
  } = useContext(WalletContext);

  const { referralAddress } = useReferral();
  const isSelfReferral = account?.address === referralAddress;

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
              try {
                const connector = account?.connector;
                const provider = await connector
                  ?.getProvider?.()
                  .catch(() => undefined);

                try {
                  localStorage.removeItem("rk-last-connector");
                  localStorage.removeItem("rainbowkit.connectedWallets");
                  localStorage.removeItem("rainbowkit:connectedWallets");
                } catch {}

                await safeDisconnect({
                  config,
                  connector,
                  provider,
                  hardReloadOnInjected:
                    isMetaMaskInAppEnv(connector as any, provider) ||
                    isInjectedLike(connector?.id, provider),
                });

                await new Promise((r) => setTimeout(r, 10));
              } finally {
                props.onClose();
                setIsConnectModalOpen(false);
              }
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
        <div className="flex max-h-full w-full grow flex-col items-center overflow-auto max-sm:gap-0">
          <div className="flex w-full flex-col items-center px-4 max-sm:px-6">
            <WalletDisplay
              network={selectedNetwork}
              provider={selectedProvider}
              wallet={account}
            />
            {!isSelfReferral ? (
              <SwapDisplay address={account?.address} />
            ) : null}
            <div className="flex w-full flex-row justify-start gap-3 border-b-1 border-default-300 pb-3 pt-4 dark:border-default-100 max-sm:pb-4">
              <TabSelector
                name="Assets"
                selected={tab}
                setTab={setTab}
                value="Assets"
              />
              <TabSelector
                name="History"
                selected={tab}
                setTab={setTab}
                value="History"
              />
            </div>
          </div>
          <div className="flex max-h-full w-full grow flex-col gap-0 ">
            {tab === "Assets" && <WalletTokens onClose={props.onClose} />}
            {tab === "History" && <WalletTransactions />}
          </div>
        </div>
      </ModalBody>
    </Fragment>
  );
}
