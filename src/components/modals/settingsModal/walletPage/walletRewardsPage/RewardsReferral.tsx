import Image from "next/image";
import { cn } from "@heroui/react";
import { Fragment } from "react";

import Icons from "@/assets/icons/icons";
import ThemedButton from "@/components/atoms/ThemedButton";

export type RewardItemProps = {
  name: string;
  amount: string;
  iconSrc?: string;
  usdAmount: string;
};

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
      {rewards.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyReward className="fill-light_mid_mint_2 dark:fill-dark_empty_state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            You have no extra rewards to claim
          </span>
        </div>
      ) : (
        <Fragment>
          <h2 className="w-full text-right text-[14px] font-semibold leading-[17px] text-primary">
            Your Claim
          </h2>
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
          <div className="flex w-full flex-row">
            <ThemedButton variant="MINT">Claim all</ThemedButton>
          </div>
        </Fragment>
      )}
    </div>
  );
}
