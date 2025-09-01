import { Button, Input, InputProps } from "@heroui/react";
import { ForwardedRef, forwardRef } from "react";
import clsx from "clsx";

import Icons from "@/assets/icons/icons";

export type SearchBoxProps = InputProps & {
  onSearch?: (value: string) => void;
};

function SearchBoxComponent(
  props: SearchBoxProps,
  ref: ForwardedRef<HTMLInputElement>
) {
  return (
    <Input
      ref={ref}
      classNames={{
        inputWrapper: clsx(
          "h-9 min-h-9 border-1 p-0",
          "border-default-400 bg-default-100",
          "dark:border-default-900 dark:bg-dark_popup_bg",
          "group-data-[focus=true]:bg-default-100",
          "dark:group-data-[focus=true]:bg-dark_popup_bg",
          "group-data-[focus-within=true]:bg-default-100",
          "dark:group-data-[focus-within=true]:bg-dark_popup_bg",
          "group-data-[focus=true]:border-default-800",
          "dark:group-data-[focus=true]:border-default-700",
          "group-data-[focus-within=true]:border-default-800",
          "dark:group-data-[focus-within=true]:border-default-700"
        ),
        innerWrapper: "px-0 py-0",
        input: clsx(
          "pl-3 text-base font-medium placeholder:text-default-800 dark:placeholder:text-default-500",
          "md:text-[13px] md:font-normal",
          "focus:outline-none dark:caret-white"
        ),
      }}
      endContent={
        <Button
          isIconOnly
          className={clsx(
            "flex h-full w-12 items-center justify-center rounded-e-full",
            "bg-default-500 dark:bg-default-700",
            "group-data-[focus=true]:bg-light_primary group-data-[focus=true]:hover:bg-light_primary_hover",
            "group-data-[focus-within=true]:bg-light_primary group-data-[focus-within=true]:hover:bg-light_primary_hover",
            "dark:group-data-[focus=true]:bg-dark_primary dark:group-data-[focus=true]:hover:bg-dark_primary_hover",
            "dark:group-data-[focus-within=true]:bg-dark_primary dark:group-data-[focus-within=true]:hover:bg-dark_primary_hover",
            "[&>svg]:fill-background"
          )}
          onClick={() => props.onSearch?.(props.value || "")}
        >
          <Icons.Search />
        </Button>
      }
      radius="full"
      {...props}
    />
  );
}

const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  SearchBoxComponent
);

export default SearchBox;
