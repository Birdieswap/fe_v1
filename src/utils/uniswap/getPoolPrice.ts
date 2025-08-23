import { BigDecimal } from "@/types/BigDecimal";

// utils/price/uniswapV3PriceBigDecimal.ts
BigDecimal
// 2^96과 2^192를 BigDecimal로 생성
const Q96 = new BigDecimal((BigInt(2) ** BigInt(96)).toString(), 0);
const Q192 = Q96.mul(Q96); // 2^192

// 일반 정밀 나눗셈: 결과 decimals = aMatched.decimals + precision
function divWithPrecision(a: BigDecimal, b: BigDecimal, precision: number): BigDecimal {
  const aMatched = a.matchDecimals(b.decimals);
  const scaleUp = BigInt(10) ** BigInt(precision);
  const quotient = (aMatched.value * scaleUp) / b.value;
  return new BigDecimal(quotient, aMatched.decimals + precision);
}

// 역수 전용 정밀 나눗셈: 결과 decimals = precision (분자의 기존 decimals 반영하지 않음)
function inverseWithPrecision(x: BigDecimal, precision: number): BigDecimal {
  // 1/x를 계산하되, 결과 decimals를 precision으로 강제
  // 방법: (10^precision) / x, 결과 decimals = precision
  const scaleUp = new BigDecimal((BigInt(10) ** BigInt(precision)).toString(), 0); // 정수 10^precision
  // divWithPrecision을 쓰면 또 precision을 더하므로 직접 구현
  // scaleUp.matchDecimals(x.decimals)로 x와 decimals를 맞추고 정수 나눗셈
  const num = scaleUp.matchDecimals(x.decimals); // value * 10^(x.decimals), decimals = x.decimals
  // quotient = num.value / x.value
  const quotient = num.value / x.value;
  // 결과 decimals는 precision (num.decimals - x.decimals + 0)을 강제로 precision으로 맞춤
  // 여기서는 quotient가 이미 num.value/x.value의 정수 몫이므로,
  // 결과 BigDecimal의 decimals를 precision으로 직접 지정
  return new BigDecimal(quotient, precision);
}

export function priceToken1PerToken0_BD(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
  precision = 36
): BigDecimal {
  const sqrtBD = new BigDecimal(sqrtPriceX96.toString(), 0);
  const sqrt2 = sqrtBD.mul(sqrtBD);
  const base = divWithPrecision(sqrt2, Q192, precision); // decimals = precision
  const scalePow = token1Decimals - token0Decimals;
  return base.shift(scalePow); // decimals = precision (shift는 지수 이동 개념으로 값 스케일만 바꿈)
}

export function priceToken0PerToken1_BD(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
  precision = 36
): BigDecimal {
  const p1per0 = priceToken1PerToken0_BD(sqrtPriceX96, token0Decimals, token1Decimals, precision);
  // 역수는 inverseWithPrecision으로 계산 → 결과 decimals = precision
  return inverseWithPrecision(p1per0, precision);
}

export function getPoolPrice(params: {
  sqrtPriceX96: bigint;
  token0Decimals: number;
  token1Decimals: number;
  zeroForOne: boolean;
  precision?: number;
}): BigDecimal {
  const { sqrtPriceX96, token0Decimals, token1Decimals, zeroForOne, precision = 36 } = params;
  return zeroForOne
    ? priceToken1PerToken0_BD(sqrtPriceX96, token0Decimals, token1Decimals, precision)
    : priceToken0PerToken1_BD(sqrtPriceX96, token0Decimals, token1Decimals, precision);
}