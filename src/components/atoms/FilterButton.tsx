import { Button } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";

export function FilterButton<T>({
  onPress,
  value,
  selected,
  setSelected,
  ...props
}: Omit<Parameters<typeof Button>[0], "className" | "size"> & {
  value: T;
  setSelected: Dispatch<SetStateAction<T>>;
  selected: T;
}) {
  return (
    <Button
      className={clsx(
        "flex h-9 min-w-fit shrink-0 border-1 text-center text-[13px] font-normal md:w-[86px]",
        "data-[hover=true]:opacity-100 dark:border-default-800 dark:text-default-600",
        "border-default-400 bg-transparent text-default-800 data-[hover=true]:bg-default-400/20",
        "data-[selected=true]:border-default-800 dark:data-[selected=true]:border-default-200 data-[selected=true]:bg-default-800 dark:data-[selected=true]:bg-default-200  data-[selected=true]:text-white",
        "data-[selected=true]:data-[hover=true]:bg-default-800/80",
      )}
      data-selected={selected === value}
      radius="full"
      onPress={(e) => {
        setSelected(value);
        onPress?.(e);
      }}
      {...props}
    />
  );
}
