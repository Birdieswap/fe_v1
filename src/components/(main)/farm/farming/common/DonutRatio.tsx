"use client";
import React, { useMemo } from "react";
import { BigDecimal } from "@/types/BigDecimal";

type Props = {
  lp?: BigDecimal;
  staked?: BigDecimal;
  total?: BigDecimal;
  size?: number; // 외경 px
  stroke?: number; // 선 굵기 px
  title?: string;
};

export default function DonutRatio({
  lp,
  staked,
  total,
  size = 40,
  stroke = 5,
  title,
}: Props) {
  const { r, c, stakedLen, gapLen } = useMemo(() => {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;

    const toNum = (v?: BigDecimal) => {
      if (!v) return 0;
      const n = Number.parseFloat(v.toString());
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    };

    const lpN = toNum(lp);
    const stN = toNum(staked);
    const totalN = total ? toNum(total) : Math.max(1e-18, lpN + stN); // 안전한 분모

    const stRatio = Math.max(0, Math.min(1, stN / totalN));
    const stLen = circ * stRatio;
    const rest = Math.max(0, circ - stLen);

    return { r: radius, c: circ, stakedLen: stLen, gapLen: rest };
  }, [lp, staked, total, size, stroke]);

  const cx = size / 2;
  const cy = size / 2;

  // 12시 기준 + 반시계 방향:
  //  - rotate(-90, cx, cy): 시작각을 12시로 이동
  //  - scale(-1,1) with center pivot: 진행을 반시계처럼 보이게
  const transform = `translate(${cx} ${cy}) rotate(90) scale(-1 1) translate(${-cx} ${-cy})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={title}
    >
      {/* 트랙 (LP 비중을 표현하는 옅은 색) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-[var(--color-default-200)] dark:stroke-[var(--color-default-800)]"
        // 트랙은 전체 원
        strokeDasharray={`${c} ${0}`}
        opacity={1}
      />
      {/* Staked 아크 */}
      <g transform={transform}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--color-primary)]"
          strokeLinecap="round"
          // staked 길이 + 나머지 길이
          strokeDasharray={`${stakedLen} ${gapLen}`}
          strokeDashoffset={0}
        />
      </g>
    </svg>
  );
}
