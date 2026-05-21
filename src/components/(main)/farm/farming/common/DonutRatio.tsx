"use client";
import { useMemo } from "react";
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
  const { r, c, stakedLen, gapLen, noTotal, showDot } = useMemo(() => {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;

    const toNum = (v?: BigDecimal) => {
      if (!v) return 0;
      const n = Number.parseFloat(v.toString());
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    };

    const lpN = toNum(lp);
    const stN = toNum(staked);

    // total 원본값(그릴지/말지 판단용)
    const totalRaw =
      total !== undefined && total !== null ? toNum(total) : lpN + stN;

    const noTotal = totalRaw <= 0; // 이 경우엔 아무것도 그리지 않음

    // 분모는 0 회피용으로만 사용 (비율 계산용)
    const denom = noTotal ? 1 : totalRaw;

    const stRatioRaw = stN / denom;
    const stRatio = Number.isFinite(stRatioRaw)
      ? Math.max(0, Math.min(1, stRatioRaw))
      : 0;

    // staked가 정확히 0이고 total이 존재하는 경우 '점'만 찍을지 여부
    const showDot = !noTotal && stRatio === 0;

    // 점 길이는 매우 짧게 (round cap 덕에 점처럼 보임)
    const DOT_LEN = 0.1; // px 단위 경로길이(원둘레 기준). 너무 작으면 브라우저마다 안 보일 수 있어 0.1 권장.

    const stLen = showDot ? DOT_LEN : circ * stRatio;
    const rest = Math.max(0, circ - stLen);

    return {
      r: radius,
      c: circ,
      stakedLen: stLen,
      gapLen: rest,
      noTotal,
      showDot,
    };
  }, [lp, staked, total, size, stroke]);

  const cx = size / 2;
  const cy = size / 2;

  // 12시 기준 + 반시계 방향처럼 보이게
  const transform = `translate(${cx} ${cy}) rotate(90) scale(-1 1) translate(${-cx} ${-cy})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={title}
    >
      {/* 트랙 */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-[var(--color-default-200)] dark:stroke-[var(--color-default-800)]"
        strokeDasharray={`${c} 0`}
      />

      {/* Staked 아크:
          - totalRaw <= 0 이면 아무것도 렌더 X
          - showDot이면 점처럼 보이는 짧은 dash
          - 그 외에는 정상 비율 */}
      {!noTotal && (
        <g transform={transform}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-[var(--color-primary)]"
            strokeLinecap="round"
            strokeDasharray={`${stakedLen} ${gapLen}`}
            strokeDashoffset={0}
          />
        </g>
      )}
    </svg>
  );
}
