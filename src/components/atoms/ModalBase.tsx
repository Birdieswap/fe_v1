"use client";

import { Modal, ModalProps } from "@heroui/react";
import clsx from "clsx";

/**
 * - scrollBehavior: 상위에서 넘긴 값을 존중 (덮어쓰지 않음)
 * - portalContainer: 기본값을 body로 강제 → iOS 16 화이트스크린/포인터 이슈 완화
 * - classNames.wrapper: 덧씌우되 기존 슬롯 유지
 */
export default function ModalBase(props: ModalProps) {
  const {
    className,
    classNames,
    portalContainer, // 상위에서 넘기면 사용
    ...rest
  } = props;

  return (
    <Modal
      {...rest}
      // 항상 body로 포털 (상위가 따로 지정하면 그걸 사용)
      portalContainer={
        portalContainer ??
        (typeof window !== "undefined" ? document.body : undefined)
      }
      // 기존 classNames 보존 + wrapper만 보정
      classNames={{
        ...classNames,
        backdrop: clsx(
          "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
          classNames?.backdrop
        ),
        wrapper: clsx(
          "items-end justify-end sm:items-end sm:justify-end md:items-center md:justify-center max-sm:p-0",
          classNames?.wrapper
        ),
      }}
      // 베이스 className은 그대로 합성
      className={clsx(
        "rounded-2xl bg-background dark:border dark:border-dark-popup-bg dark:bg-dark-popup-bg",
        "max-sm:m-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl",
        className
      )}
    />
  );
}
