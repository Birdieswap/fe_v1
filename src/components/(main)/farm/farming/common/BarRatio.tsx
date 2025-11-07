"use client";

import React, { useMemo, useId } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  Rectangle,
} from "recharts";
import clsx from "clsx";
import { BigDecimal } from "@/types/BigDecimal";

type Props = {
  staked?: BigDecimal | null;
  lp?: BigDecimal | null;
  total?: BigDecimal | null;
  height?: number;
  radius?: number;
  className?: string;
  minLabelWidth?: number;
};

function toNum(v?: BigDecimal | null): number {
  if (!v) return 0;
  try {
    const n = parseFloat(v.toString());
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
const fmtPct = (x: number) => `${x.toFixed(2)}%`;

const EdgeLabel: React.FC<
  any & { side: "left" | "right"; minWidth: number; className?: string }
> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
  side,
  minWidth,
  className,
}) => {
  if (!Number.isFinite(width) || width < minWidth) return null;
  const cy = y + height / 2 + 1;
  const cx = side === "left" ? x + 8 : x + width - 8;
  const anchor = side === "left" ? "start" : "end";
  return (
    <text
      x={cx}
      y={cy}
      fill="currentColor"
      fontSize={12}
      textAnchor={anchor}
      dominantBaseline="central"
      style={{ fontWeight: 400 }}
      className={className}
    >
      {fmtPct(value)}
    </text>
  );
};

export default function BarRatio({
  staked,
  lp,
  total,
  height = 36,
  radius = 12,
  className,
  minLabelWidth = 42,
}: Props) {
  const { stakedPct, unstakedPct } = useMemo(() => {
    const stakedVal = toNum(staked);
    const lpVal = toNum(lp);
    const totalVal = Math.max(0, toNum(total) || stakedVal + lpVal);
    if (totalVal <= 0) return { stakedPct: 0, unstakedPct: 0 };
    const s = (stakedVal / totalVal) * 100;
    const u = 100 - s;
    return {
      stakedPct: Math.max(0, Math.min(100, s)),
      unstakedPct: Math.max(0, Math.min(100, u)),
    };
  }, [staked, lp, total]);

  const EPS = 0.0001;
  const isFullStaked = stakedPct >= 100 - EPS;
  const isFullUnstaked = unstakedPct >= 100 - EPS;

  // gradient id 충돌 방지
  const gid = useId();
  const gradId = `staked-grad-${gid}`;

  return (
    <div
      className={clsx(
        "w-full rounded-[inherit]", // ← 여기서는 relative 제거
        "[--staked-left:#E5FAFA] [--staked-right:#B2EFF0] dark:[--staked-left:#1BDFE1] dark:[--staked-right:#1EA9AF]",
        "[--bar-stroke:var(--color-default-600)] dark:[--bar-stroke:var(--color-default-200)]",
        className
      )}
      style={
        { "--unstaked-fill": "var(--color-background)" } as React.CSSProperties
      }
    >
      {/* ✅ 차트 영역 전용 래퍼: relative */}
      <div className="relative" style={{ height }}>
        {/* ✅ 이제 오버레이는 바 높이(=height) 딱 그 영역 중앙에 붙습니다 */}
        {(isFullStaked || isFullUnstaked) && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span
              className={clsx(
                "text-[12px] font-sans font-medium",
                isFullStaked
                  ? "dark:text-primary-foreground text-primary-background" // 그라데이션 위라면 가독성 좋게 흰색 권장
                  : "text-default-600 dark:text-default-200"
              )}
            >
              {isFullStaked ? "100% Staked" : "100% Not staked"}
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[{ key: "ratio", stakedPct, unstakedPct }]}
            layout="vertical"
            barCategoryGap={0}
            barSize={height}
            margin={{ top: 0, right: 2, bottom: 0, left: 2 }}
            stackOffset="expand"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--staked-left)" />
                <stop offset="100%" stopColor="var(--staked-right)" />
              </linearGradient>
            </defs>

            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis type="category" hide dataKey="key" />

            <Bar
              dataKey="stakedPct"
              stackId="1"
              fill={`url(#${gradId})`}
              radius={[radius, 0, 0, radius]}
              isAnimationActive={false}
              stroke="transparent"
              background={
                <Rectangle
                  fill="transparent"
                  stroke="var(--bar-stroke)"
                  strokeWidth={1}
                  radius={[
                    Math.max(0, radius - 1),
                    Math.max(0, radius - 1),
                    Math.max(0, radius - 1),
                    Math.max(0, radius - 1),
                  ]}
                />
              }
            >
              {!isFullStaked && !isFullUnstaked && (
                <LabelList
                  dataKey="stakedPct"
                  content={(props) => (
                    <EdgeLabel
                      {...props}
                      side="left"
                      minWidth={minLabelWidth}
                      className="text-foreground font-sans font-medium"
                    />
                  )}
                />
              )}
            </Bar>

            <Bar
              dataKey="unstakedPct"
              stackId="1"
              fill="var(--unstaked-fill)"
              radius={[0, radius, radius, 0]}
              isAnimationActive={false}
              stroke="transparent"
            >
              {!isFullStaked && !isFullUnstaked && (
                <LabelList
                  dataKey="unstakedPct"
                  content={(props) => (
                    <EdgeLabel
                      {...props}
                      side="right"
                      minWidth={minLabelWidth}
                      className="text-default-600 dark:text-default-200 font-sans font-medium"
                    />
                  )}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 아래 보조 라벨 영역은 차트 래퍼 밖(→ 오버레이와 분리됨) */}
      <div className="mt-2 flex w-full text-xs font-sans font-medium">
        <span className="flex-1 text-[10px] text-foreground pl-1">Staked</span>
        <span className="flex-1 text-right text-[10px] text-default-600 dark:text-default-200 pr-1">
          Not staked
        </span>
      </div>
    </div>
  );
}
