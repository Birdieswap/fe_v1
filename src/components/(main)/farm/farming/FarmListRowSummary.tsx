"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useAccount } from "wagmi";

import { Farm, FarmType } from "@/types/FarmListTableRowProps";
import Arrow from "@/assets/icons/arrow.svg";
import { defaultTransition } from "@/const/presenceTransition";
import Icons from "@/assets/icons/icons";
import { BigDecimal } from "@/types/BigDecimal";
import { isBirdieLPFarm } from "@/const/contracts/types/tokenTypes";

import { CryptoTokenIcons } from "../FarmListTable";

import Components from "./listRowSummary/components";

export default function FarmListRowSummary({
  balance,
  item,
  isActive,
  onClick,
  apy,
  tvl,
  price,
}: {
  balance?: BigDecimal;
  isActive: boolean;
  onClick: () => void;
  item: Farm;
  apy: BigDecimal | null;
  tvl: BigDecimal | null;
  price: BigDecimal | null;
}) {
  const stakeToken = item.wip_stakeToken;
  const account = useAccount();
  const isBalanceAvailable = !!balance;
  const input = isBirdieLPFarm(stakeToken)
    ? stakeToken.swap.input.map((v) => v.input)
    : [stakeToken.input];

  return (
    <motion.div
      layout
      {...defaultTransition}
      className={clsx(
        "grid origin-top grid-cols-subgrid items-center justify-center",
        "border-t border-default-400 dark:border-default-900",
        "[&:nth-child(2)]:dark:border-default-400",
        "md:col-span-6 md:px-6",
        "max-md:col-span-3 max-md:row-span-2 max-md:px-4",
        "transition-colors hover:bg-default-200 dark:hover:bg-default-900",
      )}
      onClick={onClick}
    >
      <motion.div
        layout
        className={clsx(
          "md:col-span-2 md:grid md:grid-cols-subgrid md:items-center md:justify-center",
          "max-md:col-span-1 max-md:flex max-md:flex-col max-md:gap-3 max-md:py-4",
        )}
      >
        <motion.div layout>
          <div className="flex items-center gap-2">
            {item.type === FarmType.PAIR ? (
              <CryptoTokenIcons profiles={input} />
            ) : (
              <CryptoTokenIcons profiles={input} />
            )}
          </div>
        </motion.div>
        <motion.div layout className="md:py-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-0.5 text-sm">
              <div className="flex flex-row font-semibold text-foreground">
                {isBirdieLPFarm(stakeToken)
                  ? stakeToken.swap.input
                      .map((token) => token.input.symbol)
                      .join(" - ")
                  : stakeToken.input.symbol}
              </div>
              <div className="flex flex-row gap-2 font-medium text-default-600">
                <p className="whitespace-nowrap">
                  {isBirdieLPFarm(stakeToken)
                    ? stakeToken.swap.input
                        .map((token) => token.provider.name)
                        .join(" - ")
                    : stakeToken.provider.name}
                </p>
                <span>
                  {isBirdieLPFarm(stakeToken) ? stakeToken.provider.name : ""}
                </span>
              </div>
              <div className="flex flex-row items-center font-medium text-default-800 dark:text-default-500">
                <Icons.BirdRate
                  className="size-4 fill-default-800 dark:fill-default-500"
                  fillRule="evenodd"
                />
                <Components.Price isLoading={!price} value={price} />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        layout
        className={clsx(
          "md:col-span-3 md:grid md:grid-cols-subgrid md:items-center md:justify-center",
          "max-md:col-span-1 max-md:flex max-md:flex-col max-md:items-end max-md:gap-3",
        )}
      >
        <motion.div layout className="flex flex-row items-center gap-2">
          <span className="pt-px text-[11px] font-medium text-default-600 md:hidden">
            APY(%)
          </span>
          <Components.Apy isLoading={!apy} value={apy} />
        </motion.div>
        <motion.div layout className="flex flex-row items-center gap-2">
          <span className="pt-px text-[11px] font-medium text-default-600 md:hidden">
            TVL($)
          </span>
          <Components.Tvl isLoading={!tvl} tvl={tvl ? tvl : null} />
        </motion.div>
        <motion.div
          layout
          className="flex flex-col items-end gap-1 text-right text-sm font-semibold"
        >
          <motion.div
            layout
            className="flex flex-row items-center gap-2 text-right"
          >
            <span className="pt-px text-[11px] font-medium text-default-600 md:hidden">
              BAL
            </span>
            <span className="text-sm font-semibold max-md:font-medium">
              <p>
                {!account.isConnected && "Connect Wallet"}
                {account.isConnected && !isBalanceAvailable && "Loading..."}
                {account.isConnected &&
                  isBalanceAvailable &&
                  balance
                    .roundToDecimals(
                      item.wip_stakeToken?.displayDecimals ??
                        item.wip_stakeToken?.decimals ??
                        3,
                    )
                    .toPrecisionString(true, false)}
              </p>
            </span>
          </motion.div>
          <p className="font-medium text-default-700 max-md:text-xs md:text-sm">
            {!account.isConnected && "Connect Wallet"}
            {account.isConnected && !isBalanceAvailable && "Loading..."}
            {account.isConnected &&
              isBalanceAvailable &&
              price &&
              "$" + balance.mul(price).roundToDecimals(2).toString()}
          </p>
        </motion.div>
      </motion.div>
      <motion.div
        layout
        className="flex items-center justify-center max-md:pl-3 md:pl-6"
      >
        <Arrow
          className="rotate-0 transition-transform data-[active=true]:rotate-180"
          data-active={isActive}
        />
      </motion.div>
    </motion.div>
  );
}
