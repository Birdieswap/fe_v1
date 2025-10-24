"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import clsx from "clsx";
import { BigDecimal } from "@/types/BigDecimal";

const DEFAULT_COLORS = {
  staked: "var(--color-primary)",
  unstaked: "var(--color-lp)",
};

type Props = {
  staked?: BigDecimal | null;
  lp?: BigDecimal | null;
  total?: BigDecimal | null;
  height?: number;
  radius?: number;
  className?: string;
  colors?: { staked?: string; unstaked?: string };
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

// 좌/우 가장자리에 붙여주는 라벨 (12px, normal)
const EdgeLabel: React.FC<
  any & { side: "left" | "right"; color: string; minWidth: number }
> = ({ x = 0, y = 0, width = 0, height = 0, value, side, color, minWidth }) => {
  if (!Number.isFinite(width) || width < minWidth) return null;

  const cy = y + height / 2 + 1;
  const cx = side === "left" ? x + 8 : x + width - 8; // pl-2 / pr-2 느낌
  const anchor = side === "left" ? "start" : "end";

  return (
    <text
      x={cx}
      y={cy}
      fill={color}
      fontSize={12}
      textAnchor={anchor}
      dominantBaseline="central"
      style={{ fontWeight: 400 }}
    >
      {fmtPct(value)}
    </text>
  );
};

const FullLabel: React.FC<{ label: string; fill: string }> = ({
  label,
  fill,
}) => (
  <text
    x="50%"
    y="50%"
    fill={fill}
    fontSize={12}
    textAnchor="middle"
    dominantBaseline="central"
    style={{ fontWeight: 400 }}
  >
    {label}
  </text>
);

export default function BarRatio({
  staked,
  lp,
  total,
  height = 36,
  radius = 12,
  className,
  colors,
  minLabelWidth = 42,
}: Props) {
  const c = { ...DEFAULT_COLORS, ...(colors ?? {}) };

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

  const data = useMemo(
    () => [{ key: "ratio", stakedPct, unstakedPct }],
    [stakedPct, unstakedPct]
  );

  const isFullStaked = stakedPct === 100;
  const isFullUnstaked = unstakedPct === 100;

  return (
    <div className={clsx("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap={0}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          stackOffset="expand"
        >
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" hide dataKey="key" />

          {/* 왼쪽: Staked */}
          <Bar
            dataKey="stakedPct"
            stackId="1"
            fill={c.staked}
            radius={[radius, 0, 0, radius]}
            isAnimationActive={false}
          >
            {!isFullStaked && !isFullUnstaked && (
              <LabelList
                dataKey="stakedPct"
                content={(props) => (
                  <EdgeLabel
                    {...props}
                    side="left"
                    color="var(--color-primary-foreground)"
                    minWidth={minLabelWidth}
                  />
                )}
              />
            )}
          </Bar>

          {/* 오른쪽: Not staked */}
          <Bar
            dataKey="unstakedPct"
            stackId="1"
            fill={c.unstaked}
            radius={[0, radius, radius, 0]}
            isAnimationActive={false}
          >
            {!isFullStaked && !isFullUnstaked && (
              <LabelList
                dataKey="unstakedPct"
                content={(props) => (
                  <EdgeLabel
                    {...props}
                    side="right"
                    color="#64748b"
                    minWidth={minLabelWidth}
                  />
                )}
              />
            )}
          </Bar>

          {isFullStaked && (
            <FullLabel
              label="100% Staked"
              fill="var(--color-primary-foreground)"
            />
          )}
          {isFullUnstaked && (
            <FullLabel label="100% Not staked" fill="#64748b" />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-1 flex w-full text-xs font-medium text-foreground-500">
        <span className="flex-1">Staked</span>
        <span className="flex-1 text-right">Not staked</span>
      </div>
    </div>
  );
}
