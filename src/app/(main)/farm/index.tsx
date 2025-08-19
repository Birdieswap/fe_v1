"use client";

import { useState } from "react";

import FarmListTable from "@/components/(main)/farm/FarmListTable";
import { Farm } from "@/types/FarmListTableRowProps";
import FilterButtons, {
  Filter,
} from "@/components/(main)/farm/page/FilterButtons";
import SearchBox from "@/components/atoms/SearchBox";
import SortPopover from "@/components/(main)/farm/page/SortPopover";
import { FarmList } from "@/const/farmInfo";

export default function FarmIndex() {
  const [selected, setSelected] = useState<Filter>(Filter.ALL);
  const [sortColumns, setSortColumns] = useState<Set<keyof Farm>>(new Set());
  const sortColumn = sortColumns.size > 0 ? Array.from(sortColumns)[0] : null;
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const items = FarmList;
  const [isSortOpen, setIsSortOpen] = useState(false);
  console.log("FarmIndex", { selected, sortColumn, sortDirection, items });

  return (
    <section className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full flex-row items-center max-lg:flex-wrap-reverse max-md:gap-2 max-md:px-4 max-md:py-2 md:gap-4">
        <div className="flex grow flex-row items-center max-md:gap-2 max-md:overflow-x-scroll max-md:py-0.5 md:gap-4">
          <SortPopover
            isSortOpen={isSortOpen}
            setIsSortOpen={setIsSortOpen}
            setSortColumns={setSortColumns}
            sortColumn={sortColumn}
            sortColumns={sortColumns}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
          />
          <FilterButtons selected={selected} setSelected={setSelected} />
        </div>
        <div className="max-xl:grow max-md:pb-1">
          <SearchBox placeholder="Search Assets, Platforms" />
        </div>
      </div>
      <div className="w-full">
        <FarmListTable
          filter={selected}
          items={items}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </div>
    </section>
  );
}
