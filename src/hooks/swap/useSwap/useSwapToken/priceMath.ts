import { Fraction } from "@uniswap/sdk-core";
import { BigDecimal } from "@/types/BigDecimal";
import mathUtils from "@/utils/mathUtils";

export function computeSqrtPriceLimitX96(
  sqrtPriceX96: Fraction | null,
  zeroForOne: boolean
): bigint {
  if (!sqrtPriceX96) return BigInt(0);

  const Tolerance: number = 0.05; // 기존 하드 코딩과 동일
  const multiplier = zeroForOne
    ? new BigDecimal(1, 18).sub(new BigDecimal(Tolerance || 0.1, 18)).sqrt()
    : new BigDecimal(1, 18).add(new BigDecimal(Tolerance || 0.1, 18)).sqrt();

  const fSqrtPriceLimit = sqrtPriceX96.multiply(
    new Fraction(
      multiplier.roundToDecimals(18).value.toString(10),
      BigInt(1e18).toString(10)
    )
  );

  const sqrtPriceLimit = mathUtils.fractionToQ6496(
    fSqrtPriceLimit.numerator,
    fSqrtPriceLimit.denominator
  );

  return BigInt(sqrtPriceLimit.toString());
}

export function receiveWithSlippage(
  quoteReceive: bigint | null,
  maxSlippage?: number | null
): bigint {
  if (!quoteReceive) return BigInt(1);
  if (maxSlippage == null) return BigInt(1);

  let ms = maxSlippage;
  if (ms < 0) ms = 0;
  if (ms > 1) ms = 1;

  const s = ms.toString();
  const [ints, frac = ""] = s.split(".");
  const scale = BigInt(10) ** BigInt(frac.length);
  const msInt = BigInt(ints + frac);
  const numer = scale - msInt;
  const denom = scale;
  return (quoteReceive * numer) / denom;
}
