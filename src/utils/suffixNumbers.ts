import { BigDecimal } from "@/types/BigDecimal";

export default function suffixNumbers(
  value: BigDecimal,
  minimum: number = 1000,
  decimals: number = 2,
  stripZero?: boolean,
  useComma?: boolean,
): string {
  if (value.gt(1_000_000_000_000) && minimum < 1_000_000_000_000) {
    return (
      value
        .div(1_000_000_000_000)
        .roundToDecimals(decimals)
        .toPrecisionString(stripZero, useComma) + "T"
    );
  } else if (value.gt(1_000_000_000) && minimum < 1_000_000_000_000) {
    return (
      value
        .div(1_000_000_000)
        .roundToDecimals(decimals)
        .toPrecisionString(stripZero, useComma) + "B"
    );
  } else if (value.gt(1_000_000) && minimum < 1_000_000) {
    return (
      value
        .div(1_000_000)
        .roundToDecimals(decimals)
        .toPrecisionString(stripZero, useComma) + "M"
    );
  } else if (value.gt(1_000) && minimum < 1_000) {
    return (
      value
        .div(1_000)
        .roundToDecimals(decimals)
        .toPrecisionString(stripZero, useComma) + "K"
    );
  }

  return value.roundToDecimals(decimals).toPrecisionString(stripZero, useComma);
}
