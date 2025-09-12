
import { QuoteCtx } from "./types";
import tokens from "@/const/contracts/tokens/tokens";
import { BigDecimal } from "@/types/BigDecimal";
import { quoteExactInputSingle, quoteExactOutputSingle } from "@/utils/uniswap/getSwapAmount";
import previewFullDeposit from "@/utils/farm/previewFullDeposit";
import previewRedeem from "@/utils/farm/previewRedeem";
import { getSlot0 } from "@/utils/uniswap/getPoolState";
import { getPoolPrice } from "@/utils/uniswap/getPoolPrice";
import { Fraction } from "@uniswap/sdk-core";
import { PublicClient } from "viem";

export async function getOtherAmount(
  ctx: QuoteCtx,
  thisAmount: string,
  thisSide: "in" | "out",
  overrideFromToken?: any,
  overrideToToken?: any,
): Promise<string> {
  try {
    const {
      chainId,
      swapPool,
      poolInfo: { poolAddress, outBpool, token0Decimals, token1Decimals, zeroForOne },
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

    if (!thisAmount || !chainId || !assetValues || !curFromToken || !curToToken) return "";
    if (!swapPool || !poolAddress || !outBpool) return "";

    const fromErc20 = curFromToken.symbol === "ETH" ? tokens.WETH : curFromToken;
    const toErc20   = curToToken.symbol   === "ETH" ? tokens.WETH   : curToToken;

    const inputUnderlying = fromErc20;
    const outputUnderlying = toErc20;
    const inputAddrUnderlying  = inputUnderlying?.addresses?.[chainId] as `0x${string}` | undefined;
    const outputAddrUnderlying = outputUnderlying?.addresses?.[chainId] as `0x${string}` | undefined;

    // Guard: identical underlying token (e.g., race during token switch) -> skip quoting
      if (!inputAddrUnderlying || !outputAddrUnderlying) return "";
      if (inputAddrUnderlying.toLowerCase() === outputAddrUnderlying.toLowerCase()) return "";

    // 5) slot0 -> pool price
    const slot0Data = await getSlot0(publicClient as any, poolAddress as `0x${string}`);
    if (!slot0Data) return "";

    console.log("[quote.inputs]", {
      chainId,
      poolAddress,
      tokenInUnderlying: inputAddrUnderlying,
      tokenOutUnderlying: outputAddrUnderlying,
      thisSide,
      thisAmount,
    });

    // sqrtPriceX96 Fraction 저장 (후속 priceLimit 계산용)
    setSqrtPriceX96?.(
      new Fraction(
        slot0Data.sqrtPriceX96.toString(),
        (BigInt(2) ** BigInt(96)).toString(),
      ),
    );

    const swapPoolPrice = getPoolPrice({
      sqrtPriceX96: slot0Data.sqrtPriceX96,
      token0Decimals: token0Decimals as number,
      token1Decimals: token1Decimals as number,
      zeroForOne,
    });

    const midPoolPrice = await previewRedeem(publicClient as any, outBpool as any, swapPoolPrice);
    if (midPoolPrice) {
      const producedPair = `${addrLower(curFromToken)}_${addrLower(curToToken)}`;
      if (producedPair === pairKey) {
        setMidPoolPrice(midPoolPrice);
        try { setMidOwner?.(pairKey); } catch {}
      }
    }

    const pickTokenMeta = (entry: any) => {
      const bAddr = entry?.addresses?.[chainId] as `0x${string}` | undefined;
      const uAddr = entry?.input?.addresses?.[chainId] as `0x${string}` | undefined;
      const uSym  = entry?.input?.symbol as string | undefined;
      const bDec  = entry?.decimals as number | undefined;
      return { bAddr, uAddr, uSym, bDec, raw: entry };
    };

    const meta0 = pickTokenMeta(swapPool.input[0]);
    const meta1 = pickTokenMeta(swapPool.input[1]);

    // underlying 주소로 방향 확정(반드시 0↔1로 매칭되도록)
    const inIs0  = inputAddrUnderlying.toLowerCase()  === (meta0.uAddr ?? "").toLowerCase();
    const outIs1 = outputAddrUnderlying.toLowerCase() === (meta1.uAddr ?? "").toLowerCase();
    const inIs1  = inputAddrUnderlying.toLowerCase()  === (meta1.uAddr ?? "").toLowerCase();
    const outIs0 = outputAddrUnderlying.toLowerCase() === (meta0.uAddr ?? "").toLowerCase();

    const inputMeta  = inIs0 ? meta0 : inIs1 ? meta1 : undefined;
    const outputMeta = outIs1 ? meta1 : outIs0 ? meta0 : undefined;

    if (!inputMeta || !outputMeta) return "";

    // const midPoolPriceRaw = await previewRedeem(publicClient as any, outBpool as any, swapPoolPrice);
    // if (midPoolPriceRaw) {
    //   let oriented = midPoolPriceRaw;
    //   // 입력이 meta1이고 출력이 meta0인 경우 = 방향 반대 → 역수 처리
    //   if (inIs1 && outIs0) {
    //     try {
    //       oriented = new BigDecimal(BigInt(1), 0).div(midPoolPriceRaw);
    //     } catch {
    //       oriented = midPoolPriceRaw; // divide-by-zero 안전
    //     }
    //   }
    //   const producedPair = `${addrLower(curFromToken)}_${addrLower(curToToken)}`;
    //   if (producedPair === pairKey) {
    //     setMidPoolPrice(oriented);
    //     try { setMidOwner?.(pairKey); } catch {}
    //   }
    //   // B-logs(2): 중간가/방향
    //   console.log("[midPrice]", {
    //     raw: midPoolPriceRaw?.toString?.(),
    //     oriented: oriented?.toString?.(),
    //     inIs0, outIs1, inIs1, outIs0,
    //   });
    // }

    const feeTier = swapPool.fee_tier as number;

    if (thisSide === "in") {
      // Exact Input: underlying(from) -> bIn -> Quoter exactInput -> bOut -> underlying(to)
      const parsedUnderlyingIn = new BigDecimal(thisAmount, fromErc20.decimals ?? 18);
      if (parsedUnderlyingIn.value <= BigInt(0)) return "0";
      const bAmountIn = await previewFullDeposit(publicClient as any, inputMeta.raw, parsedUnderlyingIn);
      if (!bAmountIn || bAmountIn.value <= BigInt(0)) return "";

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
      if (!quote|| quote.amountOut <= BigInt(0)) return "";
      setQuoteReceive?.(quote.amountOut);

      const bOutBD = new BigDecimal(quote.amountOut, outputMeta.bDec ?? 18);
      const finalUnderlyingOut = await previewRedeem(publicClient as any, outputMeta.raw, bOutBD);
      if (!finalUnderlyingOut) return "";

      console.log("[quote.result.in]", {
        bIn: bAmountIn.value.toString(),
        bOut: quote.amountOut.toString(),
        underlyingOut: finalUnderlyingOut.toString(),
      });

      return finalUnderlyingOut.toPrecisionString(true, false);
    } else {
      // Exact Output: underlying(to) -> bOut(desired) -> Quoter exactOutput -> bIn -> underlying(from)
      const desiredUnderlyingOut = new BigDecimal(thisAmount, toErc20.decimals ?? 18);
      const desiredBOut = await previewFullDeposit(publicClient as any, outputMeta.raw, desiredUnderlyingOut);
      if (!desiredBOut) return "";

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

      const bInRequiredBD = new BigDecimal(quote.amountIn, inputMeta.bDec ?? 18);
      const requiredUnderlyingIn = await previewRedeem(publicClient as any, inputMeta.raw, bInRequiredBD);
      if (!requiredUnderlyingIn) return "";

      console.log("[quote.result.out]", {
        desiredBOut: desiredBOut.value.toString(),
        bIn: quote.amountIn.toString(),
        underlyingIn: requiredUnderlyingIn.toString(),
      });
      
      return requiredUnderlyingIn.toPrecisionString(true, false);
    }
  } catch (e) {
    console.error("[getOtherAmount] error", e);
    return "";
  }
}
