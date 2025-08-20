"use client";

import { cn } from "@heroui/react";
import Image from "next/image";
import { Fragment, useContext } from "react";

import Icons from "@/assets/icons/icons";
import { AssetsContext } from "@/app/AssetsContextProvider";

export type WalletTokenInfo = {
  name: string;
  amount: string;
  src?: string;
  usdAmount: string;
};

function WalletTokenItem(props: WalletTokenInfo) {
  return (
    <div className="flex w-full flex-row items-center gap-2">
      <div className="size-8 rounded-full">
        {props.src && (
          <Image
            alt={props.name}
            className="size-full rounded-full"
            height={40}
            src={props.src}
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

export default function WalletTokens() {
  const total = useContext(AssetsContext);
  
  // const asdf = useBalance()
  // asdf.
  const tokens: WalletTokenInfo[] = [
    {
      name: "Ethereum",
      amount: "0.00",
      src: "/tokens/ETH.svg",
      usdAmount: "0.00",
    },
    {
      name: "Bridged USDC",
      amount: "0.00",
      src: "/tokens/USDbC.svg",
      usdAmount: "0.00",
    },
    {
      name: "AAVE",
      amount: "0.00",
      src: "/tokens/AAVE.svg",
      usdAmount: "0.00",
    },
    {
      name: "DAI",
      amount: "0.00",
      src: "/tokens/DAI.svg",
      usdAmount: "0.00",
    },
  ];

  return (
    <div
      className={cn(
        "flex w-full grow flex-col gap-3 px-4 pb-3",
        "max-sm:pt-3 max-sm:px-6 max-sm:gap-6",
      )}
    >
      {tokens.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyToken className="fill-light_mid_mint_2 dark:fill-dark_empty_state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            No tokens yet.
          </span>
        </div>
      ) : (
        <Fragment>
          <h2 className="w-full text-right text-[14px] font-semibold leading-[17px] text-primary">
            {tokens.length} Tokens
          </h2>
          {tokens.map((token) => (
            <WalletTokenItem
              key={token.name}
              amount={token.amount}
              name={token.name}
              src={token.src}
              usdAmount={token.usdAmount}
            />
          ))}
        </Fragment>
      )}
    </div>
  );
}
