"use client";

import { Image, Skeleton } from "@heroui/react";
import { useContext, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useChainId } from "wagmi";

import { Farm, FarmTag, FarmType } from "@/types/FarmListTableRowProps";
import { FarmList } from "@/const/farmInfo";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

import FarmListTableRow from "./farming/FarmListTableRow";
import { FarmListTableHeader } from "./farming/FarmListTableHeader";
import { Filter } from "./page/FilterButtons";

export function CryptoTokenIcons({ profiles }: { profiles: IToken[] }) {
  return (
    <div className="flex w-20 flex-row-reverse items-center justify-end">
      {[...profiles].reverse().map((token) =>
        token.iconSrc ? (
          <Image
            key={token.symbol}
            alt={token.symbol}
            className="size-9 rounded-full"
            classNames={{
              wrapper: "mr-[-6px]",
            }}
            src={token.iconSrc}
          />
        ) : (
          <Skeleton key={token.symbol} className="size-9 rounded-full" />
        ),
      )}
    </div>
  );
}

function getFarmBalance(
  chainId: number,
  farm: Farm,
  singleVaultBalances?: Map<`0x${string}`, BigDecimal>,
  lpVaultBalances?: Map<`0x${string}`, BigDecimal>,
): BigDecimal | undefined {
  const vaultAddress = farm.wip_stakeToken?.addresses[chainId];

  if (!vaultAddress) return undefined;
  if (farm.type === FarmType.SINGLE) {
    return singleVaultBalances?.get(vaultAddress);
  }
  if (farm.type === FarmType.PAIR) {
    return lpVaultBalances?.get(vaultAddress);
  }

  return undefined;
}

export default function FarmListTable({
  sortColumn,
  sortDirection,
  filter,
  ...props
}: {
  items?: Farm[];
  filter?: Filter | null;
  sortColumn: keyof Farm | null;
  sortDirection: "asc" | "desc" | null;
}) {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const chainId = useChainId();
  
  const stakeTokenList = FarmList.map(farm => farm.wip_stakeToken);

  const { balances } = useContext(AssetsContext);
  const total = useContext(AssetsContext);

  // 1. farmStatusMap: address 키로 {apy, tvl, MyBalance} 저장 상태
  const [farmStatusMap, setFarmStatusMap] = useState<Record<string, {
    apy: number;
    tvl: number;
    MyBalance: number;
  }>>({});

  // 방어 로직 포함된 상태 업데이트 콜백
  const handleStatusUpdate = useCallback((
    address: string,
    status: { apy: BigDecimal; tvl: BigDecimal | null; MyBalance: BigDecimal | null }
  ) => {
    setFarmStatusMap(prev => {
      const prevStatus = prev[address];
      const newApy = Number(status.apy.toString());
      const newTvl = status.tvl ? Number(status.tvl.toString()) : 0;
      const newMyBalance = status.MyBalance ? Number(status.MyBalance.toString()) : 0;

      // 이전과 동일하면 변경 안 함 (무한 루프 방지)
      if (
        prevStatus &&
        prevStatus.apy === newApy &&
        prevStatus.tvl === newTvl &&
        prevStatus.MyBalance === newMyBalance
      ) {
        return prev;
      }

      return {
        ...prev,
        [address]: {
          apy: newApy,
          tvl: newTvl,
          MyBalance: newMyBalance,
        },
      };
    });
  }, []);

  // 3. balance 값은 getFarmBalance 같은 기존 함수로 FarmList 각 아이템별로 받아온다.
  // 예를 들어 이렇게 얻어온 값을 farmStatus에서 관리하지 말고 그대로 row에 전달하여 계산에 쓰게 한다.

  // 4. 업데이트된 farmList 작성: 기존 FarmList에 farmStatusMap값을 병합
  const updatedFarmList = useMemo(() => {
    return FarmList.map(farm => {
      const addr = farm.wip_stakeToken.addresses;
      const stat = farmStatusMap[addr[chainId]];
      return {
        ...farm,
        apy: stat?.apy ?? farm.apy,
        tvl: stat?.tvl ?? farm.tvl,
        MyBalance: stat?.MyBalance ?? farm.MyBalance,
      };
    });
  }, [farmStatusMap]);

  const items = updatedFarmList;

  console.log("FarmListTable total", total, " mergedFarmList!!!", updatedFarmList); // Debugging line to check items and balances
 
  
    const sortedItems = useMemo(() => {
    const col = sortColumn;

    const filteredItems = items.filter((item) => {
      switch (filter || Filter.ALL) {
        case Filter.ALL:
          return true;
        case Filter.SINGLE:
          return item.tags?.includes(FarmTag.SINGLE);
        case Filter.LP:
          return item.tags?.includes(FarmTag.LP);
        case Filter.STABLE:
          return item.tags?.includes(FarmTag.STABLE);
        case Filter.MY_FARM:
          return BigDecimal.ZERO().lt(
            getFarmBalance(
              chainId,
              item,
              balances?.singleVaultBalances.balanceMap,
              balances?.lpVaultBalances.balanceMap,
            ) ?? 0,
          );
        default:
          return false;
      }
    });

    if (col === null) {
      return filteredItems;
    } else {
      return filteredItems.sort((a, b) => {
        if (a[col] === b[col]) return 0;

          // a[col], b[col]이 BigDecimal 또는 객체인 경우 문자열→숫자 변환 시도
        const valA = typeof a[col] === "object" && a[col] != null && typeof a[col].toString === "function"
          ? Number(a[col].toString())
          : Number(a[col]);

        const valB = typeof b[col] === "object" && b[col] != null && typeof b[col].toString === "function"
          ? Number(b[col].toString())
          : Number(b[col]);

  // 숫자 비교 
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
  }, [
    sortColumn,
    items,
    filter,
    chainId,
    balances?.singleVaultBalances.balanceMap,
    balances?.lpVaultBalances.balanceMap,
    sortDirection,
  ]); 

  return (
    <motion.div
      className={clsx(
        "container grid origin-top items-center justify-center gap-x-1",
        "md:grid-cols-[2fr_4.5fr_2fr_2fr_3fr_72px]",
        "text-foreground max-md:grid-cols-[minmax(15%,min-content)_1fr_48px]",
      )}
      layout="size"
      transition={{ delay: -0.2 }}
    >
      <FarmListTableHeader />
      {sortedItems.map((item) => (
        <FarmListTableRow
          key={item.wip_stakeToken.fullName}
          balance={getFarmBalance(
            chainId,
            item,
            balances?.singleVaultBalances.balanceMap,
            balances?.lpVaultBalances.balanceMap,
          )}
          item={item}
          onUpdate={handleStatusUpdate} 
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          chainId={chainId}
        />

      ))}
    </motion.div>
  );
}
