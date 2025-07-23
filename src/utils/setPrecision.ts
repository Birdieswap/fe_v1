import { BigNumber } from "@ethersproject/bignumber";

import { BigDecimal } from "@/types/BigDecimal";

export function decimalsToBigNumber(
  value: number | bigint,
  decimals: number = 0,
) {
  return BigNumber.from(value).div(BigNumber.from(10).pow(decimals));
}

export function setPrecision(value: number, precision: number) {
  const multiplier = Math.pow(10, precision);

  return Math.round(value * multiplier) / multiplier;
}

export function setPrecisionString(
  value: number | BigDecimal,
  precision: number,
  stripZero?: boolean,
  useComma?: boolean,
) {
  if (value instanceof BigDecimal) {
    return value
      .roundToDecimals(precision)
      .toPrecisionString(stripZero, useComma);
  }
  let str = setPrecision(value, precision).toFixed(precision);

  if (stripZero) {
    while (str.length > 1 && (str.endsWith("0") || str.endsWith("."))) {
      str = str.slice(0, -1);
    }
  }

  if (useComma) {
    let [whole, decimal] = str.split(".");

    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    str = `${whole ? whole : "0"}${decimal ? `.${decimal}` : ""}`;
  }

  return str;
}
