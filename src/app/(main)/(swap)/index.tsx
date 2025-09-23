"use client";

import { motion } from "framer-motion";

import SwapFormAmount from "@/components/(main)/swap/SwapFormSellAmount";
import Icons from "@/assets/icons/icons";
import { useSwapContext } from "@/components/(main)/swap/SwapProvider";
import SwapConfirmButton from "@/components/(main)/swap/swapConfirmButton/SwapConfirmButton";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useChainId } from "wagmi";
import tokens from "@/const/contracts/tokens/tokens";

export default function SwapIndex() {
  const {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    fromAmount,
    fromPrice,
    toPrice,
    setFromAmount,
    toAmount,
    setToAmount,
    fromBalance,
    toBalance,
    setToTokenWithGuard,
    setFromTokenWithGuard,
    setToTokenAmountWithGuard,
    setFromTokenAmountWithGuard,
    isPending,
    isApprovePending,
    isLoadingFrom,
    isLoadingTo,
    isApproved,
    setIsTyping,
    updateAmount,
  } = useSwapContext();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const chainId = useChainId();

  const lastAppliedRef = useRef<{ from?: string; to?: string }>({});

  const resolveBySymbol = useCallback(
    (sym?: string) => {
      if (!sym) return undefined;
      const s = sym.trim().toUpperCase();
      const list: any[] = Array.isArray(tokens)
        ? (tokens as any[])
        : Object.values(tokens || {});
      // 체인에 실제 주소가 있는 토큰만 대상
      return list.find((t) => {
        const symbolEq =
          t?.symbol?.toUpperCase?.() === s ||
          // 심볼 별칭이 있다면 여기에 추가 (예: "ETH" → "WETH")
          (s === "ETH" && t?.symbol?.toUpperCase?.() === "WETH");
        const hasAddr = (t?.addresses && t?.addresses?.[chainId]) || t?.address;
        return symbolEq && !!hasAddr;
      });
    },
    [chainId]
  );

  const clearSwapParamsInUrl = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const hadFrom = sp.has("from");
    const hadTo = sp.has("to");
    if (hadFrom) sp.delete("from");
    if (hadTo) sp.delete("to");
    if (hadFrom || hadTo) {
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  useEffect(() => {
    const fromSym = searchParams.get("from") || undefined;
    const toSym = searchParams.get("to") || undefined;

    // 파라미터 없으면 스킵
    if (!fromSym && !toSym) return;

    const fTok = resolveBySymbol(fromSym);
    const tTok = resolveBySymbol(toSym);

    let didApply = false;

    // from 적용
    if (fromSym && fromSym !== lastAppliedRef.current.from) {
      if (fTok && fTok?.symbol !== fromToken?.symbol) {
        setIsTyping(true);
        setFromAmount("");
        setToAmount("");
        (setFromTokenWithGuard ?? setFromToken)?.(fTok);
        didApply = true;
      }
      lastAppliedRef.current.from = fromSym;
    }

    // to 적용
    if (toSym && toSym !== lastAppliedRef.current.to) {
      if (tTok && tTok?.symbol !== toToken?.symbol) {
        setIsTyping(true);
        setFromAmount("");
        setToAmount("");
        (setToTokenWithGuard ?? setToToken)?.(tTok);
        didApply = true;
      }
      lastAppliedRef.current.to = toSym;
    }

    // 같은 토큰 들어온 경우 to 비우기(옵션)
    if (fTok && tTok && fTok?.symbol === tTok?.symbol) {
      setToToken?.(undefined);
    }

    // 적용 후 URL 정리(루프 방지 & 깔끔한 주소)
    if (didApply) {
      const sp = new URLSearchParams(searchParams.toString());
      if (fromSym) sp.delete("from");
      if (toSym) sp.delete("to");
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [
    searchParams,
    resolveBySymbol,
    chainId,
    fromToken?.symbol,
    toToken?.symbol,
    setFromTokenWithGuard,
    setFromToken,
    setToTokenWithGuard,
    setToToken,
    setFromAmount,
    setToAmount,
    setIsTyping,
    router,
    pathname,
  ]);

  return (
    <motion.section layout className="flex w-full flex-col items-center gap-9">
      <motion.div layout className="flex w-full flex-col items-center gap-2">
        <SwapFormAmount
          amount={fromAmount}
          balance={fromBalance}
          isDisabled={isLoadingFrom}
          isPending={isPending || isApprovePending}
          price={fromPrice}
          setAmount={setFromTokenAmountWithGuard}
          setToken={setFromTokenWithGuard}
          token={fromToken}
          isApproved={isApproved}
          type="sell"
        />
        <div className="flex items-center justify-center">
          <button
            className="size-[30px]"
            //disabled={!toToken}
            onClick={() => {
              if (!fromToken && !toToken) return;

              // 1) 스냅샷
              const oldFromToken = fromToken;
              const oldToToken = toToken;
              const oldToAmount = toAmount;

              // 2) 새 조합
              const newFromToken = oldToToken; // 토큰 교환
              const newToToken = oldFromToken;
              //const newFromAmount = oldToAmount; // 기존 toAmount가 입력 기준

              // 3) 초기화
              setIsTyping(true);
              setFromToken(newFromToken);
              setToToken(newToToken);
              setFromAmount("");
              setToAmount("");
            }}
          >
            <Icons.ChangeArrow className="fill-foreground" />
          </button>
        </div>
        <SwapFormAmount
          amount={toAmount}
          balance={toBalance}
          isDisabled={isLoadingTo}
          isPending={isPending || isApprovePending}
          price={toPrice}
          setAmount={setToTokenAmountWithGuard}
          setToken={setToTokenWithGuard}
          token={toToken}
          type="buy"
        />
      </motion.div>
      <SwapConfirmButton />
    </motion.section>
  );
}
