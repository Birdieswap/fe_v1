"use client";

import { useMemo } from "react";
import { Button, Divider } from "@heroui/react";
import clsx from "clsx";

import { SectionHeader } from "../common/SectionHeader";
import { LoadingPulse } from "./stakingPanels/common/LoadingPulse";
import type { VaultRowItem } from "../../../farm/farming/FarmDetail";
import VaultInfo from "./InfoCards/VaultInfo";
import Icons from "@/assets/icons/icons";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";
import { BigDecimal } from "@/types/BigDecimal";
import type { Farm } from "@/types/FarmListTableRowProps";
import type { StakeVault } from "@/app/AssetsContextProvider";
import { useRewardInfo } from "@/hooks/farm/useRewardInfo";
import { useReadContract } from "wagmi";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import { formatUnits } from "viem";

type Period = "1d" | "7d" | "30d";
type PeriodKey = "apr1d" | "apr7d" | "apr30d";

function ButtonSelector(props: {
  selected: Period;
  value: Period;
  setTab: (value: Period) => void;
  name: string;
}) {
  return (
    <Button
      className={clsx(
        "group p-0 flex max-h-max min-h-min min-w-min max-w-max flex-row",
        "data-[hover=true]:bg-transparent data-[hover=true]:opacity-70"
      )}
      data-selected={props.value === props.selected}
      radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={clsx(
          "text-[12px] font-semibold leading-[17px]",
          "group-data-[selected=true]:text-primary dark:group-data-[selected=true]:text-dark-green-key group-data-[selected=false]:text-default-500 dark:group-data-[selected=false]:text-default-200"
        )}
      >
        {props.name}
      </h2>
    </Button>
  );
}

export default function VaultInfoCard({
  period,
  onChangePeriod,
  rows,
  periodKey,
  onOpenModal,
  className,
  title = "Vaults",
  item,
  price,
  onOpenStakingModal,
  hasRewards,
  totalSupply,
}: {
  period: Period;
  onChangePeriod: (p: Period) => void;
  rows: VaultRowItem[];
  periodKey: PeriodKey;
  onOpenModal: (row: VaultRowItem) => void;
  className?: string;
  title?: string;
  item: Farm;
  price?: BigDecimal | null;
  onOpenStakingModal?: (row: VaultRowItem) => void;
  hasRewards: boolean;
  totalSupply?: number;
}) {
  // 🔥 여기서만 useRewardInfo 사용 (선택된 FarmDetail 인스턴스에서만)
  const {
    price: priceNum,
    matched,
    dailyPointNum,
    extraList,
    showStakingBlock,
  } = useRewardInfo(item, price);

  const hasAnyExtra = Array.isArray(extraList) && extraList.length > 0;
  const hasPointRate = Number.isFinite(dailyPointNum) && dailyPointNum > 0;

  // 🔥 Staking용 VaultRowItem 구성
  const stakingRow: VaultRowItem | null = useMemo(() => {
    const src = matched?.staking as StakeVault | undefined;
    if (!src) return null;

    const raw = (src as any)?.[periodKey];
    const aprNum = raw ? Number(raw) : 0;
    const pct = aprNum / 1e16;

    return {
      kind: "staking",
      name: `Staking - ${src.stakingToken}`,
      rawName: src.stakingToken,
      apy: pct,
      aprSource: src,
    };
  }, [matched, periodKey]);

  // Extra APR 미리 계산: Hooks는 여기서 한 번만 호출
  const extraAprMap = useMemo(() => {
    const base = priceNum || 0;
    const out: Record<string, number | null> = {};

    if (base <= 0 || !totalSupply || totalSupply <= 0) {
      // 전부 null로 둠
      for (const er of extraList) {
        const key = `${er.symbol}-${er.indexNumber}`;
        out[key] = null;
      }
      return out;
    }

    for (const er of extraList) {
      const key = `${er.symbol}-${er.indexNumber}`;
      const rewardPrice = er.priceUSD ?? 0;

      if (!rewardPrice || rewardPrice <= 0) {
        out[key] = null;
        continue;
      }

      const dailyRewardPerToken =
        Number(er.dailyRewardPerTokenX18) / 1e18 / Math.pow(10, er.decimals);

      const dailyRewardUsdPerToken = dailyRewardPerToken * rewardPrice;

      const tvlUsd = totalSupply * base;
      if (!Number.isFinite(tvlUsd) || tvlUsd <= 0) {
        out[key] = null;
        continue;
      }

      const dailyRate = dailyRewardUsdPerToken / tvlUsd;
      if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
        out[key] = null;
        continue;
      }

      out[key] = dailyRate * 365 * 100;
    }

    return out;
  }, [extraList, priceNum, totalSupply]);

  // console.log("VaultInfoCard render:", {
  //   dailyPointNum,
  //   priceNum,
  //   extraList,
  //   showStakingBlock,
  //   stakingRow,
  //   totalSupply,
  // });

  return (
    <div
      className={clsx("flex grow basis-0 flex-col min-h-[176px]", className)}
    >
      <div className="flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        <div className="flex flex-col gap-4">
          {/* 헤더 + 기간 선택 탭 */}
          <div className="flex flex-row items-center justify-between pb-4 max-md:pb-0">
            <SectionHeader>{title}</SectionHeader>

            <div className="flex justify-end gap-3">
              <ButtonSelector
                name="1d"
                selected={period}
                setTab={onChangePeriod}
                value="1d"
              />
              <ButtonSelector
                name="7d"
                selected={period}
                setTab={onChangePeriod}
                value="7d"
              />
              <ButtonSelector
                name="30d"
                selected={period}
                setTab={onChangePeriod}
                value="30d"
              />
            </div>
          </div>

          {/* Vault 리스트 */}
          {rows.length > 0 ? (
            <div className="flex flex-col gap-3">
              {rows.map((row, i) => (
                <VaultInfo
                  key={i}
                  item={row}
                  periodKey={periodKey}
                  onOpenModal={onOpenModal}
                />
              ))}
            </div>
          ) : (
            <div className="text-default-500">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <LoadingPulse w="w-60" />
                  <LoadingPulse w="w-20" />
                </div>
                <div className="flex justify-between">
                  <LoadingPulse w="w-60" />
                  <LoadingPulse w="w-20" />
                </div>
                <div className="flex justify-between">
                  <LoadingPulse w="w-60" />
                  <LoadingPulse w="w-20" />
                </div>
              </div>
            </div>
          )}

          {/* 모바일 전용 Staking 요약 블록 */}
          {hasRewards && (
            <Divider className="border-default-300 dark:border-default-100 md:hidden" />
          )}
          {hasRewards && showStakingBlock && stakingRow && (
            <div className="flex flex-col gap-3 rounded-2xl bg-background text-sm md:hidden">
              {/* 클릭 시 모달 오픈 */}
              <div
                className="flex items-center pb-1 cursor-pointer select-none transition-colors"
                role="button"
                tabIndex={0}
                onClick={() => {
                  onOpenStakingModal?.(stakingRow);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenStakingModal?.(stakingRow);
                  }
                }}
              >
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-default-800 dark:text-default-400">
                    Staking
                  </p>
                  <Icons.Info
                    className={clsx(
                      "fill-default-500 group-hover:fill-default-700",
                      "dark:fill-default-300 dark:group-hover:fill-default-600",
                      "transition-[fill]"
                    )}
                    fillRule="evenodd"
                  />
                </div>
                <div className="grow" />
                <span className="whitespace-nowrap font-semibold text-primary dark:text-dark-green-key">
                  Live
                </span>
              </div>

              {/* 포인트 레이트 표시 */}
              {hasPointRate && (
                <div className="flex w-full flex-row items-center gap-1.5">
                  <p className="font-medium text-default-800 dark:text-default-200">
                    Birdieswap Point
                  </p>
                  <div className="grow" />
                  <p className="whitespace-nowrap font-normal">
                    {format2(
                      dailyPointNum /
                        (priceNum || 1) /
                        (totalSupply || 1) /
                        1e18,
                      4
                    )}
                    /$
                  </p>
                </div>
              )}
              {/* Extra Rewards */}
              {hasAnyExtra &&
                extraList.map((er: any) => {
                  const key = `${er.symbol}-${er.indexNumber}`;
                  const aprPct = extraAprMap[key] ?? null;

                  if (aprPct == null || aprPct <= 0) return null;

                  return (
                    <div
                      key={key}
                      className="flex w-full flex-row items-center gap-1.5"
                    >
                      <p className="font-medium text-default-800 dark:text-default-200">
                        {er.displayName}
                      </p>
                      <div className="grow" />
                      <p className="whitespace-nowrap font-normal">
                        {aprPct == null
                          ? "0.00% APR"
                          : `${aprPct.toFixed(2)}% APR`}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
