import { Button, cn, Spinner, useDisclosure } from "@heroui/react";

import { Farm } from "@/types/FarmListTableRowProps";

import { SectionHeader } from "../common/SectionHeader";

import VaultInfo from "./earningsPanel/VaultInfo";
import RewardInfoRow from "./earningsPanel/RewardInfoRow";
import { useState, useMemo, useContext, useCallback } from "react";
import { useChainId } from "wagmi";
import { AssetsContext } from "@/app/AssetsContextProvider";
import {
  AprEntry,
  aprDataState,
  AprVault,
  StakeVault,
  ExtraRewards,
} from "@/app/AssetsContextProvider";
import Icons from "@/assets/icons/icons";
import clsx from "clsx";
import VaultInfoModal from "./earningsPanel/vaultInfo/VaultInfoModal";
import { BigDecimal } from "@/types/BigDecimal";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";
import { LoadingPulse } from "./stakingPanels/common/LoadingPulse";

type Period = "1d" | "7d" | "30d";
type PeriodKey = "apr1d" | "apr7d" | "apr30d";

export type VaultRowItem = {
  kind: "vault" | "staking";
  name: string;
  rawName: string;
  apy: number;
  aprSource: AprVault | StakeVault;
};

function ButtonSelector(props: {
  selected: Period;
  value: Period;
  setTab: (value: Period) => void;
  name: string;
}) {
  return (
    <Button
      className={cn(
        "group p-0 flex max-h-max min-h-min min-w-min max-w-max flex-row",
        "data-[hover=true]:bg-transparent data-[hover=true]:opacity-70"
      )}
      data-selected={props.value === props.selected}
      radius="none"
      variant="light"
      onPress={() => props.setTab(props.value)}
    >
      <h2
        className={cn(
          "text-[12px] font-semibold leading-[17px]",
          "group-data-[selected=true]:text-primary group-data-[selected=false]:text-default-600 dark:group-data-[selected=false]:text-default-400"
        )}
      >
        {props.name}
      </h2>
    </Button>
  );
}

export default function EarningsPanel({
  item,
  selectedRow,
}: {
  item: Farm;
  selectedRow: string | null;
}) {
  const [tab, setTab] = useState<Period>("7d");
  const chainId = useChainId();
  const { aprDataState, farmValues } = useContext(AssetsContext);
  const aprList: AprEntry[] = aprDataState?.apr ?? [];
  const disclosure = useDisclosure();
  const [selectedStakeRow, setSelectedStakeRow] = useState<VaultRowItem | null>(
    null
  );
  const priceMap = farmValues?.priceMap;
  const periodKey: PeriodKey = useMemo(() => {
    if (tab === "1d") return "apr1d";
    if (tab === "7d") return "apr7d";
    return "apr30d";
  }, [tab]);

  // console.log("EarningsPanel", item.details.rewards);

  const stakeAddr = item?.wip_stakeToken?.addresses?.[chainId];

  const stakeAddrLower = (stakeAddr ?? "").toLowerCase();
  const chainIdStr = (() => {
    const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
      .toString()
      .trim()
      .toLowerCase();

    return mode === "dev" ? "0" : String(chainId);
  })();

  // APR 엔트리 매칭
  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chainId === chainIdStr &&
          (e.contractAddress ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddr]
  );

  const stakeTokenAddress: `0x${string}` =
    matched?.contractAddress as `0x${string}`;
  const price: number = priceMap?.get(stakeTokenAddress)?.toNumber() as number;

  const toRowItem = (
    src: AprVault,
    kind: "vault" | "staking"
  ): VaultRowItem => {
    const raw = src?.[periodKey];
    const aprNum = raw ? Number(raw) : 0;
    const pct = aprNum / 1e16;
    return {
      kind,
      name: kind === "staking" ? `Staking - ${src.name}` : src.name,
      rawName: src.name,
      apy: pct,
      aprSource: src,
    };
  };

  const combinedRows: VaultRowItem[] = useMemo(() => {
    return (matched?.vaults ?? []).map((v) => toRowItem(v, "vault"));
  }, [matched, periodKey]);

  // console.log(
  //   "EarningsPanel item",
  //   matched,
  //   stakeTokenAddress,
  //   priceMap?.get(stakeTokenAddress),
  //   price
  // );

  // const [modalItem, setModalItem] = useState<any | null>(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback(
    (rowItem: VaultRowItem) => {
      setSelectedStakeRow(rowItem);
      disclosure.onOpen();
    },
    [disclosure]
  );

  const openStakingModal = useCallback(() => {
    if (!matched?.staking) return;

    const stakingRow: VaultRowItem = {
      kind: "staking",
      name: "Staking",
      rawName: "Staking",
      apy: 0,
      aprSource: matched.staking,
    };

    setSelectedStakeRow(stakingRow);
    disclosure.onOpen();
  }, [matched?.staking, disclosure]);

  const dprRaw = matched?.staking?.dailyPointRate as string;
  const dailyPointRateNum = Number(
    typeof dprRaw === "string" || typeof dprRaw === "number" ? dprRaw : 0
  );
  // console.log("EarningsPanel dprRaw", dprRaw, dailyPointRateNum, price);
  const hasPointRate =
    Number.isFinite(dailyPointRateNum) && dailyPointRateNum > 0;

  const extra = matched?.staking?.extraRewards;
  const hasAnyExtra = Array.isArray(extra) && extra.length > 0;

  const showStakingBlock =
    Boolean(matched?.staking) && (hasAnyExtra || hasPointRate);

  const canRenderStakeDetail = (matched?.staking?.contractAddress ?? "") !== "";

  return (
    <div className="mt-2 flex grow basis-0 flex-col">
      <div className="mb-3 mt-[14px] flex grow basis-0 flex-col gap-4 rounded-2xl bg-background p-4 text-sm">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center">
            <SectionHeader>Vaults</SectionHeader>

            <div className="flex justify-end gap-3">
              <ButtonSelector
                name="1d"
                selected={tab}
                setTab={setTab}
                value="1d"
              />
              <ButtonSelector
                name="7d"
                selected={tab}
                setTab={setTab}
                value="7d"
              />
              <ButtonSelector
                name="30d"
                selected={tab}
                setTab={setTab}
                value="30d"
              />
            </div>
          </div>
          {combinedRows.length > 0 ? (
            <div className="flex flex-col gap-2">
              {combinedRows.map((row, i) => (
                <VaultInfo
                  key={i}
                  item={row}
                  periodKey={periodKey}
                  onOpenModal={handleOpenModal}
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
        {showStakingBlock && (
          <div className="flex flex-col gap-2 rounded-2xl bg-background text-sm">
            <div
              className="flex items-center cursor-pointer select-none
                 transition-colors"
              role="button"
              tabIndex={0}
              onClick={openStakingModal}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStakingModal();
                }
              }}
            >
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-default-800 dark:text-default-700">
                  Staking
                </p>
                <Icons.Info
                  className={clsx(
                    "fill-default-500 group-hover:fill-default-700",
                    "dark:fill-default-800 dark:group-hover:fill-default-600",
                    "transition-[fill]"
                  )}
                  fillRule="evenodd"
                />
              </div>
              <div className="grow" />
              <span className="whitespace-nowrap font-semibold text-primary">
                Live
              </span>
            </div>

            {hasAnyExtra &&
              (matched!.staking!.extraRewards ?? []).map((er) => {
                const daily =
                  Number(er.dailyRewardPerTokenX18) /
                  1e18 /
                  Math.pow(10, er.decimals) /
                  price;
                const aprPct = daily * 365 * 100;
                return (
                  <div
                    key={er.symbol}
                    className="flex w-full flex-row items-center gap-1.5"
                  >
                    <p className="font-medium text-default-800 dark:text-default-700">
                      {er.displayName}
                    </p>
                    <div className="grow" />
                    <p className="whitespace-nowrap font-normal">
                      {aprPct.toFixed(2)}% APR
                    </p>
                  </div>
                );
              })}

            {hasPointRate && (
              <div className="flex w-full flex-row items-center gap-1.5">
                <p className="font-medium text-default-800 dark:text-default-700">
                  Birdieswap Point
                </p>
                <div className="grow" />
                <p className="whitespace-nowrap font-normal">
                  {format2(dailyPointRateNum / price / 1e18, 2)} point/$
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* {canRenderStakeDetail && (
        <>
          <div className="mb-3 pl-2">
            <SectionHeader>Unlock more benefits</SectionHeader>
          </div>
          <StakeDetail
            item={item}
            selectedRow={selectedRow}
            matched={matched}
          />
        </>
      )} */}

      {selectedStakeRow && (
        <VaultInfoModal
          item={selectedStakeRow}
          disclosure={disclosure}
          onJustClosed={() => setSelectedStakeRow(null)}
        />
      )}
    </div>
  );
}
