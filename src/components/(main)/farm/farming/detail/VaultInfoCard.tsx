// VaultInfoCard.tsx
"use client";

import { Button, Divider } from "@heroui/react";
import clsx from "clsx";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingPulse } from "./stakingPanels/common/LoadingPulse";
import type { VaultRowItem } from "../../../farm/farming/FarmDetail";
import VaultInfo from "./InfoCards/VaultInfo";
import Icons from "@/assets/icons/icons"; // ⬅️ 추가
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal"; // ⬅️ 추가
import { BigDecimal } from "@/types/BigDecimal";

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

type MobileStakingProps = {
  show: boolean;
  extraList: Array<{
    symbol: string;
    displayName: string;
    dailyRewardPerTokenX18: string | number;
    decimals: number;
  }>;
  dailyPointRateNum: number;
  priceNum: number; // 스테이킹 토큰 가격
  onOpen: () => void; // 스테이킹 모달 열기
};

export default function VaultInfoCard({
  period,
  onChangePeriod,
  rows,
  periodKey,
  onOpenModal,
  className,
  title = "Vaults",
  mobileStaking, // ⬅️ 추가
}: {
  period: Period;
  onChangePeriod: (p: Period) => void;
  rows: VaultRowItem[];
  periodKey: PeriodKey;
  onOpenModal: (row: VaultRowItem) => void;
  className?: string;
  title?: string;
  mobileStaking?: MobileStakingProps; // ⬅️ 추가
}) {
  const hasAnyExtra =
    Array.isArray(mobileStaking?.extraList) &&
    (mobileStaking?.extraList?.length ?? 0) > 0;

  const hasPointRate =
    typeof mobileStaking?.dailyPointRateNum === "number" &&
    Number.isFinite(mobileStaking.dailyPointRateNum) &&
    mobileStaking.dailyPointRateNum > 0;

  return (
    <div
      className={clsx("flex grow basis-0 flex-col min-h-[176px]", className)}
    >
      <div className="flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        <div className="flex flex-col gap-4">
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

          {/* ⬇️⬇️ 모바일 전용 Staking 요약 블록 */}
          <Divider className="border-default-300 dark:border-default-100 md:hidden" />
          {mobileStaking?.show && (
            <div className="flex flex-col gap-3 rounded-2xl bg-background text-sm md:hidden">
              <div
                className="flex items-center pb-1 cursor-pointer select-none transition-colors"
                role="button"
                tabIndex={0}
                onClick={mobileStaking.onOpen}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    mobileStaking.onOpen();
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

              <div className="flex w-full flex-row items-center gap-1.5">
                <p className="font-medium text-default-800 dark:text-default-200">
                  Birdieswap Point
                </p>
                <div className="grow" />
                <p className="whitespace-nowrap font-normal">
                  {hasPointRate
                    ? format2(
                        mobileStaking.dailyPointRateNum /
                          (mobileStaking.priceNum || 1) /
                          1e18,
                        2
                      )
                    : "0.00"}{" "}
                  /$
                </p>
              </div>

              {hasAnyExtra &&
                mobileStaking.extraList.map((er) => {
                  const daily =
                    Number(er.dailyRewardPerTokenX18) /
                    1e18 /
                    Math.pow(10, er.decimals) /
                    (mobileStaking.priceNum || 1);
                  const aprPct = daily * 365 * 100;
                  return (
                    <div
                      key={er.symbol}
                      className="flex w-full flex-row items-center gap-1.5"
                    >
                      <p className="font-medium text-default-800 dark:text-default-200">
                        {er.displayName}
                      </p>
                      <div className="grow" />
                      <p className="whitespace-nowrap font-normal">
                        {aprPct.toFixed(2)}% APR
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
          {/* ↑↑↑ 모바일 전용 끝 */}
        </div>
      </div>
    </div>
  );
}
