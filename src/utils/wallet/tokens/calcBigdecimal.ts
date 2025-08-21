
import { BigDecimal } from "@/types/BigDecimal";

export function bdToNumber(bd: BigDecimal | null | undefined): number {
  if (!bd) return 0;
  if (typeof (bd as any).toNumber === "function") {
    return (bd as any).toNumber();
  }
  // fallback: 문자열 변환 후 Number
  const s = bd.toString();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function format2(n: number): string {
  return n.toFixed(2);
}

// 0 판정 헬퍼
export function isZeroBD(bd: BigDecimal | null | undefined): boolean {
  if (!bd) return true;
  if (typeof (bd as any).isZero === "function") {
    return (bd as any).isZero();
  }
  const v = (bd as any).value as bigint | undefined;
  return v === undefined ? false : v === BigInt(0);
}
