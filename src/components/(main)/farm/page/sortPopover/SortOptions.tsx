import { Listbox, ListboxItem } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

import { Farm } from "@/types/FarmListTableRowProps";

// type SortableColumn = keyof Farm;

// const SORTABLE_COLUMNS: Array<{ key: SortableColumn; label: string }> = [
//   { key: 'apy', label: 'APY (%)' },
//   { key: 'tvl', label: 'TVL ($)' },
//   { key: 'MyBalance', label: 'Balance ($)' }
// ];

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

  // HeroUI Selection 타입을 올바르게 처리
  function onSelectionChange(keys: any) {
    let selectedValue: keyof Farm | null = null;
    
    // Selection 타입 처리: Set, string, number, "all" 등을 고려
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

    // 정렬 로직: 같은 컬럼 클릭 시 desc -> asc -> null 순환
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

