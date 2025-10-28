"use client";

import { Button } from "@heroui/react";
import clsx from "clsx";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingPulse } from "./stakingPanels/common/LoadingPulse";
import type { VaultRowItem } from "../../../farm/farming/FarmDetail";
import VaultInfo from "./InfoCards/VaultInfo";

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
          "group-data-[selected=true]:text-primary group-data-[selected=false]:text-default-600 dark:group-data-[selected=false]:text-default-400"
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
}: {
  period: Period;
  onChangePeriod: (p: Period) => void;
  rows: VaultRowItem[];
  periodKey: PeriodKey;
  onOpenModal: (row: VaultRowItem) => void;
  className?: string;
  title?: string;
}) {
  return (
    <div className={clsx("flex grow basis-0 flex-col", className)}>
      <div className="flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between pb-4">
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
            <div className="flex flex-col gap-4">
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
        </div>
      </div>
    </div>
  );
}
