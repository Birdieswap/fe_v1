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
}: {
  isSortOpen: boolean;
  setIsSortOpen: Dispatch<SetStateAction<boolean>>;
  sortColumn: keyof Farm | null;
  sortColumns: Set<keyof Farm>;
  setSortColumns: Dispatch<SetStateAction<Set<keyof Farm>>>;
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
            "data-[selected=true]:border-default-600 data-[selected=true]:bg-primary-200 data-[selected=true]:dark:bg-dark_mid_mint_4",
            "hover:border-default-600 hover:bg-default-100",
            "aria-expanded:opacity-100",
          )}
          data-selected={sortColumn !== null}
          radius="full"
        >
          <Icons.Sort
            className="size-6 fill-foreground stroke-foreground"
            fillRule="evenodd"
            strokeWidth={0.3}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="gap-4 border-default-300 bg-background p-4 dark:border-1 dark:border-default-900 dark:bg-dark_popup_bg">
        <p className="w-full">Sort by</p>
        <SortOptions
          setSortColumns={setSortColumns}
          sortColumns={sortColumns}
        />
        <Button
          className={clsx(
            "data-[selected=true]:btn-mint w-full bg-default-300 text-sm font-medium text-default-800 dark:text-background",
            "data-[disabled=true]:bg-default-300 data-[disabled=true]:text-default-800 data-[disabled=true]:opacity-100",
            "data-[disabled=true]:dark:bg-dark_swap_bg data-[disabled=true]:dark:text-default-800",
          )}
          data-selected={sortColumn !== null}
          isDisabled={sortColumn === null}
          size="sm"
          onClick={() => {
            setSortColumns(new Set());
          }}
        >
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  );
}
