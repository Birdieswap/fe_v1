"use client";

import { useState, useMemo, useContext, useCallback } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useChainId } from "wagmi";
import { useDisclosure } from "@heroui/react";

import { Farm } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import { defaultTransition } from "@/const/presenceTransition";

import FarmingPanels from "./detail/FarmingPanels";
import StakingPanels from "./detail/StakingPanels";
import VaultInfoCard from "./detail/VaultInfoCard";
import VaultInfoModal from "./detail/InfoCards/vaultInfo/VaultInfoModal";

import { AssetsContext, AprEntry } from "@/app/AssetsContextProvider";
import type { AprVault, StakeVault } from "@/app/AssetsContextProvider";
import RewardInfoCard from "./detail/RewardInfoCard";
import { useRewardInfo } from "@/hooks/farm/useRewardInfo";

type Period = "1d" | "7d" | "30d";
type PeriodKey = "apr1d" | "apr7d" | "apr30d";

export type VaultRowItem = {
  kind: "vault" | "staking";
  name: string;
  rawName: string;
  apy: number;
  aprSource: AprVault | StakeVault;
};

export default function FarmDetail({
  item,
  selectedRow,
  price,
  lpBalance,
  stakedBalance,
  totalBalance,
}: {
  item: Farm;
  selectedRow: string | null;
  price: BigDecimal | null;
  lpBalance?: BigDecimal;
  stakedBalance?: BigDecimal;
  totalBalance?: BigDecimal;
}) {
  const isActive = selectedRow === item.wip_stakeToken.fullName;

  // ===== 상단 패널 애니메이션 세팅 =====
  const ENTER = { type: "tween", duration: 0.5, ease: [0.22, 0.61, 0.36, 1] };
  const EXIT = { type: "tween", duration: 0.32, ease: [0.4, 0.0, 1, 1] };

  // ===== 아래 카드용 상태/계산 (EarningsPanel에서 끌어옴) =====
  const [tab, setTab] = useState<Period>("7d");
  const periodKey: PeriodKey = useMemo(() => {
    if (tab === "1d") return "apr1d";
    if (tab === "7d") return "apr7d";
    return "apr30d";
  }, [tab]);

  const chainId = useChainId();
  const { aprDataState, farmValues } = useContext(AssetsContext);
  const aprList: AprEntry[] = aprDataState?.apr ?? [];
  const priceMap = farmValues?.priceMap;

  const stakeAddr = item?.wip_stakeToken?.addresses?.[chainId];
  const stakeAddrLower = (stakeAddr ?? "").toLowerCase();
  const chainIdStr = (() => {
    const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
      .toString()
      .trim()
      .toLowerCase();
    return mode === "dev" ? "0" : String(chainId);
  })();

  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chainId === chainIdStr &&
          (e.contractAddress ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddrLower]
  );

  // rows 계산
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

  // 모달 제어
  const disclosure = useDisclosure();
  const [selectedStakeRow, setSelectedStakeRow] = useState<VaultRowItem | null>(
    null
  );

  const handleOpenModal = useCallback(
    (rowItem: VaultRowItem) => {
      setSelectedStakeRow(rowItem);
      disclosure.onOpen();
    },
    [disclosure]
  );

  const {
    price: priceNum,
    dailyPointRateNum,
    extraList,
    showStakingBlock,
  } = useRewardInfo(item);

  const openStakingModal = useCallback(() => {
    // 필요하면 여기서 selectedStakeRow 세팅 후 모달 오픈
    disclosure.onOpen();
  }, [disclosure]);

  return (
    <AnimatePresence initial={false} mode="wait">
      {isActive && (
        <motion.div
          key={`${item.name}-farm-detail`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1, transition: ENTER }}
          exit={{ height: 0, opacity: 0, transition: EXIT }}
          style={{ overflow: "hidden", willChange: "height, opacity" }}
          className={clsx(
            "flex w-full flex-col gap-4 overflow-hidden  px-4 py-6 bg-default-100 dark:bg-dark-popup-bg",
            "md:col-span-6",
            "max-md:col-span-3 max-md:row-span-2"
          )}
          data-selected={isActive}
        >
          {/* 상단: Farming / Staking 패널 */}
          <div className="flex w-full gap-4 md:flex-row max-md:flex-col">
            <FarmingPanels item={item} price={price} />

            <StakingPanels
              item={item}
              selectedRow={selectedRow}
              lpBalance={lpBalance}
              stakedBalance={stakedBalance}
              totalBalance={totalBalance}
              price={price}
            />
          </div>

          {/* 하단: 좌/우 카드 */}
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 items-start">
            <VaultInfoCard
              period={tab}
              onChangePeriod={setTab}
              rows={combinedRows}
              periodKey={periodKey}
              onOpenModal={handleOpenModal}
              mobileStaking={{
                show: showStakingBlock,
                extraList,
                dailyPointRateNum,
                priceNum,
                onOpen: openStakingModal,
              }}
            />

            {/* RewardInfoCard가 준비되면 여기에 배치하세요 */}
            <RewardInfoCard
              item={item}
              price={price} // FarmDetail에서 내려주는 BigDecimal|null
              onOpenStakingModal={handleOpenModal} // 선택
            />
          </div>

          {/* Vault 상세 모달 */}
          {selectedStakeRow && (
            <VaultInfoModal
              item={selectedStakeRow}
              disclosure={disclosure}
              onJustClosed={() => setSelectedStakeRow(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
