import {
  Dispatch,
  Fragment,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Farm } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";

import FarmDetail from "./FarmDetail";
import FarmListRowSummary from "./FarmListRowSummary";

type Props = {
  item: Farm;
  balance?: BigDecimal;
  onRowClick: (fullName: string, address: `0x${string}`) => void;
  activeFullName: string | null;
  chainId: number;
  apy: BigDecimal | null;
  tvl: BigDecimal | null;
  price: BigDecimal | null;
  attachRef?: (fullName: string) => (el: HTMLElement | null) => void; // ★ 추가
};

function getNearestScrollParent(
  node: HTMLElement | null
): HTMLElement | Window {
  let el: HTMLElement | null = node;
  while (el && el.parentElement) {
    el = el.parentElement;
    if (!el) break;
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY)) return el;
  }
  return window;
}

export default function FarmListTableRow({
  item,
  balance,
  onRowClick,
  activeFullName,
  chainId,
  apy,
  tvl,
  price,
  attachRef,
}: Props) {
  const isActive = useMemo(
    () => activeFullName === item.wip_stakeToken.fullName,
    [activeFullName, item.wip_stakeToken.fullName]
  );

  const onClick = useCallback(() => {
    onRowClick(
      item.wip_stakeToken.fullName,
      item.wip_stakeToken.addresses![chainId] as `0x${string}`
    );
  }, [onRowClick, item.wip_stakeToken, chainId]);

  // console.log(
  //   "FarmListTableRow selectedRow",
  //   selectedRow,
  //   "fullname",
  //   item.wip_stakeToken.fullName
  // );
  // Row Summary를 스크롤 앵커로 사용
  const rowTopRef = useRef<HTMLDivElement | null>(null);
  const wasActiveRef = useRef<boolean>(isActive);

  const parentRefCb = attachRef?.(item.wip_stakeToken.fullName);

  // 두 ref를 합성
  const summaryRef = useCallback(
    (el: HTMLDivElement | null) => {
      rowTopRef.current = el;
      parentRefCb?.(el || null);
    },
    [parentRefCb]
  );

  useLayoutEffect(() => {
    const openedNow = !wasActiveRef.current && isActive;
    wasActiveRef.current = isActive;
    if (!openedNow) return;

    const el = rowTopRef.current;
    if (!el) return;

    const navVar = getComputedStyle(document.documentElement)
      .getPropertyValue("--nav-h")
      .trim();
    const navH = (navVar ? parseInt(navVar, 10) : 64) + 8;
    const ENTER_MS = 700;

    const raf1 = requestAnimationFrame(() => {
      const t = setTimeout(() => {
        const scroller = getNearestScrollParent(el);
        const rect = el.getBoundingClientRect();
        if (scroller === window) {
          const top = rect.top + window.pageYOffset - navH;
          window.scrollTo({ top, behavior: "smooth" });
        } else {
          const parentRect = (scroller as HTMLElement).getBoundingClientRect();
          const topInParent =
            rect.top -
            parentRect.top +
            (scroller as HTMLElement).scrollTop -
            navH;
          (scroller as HTMLElement).scrollTo({
            top: topInParent,
            behavior: "smooth",
          });
        }
      }, ENTER_MS);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(raf1);
  }, [isActive]);

  return (
    <Fragment key={item.wip_stakeToken.fullName}>
      <FarmListRowSummary
        apy={apy}
        balance={balance}
        isActive={isActive}
        item={item}
        tvl={tvl}
        price={price}
        onClick={onClick}
        ref={summaryRef}
      />

      <FarmDetail item={item} selectedRow={activeFullName} price={price} />
    </Fragment>
  );
}
