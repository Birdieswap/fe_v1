"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useAccount, useChainId } from "wagmi";

import { Farm, FarmType } from "@/types/FarmListTableRowProps";
import Arrow from "@/assets/icons/arrow.svg";
import { defaultTransition } from "@/const/presenceTransition";
import Icons from "@/assets/icons/icons";
import { BigDecimal } from "@/types/BigDecimal";
import { isBirdieLPFarm } from "@/const/contracts/types/tokenTypes";

import { CryptoTokenIcons } from "../FarmListTable";

import Components from "./listRowSummary/components";
import suffixNumbers from "@/utils/suffixNumbers";
import { useContext, useMemo } from "react";
import { AssetsContext } from "@/app/AssetsContextProvider";

import { Spacer } from "@heroui/react";

// 상단 import 아래 유틸 함수 추가
const toNum = (v: any): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v?.toPrecisionString === "function") {
    const n = parseFloat(v.toPrecisionString());
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v?.toFixed === "function") {
    const n = parseFloat(v.toFixed(2));
    return Number.isFinite(n) ? n : undefined;
  }
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
};

export function LoadingPulse({
  w = "w-12",
  className = "",
}: {
  w?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center align-middle ${className}`}
      aria-busy="true"
    >
      <Spacer x={0.5} />
      <span
        className={`inline-block h-[14px] ${w} rounded-md bg-default-200 dark:bg-default-700 animate-pulse`}
      />
    </span>
  );
}

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
  const chainId = useChainId();
  const { aprDataState } = useContext(AssetsContext);
  const isBalanceAvailable = !!balance;
  const input = isBirdieLPFarm(stakeToken)
    ? stakeToken.swap.input.map((v) => v.input)
    : [stakeToken.input];

  const poolDescription = useMemo(() => {
    const targetAddr = stakeToken?.addresses?.[chainId];
    if (!targetAddr) return;

    const norm = (s?: string) => String(s ?? "").toLowerCase();
    const T = norm(targetAddr);
    const S = aprDataState as any;

    // 1) 배열 후보 (apr / aprs / data / 자체가 배열)
    const arr: any[] | undefined = Array.isArray(S?.apr)
      ? S.apr
      : Array.isArray(S?.aprs)
      ? S.aprs
      : Array.isArray(S?.data)
      ? S.data
      : Array.isArray(S)
      ? S
      : undefined;

    if (arr) {
      const hit = arr.find(
        (e) => norm(e?.contractAddress ?? e?.apr?.contractAddress) === T
      );
      if (hit) return hit?.description ?? hit?.apr?.description;
    }

    // 2) 맵(사전) 후보 (byAddress / aprMap / map)
    const dict = S?.byAddress ?? S?.aprMap ?? S?.map;
    if (dict && typeof dict === "object") {
      const entry =
        dict[targetAddr] ??
        dict[targetAddr.toLowerCase()] ??
        dict[targetAddr.toUpperCase()];
      if (entry) return entry?.description ?? entry?.apr?.description;
    }

    // 3) 단일 객체 후보
    if (norm(S?.apr?.contractAddress) === T) return S?.apr?.description;

    return;
  }, [aprDataState, chainId, stakeToken]);

  // console.log(
  //   "FarmListRowSummary poolDescription:",
  //   stakeToken,
  //   poolDescription
  // );

  const hasAprEntry = useMemo(() => {
    const targetAddr = stakeToken?.addresses?.[chainId];
    if (!targetAddr) return false;

    const norm = (s?: string) => String(s ?? "").toLowerCase();
    const T = norm(targetAddr);
    const S = aprDataState as any;

    const arr: any[] | undefined = Array.isArray(S?.apr)
      ? S.apr
      : Array.isArray(S?.aprs)
      ? S.aprs
      : Array.isArray(S?.data)
      ? S.data
      : Array.isArray(S)
      ? S
      : undefined;

    if (arr) {
      const hit = arr.find(
        (e) => norm(e?.contractAddress ?? e?.apr?.contractAddress) === T
      );
      if (hit) return true;
    }

    const dict = S?.byAddress ?? S?.aprMap ?? S?.map;
    if (dict && typeof dict === "object") {
      const entry =
        dict[targetAddr] ??
        dict[targetAddr.toLowerCase()] ??
        dict[targetAddr.toUpperCase()];
      if (entry) return true;
    }

    if (norm(S?.apr?.contractAddress) === T) return true;
    return false;
  }, [aprDataState, chainId, stakeToken]);

  const apyNum = toNum(apy);
  const apyIsLoading =
    apy == null || apyNum === undefined || (apyNum === 0 && !hasAprEntry);

  return (
    <motion.div
      layout
      {...defaultTransition}
      className={clsx(
        "grid origin-top grid-cols-subgrid items-center min-h-[120px] sm:min-h-[72px] justify-center",
        "border-t border-default-400 dark:border-default-900",
        "[&:nth-child(2)]:dark:border-default-400",
        "md:col-span-6 md:px-6 cursor-pointer",
        "max-md:col-span-3 max-md:row-span-2 max-md:px-4",
        "transition-colors hover:bg-default-200 dark:hover:bg-default-100"
      )}
      onClick={onClick}
    >
      <motion.div
        layout
        className={clsx(
          "md:col-span-2 md:grid md:grid-cols-subgrid md:items-center md:justify-center",
          "max-md:col-span-1 max-md:flex max-md:flex-col max-md:gap-3 max-md:py-4"
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
              <div className="flex flex-row font-semibold min-w-[140px] text-foreground">
                {isBirdieLPFarm(stakeToken)
                  ? stakeToken.swap.input
                      .map((token) => token.input.symbol)
                      .join(" - ")
                  : stakeToken.input.symbol}
              </div>
              <div className="bleak flex flex-row gap-2 text-xs font-medium text-default-600">
                {poolDescription ? (
                  <>{poolDescription}</>
                ) : (
                  <LoadingPulse w="w-20" />
                )}
              </div>
              {/* <div className="flex flex-row items-center font-medium text-default-800 dark:text-default-500">
                <Icons.BirdRate
                  className="size-4 fill-default-800 dark:fill-default-500"
                  fillRule="evenodd"
                />
                <Components.Price isLoading={!price} value={price} />
              </div> */}
            </div>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        layout
        className={clsx(
          "md:col-span-3 md:grid md:grid-cols-subgrid md:items-center md:justify-center",
          "max-md:col-span-1 max-md:flex max-md:flex-col max-md:items-end max-md:gap-3"
        )}
      >
        <motion.div layout className="flex flex-row items-center gap-2">
          <span className="pt-px text-[11px] font-medium text-default-600 md:hidden">
            APY(%)
          </span>
          <Components.Apy isLoading={apyIsLoading} value={apy} />
        </motion.div>
        <motion.div layout className="flex flex-row items-center gap-2">
          <span className="pt-px text-[11px] font-medium text-default-600 md:hidden">
            TVL($)
          </span>
          <Components.Tvl isLoading={tvl == null} tvl={tvl ? tvl : null} />
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
                {account.isConnected && !isBalanceAvailable && (
                  <LoadingPulse w="w-16" />
                )}
                {account.isConnected &&
                  isBalanceAvailable &&
                  balance
                    .roundToDecimals(
                      5
                      // item.wip_stakeToken?.displayDecimals ??
                      //   item.wip_stakeToken?.decimals ??
                      //   3
                    )
                    .toPrecisionString(true, true)}
              </p>
            </span>
          </motion.div>
          <p className="font-medium text-default-700 max-md:text-xs md:text-sm">
            {!account.isConnected && "Connect Wallet"}
            {account.isConnected &&
              (!isBalanceAvailable ? (
                <LoadingPulse w="w-20" />
              ) : price ? (
                "$" +
                suffixNumbers(
                  balance.mul(price).roundToDecimals(2),
                  0,
                  2,
                  false,
                  false
                )
              ) : (
                <LoadingPulse w="w-20" />
              ))}
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
