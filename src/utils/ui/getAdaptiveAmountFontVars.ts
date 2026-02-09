import type { CSSProperties } from "react";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function interpolateFontSize(params: {
  length: number;
  startLength: number;
  endLength: number;
  maxSize: number;
  minSize: number;
}) {
  const { length, startLength, endLength, maxSize, minSize } = params;
  if (length <= startLength) return maxSize;
  if (length >= endLength) return minSize;

  const t = (length - startLength) / (endLength - startLength);
  return maxSize - (maxSize - minSize) * clamp(t, 0, 1);
}

export function getAdaptiveAmountFontVars(
  rawValue?: string | null,
): CSSProperties {
  const value = String(rawValue ?? "");
  const normalized = value.trim();

  // 숫자, 소수점만 길이 계산 대상으로 사용
  const length = normalized.replace(/[^0-9.]/g, "").length;

  const desktop = interpolateFontSize({
    length,
    startLength: 10,
    endLength: 22,
    maxSize: 30,
    minSize: 20,
  });

  const mobile = interpolateFontSize({
    length,
    startLength: 8,
    endLength: 18,
    maxSize: 22,
    minSize: 12,
  });

  return {
    ["--amount-font-desktop-size" as any]: `${desktop.toFixed(2)}px`,
    ["--amount-font-mobile-size" as any]: `${mobile.toFixed(2)}px`,
  };
}
