import { Button, ButtonProps } from "@heroui/react";
import clsx from "clsx";
import { ForwardedRef, forwardRef, PropsWithRef } from "react";

export type ThemedButtonVariant = "MINT" | "PINK" | "LIGHT";
export type ThemedButtonProps = Omit<
  ButtonProps,
  "ref" | "variant" | "color"
> & {
  variant?: ThemedButtonVariant;
};

function StakeThemedButtonComponent(
  props: PropsWithRef<ThemedButtonProps>,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <Button
      {...{ ...props, className: undefined, variant: undefined, ref }}
      className={clsx(
        "!data-[hover=true]:opacity-100 h-[36px] grow rounded-lg text-md font-semibold",
        "disabled:bg-default-300 disabled:text-default-600",
        "dark:disabled:bg-dark_popup_bg dark:disabled:text-default-400",
        "aria-[busy=true]:animate-pulse aria-[busy=true]:cursor-wait",
        props.variant === "MINT" && "btn-mint",
        props.variant === "LIGHT" && [
          "text-light_primary dark:text-dark_green_key",
          "bg-transparent",
          "data-[hover=true]:bg-transparent data-[hover=true]:text-light_primary_hover dark:data-[hover=true]:text-dark_primary_hover",
        ],
        props.variant === "PINK" && [
          "text-warning-foreground",
          "bg-light_pink dark:bg-dark_pink",
          "data-[hover=true]:bg-light_pink_hover dark:data-[hover=true]:bg-dark_pink_hover",
          "hover:bg-light_pink_hover dark:hover:bg-dark_pink_hover",
        ],
        props.className
      )}
    />
  );
}

const StakeThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  StakeThemedButtonComponent
);

export default StakeThemedButton;
