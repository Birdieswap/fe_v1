"use client";
import { useMemo } from "react";
import { BigDecimal } from "@/types/BigDecimal";

type Props = {
  lp?: BigDecimal;
  staked?: BigDecimal;
  total?: BigDecimal;
  /** 바의 폭(px). 기본 12 */
  width?: number;
  /** 바의 높이(px). 기본 52 */
  height?: number;
  /** 접근성 라벨 */
  title?: string;
  /** 추가 클래스 */
  className?: string;
};

export default function MobileBarRatio({
  lp,
  staked,
  total,
  width = 12,
  height = 52,
  title,
  className,
}: Props) {
  const { stH, ratio } = useMemo(() => {
    const toNum = (v?: BigDecimal) => {
      if (!v) return 0;
      const n = Number.parseFloat(v.toString());
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    };
    const lpN = toNum(lp);
    const stN = toNum(staked);
    const totalN = total ? toNum(total) : Math.max(1e-18, lpN + stN);

    const r = Math.max(0, Math.min(1, stN / totalN));
    return { ratio: r, stH: height * r };
  }, [lp, staked, total, height]);

  // 둥근 모서리를 위해 pill 반경
  const rx = width / 4;
  // staked 막대의 상단 모서리 라운딩이 찌그러지지 않도록
  const stRy = Math.min(rx, stH / 4);

  // staked 막대를 아래에서부터 채우기 위해 y를 계산
  const stY = height - stH;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={title ?? `Staked ${Math.round(ratio * 100)}%`}
      className={className}
    >
      {/* 배경(= Not staked) */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={rx}
        ry={rx}
        className="fill-[var(--color-default-200)] dark:fill-[var(--color-default-800)]"
      />

      {/* Staked (아래에서부터 채움) */}
      {stH > 0 && (
        <rect
          x={0}
          y={stY}
          width={width}
          height={stH}
          rx={rx}
          // 상단 모서리는 비율이 낮을 때 둥글게 보이도록 ry를 가변 처리
          ry={stRy}
          className="fill-[var(--color-primary)]"
        />
      )}
    </svg>
  );
}
