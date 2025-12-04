import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "viem";

function sqrtBigInt(value: bigint): bigint {
  if (value < BigInt(0)) {
    throw "square root of negative numbers is not supported";
  }

  if (value < BigInt(2)) {
    return value;
  }

  function newtonIteration(n: bigint, x0: bigint): bigint {
    const x1 = (n / x0 + x0) >> BigInt(1);

    if (x0 === x1 || x0 === x1 - BigInt(1)) {
      return x0;
    }

    return newtonIteration(n, x1);
  }

  return newtonIteration(value, BigInt(1));
}

export class BigDecimal {
  readonly value: bigint;
  readonly decimals: number;
  constructor(
    value: BigDecimal | BigNumber | bigint | number | string | undefined,
    decimals?: number
  ) {
    //value?: BigDecimal | bigint | string | number, decimals?: number) {
    if (value === undefined) {
      this.value = BigInt(0);
      this.decimals = 18;

      return;
    } else if (value instanceof BigDecimal) {
      this.value = value.value;
      this.decimals = value.decimals;
    } else if (typeof value === "string") {
      if (decimals && decimals < 0) {
        throw new Error("Decimals cannot be negative");
      }
      if (!value) {
        this.value = BigInt(0);
        this.decimals = decimals ?? 0;

        return;
      } else if (/^-?0x[0-9a-fA-F]+$/.test(value)) {
        if (decimals) {
          throw new Error("Hex string cannot have decimals");
        }
        this.value = BigInt(value);
        this.decimals = 0;

        return;
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        const [whole, decimal] = value.split(".");

        if (decimal) {
          this.decimals = decimals ?? decimal.length;
        } else {
          // The input string is an integer
          this.decimals = decimals ?? 0;
        }
        value =
          whole.replace(/,/g, "") +
          (decimal ? decimal : "").padEnd(this.decimals, "0");

        this.value = BigInt(value);
        this.decimals = this.decimals || 0;

        return;
      } else {
        throw new Error(`Invalid number string: ${value}`);
      }
    } else if (typeof value === "number") {
      this.value = BigInt(
        parseUnits(value.toFixed(decimals ?? 18), decimals ?? 18)
      );
      this.decimals = decimals ?? 18;
    } else if (value instanceof BigNumber) {
      this.value = value.toBigInt();
      this.decimals = decimals ?? 18;
    } else {
      this.value = value ? BigInt(value) : BigInt(0);
      this.decimals = decimals ?? 18;
    }
  }
  isZero(): boolean {
    return this.value === BigInt(0);
  }
  toNumber(): number {
    return Number(this.value) / 10 ** this.decimals;
  }
  toBigNumber(): BigNumber {
    return BigNumber.from(this.value).div(
      BigNumber.from(10).pow(this.decimals)
    );
  }
  matchDecimals(decimals: number): BigDecimal {
    if (this.decimals < decimals) {
      return new BigDecimal(
        this.value * BigInt(10) ** BigInt(decimals - this.decimals),
        decimals
      );
    } else return new BigDecimal(this);
  }
  add(value: BigDecimal | number): BigDecimal {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }
    const matchedValue = value.matchDecimals(this.decimals);
    const matchedThis = this.matchDecimals(matchedValue.decimals);

    return new BigDecimal(
      matchedThis.value + matchedValue.value,
      matchedThis.decimals
    );
  }
  sub(value: BigDecimal | number): BigDecimal {
    return this.subtract(value);
  }
  subtract(value: BigDecimal | number): BigDecimal {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }
    const matchedValue = value.matchDecimals(this.decimals);
    const matchedThis = this.matchDecimals(matchedValue.decimals);

    return new BigDecimal(
      matchedThis.value - matchedValue.value,
      matchedThis.decimals
    );
  }
  sqrt(): BigDecimal {
    if (this.value < BigInt(0)) {
      throw new Error("Cannot calculate square root of a negative number");
    }
    const sqrtValue = sqrtBigInt(
      this.value * BigInt(10) ** BigInt(this.decimals)
    );

    return new BigDecimal(sqrtValue, this.decimals);
  }
  mul(value: BigDecimal | number): BigDecimal {
    return this.multiply(value);
  }
  multiply(value: BigDecimal | number): BigDecimal {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }

    return new BigDecimal(
      this.value * value.value,
      this.decimals + value.decimals
    );
  }
  shiftTo(decimals: number): BigDecimal {
    const str = this.value.toString();

    if (decimals < 0) {
      return new BigDecimal(str + "0".repeat(-decimals), 0);
    }
    if (decimals === 0) {
      return new BigDecimal(str, 0);
    }

    return new BigDecimal(
      str.length <= decimals
        ? "0." + str.padStart(decimals, "0")
        : str.slice(0, -decimals) + "." + str.slice(-decimals),
      decimals
    );
  }
  shift(decimals: number): BigDecimal {
    return this.shiftTo(this.decimals + decimals);
  }
  div(value: BigDecimal | number): BigDecimal {
    return this.divide(value);
  }
  divide(value: BigDecimal | number): BigDecimal {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }
    const matchedValue = value.matchDecimals(this.decimals);
    const matchedThis = this.matchDecimals(matchedValue.decimals);

    return new BigDecimal(
      (matchedThis.value * BigInt(10) ** BigInt(matchedThis.decimals)) /
        matchedValue.value,
      matchedThis.decimals
    );
  }
  isGreaterThan(value: BigDecimal | number): boolean {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }
    const matchedValue = value.matchDecimals(this.decimals);
    const matchedThis = this.matchDecimals(matchedValue.decimals);

    return matchedThis.value > matchedValue.value;
  }
  isLessThan(value: BigDecimal | number): boolean {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }
    const matchedValue = value.matchDecimals(this.decimals);
    const matchedThis = this.matchDecimals(matchedValue.decimals);

    return matchedThis.value < matchedValue.value;
  }
  isGreaterThanOrEqualTo(value: BigDecimal | number): boolean {
    return !this.isLessThan(value);
  }
  isLessThanOrEqualTo(value: BigDecimal | number): boolean {
    return !this.isGreaterThan(value);
  }
  abs(): BigDecimal {
    return new BigDecimal(
      this.value < BigInt(0) ? -this.value : this.value,
      this.decimals
    );
  }
  gt(value: BigDecimal | number): boolean {
    return this.isGreaterThan(value);
  }
  lt(value: BigDecimal | number): boolean {
    return this.isLessThan(value);
  }
  gte(value: BigDecimal | number): boolean {
    return this.isGreaterThanOrEqualTo(value);
  }
  lte(value: BigDecimal | number): boolean {
    return this.isLessThanOrEqualTo(value);
  }
  equal(value: BigDecimal | number): boolean {
    if (typeof value === "number") {
      value = new BigDecimal(value);
    }
    const matchedValue = value.matchDecimals(this.decimals);
    const matchedThis = this.matchDecimals(matchedValue.decimals);

    return matchedThis.value === matchedValue.value;
  }
  eq(value: BigDecimal | number): boolean {
    return this.equal(value);
  }
  negate(): BigDecimal {
    return new BigDecimal(-this.value, this.decimals);
  }
  roundToDecimals(decimals: number): BigDecimal {
    if (this.decimals === decimals) {
      return new BigDecimal(this);
    } else if (this.decimals < decimals) {
      return new BigDecimal(
        this.value * BigInt(10) ** BigInt(decimals - this.decimals),
        decimals
      );
    } else {
      return new BigDecimal(
        this.value / BigInt(10) ** BigInt(this.decimals - decimals),
        decimals
      );
    }
  }
  toString(): string {
    return this.toPrecisionString(false, false);
  }
  toFixed(fractionDigits?: number): string {
    return this.roundToDecimals(
      fractionDigits || this.decimals
    ).toPrecisionString(false, false);
  }
  toPrecisionString(stripZero?: boolean, useComma?: boolean): string {
    const absValue = this.value < BigInt(0) ? -this.value : this.value;
    let str = `${absValue}`;

    if (this.decimals > 0) {
      if (str.length < this.decimals) {
        str = str.padStart(this.decimals, "0");
      }
      str = `${str.slice(0, -this.decimals) || "0"}.${str.slice(-this.decimals) || "0"}`;
    }

    if (stripZero && this.decimals > 0) {
      while (str.endsWith("0")) {
        str = str.slice(0, -1);
      }
    }

    while (str.endsWith(".")) {
      str = str.slice(0, -1);
    }

    if (useComma) {
      let [whole, decimal] = str.split(".");

      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      str = `${whole ? whole : "0"}${decimal ? `.${decimal}` : ""}`;
    }

    if (this.value < BigInt(0)) {
      str = "-" + str;
    }

    return str;
  }
  static min(...values: (BigDecimal | number)[]): BigDecimal {
    return values.reduce<BigDecimal>(
      (min, value) =>
        new BigDecimal(min).isLessThan(value)
          ? new BigDecimal(min)
          : new BigDecimal(value),
      new BigDecimal(values[0])
    );
  }
  static max(...values: (BigDecimal | number)[]): BigDecimal {
    return values.reduce<BigDecimal>(
      (max, value) =>
        new BigDecimal(max).isGreaterThan(value)
          ? new BigDecimal(max)
          : new BigDecimal(value),
      new BigDecimal(values[0])
    );
  }

  static ZERO() {
    return new BigDecimal(0);
  }
  static ONE() {
    return new BigDecimal(1);
  }
}
