import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

import { Farm } from "@/types/FarmListTableRowProps";
import Icons from "@/assets/icons/icons";

import SortOptions from "./sortPopover/SortOptions";

export default function SortPopover({
  isSortOpen,
  setIsSortOpen,
  sortColumn,
  sortColumns,
  setSortColumns,
  sortDirection,
  setSortDirection
}: {
  isSortOpen: boolean;
  setIsSortOpen: Dispatch<SetStateAction<boolean>>;
  sortColumn: keyof Farm | null;
  sortColumns: Set<keyof Farm>;
  setSortColumns: Dispatch<SetStateAction<Set<keyof Farm>>>;
  sortDirection: "asc" | "desc" | null;
  setSortDirection: Dispatch<SetStateAction<"asc" | "desc" | null>>;
}) {
  return (
    <Popover
      isOpen={isSortOpen}
      placement="bottom-start"
      onClose={() => setIsSortOpen(false)}
      onOpenChange={setIsSortOpen}
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          className={clsx(
            "flex items-center justify-center border-1",
            "w-9 min-w-9 max-w-9",
            "h-9 max-h-9 min-h-9 ",
            "data-[hover=true]:opacity-100 dark:border-default-800 dark:text-default-600",
            "border-default-400 bg-transparent text-default-800 data-[hover=true]:bg-default-400/20",
            "data-[selected=true]:border-default-600 data-[selected=true]:bg-primary-200 data-[selected=true]:dark:bg-dark_mid_mint",
            "hover:border-default-600 hover:bg-default-100",
            "aria-expanded:opacity-100",
          )}
          data-selected={sortColumn !== null}
          radius="full"
        >
          <Icons.Sort
            className="size-6 fill-foreground stroke-foreground data-[selected=true]:dark:fill-background data-[selected=true]:dark:stroke-background"
            fillRule="evenodd"
            strokeWidth={0.3}
            data-selected={sortColumn !== null}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[141px] h-[230px]  gap-4 p-3.5
       border-default-300 bg-background text-foreground dark:text-p-4 dark:border-1 dark:border-default-100 dark:bg-dark_popup_bg">
        <p className="w-full">Sort by</p>
        <SortOptions
          setSortColumns={setSortColumns}
          sortColumns={sortColumns}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
        />
        <Button
          className={clsx(
            "data-[selected=true]:bg-light-primary bg-default-300 text-sm font-medium text-default-800 dark:bg-dark_swap_bg dark:text-default-200 data-[selected=true]:dark:bg-dark_green_key  data-[selected=true]:text-background w-[109px] h-[33px] text-[14px]",
            "data-[disabled=true]:bg-default-300 data-[disabled=true]:text-default-800 data-[disabled=true]:opacity-100",
            "data-[disabled=true]:dark:bg-dark_swap_bg data-[disabled=true]:dark:text-default-200",
          )}
          data-selected={sortColumn !== null}
          isDisabled={sortColumn === null}
          size="sm"
          onClick={() => {
            setSortColumns(new Set());
            setSortDirection(null);
          }}
        >
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  );
}
