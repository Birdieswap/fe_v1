
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

export function format2(n: number,fixedNum: number, stripZero = true): string {
  if (!Number.isFinite(n)) return "0";

  if (Object.is(n, -0)) n = 0;

  const out = new Intl.NumberFormat("en-US", {
    useGrouping: true,                  // ← 천 단위 콤마
    maximumFractionDigits: fixedNum,    // ← 소수 최대 자리
    minimumFractionDigits: stripZero ? 0 : fixedNum, // ← 0 제거 여부
  });

  return out.format(n);
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
