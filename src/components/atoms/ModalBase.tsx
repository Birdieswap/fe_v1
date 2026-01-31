"use client";

import { useEffect } from "react";
import { Modal, type ModalProps } from "@heroui/react";
import clsx from "clsx";

function useVisualViewportVhVar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const set = () => {
      const vv = window.visualViewport;
      const h = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${h * 0.01}px`);
    };

    set();

    window.addEventListener("resize", set);
    window.visualViewport?.addEventListener("resize", set);
    window.visualViewport?.addEventListener("scroll", set);

    return () => {
      window.removeEventListener("resize", set);
      window.visualViewport?.removeEventListener("resize", set);
      window.visualViewport?.removeEventListener("scroll", set);
    };
  }, []);
}

/**
 * - portalContainer: 기본값 body 고정 (iOS 16 이슈 완화)
 * - 모바일 bottom-sheet: 항상 하단에 붙도록 wrapper/base 강제
 * - iOS 동적 툴바: 100dvh + visualViewport fallback(--app-vh)
 * - ✅ 권장2: className을 Modal prop으로 넘기지 않고, base 슬롯(classNames.base)에 흡수
 */
export default function ModalBase(props: ModalProps) {
  useVisualViewportVhVar();

  const {
    className, // ✅ Modal prop으로 전달하지 않고 base 슬롯에 합침
    classNames,
    portalContainer,
    placement,
    ...rest
  } = props;

  const mergedBackdrop = clsx(
    classNames?.backdrop,
    "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none"
  );

  const mergedWrapper = clsx(
    classNames?.wrapper,

    // ✅ 모바일: 무조건 하단 정렬
    "max-sm:!items-end max-sm:!justify-end",
    "md:items-center md:justify-center",

    // ✅ 모바일: wrapper 패딩 제거(갭 방지)
    "max-sm:!p-0 max-sm:!pt-0 max-sm:!pr-0 max-sm:!pb-0 max-sm:!pl-0",

    // ✅ iOS/인앱브라우저 동적 툴바 대응
    "max-sm:!h-[100dvh] max-sm:!min-h-[100dvh]",
    "max-sm:!h-[calc(var(--app-vh,1vh)*100)] max-sm:!min-h-[calc(var(--app-vh,1vh)*100)]"
  );

  const mergedBase = clsx(
    classNames?.base,

    // 기본 스타일
    "rounded-2xl bg-background dark:border dark:border-dark-popup-bg dark:bg-dark-popup-bg",

    // ✅ 모바일: 바깥 마진/여백 제거 + full width
    "max-sm:!m-0 max-sm:!my-0 max-sm:!mx-0 max-sm:!w-full max-sm:!max-w-full",
    "max-sm:rounded-b-none max-sm:rounded-t-2xl",

    // ✅ 권장2 핵심: 외부에서 주는 className을 base에 합침
    className
  );

  return (
    <Modal
      {...rest}
      placement={placement ?? "auto"}
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
      // ✅ 여기서 className은 넘기지 않음 (base 슬롯에서 처리)
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
