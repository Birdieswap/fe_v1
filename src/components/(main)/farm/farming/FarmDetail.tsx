"use client";

import { useState, useMemo, useContext, useCallback } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useChainId, useReadContract } from "wagmi";
import { useDisclosure } from "@heroui/react";

import { Farm } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";

import FarmingPanels from "./detail/FarmingPanels";
import StakingPanels from "./detail/StakingPanels";
import VaultInfoCard from "./detail/VaultInfoCard";
import VaultInfoModal from "./detail/InfoCards/vaultInfo/VaultInfoModal";
import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";

import { AssetsContext, AprEntry } from "@/app/AssetsContextProvider";
import type { AprVault, StakeVault } from "@/app/AssetsContextProvider";
import RewardInfoCard from "./detail/RewardInfoCard";
import { formatUnits } from "viem";

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
  const { aprDataState, farmValues, refetchAll } = useContext(AssetsContext);
  const aprList: AprEntry[] = aprDataState?.apr ?? [];
  const priceMap = farmValues?.priceMap; // 필요시 사용

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

  // Vault 리스트에서 클릭할 때 모달 열기
  const handleOpenModal = useCallback(
    (rowItem: VaultRowItem) => {
      setSelectedStakeRow(rowItem);
      disclosure.onOpen();
    },
    [disclosure]
  );

  // 모바일 Staking 블록에서 모달 열기 (stakingRow 전달)
  const handleOpenStakingModal = useCallback(
    (rowItem: VaultRowItem) => {
      setSelectedStakeRow(rowItem);
      disclosure.onOpen();
    },
    [disclosure]
  );

  const stakingAddress = matched?.staking?.contractAddress;
  const {
    data: totalSupplyRaw,
    isLoading: isReadingTotal,
    refetch: refetchTotalSupply,
  } = useReadContract({
    address: stakingAddress,
    abi: birdieswap_staking_abi,
    functionName: "getTotalSupply",
    query: {
      enabled: Boolean(stakingAddress),
      refetchOnWindowFocus: false,
    },
  });

  const totalSupply = useMemo(() => {
    try {
      if (!totalSupplyRaw) return 0;
      return Number(
        formatUnits(totalSupplyRaw as bigint, item.wip_stakeToken.decimals)
      );
    } catch {
      return 0;
    }
  }, [totalSupplyRaw, item.wip_stakeToken.decimals]);
  // console.log("FarmDetail item", item, "price", price);

  const hasRewards =
    !!matched &&
    !!matched.staking &&
    (Number(matched.staking.dailyPoint) > 0 ||
      (matched.staking.extraRewards?.length ?? 0) > 0);

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
            <FarmingPanels
              item={item}
              price={price}
              totalBalance={totalBalance}
            />

            <StakingPanels
              item={item}
              selectedRow={selectedRow}
              lpBalance={lpBalance}
              stakedBalance={stakedBalance}
              totalBalance={totalBalance}
              price={price}
              hasRewards={hasRewards}
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
              item={item} // ⬅️ useRewardInfo용
              price={price} // ⬅️ useRewardInfo용
              onOpenStakingModal={handleOpenStakingModal} // ⬅️ 모바일 Staking
              hasRewards={hasRewards}
              totalSupply={totalSupply}
            />

            <RewardInfoCard
              item={item}
              price={price}
              onOpenStakingModal={handleOpenModal}
              hasRewards={hasRewards}
              totalSupply={totalSupply}
              stakedBalance={stakedBalance}
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
