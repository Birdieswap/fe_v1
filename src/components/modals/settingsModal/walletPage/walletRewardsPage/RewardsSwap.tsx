import Image from "next/image";
import { Fragment, useContext, useMemo } from "react";
import { Button, cn, Link } from "@heroui/react";
import { useAccount, useChainId } from "wagmi";
import Icons from "@/assets/icons/icons";
import ThemedButton from "@/components/atoms/ThemedButton";
import { useReferral } from "@/app/ReferralContextProvider";
import { WalletContext } from "@/app/WalletContextProvider";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { getRewardsTotal } from "@/utils/wallet/getRewardsTotal";
import {
  getRewardList,
  type RewardListItem,
} from "@/utils/wallet/getRewardList";
import { getBlockExplorerUrl } from "@/utils/farm/getBlockExplorerURL";
import { getTimeAgoLinux } from "@/utils/farm/getTimeAgoLinux";

export type RewardItemProps = {
  name: string;
  amount: string;
  iconSrc?: string;
  usdAmount: string;
};

function SwapDisplay() {
  const { address } = useAccount();
  const { referralAddress, setReferralAddress } = useReferral();

  const isSelfReferral = address === referralAddress;

  return (
    <div
      className={cn(
        "flex max-h-[180px] w-full px-4 py-3 rounded-lg bg-default-100 sm:h-[100px]",
        "flex-col items-start justify-between",
        "max-sm:flex-col max-sm:gap-4 max-sm:py-4 max-sm:items-start"
      )}
    >
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
      <div className="text-[11px] text-light-primary dark:text-dark_green_key">
        Prefer not to share rewards with a referrer? Opt out anytime.
      </div>
    </div>
  );
}

function RewardItem(props: RewardItemProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="size-8 rounded-full">
        {props.iconSrc && (
          <Image
            alt={props.name}
            className="size-full rounded-full"
            height={40}
            src={props.iconSrc}
            width={40}
          />
        )}
      </div>
      <span className="text-[15px] font-bold leading-[18px] text-foreground">
        {props.name}
      </span>
      <div className="flex grow flex-col items-end gap-0.5">
        <span className="text-[16px] font-semibold leading-[19px] text-foreground">
          {props.amount}
        </span>
        <span className="text-[12px] font-bold leading-[16px] text-default-700 dark:text-default-300">
          $ {props.usdAmount}
        </span>
      </div>
    </div>
  );
}

export default function RewardsSwap() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { assetValues } = useContext(AssetsContext);
  const { referralAddress } = useReferral();
  const explorerURL = getBlockExplorerUrl(chainId);
  const { walletData } = useContext(WalletContext);

  // ---------- 원본 데이터: 존재 안하면 안전 디폴트 ----------
  const SwapRewardItem = walletData?.currentUserReward?.SwapRewards ?? {}; // 객체 or {}
  const SwapRewardInfo =
    walletData?.swapRewards ?? walletData?.swapRewards ?? [];
  const isSelfReferral = address === referralAddress;

  // ---------- 계산 1: rewards/raw (항상 useMemo 호출, 내부에서 방어) ----------
  const rewardsMemo = useMemo(() => {
    try {
      if (!chainId) return { rows: [], raw: [] };
      if (!SwapRewardItem || typeof SwapRewardItem !== "object") {
        return { rows: [], raw: [] };
      }
      return (
        getRewardsTotal(
          SwapRewardItem,
          chainId,
          assetValues?.chainLinkPriceMap
        ) ?? { rows: [], raw: [] }
      );
    } catch {
      return { rows: [], raw: [] };
    }
  }, [SwapRewardItem, chainId, assetValues?.chainLinkPriceMap]);

  const rewards = rewardsMemo.rows ?? [];
  const raw = rewardsMemo.raw ?? [];

  // ---------- 계산 2: SwapRewardList (항상 useMemo 호출, 내부에서 방어) ----------
  const SwapRewardList = useMemo(() => {
    try {
      if (!Array.isArray(SwapRewardInfo) || raw.length === 0) return [];
      return getRewardList(SwapRewardInfo, raw) ?? [];
    } catch {
      return [];
    }
  }, [SwapRewardInfo, raw]);

  // ---------- 화면 분기: "훅 호출 후"에만 조건 ----------
  const showEmpty =
    !Array.isArray(rewards) ||
    rewards.length === 0 ||
    !Array.isArray(SwapRewardList) ||
    SwapRewardList.length === 0;

  if (showEmpty) {
    return (
      <div
        className={cn(
          "flex w-full grow flex-col gap-3 p-0 pb-4",
          "max-sm:gap-6 max-sm:px-6 max-sm:pt-3 sm:px-4"
        )}
      >
        {!isSelfReferral ? <SwapDisplay /> : null}
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyReward className="fill-light-mid-mint-2 dark:fill-dark_empty_state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            You have no Swap rewards to claim
          </span>
        </div>
      </div>
    );
  }

  console.log("RewardsSwap", "rewards", rewards);

  return (
    <div
      className={cn(
        "flex w-full grow flex-col gap-3 p-0 pb-4",
        "max-sm:gap-6 max-sm:px-6 max-sm:pt-3 sm:px-4"
      )}
    >
      {!isSelfReferral ? <SwapDisplay /> : null}
      <Fragment>
        <div className="border-1 border-default-400 px-4 py-4 rounded-lg">
          <div className="flex w-full grow flex-col gap-3 p-0 max-sm:gap-6">
            {rewards.map((reward, index) => (
              <RewardItem
                key={index}
                amount={reward.amount}
                iconSrc={reward.iconSrc}
                name={reward.name}
                usdAmount={reward.usdAmount}
              />
            ))}
          </div>
          <div className="flex w-full flex-row mt-6">
            <ThemedButton
              // variant="MINT"
              className="h-[48px] rounded-xl dark:disabled:bg-[#363b4C]"
              disabled
            >
              Claim all
            </ThemedButton>
          </div>
        </div>

        {Array.isArray(SwapRewardList) && SwapRewardList.length > 0 && (
          <div className="rounded-lg divide-y divide-default-100">
            {SwapRewardList.map((it) => (
              <Link
                key={it.transactionHash || `${it.type}-${it.blockTimestamp}`}
                className="block w-full hover:bg-default-200 dark:hover:bg-default-100 px-2"
                href={`${explorerURL}/tx/${it.transactionHash}`}
                target="_blank"
              >
                <div className="flex w-full flex-row items-center justify-between text-foreground gap-1.5 pt-4 pb-4">
                  <div className="flex min-w-0 grow flex-col items-start gap-1">
                    <p>{`${it.type}  ${it.amount}  ${it.symbol}`}</p>
                    {it.transactionHash && (
                      <p className="text-xs text-default-700 transition-colors dark:text-default-300">
                        {it.transactionHash.length > 42
                          ? `${it.transactionHash.slice(0, 40)}...`
                          : it.transactionHash}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-row justify-end items-center gap-2">
                    <p>{getTimeAgoLinux(it.blockTimestamp)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Fragment>
    </div>
  );
}
