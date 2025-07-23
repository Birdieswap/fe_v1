import { Fraction } from "@uniswap/sdk-core";
import JSBI from "jsbi";

function fractionToQ6496<T extends number | bigint | JSBI>(
  numerator: T,
  denominator: T,
): bigint {
  const n = JSBI.BigInt(numerator.toString(10));
  const d = JSBI.BigInt(denominator.toString(10));

  if (JSBI.equal(d, JSBI.BigInt(0))) {
    throw new Error("Denominator cannot be zero");
  }
  const result = JSBI.divide(
    JSBI.multiply(n, JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))),
    d,
  );

  return BigInt(result.toString(10));
}

function Q6496ToFraction<T extends number | bigint | JSBI>(q6496: T): Fraction {
  const q = JSBI.BigInt(q6496.toString(10));
  const denominator = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));

  return new Fraction(q, denominator);
}

const mathUtils = {
  fractionToQ6496,
  Q6496ToFraction,
};

export default mathUtils;
