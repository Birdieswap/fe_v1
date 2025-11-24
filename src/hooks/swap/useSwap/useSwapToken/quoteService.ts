import { QuoteCtx } from "./types";
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

const DEBUG_QUOTE = false;

export async function getOtherAmount(
  ctx: QuoteCtx,
  thisAmount: string,
  thisSide: "in" | "out",
  overrideFromToken?: any,
  overrideToToken?: any
): Promise<string> {
  try {
    const {
      chainId,
      swapPool,
      poolInfo: {
        poolAddress,
        outBpool,
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

    const curFromToken = overrideFromToken ?? ctx.fromToken;
    const curToToken = overrideToToken ?? ctx.toToken;

    if (DEBUG_QUOTE) {
      console.log("[getOtherAmount] start", {
        thisAmount,
        thisSide,
        chainId,
        fromSymbol: curFromToken?.symbol,
        toSymbol: curToToken?.symbol,
      });
    }

    if (!thisAmount || !chainId || !assetValues || !curFromToken || !curToToken)
      return "";
    if (!swapPool || !poolAddress || !outBpool) return "";

    const fromErc20 =
      curFromToken.symbol === "ETH" ? tokens.WETH : curFromToken;
    const toErc20 = curToToken.symbol === "ETH" ? tokens.WETH : curToToken;

    const inputUnderlying = fromErc20;
    const outputUnderlying = toErc20;
    const inputAddrUnderlying = inputUnderlying?.addresses?.[chainId] as
      | `0x${string}`
      | undefined;
    const outputAddrUnderlying = outputUnderlying?.addresses?.[chainId] as
      | `0x${string}`
      | undefined;

    // Guard: identical underlying token (e.g., race during token switch) -> skip quoting
    if (!inputAddrUnderlying || !outputAddrUnderlying) return "";
    if (
      inputAddrUnderlying.toLowerCase() === outputAddrUnderlying.toLowerCase()
    )
      return "";

    if (DEBUG_QUOTE) {
      console.log("[getOtherAmount] underlying addrs", {
        inputAddrUnderlying,
        outputAddrUnderlying,
      });
    }

    // 5) slot0 -> pool price
    const slot0Data = await getSlot0(
      publicClient as any,
      poolAddress as `0x${string}`
    );
    if (!slot0Data) return "";

    // console.log("[quote.inputs]", {
    //   chainId,
    //   poolAddress,
    //   tokenInUnderlying: inputAddrUnderlying,
    //   tokenOutUnderlying: outputAddrUnderlying,
    //   thisSide,
    //   thisAmount,
    // });

    // sqrtPriceX96 Fraction 저장 (후속 priceLimit 계산용)
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

    if (DEBUG_QUOTE) {
      console.log("[getOtherAmount] pool price", {
        sqrtPriceX96: slot0Data.sqrtPriceX96.toString(),
        swapPoolPrice: swapPoolPrice?.toString?.() ?? swapPoolPrice,
      });
    }

    const midPoolPrice = await previewRedeem(
      publicClient as any,
      outBpool as any,
      swapPoolPrice
    );
    if (midPoolPrice) {
      const producedPair = `${addrLower(curFromToken)}_${addrLower(curToToken)}`;
      if (producedPair === pairKey) {
        setMidPoolPrice(midPoolPrice);
        try {
          setMidOwner?.(pairKey);
        } catch {}
      }
    }

    const pickTokenMeta = (entry: any) => {
      const bAddr = entry?.addresses?.[chainId] as `0x${string}` | undefined;
      const uAddr = entry?.input?.addresses?.[chainId] as
        | `0x${string}`
        | undefined;
      const uSym = entry?.input?.symbol as string | undefined;
      const bDec = entry?.decimals as number | undefined;
      return { bAddr, uAddr, uSym, bDec, raw: entry };
    };

    const meta0 = pickTokenMeta(swapPool.input[0]);
    const meta1 = pickTokenMeta(swapPool.input[1]);

    // underlying 주소로 방향 확정(반드시 0↔1로 매칭되도록)
    const inIs0 =
      inputAddrUnderlying.toLowerCase() === (meta0.uAddr ?? "").toLowerCase();
    const outIs1 =
      outputAddrUnderlying.toLowerCase() === (meta1.uAddr ?? "").toLowerCase();
    const inIs1 =
      inputAddrUnderlying.toLowerCase() === (meta1.uAddr ?? "").toLowerCase();
    const outIs0 =
      outputAddrUnderlying.toLowerCase() === (meta0.uAddr ?? "").toLowerCase();

    const inputMeta = inIs0 ? meta0 : inIs1 ? meta1 : undefined;
    const outputMeta = outIs1 ? meta1 : outIs0 ? meta0 : undefined;

    if (DEBUG_QUOTE) {
      console.log("[getOtherAmount] meta match", {
        inIs0,
        inIs1,
        outIs0,
        outIs1,
        inputMeta: {
          bAddr: inputMeta?.bAddr,
          uAddr: inputMeta?.uAddr,
          uSym: inputMeta?.uSym,
          bDec: inputMeta?.bDec,
        },
        outputMeta: {
          bAddr: outputMeta?.bAddr,
          uAddr: outputMeta?.uAddr,
          uSym: outputMeta?.uSym,
          bDec: outputMeta?.bDec,
        },
      });
    }

    if (!inputMeta || !outputMeta) return "";

    const feeTier = swapPool.fee_tier as number;

    if (thisSide === "in") {
      // Exact Input: underlying(from) -> bIn -> Quoter exactInput -> bOut -> underlying(to)
      const parsedUnderlyingIn = new BigDecimal(
        thisAmount,
        fromErc20.decimals ?? 18
      );

      if (DEBUG_QUOTE) {
        console.log("[getOtherAmount.in] parsedUnderlyingIn", {
          thisAmount,
          decimals: fromErc20.decimals ?? 18,
          raw: parsedUnderlyingIn.value.toString(),
          display: parsedUnderlyingIn.toString?.() ?? parsedUnderlyingIn,
        });
      }

      if (parsedUnderlyingIn.value <= BigInt(0)) return "0";
      const bAmountIn = await previewFullDeposit(
        publicClient as any,
        inputMeta.raw,
        parsedUnderlyingIn
      );
      if (!bAmountIn || bAmountIn.value <= BigInt(0)) return "";

      if (DEBUG_QUOTE) {
        console.log("[getOtherAmount.in] after previewFullDeposit", {
          bAmountIn: bAmountIn.value.toString(),
        });
      }

      const quote = await quoteExactInputSingle(
        publicClient as PublicClient,
        inputMeta.bAddr as `0x${string}`,
        outputMeta.bAddr as `0x${string}`,
        bAmountIn.value,
        feeTier,
        BigInt(0),
        {
          tag: "exactInput",
          tokenIn: inputMeta.bAddr,
          tokenOut: outputMeta.bAddr,
          fee: feeTier,
          amountIn: bAmountIn.value,
        }
      );
      if (!quote || quote.amountOut <= BigInt(0)) return "";
      setQuoteReceive?.(quote.amountOut);

      if (DEBUG_QUOTE) {
        let approxRateB: number | undefined;
        try {
          approxRateB = Number(quote.amountOut) / Number(bAmountIn.value || 1n);
        } catch {}
        console.log("[getOtherAmount.in] quoter result", {
          amountOut: quote.amountOut.toString(),
          sqrtPriceX96After: quote.sqrtPriceX96After.toString(),
          initializedTicksCrossed: quote.initializedTicksCrossed,
          gasEstimate: quote.gasEstimate.toString(),
          approxRateB, // bOut / bIn (rough)
        });
      }

      const bOutBD = new BigDecimal(quote.amountOut, outputMeta.bDec ?? 18);
      const finalUnderlyingOut = await previewRedeem(
        publicClient as any,
        outputMeta.raw,
        bOutBD
      );
      if (!finalUnderlyingOut) return "";

      if (DEBUG_QUOTE) {
        let approxRateUnderlying: number | undefined;
        try {
          approxRateUnderlying =
            Number(finalUnderlyingOut.toString?.() ?? finalUnderlyingOut) /
            Number(thisAmount);
        } catch {}
        console.log("[getOtherAmount.in] final", {
          finalUnderlyingOutRaw:
            finalUnderlyingOut.value?.toString?.() ?? undefined,
          finalUnderlyingOutDisplay:
            finalUnderlyingOut.toString?.() ?? finalUnderlyingOut,
          approxRateUnderlying, // out / in (rough, only small amounts에서 의미 있음)
        });
      }

      return finalUnderlyingOut.toPrecisionString(true, false);
    } else {
      // Exact Output: underlying(to) -> bOut(desired) -> Quoter exactOutput -> bIn -> underlying(from)
      const desiredUnderlyingOut = new BigDecimal(
        thisAmount,
        toErc20.decimals ?? 18
      );

      if (DEBUG_QUOTE) {
        console.log("[getOtherAmount.out] desiredUnderlyingOut", {
          thisAmount,
          decimals: toErc20.decimals ?? 18,
          raw: desiredUnderlyingOut.value.toString(),
          display: desiredUnderlyingOut.toString?.() ?? desiredUnderlyingOut,
        });
      }

      const desiredBOut = await previewFullDeposit(
        publicClient as any,
        outputMeta.raw,
        desiredUnderlyingOut
      );
      if (!desiredBOut) return "";

      if (DEBUG_QUOTE) {
        console.log("[getOtherAmount.out] after previewFullDeposit", {
          desiredBOut: desiredBOut.value.toString(),
        });
      }

      const quote = await quoteExactOutputSingle(
        publicClient as PublicClient,
        inputMeta.bAddr as `0x${string}`,
        outputMeta.bAddr as `0x${string}`,
        desiredBOut.value,
        feeTier,
        BigInt(0),
        {
          tag: "exactOutput",
          tokenIn: inputMeta.bAddr,
          tokenOut: outputMeta.bAddr,
          fee: feeTier,
          amount: desiredBOut.value,
        }
      );
      if (!quote) return "";

      if (DEBUG_QUOTE) {
        let approxRateB: number | undefined;
        try {
          approxRateB =
            Number(desiredBOut.value || 1n) / Number(quote.amountIn || 1n);
        } catch {}
        console.log("[getOtherAmount.out] quoter result", {
          amountIn: quote.amountIn.toString(),
          sqrtPriceX96After: quote.sqrtPriceX96After.toString(),
          initializedTicksCrossed: quote.initializedTicksCrossed,
          gasEstimate: quote.gasEstimate.toString(),
          approxRateB, // desiredBOut / bInRequired (rough)
        });
      }

      const bInRequiredBD = new BigDecimal(
        quote.amountIn,
        inputMeta.bDec ?? 18
      );
      const requiredUnderlyingIn = await previewRedeem(
        publicClient as any,
        inputMeta.raw,
        bInRequiredBD
      );
      if (!requiredUnderlyingIn) return "";

      if (DEBUG_QUOTE) {
        let approxRateUnderlying: number | undefined;
        try {
          approxRateUnderlying =
            Number(desiredUnderlyingOut.toString?.() ?? desiredUnderlyingOut) /
            Number(requiredUnderlyingIn.toString?.() ?? requiredUnderlyingIn);
        } catch {}
        console.log("[getOtherAmount.out] final", {
          requiredUnderlyingInRaw:
            requiredUnderlyingIn.value?.toString?.() ?? undefined,
          requiredUnderlyingInDisplay:
            requiredUnderlyingIn.toString?.() ?? requiredUnderlyingIn,
          approxRateUnderlying, // desiredOut / requiredIn (rough)
        });
      }

      return requiredUnderlyingIn.toPrecisionString(true, false);
    }
  } catch (e) {
    console.error("[getOtherAmount] error", e);
    return "";
  }
}
