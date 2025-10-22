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
  const isDisabled = Boolean(props.isDisabled ?? (props as any).disabled);

  // 외부에서 넘긴 className/variant는 우리가 통제
  const {
    className: _classNameIgnored,
    variant: _variantIgnored,
    ...rest
  } = props;

  // 🔥 항상 맨 마지막에 붙일 비활성 오버라이드 (변형 색보다 이기도록)
  const disabledOverride = isDisabled
    ? [
        "!bg-default-300 !text-default-600 !opacity-100 !shadow-none !ring-0",
        "dark:!bg-dark-popup-bg dark:!text-default-400",
        // hover 경로도 회색 고정
        "data-[hover=true]:!bg-default-300 data-[hover=true]:!text-default-600",
        "dark:data-[hover=true]:!bg-dark-popup-bg dark:data-[hover=true]:!text-default-400",
        // aria 경로도 흐림 방지
        "aria-[disabled=true]:!opacity-100",
      ]
    : null;
  return (
    <Button
      ref={ref}
      isDisabled={isDisabled}
      {...rest}
      /* 슬롯에서 크기/타이포/간격을 고정(흔들림 방지) */
      classNames={{
        base: "h-[32px] rounded-lg font-semibold",
        label: "text-md font-semibold",
        content: "px-3 gap-2 items-center",
      }}
      className={clsx(
        // 공통 베이스
        "!data-[hover=true]:opacity-100 h-[32px] grow rounded-lg text-md font-semibold",
        "aria-[busy=true]:animate-pulse aria-[busy=true]:cursor-wait",

        // ✅ 변형(색) — 항상 비활성 오버라이드보다 먼저!
        !isDisabled && props.variant === "MINT" && "btn-mint",
        !isDisabled &&
          props.variant === "LIGHT" && [
            "text-light-primary dark:text-dark-green-key",
            "bg-transparent",
            "data-[hover=true]:bg-transparent data-[hover=true]:text-light-primary-hover dark:data-[hover=true]:text-dark-primary-hover",
          ],
        !isDisabled &&
          props.variant === "PINK" && [
            "text-warning-foreground",
            "bg-light-pink dark:bg-dark-pink",
            "data-[hover=true]:bg-light-pink-hover dark:data-[hover=true]:bg-dark-pink-hover",
            "hover:bg-light-pink-hover dark:hover:bg-dark-pink-hover",
          ],

        // 외부 className은 오버라이드 이전에 합성(필요 시 마지막에 두고 싶다면 위치 조정)
        _classNameIgnored,

        // 🛟 마지막: 비활성 오버라이드(항상 승리)
        disabledOverride,

        // 안전망(일부 테마 경로): data/aria-disabled도 흐림 제거
        "data-[disabled=true]:!opacity-100 aria-[disabled=true]:!opacity-100"
      )}
    />
  );
}

const StakeThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  StakeThemedButtonComponent
);

export default StakeThemedButton;
