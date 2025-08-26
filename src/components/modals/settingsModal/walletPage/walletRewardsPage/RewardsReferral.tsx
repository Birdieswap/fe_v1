import Image from "next/image";
import { Button, cn } from "@heroui/react";
import { Fragment, useMemo } from "react";
import { useAccount } from "wagmi";
import Icons from "@/assets/icons/icons";
import ThemedButton from "@/components/atoms/ThemedButton";

export type RewardItemProps = {
  name: string;
  amount: string;
  iconSrc?: string;
  usdAmount: string;
};

function ReferralDisplay() {

  const { address } = useAccount();
  const ReferralLink =`https://birdieswap.vercel.app/?ref=${address}`

  return (
    <div
      className={cn(
        "flex h-[100px] w-full px-4 py-3 rounded-lg bg-default-100 max-sm:h-[104px]",
        "flex-col items-start justify-between",
        "max-sm:flex-col max-sm:gap-4 max-sm:py-4 max-sm:items-start",
      )}
    >
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
        <span className="text-[12px] font-bold leading-[16px] text-default-300">
          $ {props.usdAmount}
        </span>
      </div>
    </div>
  );
}

export default function RewardsReferral() {
  const rewards: RewardItemProps[] = [
    {
      name: "AAVE",
      amount: "0.00",
      iconSrc: "/tokens/AAVE.svg",
      usdAmount: "0.00",
    },
    {
      name: "Birdie",
      amount: "0.00",
      iconSrc: "/tokens/Birdie.svg",
      usdAmount: "0.00",
    },
  ];

  return (
    <div
      className={cn(
        "flex w-full grow flex-col gap-3 p-0 pb-4",
        "max-sm:gap-6 max-sm:px-6 max-sm:pt-3 sm:px-4",
      )}
    >
      <ReferralDisplay />
      {rewards.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyReward className="fill-light_mid_mint_2 dark:fill-dark_empty_state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            You have no Referral rewards to claim
          </span>
        </div>
      ) : (
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
              <ThemedButton variant="MINT" className="h-[48px] rounded-xl">Claim all</ThemedButton>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}
