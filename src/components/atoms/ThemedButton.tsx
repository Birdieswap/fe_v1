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

function ThemedButtonComponent(
  props: PropsWithRef<ThemedButtonProps>,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const isDisabled = Boolean(props.isDisabled ?? (props as any).disabled);

  // 외부에서 넘긴 className/variant/color는 우리가 통제
  const {
    className: _classNameIgnored,
    variant: _variantIgnored,
    ...rest
  } = props;

  const disabledFix =
    (props.isDisabled ?? (props as any).disabled)
      ? [
          // 색상만 바꾸고 흐림/효과 제거
          "!bg-default-300 !text-default-600 !opacity-100 !shadow-none !ring-0",
          "dark:!bg-dark-popup-bg dark:!text-default-400",
          // hover 변형도 회색으로 고정
          "data-[hover=true]:!bg-default-300 data-[hover=true]:!text-default-600",
          "dark:data-[hover=true]:!bg-dark-popup-bg dark:data-[hover=true]:!text-default-400",
          // aria-disabled 경로도 동일 처리(일부 테마에서 씀)
          "aria-[disabled=true]:!opacity-100",
        ]
      : null;

  return (
    <Button
      isDisabled={props.isDisabled ?? (props as any).disabled}
      {...{ ...props, className: undefined, variant: undefined, ref }}
      className={clsx(
        // 1) 공통 베이스
        "!data-[hover=true]:opacity-100 h-[58px] grow rounded-2xl text-lg font-semibold",
        "aria-[busy=true]:animate-pulse aria-[busy=true]:cursor-wait",

        // 2) 변형(색) — 항상 오버라이드보다 먼저!
        props.variant === "MINT" && "btn-mint",
        props.variant === "LIGHT" && [
          "text-light-primary dark:text-dark-green-key",
          "bg-transparent",
          "data-[hover=true]:bg-transparent data-[hover=true]:text-light-primary-hover dark:data-[hover=true]:text-dark-primary-hover",
        ],
        props.variant === "PINK" && [
          "text-warning-foreground",
          "bg-light-pink dark:bg-dark-pink",
          "data-[hover=true]:bg-light-pink-hover dark:data-[hover=true]:bg-dark-pink-hover",
          "hover:bg-light-pink-hover dark:hover:bg-dark-pink-hover",
        ],

        // 3) 외부에서 준 className — 이것도 오버라이드보다 먼저!
        props.className,

        // 4) 🔥 비활성 오버라이드 — 항상 맨 마지막에!
        disabledFix
      )}
    />
  );
}

const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ThemedButtonComponent
);

export default ThemedButton;
