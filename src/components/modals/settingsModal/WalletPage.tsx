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
          "group-data-[selected=true]:text-foreground group-data-[selected=false]:text-default-700"
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
        "flex-col items-start justify-between",
        "max-sm:flex-col max-sm:gap-4 max-sm:py-2 max-sm:items-start"
      )}
    >
      <div className="pt-0 px-0">
        <div className="text-[12px] font-light text-foreground pb-1">
          Your Referrer Address
        </div>
        <div className="flex flex-row w-full justify-between items-center gap-4 pb-3">
          <div className="text-[12px] font-semibold break-all flex items-center flex-1 min-w-0">
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
        "flex h-auto min-h-[140px] w-full rounded-xl bg-primary/10 py-0 my-0 px-3 pt-3 dark:bg-dark-mid-mint max-sm:h-auto max-sm:min-h-[84px]",
        "flex-col items-stretch gap-3",
        "max-sm:flex-col max-sm:gap-1 max-sm:py-3 max-sm:items-start"
      )}
    >
      <div className="grid w-full items-center gap-2 sm:grid-cols-[1fr_auto] grid-cols-1">
        {/* 왼쪽 영역 (지갑 아이콘/주소) */}
        <div className="flex flex-row items-center gap-2 min-w-0">
          <WalletIcon provider={provider} size="lg" />
          <div className="flex grow flex-col gap-0 min-w-0">
            <span className="text-[12px] font-semibold leading-[15px]">
              {provider?.name ?? "unknown"}
            </span>
            <div className="flex flex-row items-center gap-[5px] min-w-0">
              <span className="text-[15px] font-semibold leading-[18px] truncate">
                {address}
              </span>
              <Button
                isIconOnly
                className="size-[18px] min-w-[18px] max-w-[18px] rounded-[4px]"
                variant="light"
                onPress={() =>
                  navigator.clipboard.writeText(wallet?.address ?? "")
                }
              >
                <Icons.WalletCopy className="fill-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* 오른쪽 링크: 모바일에선 다음 줄, 항상 오른쪽 끝 고정 */}
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

      {/* 데스크톱(≥sm): 내부 카드 */}
      <div className="mt-0 py-0 px-0 flex-grow hidden sm:block">
        {/* 내부 카드: 라이트는 white, 다크는 어두운 패널 */}
        <div
          className="
            rounded-xl border shadow-sm px-4 py-3 sm:px-4 sm:py-3 font-sans
            bg-white border-default-200
            dark:bg-default-100 dark:border-default-100
          "
        >
          <div className="text-[12px] font-light text-foreground">
            Your Referral link to share
          </div>

          {/* 링크 + 복사 버튼 라인 */}
          <div className="mt-1 flex items-center justify-between gap-4">
            <div
              className="
                group inline-flex items-center gap-1 
                text-[14px] sm:text-[14px] font-semibold
                text-foreground break-all
              "
            >
              {ReferralLink}
              {/* 외부 링크 아이콘 (라이트/다크에 맞게 색상 상속) */}
            </div>

            <div className="shrink-0">
              <Button
                isIconOnly
                className="size-[20px] min-w-[20px] max-w-[20px] rounded-[4px]"
                variant="light"
                onPress={() =>
                  navigator.clipboard.writeText(ReferralLink ?? "")
                }
                aria-label="Copy referral link"
              >
                <Icons.WalletCopy className="fill-foreground" />
              </Button>
            </div>
          </div>

          <div className="mt-3 font-regular text-[11px] text-light-primary dark:text-dark-green-key">
            Join our referral program: share, invite, and be rewarded.
          </div>
        </div>
      </div>

      {/* 모바일(<sm): 아코디언 */}
      <div className="w-full">
        <MobileReferralAccordion ReferralLink={ReferralLink} />
      </div>
    </div>
  );
}

function MobileReferralAccordion({ ReferralLink }: { ReferralLink: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden w-full">
      {/* 하얀 카드 컨테이너: 하단 패딩(pb-3) 유지 */}
      <div
        className={cn(
          "rounded-xl border shadow-sm font-sans px-4 pt-3 pb-3",
          "bg-white border-default-200",
          "dark:bg-default-800 dark:border-default-700"
        )}
      >
        {/* 1) 펼쳐지는 컨텐츠: 헤더 '위쪽'에 배치 */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="ref-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="text-[12px] font-light text-default-700 dark:text-default-300">
                Your Referral link to share
              </div>

              {/* 링크 + 복사 버튼 라인 */}
              <div className="mt-1 flex items-center justify-between gap-4">
                <div
                  className="
                group inline-flex items-center gap-1 
                text-[12px] sm:text-[12px] font-semibold
                text-foreground break-all
                underline-offset-4 hover:underline
              "
                >
                  {ReferralLink}
                  {/* 외부 링크 아이콘 (라이트/다크에 맞게 색상 상속) */}
                </div>

                <div className="shrink-0">
                  <Button
                    isIconOnly
                    className="size-[20px] min-w-[20px] max-w-[20px] rounded-[4px]"
                    variant="light"
                    onPress={() =>
                      navigator.clipboard.writeText(ReferralLink ?? "")
                    }
                    aria-label="Copy referral link"
                  >
                    <Icons.WalletCopy className="fill-foreground" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2) 헤더(하단 고정): 색상 유지 + 원래 화살표 아이콘 */}
        <button
          type="button"
          className="w-full flex items-center justify-between leading-none"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className="text-left text-[11px] text-light-primary dark:text-dark-green-key">
            Join our referral program : share, invite, and be rewarded.
          </div>

          {/* 화살표 위치 고정: 크기 고정 + 회전만 */}
          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: "50% 50%", willChange: "transform" }}
            >
              <Arrow className="[&>*]:fill-foreground" />
            </motion.div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function WalletPage(props: {
  toSettings: () => void;
  onClose: () => void;
}) {
  const config = useConfig();
  const [tab, setTab] = useState<"History" | "Assets">("Assets");
  // const { hideSmallBalances, hideUnknownTokens } = useContext(SettingsContext);

  const {
    selectedProvider,
    account,
    setIsConnectModalOpen,
    selectedNetwork,
    walletData,
  } = useContext(WalletContext);

  console.log("WalletPage walletData", account, walletData);
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

                // RainbowKit 최근 커넥터 캐시도 함께 지워 재연결 소스 제거
                try {
                  localStorage.removeItem("rk-last-connector");
                  localStorage.removeItem("rainbowkit.connectedWallets");
                  localStorage.removeItem("rainbowkit:connectedWallets");
                } catch {}

                const doHardReload = isInjectedLike(connector?.id, provider);
                await safeDisconnect({
                  config,
                  connector,
                  provider,
                  hardReloadOnInjected:
                    isMetaMaskInAppEnv(connector as any, provider) ||
                    isInjectedLike(connector?.id, provider),
                });

                // 아주 짧은 틱으로 펜딩 이벤트 정리
                await new Promise((r) => setTimeout(r, 10));
              } finally {
                // UI 정리
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
            <div className="flex w-full flex-row justify-start gap-3 border-b-1 border-default-300 pb-3 pt-4 dark:border-default-900 max-sm:pb-4">
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
