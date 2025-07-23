"use client";

import { Modal } from "@heroui/react";
import clsx from "clsx";

export default function ModalBase(props: Parameters<typeof Modal>[0]) {
  return (
    <Modal
      {...{
        ...props,
        scrollBehavior: "outside",
        classNames: {
          ...props.classNames,
          wrapper: "items-end sm:items-end md:items-center",
        },
        className: clsx(
          "rounded-2xl bg-background dark:border-1 dark:border-dark_popup_bg dark:bg-dark_popup_bg",
          "max-sm:m-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl",
          props.className,
        ),
      }}
    />
  );
}
