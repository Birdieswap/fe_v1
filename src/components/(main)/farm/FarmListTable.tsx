"use client";

import { Image, Skeleton } from "@heroui/react";
import { useContext, useMemo, useState, useCallback, useEffect } from "react";
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

type FarmStatus = {
  apy: BigDecimal;
  tvl: BigDecimal | null;
  MyBalance: BigDecimal | null;
  price: BigDecimal | null; // 표시용으로 Row에 직접 넘길 때 사용
};

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
        )
      )}
    </div>
  );
}

export default function FarmListTable({
  sortColumn,
  sortDirection,
  filter,
  searchTerm,
  overrideQuery,
  ...props
}: {
  items?: Farm[];
  filter?: Filter | null;
  sortColumn: keyof Farm | null;
  sortDirection: "asc" | "desc" | null;
  searchTerm?: string;
  overrideQuery?: string; // ★ 추가
}) {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const chainId = useChainId();

  const total = useContext(AssetsContext);

  const balances = total?.balances;

  const [farmStatusMap, setFarmStatusMap] = useState<
    Record<`0x${string}`, FarmStatus>
  >({});

  // 각 맵들: 없으면 빈 Map로 처리해 안정성 확보
  const apyMap = total?.farmValues?.apyMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;
  const tvlMap = total?.farmValues?.tvlMap as
    | Map<`0x${string}`, BigDecimal | null>
    | undefined;
  const priceMap = total?.farmValues?.priceMap as
    | Map<`0x${string}`, BigDecimal | null>
    | undefined;

  const singleBalanceMap = balances?.singleVaultBalances?.balanceMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;
  const lpBalanceMap = balances?.lpVaultBalances?.balanceMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;

  const getFarmBalance = useCallback(
    (address: `0x${string}`): BigDecimal | null => {
      if (!address) return null;
      const s = singleBalanceMap?.get(address);
      if (s) return s;
      const l = lpBalanceMap?.get(address);
      if (l) return l;
      return null;
    },
    [singleBalanceMap, lpBalanceMap]
  );

  useEffect(() => {
    if (!apyMap || !tvlMap || !priceMap) return;

    setFarmStatusMap((prev) => {
      let next = prev;

      for (const farm of FarmList) {
        const address = farm.wip_stakeToken.addresses?.[chainId] as
          | `0x${string}`
          | undefined;
        if (!address) continue;

        const apy = apyMap.get(address) ?? BigDecimal.ZERO();
        const tvl = tvlMap.get(address) ?? null;
        const price = priceMap.get(address) ?? null;
        const balance = getFarmBalance(address);

        const MyBalance = balance && price ? balance.mul(price) : null;

        next = {
          ...next,
          [address]: {
            apy,
            tvl,
            MyBalance,
            price, // Row에 직접 내려줄 용도
          },
        };
      }

      return next;
    });
  }, [chainId, apyMap, tvlMap, priceMap, getFarmBalance]);

  const updatedFarmList = useMemo(() => {
    return FarmList.map((farm) => {
      const address = farm.wip_stakeToken.addresses?.[chainId] as
        | `0x${string}`
        | undefined;
      const stat = address ? farmStatusMap[address] : undefined;

      const toNum = (v: BigDecimal | null | undefined): number => {
        if (!v) return 0;
        try {
          // 소수점 반영된 문자열을 number로 변환(표시·정렬 목적)
          return parseFloat(v.toString());
        } catch {
          return 0;
        }
      };

      return {
        ...farm,
        apy: toNum(stat?.apy), // number
        tvl: toNum(stat?.tvl), // number
        MyBalance: toNum(stat?.MyBalance), // number
      };
    });
  }, [chainId, farmStatusMap]);
  //console.log("FarmListTable updatedFarmList:", updatedFarmList);

  const qSearchTerm = (searchTerm ?? "").trim().toLowerCase();
  const qOverride = (overrideQuery ?? "").trim().toLowerCase();
  const q =
    filter === Filter.ALL && overrideQuery !== undefined
      ? qOverride
      : qSearchTerm;

  const searchedItems = useMemo(() => {
    if (!q) return updatedFarmList;
    return updatedFarmList.filter((item) => {
      if (item.name && String(item.name).toLowerCase().includes(q)) return true;
      if (
        Array.isArray(item.tags) &&
        item.tags.some((t) => String(t).toLowerCase().includes(q))
      )
        return true;
      const providerName = item.wip_stakeToken?.provider?.name;
      if (providerName && String(providerName).toLowerCase().includes(q))
        return true;
      return false;
    });
  }, [updatedFarmList, q, filter, overrideQuery, searchTerm]); // ★ overrideQuery 포함

  const items = searchedItems;

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
            getFarmBalance(item.wip_stakeToken.addresses?.[chainId]) ?? 0
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
        const valA =
          typeof a[col] === "object" &&
          a[col] != null &&
          typeof a[col].toString === "function"
            ? Number(a[col].toString())
            : Number(a[col]);

        const valB =
          typeof b[col] === "object" &&
          b[col] != null &&
          typeof b[col].toString === "function"
            ? Number(b[col].toString())
            : Number(b[col]);

        // 숫자 비교
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        //(console.log("FarmListTable sorting:", filteredItems));
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
        "text-foreground max-md:grid-cols-[minmax(15%,min-content)_1fr_48px]"
      )}
      layout="size"
      transition={{ delay: -0.2 }}
    >
      <FarmListTableHeader />
      {sortedItems.map((item) => {
        const address = item.wip_stakeToken.addresses?.[chainId] as
          | `0x${string}`
          | undefined;
        if (!address) return null;

        const apy = apyMap?.get(address)?.mul(100) ?? BigDecimal.ZERO();
        const tvl = tvlMap?.get(address) ?? null;
        const price = priceMap?.get(address) ?? null;

        const balance = getFarmBalance(address) ?? undefined;

        return (
          <FarmListTableRow
            key={address}
            item={item}
            balance={balance}
            apy={apy}
            tvl={tvl}
            price={price}
            selectedRow={selectedRow}
            setSelectedRow={setSelectedRow}
            chainId={chainId}
          />
        );
      })}
    </motion.div>
  );
}
