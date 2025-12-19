"use client";

import { Modal, type ModalProps } from "@heroui/react";
import clsx from "clsx";

/**
 * - scrollBehavior: 상위에서 넘긴 값을 존중 (덮어쓰지 않음)
 * - portalContainer: 기본값을 body로 강제 → iOS 16 화이트스크린/포인터 이슈 완화
 * - wrapper/base: 모바일(bottom-sheet)에서 하단 갭 없도록 강제
 * - class 합성 순서: 외부에서 들어온 classNames가 우리의 "하단 고정/패딩 제거"를 덮지 못하게 마지막에 배치
 */
export default function ModalBase(props: ModalProps) {
  const { className, classNames, portalContainer, placement, ...rest } = props;

  // className(Modal prop)도 base 슬롯으로 흡수해서 확실히 제어
  const mergedBase = clsx(
    classNames?.base,
    className,
    // 기본 스타일
    "rounded-2xl bg-background dark:border dark:border-dark-popup-bg dark:bg-dark-popup-bg",
    // ✅ 모바일에서는 화면 하단에 '딱' 붙게 (바깥 여백/마진 제거 + full width)
    "max-sm:!m-0 max-sm:!my-0 max-sm:!mx-0 max-sm:w-full max-sm:max-w-full",
    "max-sm:rounded-b-none max-sm:rounded-t-2xl"
  );

  const mergedWrapper = clsx(
    classNames?.wrapper,
    // ✅ 모바일은 바닥 정렬 + wrapper 패딩 제거(갭 원인)
    "items-end justify-end",
    "max-sm:!p-0 max-sm:!pt-0 max-sm:!pr-0 max-sm:!pb-0 max-sm:!pl-0",
    // 기존 의도 유지: sm에서는 bottom, md부터 center
    "sm:items-end sm:justify-end md:items-center md:justify-center"
  );

  const mergedBackdrop = clsx(
    classNames?.backdrop,
    "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none"
  );

  return (
    <Modal
      {...rest}
      placement={placement ?? "auto"} // HeroUI 기본 의도 유지: mobile bottom / >=sm center (필요시 상위에서 override 가능)
      portalContainer={
        portalContainer ??
        (typeof window !== "undefined" ? document.body : undefined)
      }
      classNames={{
        ...classNames,
        backdrop: mergedBackdrop,
        wrapper: mergedWrapper,
        base: mergedBase,
      }}
    />
  );
}

// "use client";

// import { Modal, ModalProps } from "@heroui/react";
// import clsx from "clsx";

// /**
//  * - scrollBehavior: 상위에서 넘긴 값을 존중 (덮어쓰지 않음)
//  * - portalContainer: 기본값을 body로 강제 → iOS 16 화이트스크린/포인터 이슈 완화
//  * - classNames.wrapper: 덧씌우되 기존 슬롯 유지
//  */
// export default function ModalBase(props: ModalProps) {
//   const {
//     className,
//     classNames,
//     portalContainer, // 상위에서 넘기면 사용
//     ...rest
//   } = props;

//   return (
//     <Modal
//       {...rest}
//       // 항상 body로 포털 (상위가 따로 지정하면 그걸 사용)
//       portalContainer={
//         portalContainer ??
//         (typeof window !== "undefined" ? document.body : undefined)
//       }
//       // 기존 classNames 보존 + wrapper만 보정
//       classNames={{
//         ...classNames,
//         backdrop: clsx(
//           "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
//           classNames?.backdrop
//         ),
//         wrapper: clsx(
//           "items-end justify-end sm:items-end sm:justify-end md:items-center md:justify-center max-sm:p-0",
//           classNames?.wrapper
//         ),
//       }}
//       // 베이스 className은 그대로 합성
//       className={clsx(
//         "rounded-2xl bg-background dark:border dark:border-dark-popup-bg dark:bg-dark-popup-bg",
//         "max-sm:m-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-2xl",
//         className
//       )}
//     />
//   );
// }
