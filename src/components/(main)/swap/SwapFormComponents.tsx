import "./SwapFormComponents.css";

import { cn, Input } from "@heroui/react";
import clsx from "clsx";
import React, { ForwardedRef, forwardRef } from "react";

export const SwapFormContainer: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        "group flex w-full flex-col gap-1.5 rounded-2xl bg-default-100 py-4 pl-3 pr-4 transition-colors dark:bg-dark_swap_bg",
        "focus-within:bg-default-500/5 hover:bg-default-500/10 group-hover:bg-default-500/10 group-focus:bg-default-500/5 group-focus-visible:bg-default-500/5",
        "dark:focus-within:bg-default-500/5 dark:hover:bg-default-500/10 dark:group-hover:bg-default-500/10 dark:group-focus:bg-default-500/5 dark:group-focus-visible:bg-default-500/5",
        className,
      )}
      {...props}
    />
  );
};

export const SwapFormHeader: React.FC<
  React.HTMLAttributes<HTMLHeadingElement>
> = ({ className, ...props }) => {
  return (
    <h1
      className={clsx(
        "pl-1 text-[15px] font-medium leading-[18px] text-default-700",
        className,
      )}
      {...props}
    />
  );
};

const SwapFormNumberInputComponent = (
  { className, ...props }: Omit<Parameters<typeof Input>[0], "ref">,
  ref: ForwardedRef<HTMLInputElement>,
) => {
  return (
    <Input
      className={cn("bg-transparent animate-p", className)}
      classNames={{
        inputWrapper: cn(
          "h-11 min-h-11 bg-transparent p-1 shadow-none",
          "data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent",
        ),
        input: cn(
          "text-[30px] font-bold leading-[36px] placeholder:text-default-500 bg-transparent textfield",
          "data-[disabled=true]:animate-loading",
          "disabled:animate-loading",
        ),
      }}
      onWheel={(e) => {
        e.stopPropagation(); // Prevent scrolling from affecting the input
      }}
      {...props}
      ref={ref}
      min={0}
    />
  );
};

export const SwapFormNumberInput = forwardRef<
  HTMLInputElement,
  Omit<Parameters<typeof Input>[0], "ref">
>(SwapFormNumberInputComponent);
