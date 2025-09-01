
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

export function format2(n: number, stripZero = true): string {
  if (!Number.isFinite(n)) return "0";
  const s = n.toFixed(5);
  if (!stripZero) return s;
  let out = s.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");

  // 2) -0 방지
  if (out === "-0") out = "0";
  return out;
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
