import { Button } from "@heroui/react";

import { Farm } from "@/types/FarmListTableRowProps";

import { SectionHeader } from "../common/SectionHeader";

import VaultInfo from "./earningsPanel/VaultInfo";
import RewardInfoRow from "./earningsPanel/RewardInfoRow";

export default function EarningsPanel({ item }: { item: Farm }) {
  return (
    <div className="mt-5 flex grow basis-0 flex-col">
      <SectionHeader>Vaults</SectionHeader>
      <div className="mb-6 mt-[14px] flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        {item.details.vaults.map((v) => (
          <VaultInfo key={v.name} item={v} />
        ))}
      </div>
      <SectionHeader>Extra Rewards</SectionHeader>
      <div className="mt-[14px] flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        {item.details.rewards.map((v) => {
          const amount = 0; // TODO calculate the balance
          const price = 0; // TODO calculate the price
          // const amount = v.amount.toFixed(v.token.balance?.decimals || 0);
          const dollarAmount = (amount * price).toFixed(2);
          const stakeAt = v.token.symbol;
          const stakeAtSrc = v.token.iconSrc;

          return (
            <RewardInfoRow
              key={stakeAt}
              amount={amount.toFixed(
                v.token.displayDecimals ?? v.token.decimals ?? 3,
              )}
              dollarAmount={dollarAmount}
              rewardToken={stakeAt}
              rewardTokenSrc={stakeAtSrc}
            />
          );
        })}
        <div className="flex grow flex-row items-center gap-2 text-foreground">
          <p className="grow text-sm">Claim all rewards into your wallet.</p>
          <Button
            className="btn-mint h-[43px] w-40 rounded-2xl text-base font-semibold"
            size="sm"
          >
            Claim
          </Button>
        </div>
      </div>
    </div>
  );
}
