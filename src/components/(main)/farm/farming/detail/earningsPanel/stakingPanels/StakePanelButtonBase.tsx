import { Button } from "@heroui/react";
import clsx from "clsx";
import { Dispatch, PropsWithChildren, SetStateAction } from "react";

export default function StakePanelButtonBase<K extends string>(
  props: PropsWithChildren<{
    selectedPanel: K;
    setSelectedPanel: Dispatch<SetStateAction<K>>;
    value: K;
  }>
) {
  return (
    <Button
      fullWidth
      className={clsx(
        "group h-8 min-h-8 rounded-b-none rounded-t-2xl text-sm font-semibold",
        "bg-background/0 data-[selected=true]:bg-background",
        "text-default-700 data-[selected=true]:text-foreground dark:text-default-800"
      )}
      data-selected={props.selectedPanel === props.value}
      onClick={() => {
        props.setSelectedPanel(props.value);
      }}
    >
      {props.children}
    </Button>
  );
}
