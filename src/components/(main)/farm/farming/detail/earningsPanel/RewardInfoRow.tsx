import { Image } from "@heroui/react";

export default function RewardInfoRow(props: {
  rewardToken: string;
  rewardTokenSrc?: string;
  amount: string;
  dollarAmount: string;
}) {
  return (
    <div className="flex grow flex-row items-center gap-2">
      <Image
        alt={props.rewardToken}
        className="rounded-full"
        height={36}
        src={props.rewardTokenSrc}
        width={36}
      />
      <p className="grow">{props.rewardToken}</p>
      <p>{props.amount}</p>
      <p>($ {props.dollarAmount})</p>
    </div>
  );
}
