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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );
  const items = FarmList;
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [inputValue, setInputValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [overrideQuery, setOverrideQuery] = useState<string | undefined>(
    undefined
  );

  console.log("FarmIndex", {
    selected,
    sortColumn,
    sortDirection,
    items,
    searchTerm,
  });

  const handleSetSelected: React.Dispatch<React.SetStateAction<Filter>> = (
    value
  ) => {
    setSelected((prev) => {
      const next =
        typeof value === "function"
          ? (value as (p: Filter) => Filter)(prev)
          : value;

      if (next === Filter.ALL) {
        // ★ ALL 버튼을 '클릭'한 매 순간, 현재 inputValue로 오버라이드(1회성)
        setOverrideQuery(inputValue.trim());
        setSearchTerm("");
      } else {
        // 다른 필터로 이동하면 오버라이드 해제
        setOverrideQuery(undefined);
      }

      return next;
    });
  };

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
          <FilterButtons selected={selected} setSelected={handleSetSelected} />
        </div>
        <div className="max-xl:grow max-md:pb-1">
          <SearchBox
            placeholder="Search Assets, Platforms"
            value={inputValue}
            // Input의 onChange 이벤트 핸들러 (Input이 ChangeEvent를 넘긴다고 가정)
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setInputValue(e.target.value);
            }}
            // 돋보기 버튼 클릭 시 (SearchBox 내부에서 props.onSearch를 호출하도록 구현됨)
            onSearch={(v) => {
              // 돋보기 클릭 시 커밋
              setSearchTerm((v ?? inputValue ?? "").trim());
              setOverrideQuery(undefined); // 검색 커밋되면 오버라이드 해제
            }}
            onKeyDown={(e) => {
              // Enter로 커밋
              if (e.key === "Enter") {
                e.preventDefault();
                setSearchTerm(inputValue.trim());
                setOverrideQuery(undefined); // 검색 커밋되면 오버라이드 해제
              }
            }}
          />
        </div>
      </div>
      <div className="w-full">
        <FarmListTable
          filter={selected}
          items={items}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          searchTerm={searchTerm} // <-- 검색어 전달 (돋보기 혹은 Enter로 설정된 값)
          overrideQuery={overrideQuery}
        />
      </div>
    </section>
  );
}
