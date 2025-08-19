import { Listbox, ListboxItem } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

import { Farm } from "@/types/FarmListTableRowProps";

export default function SortOptions({
  sortColumns,
  setSortColumns,
  sortDirection,
  setSortDirection
}: {
  sortColumns: Set<keyof Farm>;
  setSortColumns: Dispatch<SetStateAction<Set<keyof Farm>>>;
  sortDirection: "asc" | "desc" | null;
  setSortDirection: Dispatch<SetStateAction<"asc" | "desc" | null>>;
}) {
  const selectedColumn = sortColumns.size > 0 ? Array.from(sortColumns)[0] : null;

  function onSelectionChange(keys: any) {
    let selectedValue: keyof Farm | null = null;

    if (!keys || keys === "all") {
      selectedValue = null;
    } else if (typeof keys === "string" || typeof keys === "number") {
      selectedValue = keys as keyof Farm;
    } else if (keys instanceof Set) {
      const firstKey = Array.from(keys)[0];
      selectedValue = firstKey ? (firstKey as keyof Farm) : null;
    }

    if (!selectedValue) {
      setSortColumns(new Set());
      setSortDirection(null);
      return;
    }

    if (selectedColumn !== selectedValue) {
      setSortColumns(new Set([selectedValue]));
      setSortDirection("desc");
    } else {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortColumns(new Set());
      } else {
        setSortDirection("desc");
      }
    }
  }

  // selectedKeys는 Set<string> 타입이어야 하므로 string 변환 처리
  const selectedKeys = selectedColumn
    ? new Set([String(selectedColumn)])
    : new Set();

  return (
    <Listbox
      hideSelectedIcon
      classNames={{ base: "p-0", list: "gap-0" }}
      color="default"
      itemClasses={{
        base: clsx(
          "box-border rounded-none border-1 border-b-0 first:rounded-t-xl last:rounded-b-xl last:border-b-1 w-[109px] h-[38px] text-[15px]",
          "border-default-300 bg-background dark:border-default-100 dark:bg-dark_swap_bg",
          "data-[selected=true]:border-default-300 data-[selected=true]:bg-default-100",
          "data-[hover=true]:border-default-300 data-[hover=true]:bg-default-200",
          "data-[selectable=true]:focus:border-default-300 data-[selectable=true]:focus:bg-default-100",
          "dark:data-[selected=true]:border-default-100 dark:data-[selected=true]:bg-default-100",
          "dark:data-[hover=true]:border-default-200 dark:data-[hover=true]:bg-default-200",
          "dark:data-[selectable=true]:focus:border-default-200 dark:data-[selectable=true]:focus:bg-dark_default-100",
        ),
      }}
      selectedKeys={sortColumns}
      selectionMode="single"
      variant="bordered"
      onSelectionChange={onSelectionChange}
    >
      {/* <ListboxItem key="birdRate">Birdie Index</ListboxItem> */}
      <ListboxItem key="apy">APY (%)</ListboxItem>
      <ListboxItem key="tvl">TVL ($)</ListboxItem>
      <ListboxItem key="MyBalance">Balance ($)</ListboxItem>
    </Listbox>
  );
}

