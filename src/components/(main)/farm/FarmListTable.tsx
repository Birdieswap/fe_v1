"use client";

import { Image, Skeleton } from "@heroui/react";
import { useContext, useMemo, useState } from "react";
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
  const items = props.items || FarmList;
  const { balances } = useContext(AssetsContext);
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
        const cmp =
          a[col] === b[col]
            ? 0
            : [a[col], b[col]].sort()[0] === a[col]
              ? -1
              : 1;

        return sortDirection === "asc" ? cmp : -cmp;
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
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
        />
      ))}
    </motion.div>
  );
}
