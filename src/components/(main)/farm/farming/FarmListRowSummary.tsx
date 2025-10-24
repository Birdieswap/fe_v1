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
import { forwardRef, useContext, useMemo } from "react";
import { AssetsContext } from "@/app/AssetsContextProvider";

import { Spacer } from "@heroui/react";
import DonutRatio from "./common/DonutRatio";

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

type Props = {
  balance?: BigDecimal;
  lpBalance?: BigDecimal;
  stakedBalance?: BigDecimal;
  gridCols: string;
  isActive: boolean;
  onClick: () => void;
  item: Farm;
  apy: BigDecimal | null;
  tvl: BigDecimal | null;
  price: BigDecimal | null;
};

export default forwardRef<HTMLDivElement, Props>(function FarmListRowSummary(
  {
    balance,
    lpBalance,
    stakedBalance,
    gridCols,
    item,
    isActive,
    onClick,
    apy,
    tvl,
    price,
  }: Props,
  ref
) {
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
      ref={ref}
      layout="position"
      {...defaultTransition}
      className={clsx(
        // 💡 모바일=2열, 데스크탑=전달된 grid 템플릿
        "col-span-full",
        "grid items-center min-h-[120px] sm:min-h-[72px] md:px-6 max-md:px-4 border-t border-default-300 dark:border-default-800 cursor-pointer",
        "max-md:grid-cols-[64px_1fr]",
        gridCols,
        "transition-colors hover:bg-default-200 dark:hover:bg-default-100"
      )}
      style={{ scrollMarginTop: "calc(var(--nav-h, 64px) + 8px)" }}
      onClick={onClick}
    >
      {/* ---------- [모바일] 왼쪽: 아이콘 + 심볼(아래) ---------- */}
      <div
        className={clsx(
          // 모바일: 왼쪽 첫 컬럼
          "max-md:col-span-1 max-md:row-span-2",
          // 데스크탑: 첫 컬럼으로 동작
          "md:[grid-column:1/2]"
        )}
      >
        <div className="flex max-md:flex-col md:flex-row items-start md:items-center gap-2">
          <CryptoTokenIcons profiles={input} />
          {/* 모바일에서 아이콘 아래로 내려가도록 flex-col */}
          <div className="flex min-w-0 flex-col md:ml-2">
            <div className="truncate font-semibold text-foreground">
              {isBirdieLPFarm(stakeToken)
                ? stakeToken.swap.input.map((t) => t.input.symbol).join(" - ")
                : stakeToken.input.symbol}
            </div>
            <div className="bleak text-xs font-medium text-default-600">
              {poolDescription ?? <LoadingPulse w="w-20" />}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- [데스크탑] APY / TVL / BAL (기존 2~4컬럼) ---------- */}

      <div className="hidden md:flex items-center justify-end text-right pr-2 md:[grid-column:2/3]">
        <Components.Apy isLoading={apyIsLoading} value={apy} />
      </div>

      <div className="hidden md:flex items-center justify-end text-right pr-2 md:[grid-column:3/4]">
        <Components.Tvl isLoading={tvl == null} tvl={tvl ? tvl : null} />
      </div>

      <div className="hidden md:flex flex-col items-end text-right gap-1 pr-1 md:[grid-column:4/5]">
        <div className="text-sm font-semibold">
          {!account.isConnected ? (
            "Connect Wallet"
          ) : !isBalanceAvailable ? (
            <LoadingPulse w="w-16" />
          ) : (
            balance.roundToDecimals(5).toPrecisionString(true, true)
          )}
        </div>
        <div className="font-medium text-default-700">
          {!account.isConnected ? (
            "Connect Wallet"
          ) : !isBalanceAvailable ? (
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
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center justify-end gap-4 md:[grid-column:5/6]">
        <DonutRatio
          lp={lpBalance}
          staked={stakedBalance}
          total={balance}
          size={40}
          stroke={5}
          title="Staked vs LP"
        />
        <Arrow
          className="rotate-0 transition-transform data-[active=true]:rotate-180"
          data-active={isActive}
        />
      </div>

      {/* ---------- [모바일] 오른쪽: 120px 높이, APY/TVL/BAL 세로 등간격 + 도넛/화살표 ---------- */}
      <div className="md:hidden max-md:col-span-1 grid grid-cols-[1fr_auto] items-center gap-x-2">
        {/* ◀︎ 왼쪽: APY / TVL / BAL 스택 (120px에 등간격) */}
        <div className="flex h-[120px] flex-col items-end justify-around">
          {/* APY */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-default-600">
              APY(%)
            </span>
            <Components.Apy isLoading={apyIsLoading} value={apy} />
          </div>

          {/* TVL */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-default-600">
              TVL($)
            </span>
            <Components.Tvl isLoading={tvl == null} tvl={tvl ? tvl : null} />
          </div>

          {/* BAL (값 + $값은 붙어서) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-default-600">
              BAL
            </span>
            <div className="flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold">
                {!account.isConnected ? (
                  "Connect Wallet"
                ) : !isBalanceAvailable ? (
                  <LoadingPulse w="w-16" />
                ) : (
                  balance.roundToDecimals(5).toPrecisionString(true, true)
                )}
              </span>
              <span className="text-[12px] text-default-700">
                {!account.isConnected ? (
                  "Connect Wallet"
                ) : !isBalanceAvailable ? (
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
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ▶︎ 오른쪽: Donut + Arrow (세로 가운데) */}
        <div className="flex items-center gap-2 shrink-0 pl-2">
          <DonutRatio
            lp={lpBalance}
            staked={stakedBalance}
            total={balance}
            size={40}
            stroke={5}
            title="Staked vs LP"
          />
          <Arrow
            className="rotate-0 transition-transform data-[active=true]:rotate-180"
            data-active={isActive}
          />
        </div>
      </div>
    </motion.div>
  );
});
