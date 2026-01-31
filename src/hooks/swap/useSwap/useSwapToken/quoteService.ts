import tokens from "@/const/contracts/tokens/tokens";
import { BigDecimal } from "@/types/BigDecimal";
import {
  quoteExactInputSingle,
  quoteExactOutputSingle,
} from "@/utils/uniswap/getSwapAmount";
import previewFullDeposit from "@/utils/farm/previewFullDeposit";
import previewRedeem from "@/utils/farm/previewRedeem";
import { getSlot0 } from "@/utils/uniswap/getPoolState";
import { getPoolPrice } from "@/utils/uniswap/getPoolPrice";
import { Fraction } from "@uniswap/sdk-core";
import { PublicClient } from "viem";

import type { QuoteCtx } from "./types";

// =========================
// Types
// =========================
export type DualQuoteResult = {
  /** UI에 표시할 결과(우리 라우트/현재 라우트 결과) */
  amount: string;
  /** 성공 시: 유니스왑 벤치마크 결과, 실패 시: amount*0.9975 fallback */
  benchmarkOut?: string | null;
  /** 디버그용 메타 정보 */
  meta: {
    isInternalPool: boolean;
    benchmarkUsed: "external" | "fallback_internal_x_1" | "none";
  };
};

// =========================
// Debug
// =========================
const DEBUG_QUOTE = true;

// =========================
// Constants
// =========================
const INTERFACE_FEE_FACTOR = new BigDecimal("1"); // 1 - 0.0025

// =========================
// Helpers
// =========================
const symUP = (t?: any) => String(t?.symbol ?? "").toUpperCase();
const isETH = (t?: any) => symUP(t) === "ETH";

/** Quoter에 넘길 ERC20주소: ETH면 WETH 주소 사용 */
function quoteAddr(token: any, chainId: number): `0x${string}` | undefined {
  if (!token || !chainId) return undefined;
  if (isETH(token)) return tokens.WETH.addresses?.[chainId] as any;

  const a = token.addresses?.[chainId];
  return typeof a === "string" && a.length > 0 ? (a as any) : undefined;
}

/** 내부 로직에서 underlying 계산은 ETH면 WETH로 */
function underlyingErc20(token: any) {
  return isETH(token) ? tokens.WETH : token;
}

/** outAmountStr(토큰 단위 문자열)에 0.9975 곱해서 fallback benchmark 생성 */
function applyInterfaceFee(outAmountStr: string, outDecimals: number) {
  const outBD = new BigDecimal(String(outAmountStr || "0"), outDecimals);
  const afterFee = outBD.mul(INTERFACE_FEE_FACTOR);
  return afterFee.toPrecisionString(true, false);
}

/**
 * UniswapV3 mid price 계산:
 * price(token1 per token0) = (sqrtPriceX96^2 / 2^192) * 10^(dec0-dec1)
 * fromIsToken0에 따라 1 from = ? to 형태 반환
 */
function sqrtPriceX96ToMidPrice(params: {
  sqrtPriceX96: bigint;
  token0Decimals: number;
  token1Decimals: number;
  fromIsToken0: boolean;
}) {
  const { sqrtPriceX96, token0Decimals, token1Decimals, fromIsToken0 } = params;
  if (!sqrtPriceX96 || sqrtPriceX96 === 0n) return null;

  const Q192 = 2n ** 192n;
  const num = sqrtPriceX96 * sqrtPriceX96;

  const ratio = new BigDecimal(num.toString()).div(
    new BigDecimal(Q192.toString())
  );

  const scalePow = token0Decimals - token1Decimals;
  let scale = new BigDecimal("1");
  if (scalePow > 0) scale = new BigDecimal("1" + "0".repeat(scalePow));
  if (scalePow < 0) {
    scale = new BigDecimal("1").div(
      new BigDecimal("1" + "0".repeat(-scalePow))
    );
  }

  const p1Per0 = ratio.mul(scale);

  const pIsZero = (p1Per0 as any)?.isZero
    ? (p1Per0 as any).isZero()
    : p1Per0.lte(0);
  if (pIsZero) return null;

  if (fromIsToken0) return p1Per0;

  return new BigDecimal("1").div(p1Per0);
}

/**
 * slot0 기반으로 midPrice를 항상 세팅(외부풀 포함)
 * - 성공: setMidPoolPrice + setMidOwner(pairKey)
 * - 실패: 아무것도 안 함
 */
async function ensureMidPriceFromSlot0(
  ctx: QuoteCtx,
  curFromToken: any,
  curToToken: any
) {
  const {
    chainId,
    swapPool,
    poolInfo,
    publicClient,
    setMidPoolPrice,
    setMidOwner,
    pairKey,
  } = ctx;

  if (!publicClient || !swapPool || !chainId) return;

  const poolAddr = (swapPool as any)?.addresses?.[chainId] as
    | `0x${string}`
    | undefined;
  if (!poolAddr) return;

  try {
    const slot0 = await getSlot0(publicClient as any, poolAddr);
    if (!slot0?.sqrtPriceX96 || slot0.sqrtPriceX96 === 0n) return;

    const token0Dec =
      poolInfo?.token0Decimals ??
      (swapPool as any)?.input?.[0]?.decimals ??
      (swapPool as any)?.input?.[0]?.input?.decimals ??
      18;

    const token1Dec =
      poolInfo?.token1Decimals ??
      (swapPool as any)?.input?.[1]?.decimals ??
      (swapPool as any)?.input?.[1]?.input?.decimals ??
      18;

    const mid = sqrtPriceX96ToMidPrice({
      sqrtPriceX96: slot0.sqrtPriceX96,
      token0Decimals: token0Dec,
      token1Decimals: token1Dec,
      fromIsToken0: !!poolInfo?.fromIsToken0,
    });

    if (!mid) return;

    // if (DEBUG_QUOTE) {
    //   console.log("[ensureMidPriceFromSlot0] midPrice", {
    //     pool: (swapPool as any)?.symbol,
    //     chainId,
    //     poolAddr,
    //     mid: mid.toPrecisionString(true, false),
    //     fromIsToken0: !!poolInfo?.fromIsToken0,
    //   });
    // }

    setMidPoolPrice(mid);
    setMidOwner?.(pairKey);
  } catch (e) {
    if (DEBUG_QUOTE) console.warn("[ensureMidPriceFromSlot0] fail", e);
  }
}

// =========================
// INTERNAL quote
// =========================
async function getOtherAmountInternal(
  ctx: QuoteCtx,
  thisAmount: string,
  thisSide: "in" | "out",
  curFromToken: any,
  curToToken: any
): Promise<DualQuoteResult> {
  try {
    const {
      chainId,
      swapPool,
      poolInfo: {
        poolAddress,
        outBpool, // 현재는 사용 안 하지만 타입 변화 피하려고 그대로 둠
        token0Decimals,
        token1Decimals,
        zeroForOne,
      },
      assetValues,
      publicClient,
      setMidPoolPrice,
      setSqrtPriceX96,
      setQuoteReceive,
      setMidOwner,
      pairKey,
      addrLower,
    } = ctx;

    if (!thisAmount || !chainId || !assetValues || !curFromToken || !curToToken)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };
    if (!swapPool || !poolAddress || !publicClient)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    const fromErc20 = underlyingErc20(curFromToken);
    const toErc20 = underlyingErc20(curToToken);

    const inputAddrUnderlying = fromErc20?.addresses?.[chainId] as
      | `0x${string}`
      | undefined;
    const outputAddrUnderlying = toErc20?.addresses?.[chainId] as
      | `0x${string}`
      | undefined;

    if (!inputAddrUnderlying || !outputAddrUnderlying)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    if (
      inputAddrUnderlying.toLowerCase() === outputAddrUnderlying.toLowerCase()
    )
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    // slot0 -> pool price (bToken 기준 mid)
    const slot0Data = await getSlot0(
      publicClient as any,
      poolAddress as `0x${string}`
    );
    if (!slot0Data)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    setSqrtPriceX96?.(
      new Fraction(
        slot0Data.sqrtPriceX96.toString(),
        (BigInt(2) ** BigInt(96)).toString()
      )
    );

    const swapPoolPrice = getPoolPrice({
      sqrtPriceX96: slot0Data.sqrtPriceX96,
      token0Decimals: token0Decimals as number,
      token1Decimals: token1Decimals as number,
      zeroForOne,
    });

    const pickTokenMeta = (entry: any) => {
      const bAddr = entry?.addresses?.[chainId] as `0x${string}` | undefined;
      const uAddr = entry?.input?.addresses?.[chainId] as
        | `0x${string}`
        | undefined;
      const bDec = entry?.decimals as number | undefined;
      return { bAddr, uAddr, bDec, raw: entry };
    };

    const meta0 = pickTokenMeta(swapPool.input[0]);
    const meta1 = pickTokenMeta(swapPool.input[1]);

    const inIs0 =
      inputAddrUnderlying.toLowerCase() === (meta0.uAddr ?? "").toLowerCase();
    const inIs1 =
      inputAddrUnderlying.toLowerCase() === (meta1.uAddr ?? "").toLowerCase();

    const outIs1 =
      outputAddrUnderlying.toLowerCase() === (meta1.uAddr ?? "").toLowerCase();
    const outIs0 =
      outputAddrUnderlying.toLowerCase() === (meta0.uAddr ?? "").toLowerCase();

    const inputMeta = inIs0 ? meta0 : inIs1 ? meta1 : undefined;
    const outputMeta = outIs1 ? meta1 : outIs0 ? meta0 : undefined;
    if (!inputMeta || !outputMeta)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    const feeTier = swapPool.fee_tier as number;

    // =========================
    // 완전한 underlying mid price 계산
    // P_U = (v_out * P_B) / v_in
    //  - v_in  = previewRedeem(1 B_in)
    //  - v_out = previewRedeem(1 B_out)
    //  - P_B   = swapPoolPrice (B_out / B_in)
    // =========================
    try {
      const oneBIn = new BigDecimal("1", inputMeta.bDec ?? 18);
      const oneBOut = new BigDecimal("1", outputMeta.bDec ?? 18);

      const underlyingPerBIn = await previewRedeem(
        publicClient as any,
        inputMeta.raw,
        oneBIn
      );
      const underlyingPerBOut = await previewRedeem(
        publicClient as any,
        outputMeta.raw,
        oneBOut
      );

      if (
        !underlyingPerBIn ||
        !underlyingPerBOut ||
        underlyingPerBIn.value <= 0n ||
        underlyingPerBOut.value <= 0n
      ) {
        throw new Error("invalid share price from previewRedeem");
      }

      // v_out * P_B  (단위: U_out per B_in)
      const uOutPerBIn = underlyingPerBOut.mul(swapPoolPrice);
      // (v_out * P_B) / v_in  (단위: U_out / U_in)
      const midUnderlying = uOutPerBIn.div(underlyingPerBIn);

      const midIsZero =
        (midUnderlying as any)?.isZero?.() ?? midUnderlying.lte(0);

      if (!midIsZero) {
        const poolAddrForKey = (swapPool as any)?.addresses?.[chainId] as
          | string
          | undefined;
        const producedKey = `${addrLower(curFromToken)}_${addrLower(
          curToToken
        )}_${(poolAddrForKey ?? "").toLowerCase()}`;

        // 🔥 여기서 pairKey와 정확히 맞춰줘야 internal PI 계산이 살아난다
        if (producedKey === pairKey) {
          setMidPoolPrice(midUnderlying);
          setMidOwner?.(pairKey);
        }
      }
    } catch (e) {
      if (DEBUG_QUOTE) {
        console.warn("[internal midPrice underlying calc error]", e);
      }
      // 실패 시 slot0 기반 mid fallback (기존 로직 유지)
      await ensureMidPriceFromSlot0(ctx, curFromToken, curToToken);
    }

    // -------------------------
    // SIDE: in
    // -------------------------
    if (thisSide === "in") {
      const parsedUnderlyingIn = new BigDecimal(
        thisAmount,
        fromErc20.decimals ?? 18
      );
      if (parsedUnderlyingIn.value <= 0n)
        return {
          amount: "0",
          benchmarkOut: "0",
          meta: { isInternalPool: true, benchmarkUsed: "none" },
        };

      // underlying -> bIn
      const bAmountIn = await previewFullDeposit(
        publicClient as any,
        inputMeta.raw,
        parsedUnderlyingIn
      );
      if (!bAmountIn || bAmountIn.value <= 0n)
        return {
          amount: "",
          benchmarkOut: null,
          meta: { isInternalPool: true, benchmarkUsed: "none" },
        };

      // bIn -> bOut (quoter)
      let quote: any;
      try {
        quote = await quoteExactInputSingle(
          publicClient as PublicClient,
          inputMeta.bAddr as `0x${string}`,
          outputMeta.bAddr as `0x${string}`,
          bAmountIn.value,
          feeTier,
          0n,
          {
            tag: "internalExactInput",
            tokenIn: inputMeta.bAddr,
            tokenOut: outputMeta.bAddr,
            fee: feeTier,
            amountIn: bAmountIn.value,
          }
        );
      } catch (e) {
        if (DEBUG_QUOTE) {
          console.warn("[internal quote reverted]", {
            chainId,
            pool: (swapPool as any)?.symbol,
            poolAddress,
            tokenIn: inputMeta.bAddr,
            tokenOut: outputMeta.bAddr,
            feeTier,
            amountIn: bAmountIn.value.toString(),
          });
          console.warn(e);
        }
        return {
          amount: "",
          benchmarkOut: null,
          meta: { isInternalPool: true, benchmarkUsed: "none" },
        };
      }

      if (!quote || quote.amountOut <= 0n)
        return {
          amount: "",
          benchmarkOut: null,
          meta: { isInternalPool: true, benchmarkUsed: "none" },
        };

      setQuoteReceive?.(quote.amountOut);

      // bOut -> underlying (final)
      const bOutBD = new BigDecimal(quote.amountOut, outputMeta.bDec ?? 18);
      const finalUnderlyingOut = await previewRedeem(
        publicClient as any,
        outputMeta.raw,
        bOutBD
      );
      if (!finalUnderlyingOut)
        return {
          amount: "",
          benchmarkOut: null,
          meta: { isInternalPool: true, benchmarkUsed: "none" },
        };

      const amountStr = finalUnderlyingOut.toPrecisionString(true, false);

      // ✅ benchmarkOut: external quote가 가능하면 그걸, 실패하면 internal*0.9975
      let benchmarkOut: string | null = null;
      let benchmarkUsed: DualQuoteResult["meta"]["benchmarkUsed"] = "none";

      try {
        const bench = await quoteExactInputSingle(
          publicClient as PublicClient,
          inputAddrUnderlying,
          outputAddrUnderlying,
          parsedUnderlyingIn.value,
          feeTier,
          0n,
          {
            tag: "benchmarkExactInput",
            tokenIn: inputAddrUnderlying,
            tokenOut: outputAddrUnderlying,
            fee: feeTier,
            amountIn: parsedUnderlyingIn.value,
          }
        );

        if (bench?.amountOut && bench.amountOut > 0n) {
          const benchOutBD = new BigDecimal(
            bench.amountOut,
            toErc20.decimals ?? 18
          );
          benchmarkOut = benchOutBD.toPrecisionString(true, false);
          benchmarkUsed = "external";
        } else {
          benchmarkOut = applyInterfaceFee(amountStr, toErc20.decimals ?? 18);
          benchmarkUsed = "fallback_internal_x_1";
        }
      } catch (e) {
        if (DEBUG_QUOTE) {
          console.warn("[internal benchmark quote reverted]", {
            chainId,
            pool: (swapPool as any)?.symbol,
            inputAddrUnderlying,
            outputAddrUnderlying,
            feeTier,
          });
          console.warn(e);
        }
        benchmarkOut = applyInterfaceFee(amountStr, toErc20.decimals ?? 18);
        benchmarkUsed = "fallback_internal_x_1";
      }

      return {
        amount: amountStr,
        benchmarkOut,
        meta: { isInternalPool: true, benchmarkUsed },
      };
    }

    // -------------------------
    // SIDE: out
    // -------------------------
    const desiredUnderlyingOut = new BigDecimal(
      thisAmount,
      toErc20.decimals ?? 18
    );
    if (desiredUnderlyingOut.value <= 0n)
      return {
        amount: "0",
        benchmarkOut: "0",
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    // desired underlying -> desired bOut
    const desiredBOut = await previewFullDeposit(
      publicClient as any,
      outputMeta.raw,
      desiredUnderlyingOut
    );
    if (!desiredBOut)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    // quoter exactOutput: bIn required
    let quote: any;
    try {
      quote = await quoteExactOutputSingle(
        publicClient as PublicClient,
        inputMeta.bAddr as `0x${string}`,
        outputMeta.bAddr as `0x${string}`,
        desiredBOut.value,
        feeTier,
        0n,
        {
          tag: "internalExactOutput",
          tokenIn: inputMeta.bAddr,
          tokenOut: outputMeta.bAddr,
          fee: feeTier,
          amount: desiredBOut.value,
        }
      );
    } catch (e) {
      if (DEBUG_QUOTE) console.warn("[internal exactOutput reverted]", e);
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };
    }

    if (!quote)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    // bIn -> underlying required
    const bInRequiredBD = new BigDecimal(quote.amountIn, inputMeta.bDec ?? 18);
    const requiredUnderlyingIn = await previewRedeem(
      publicClient as any,
      inputMeta.raw,
      bInRequiredBD
    );
    if (!requiredUnderlyingIn)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: true, benchmarkUsed: "none" },
      };

    const amountStr = requiredUnderlyingIn.toPrecisionString(true, false);

    // out side 에서는 일단 amount 기반 fallback 만 제공
    const benchmarkOut = applyInterfaceFee(thisAmount, toErc20.decimals ?? 18);

    return {
      amount: amountStr,
      benchmarkOut,
      meta: {
        isInternalPool: true,
        benchmarkUsed: "fallback_internal_x_1",
      },
    };
  } catch (e) {
    if (DEBUG_QUOTE) console.error("[getOtherAmountInternal] fatal", e);
    return {
      amount: "",
      benchmarkOut: null,
      meta: { isInternalPool: true, benchmarkUsed: "none" },
    };
  }
}

// =========================
// EXTERNAL quote
// =========================
async function getOtherAmountExternal(
  ctx: QuoteCtx,
  thisAmount: string,
  thisSide: "in" | "out",
  curFromToken: any,
  curToToken: any
): Promise<DualQuoteResult> {
  try {
    const { chainId, swapPool, publicClient, setQuoteReceive } = ctx;
    if (!thisAmount || !chainId || !curFromToken || !curToToken)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };
    if (!swapPool || !publicClient)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };

    const poolAddr = (swapPool as any)?.addresses?.[chainId] as
      | `0x${string}`
      | undefined;
    const feeTier = (swapPool as any)?.fee_tier as number | undefined;

    if (!poolAddr || feeTier == null)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };

    const tokenInAddr = quoteAddr(curFromToken, chainId);
    const tokenOutAddr = quoteAddr(curToToken, chainId);
    if (!tokenInAddr || !tokenOutAddr)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };

    // if (DEBUG_QUOTE) {
    //   console.log("[external quote] ctx", {
    //     chainId,
    //     pool: (swapPool as any)?.symbol,
    //     poolAddr,
    //     feeTier,
    //     tokenInAddr,
    //     tokenOutAddr,
    //     side: thisSide,
    //     amount: thisAmount,
    //   });
    // }

    // midPrice 보장 (PI 용)
    await ensureMidPriceFromSlot0(ctx, curFromToken, curToToken);

    const fromErc20 = underlyingErc20(curFromToken);
    const toErc20 = underlyingErc20(curToToken);

    if (thisSide === "in") {
      const parsedIn = new BigDecimal(thisAmount, fromErc20.decimals ?? 18);
      if (parsedIn.value <= 0n)
        return {
          amount: "0",
          benchmarkOut: "0",
          meta: { isInternalPool: false, benchmarkUsed: "none" },
        };

      const quote = await quoteExactInputSingle(
        publicClient as PublicClient,
        tokenInAddr,
        tokenOutAddr,
        parsedIn.value,
        feeTier,
        0n,
        {
          tag: "externalExactInput",
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          fee: feeTier,
          amountIn: parsedIn.value,
        }
      );
      if (!quote || quote.amountOut <= 0n)
        return {
          amount: "",
          benchmarkOut: null,
          meta: { isInternalPool: false, benchmarkUsed: "none" },
        };

      setQuoteReceive?.(quote.amountOut);

      const outBD = new BigDecimal(quote.amountOut, toErc20.decimals ?? 18);
      const amountStr = outBD.toPrecisionString(true, false);

      // external 의 benchmark는 "자기 자신 * 0.9975" 로 사용
      const benchmarkOut = applyInterfaceFee(amountStr, toErc20.decimals ?? 18);

      // if (DEBUG_QUOTE) {
      //   console.log("[external result in]", {
      //     amountStr,
      //     benchmarkOut,
      //   });
      // }

      return {
        amount: amountStr,
        benchmarkOut,
        meta: {
          isInternalPool: false,
          benchmarkUsed: "fallback_internal_x_1",
        },
      };
    }

    // SIDE: out
    const desiredOut = new BigDecimal(thisAmount, toErc20.decimals ?? 18);
    if (desiredOut.value <= 0n)
      return {
        amount: "0",
        benchmarkOut: "0",
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };

    const quote = await quoteExactOutputSingle(
      publicClient as PublicClient,
      tokenInAddr,
      tokenOutAddr,
      desiredOut.value,
      feeTier,
      0n,
      {
        tag: "externalExactOutput",
        tokenIn: tokenInAddr,
        tokenOut: tokenOutAddr,
        fee: feeTier,
        amount: desiredOut.value,
      }
    );
    if (!quote)
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };

    setQuoteReceive?.(quote.amountIn);

    const inBD = new BigDecimal(quote.amountIn, fromErc20.decimals ?? 18);
    const amountStr = inBD.toPrecisionString(true, false);

    const benchmarkOut = applyInterfaceFee(thisAmount, toErc20.decimals ?? 18);

    // if (DEBUG_QUOTE) {
    //   console.log("[external result out]", {
    //     amountStr,
    //     benchmarkOut,
    //   });
    // }

    return {
      amount: amountStr,
      benchmarkOut,
      meta: {
        isInternalPool: false,
        benchmarkUsed: "fallback_internal_x_1",
      },
    };
  } catch (e) {
    if (DEBUG_QUOTE) {
      console.warn("[external quote reverted]", {
        chainId: ctx.chainId,
        pool: (ctx.swapPool as any)?.symbol,
      });
      console.warn(e);
    }

    return {
      amount: "",
      benchmarkOut: null,
      meta: { isInternalPool: false, benchmarkUsed: "none" },
    };
  }
}

// =========================
// Public entry
// =========================
export async function getOtherAmount(
  ctx: QuoteCtx,
  thisAmount: string,
  thisSide: "in" | "out",
  overrideFromToken?: any,
  overrideToToken?: any
): Promise<DualQuoteResult> {
  try {
    const curFromToken = overrideFromToken ?? ctx.fromToken;
    const curToToken = overrideToToken ?? ctx.toToken;
    if (!curFromToken || !curToToken) {
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };
    }
    if (!ctx.swapPool) {
      return {
        amount: "",
        benchmarkOut: null,
        meta: { isInternalPool: false, benchmarkUsed: "none" },
      };
    }

    const isInternalPool = !!(ctx.swapPool as any)?.isInternal;

    // if (DEBUG_QUOTE) {
    //   console.log("[getOtherAmount] sanity", {
    //     chainId: ctx.chainId,
    //     side: thisSide,
    //     amount: thisAmount,
    //     pool: (ctx.swapPool as any)?.symbol,
    //     isInternal: isInternalPool,
    //     poolAddr: (ctx.swapPool as any)?.addresses?.[ctx.chainId],
    //     fee: (ctx.swapPool as any)?.fee_tier,
    //     from: curFromToken?.symbol,
    //     to: curToToken?.symbol,
    //     quoteIn: quoteAddr(curFromToken, ctx.chainId),
    //     quoteOut: quoteAddr(curToToken, ctx.chainId),
    //     poolInfo: ctx.poolInfo,
    //     pairKey: ctx.pairKey,
    //   });
    // }

    return isInternalPool
      ? await getOtherAmountInternal(
          ctx,
          thisAmount,
          thisSide,
          curFromToken,
          curToToken
        )
      : await getOtherAmountExternal(
          ctx,
          thisAmount,
          thisSide,
          curFromToken,
          curToToken
        );
  } catch (e) {
    console.error("[getOtherAmount] fatal error", e);
    return {
      amount: "",
      benchmarkOut: null,
      meta: { isInternalPool: false, benchmarkUsed: "none" },
    };
  }
}
