import { Listbox, ListboxItem } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

import { Farm } from "@/types/FarmListTableRowProps";

export default function SortOptions({
  sortColumns,
  setSortColumns,
}: {
  sortColumns: Set<keyof Farm>;
  setSortColumns: Dispatch<SetStateAction<Set<keyof Farm>>>;
}) {
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
      onSelectionChange={(v) => {
        setSortColumns(v as Set<keyof Farm>);
      }}
    >
      {/* <ListboxItem key="birdRate">Birdie Index</ListboxItem> */}
      <ListboxItem key="apy">APY (%)</ListboxItem>
      <ListboxItem key="tvl">TVL ($)</ListboxItem>
      <ListboxItem key="balance">Balance ($)</ListboxItem>
    </Listbox>
  );
}
