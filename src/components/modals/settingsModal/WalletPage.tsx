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

import WalletRewards from "./walletPage/WalletRewards";
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
    <div
      className={cn(
        "flex h-auto min-h-[86px] w-full mt-2 px-4 py-2 rounded-lg bg-light_pink/10 dark:bg-dark_pink/50 max-sm:min-h-[40px]",
        "flex-col items-start justify-between",
        "max-sm:flex-col max-sm:gap-4 max-sm:py-2 max-sm:items-start"
      )}
    >
      <div className="pt-0 px-2">
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
        <div className="text-[11px] text-light_pink dark:text-dark_pink">
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
        "flex h-auto min-h-[140px] w-full rounded-xl bg-primary/10 py-0 my-0 px-2 dark:bg-dark_mid_mint max-sm:h-auto max-sm:min-h-[84px]",
        "flex-col items-stretch gap-0",
        "max-sm:flex-col max-sm:gap-1 max-sm:py-1 max-sm:items-start"
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
      </div>
      <Link
        className="mt-auto self-end flex flex-row items-center gap-0.5 text-[12px] font-medium leading-[15px] max-sm:w-full max-sm:justify-end pr-2"
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

      <Divider />

      <div className="mt-0 py-0 px-2 flex-grow hidden sm:block">
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

      {/* 모바일(<sm): 아코디언 */}
      <MobileReferralAccordion ReferralLink={ReferralLink} />
    </div>
  );
}

function MobileReferralAccordion({ ReferralLink }: { ReferralLink: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden w-full">
      {/* 1) 펼쳐지는 컨텐츠: 버튼 '위쪽'에 배치 */}
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
            <div className="px-2 pt-2 pb-2">
              <div className="text-[11px] font-light text-foreground">
                Your Referral link to share
              </div>

              <div className="mt-1 flex flex-row justify-between items-center gap-4">
                <div className="text-[13px] font-semibold break-all">
                  {ReferralLink}
                </div>
                <div className="shrink-0">
                  <Button
                    isIconOnly
                    className="size-[18px] min-w-[18px] max-w-[18px] rounded-[4px]"
                    variant="light"
                    onPress={() =>
                      navigator.clipboard.writeText(ReferralLink ?? "")
                    }
                  >
                    <Icons.WalletCopy className="fill-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2) 헤더/버튼: 항상 보이고, 클릭 시 위의 컨텐츠가 나타나도록 */}
      <button
        type="button"
        className={cn(
          "w-full px-2 flex items-center justify-between",
          // ↓ 닫혔을 땐 더 얇게, 열렸을 땐 살짝
          open ? "py-1" : "py-0.5",
          // ↓ 텍스트 라인간격을 타이트하게
          "leading-none"
          // ↓ 버튼 자체 아래 여백을 더 줄이고 싶다면 주석 해제
          // "mb-[-2px]"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="text-left text-[11px] text-light_primary dark:text-dark_green_key">
          Join our referral program : share, invite, and be rewarded.
        </div>

        {/* 🔒 화살표 위치 고정: 고정 크기 + 회전만 적용(레이아웃 이동 방지) */}
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
          <div className="flex w-full flex-col items-center px-3 max-sm:px-6">
            <WalletDisplay
              network={selectedNetwork}
              provider={selectedProvider}
              wallet={account}
            />
            {!isSelfReferral ? (
              <SwapDisplay address={account?.address} />
            ) : null}
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
              </ButtonGroup>
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
