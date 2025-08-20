import { Listbox, ListboxItem } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";

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

  // selectedKeys는 라이브러리 문서에 따라 배열로 넘김 (React.Key[])
  const selectedKeys = useMemo(() => {
    return selectedColumn ? [String(selectedColumn)] : [];
  }, [selectedColumn]);

  // function onSelectionChange(keys: any) {
  //   let selectedValue: keyof Farm | null = null;

  //   if (!keys || keys === "all") {
  //     selectedValue = null;
  //   } else if (typeof keys === "string" || typeof keys === "number") {
  //     selectedValue = keys as keyof Farm;
  //   } else if (keys instanceof Set) {
  //     const firstKey = Array.from(keys)[0];
  //     selectedValue = firstKey ? (firstKey as keyof Farm) : null;
  //   }

  //   if (!selectedValue) {
  //     setSortColumns(new Set());
  //     setSortDirection(null);
  //     return;
  //   }

  //   if (selectedColumn !== selectedValue) {
  //     setSortColumns(new Set([selectedValue]));
  //     setSortDirection("desc");
  //   } else {
  //     if (sortDirection === "desc") {
  //       setSortDirection("asc");
  //     } else if (sortDirection === "asc") {
  //       setSortDirection(null);
  //       setSortColumns(new Set());
  //     } else {
  //       setSortDirection("desc");
  //     }
  //   }
  // }

// robust한 키 추출: 라이브러리마다 onAction 시그니처가 다르므로 여러 형태 처리
// robust한 handler: key 문자열을 받아 순환 로직 수행
  const handleAction = useCallback((keyStr: string | null) => {
    // 디버깅: 매 클릭마다 찍히는지 확인
    // console.log("handleAction key:", keyStr);

    const selectedValue = keyStr ? (keyStr as keyof Farm) : null;

    if (!selectedValue) {
      setSortColumns(new Set());
      setSortDirection(null);
      return;
    }

    // 다른 컬럼 클릭 -> 해당 컬럼으로 바꾸고 기본 desc
    if (selectedColumn !== selectedValue) {
      setSortColumns(new Set([selectedValue]));
      setSortDirection("desc");
      return;
    }

    // 같은 컬럼 반복 클릭: desc -> asc -> null -> desc ...
    if (sortDirection === "desc") {
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection(null);
      setSortColumns(new Set());
    } else {
      setSortDirection("desc");
    }
  }, [selectedColumn, sortDirection, setSortColumns, setSortDirection]);

  
  return (
    <Listbox
      aria-label="Sort options" 
      hideSelectedIcon
      classNames={{ base: "p-0", list: "gap-0" }}
      color="default"
      itemClasses={{
        base: clsx(
          "box-border rounded-none border-1 border-b-0 first:rounded-t-xl last:rounded-b-xl last:border-b-1 w-[109px] h-[38px] text-[14px]",
          "border-default-300 bg-background dark:border-default-100 dark:bg-dark_swap_bg",
          "data-[selected=true]:border-default-300 data-[selected=true]:bg-default-100",
          "data-[hover=true]:border-default-300 data-[hover=true]:bg-default-200",
          "data-[selectable=true]:focus:border-default-300 data-[selectable=true]:focus:bg-default-100",
          "dark:data-[selected=true]:border-default-100 dark:data-[selected=true]:bg-default-100",
          "dark:data-[hover=true]:border-default-200 dark:data-[hover=true]:bg-default-200",
          "dark:data-[selectable=true]:focus:border-default-200 dark:data-[selectable=true]:focus:bg-dark_default-100",
        ),
      }}
      selectedKeys={selectedKeys}
      selectionMode="single"
      selectionBehavior="replace"
      variant="bordered"
      // 라이브러리 레벨 onAction는 남겨두되, item-level onClick도 사용
      onAction={(k) => {
        // Listbox onAction은 key (React.Key)를 전달함. 디버깅용 로그:
        console.log("Listbox onAction key:", k);
        handleAction(k ? String(k) : null);
      }}
    >
      {/* <ListboxItem key="birdRate">Birdie Index</ListboxItem> */}
      <ListboxItem 
        key="apy" 
        textValue="APY (%)" 
        onClick={() => {
          console.log("Item onClick apy");
          handleAction("apy");
        }}>
          <div className="w-full h-full flex items-center justify-between px-0 py-1">
          <span>APY(%)</span>
          <span className="text-xs">
            {selectedColumn === "apy" ? (sortDirection === "desc" ? "↓" : sortDirection === "asc" ? "↑" : "") : ""}
          </span>
        </div>
        </ListboxItem>
      <ListboxItem
        key="tvl"
        textValue="TVL($)"
        onClick={() => {
          console.log("Item onClick tvl");
          handleAction("tvl");
        }}
      >
        <div className="w-full h-full flex items-center justify-between px-0 py-1">
          <span>TVL($)</span>
          <span className="text-xs">
            {selectedColumn === "tvl" ? (sortDirection === "desc" ? "↓" : sortDirection === "asc" ? "↑" : "") : ""}
          </span>
        </div>
      </ListboxItem>

      <ListboxItem
        key="MyBalance"
        textValue="Balance($)"
        onClick={() => {
          console.log("Item onClick MyBalance");
          handleAction("MyBalance");
        }}
      >
        <div className="w-full h-full flex items-center justify-between px-0 py-1">
          <span>Balance($)</span>
          <span className="text-xs">
            {selectedColumn === "MyBalance" ? (sortDirection === "desc" ? "↓" : sortDirection === "asc" ? "↑" : "") : ""}
          </span>
        </div>
      </ListboxItem>
    </Listbox>
  );
}

