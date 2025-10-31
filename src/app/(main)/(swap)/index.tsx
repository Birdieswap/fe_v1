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
      return list.find((t) => {
        const symbolEq =
          t?.symbol?.toUpperCase?.() === s ||
          (s === "ETH" && t?.symbol?.toUpperCase?.() === "WETH");
        const hasAddr = (t?.addresses && t?.addresses?.[chainId]) || t?.address;
        return symbolEq && !!hasAddr;
      });
    },
    [chainId]
  );

  // URL(query) → 상태 적용 + 필요 시 URL 정리
  const applySwapParamsFromLocation = useCallback(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(window.location.search);
    const fromSym = sp.get("from") || undefined;
    const toSym = sp.get("to") || undefined;
    if (!fromSym && !toSym) return;

    const fTok = resolveBySymbol(fromSym);
    const tTok = resolveBySymbol(toSym);

    let didApply = false;

    // from
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

    // to
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

    // 같은 토큰이면 to 비우기(옵션)
    if (fTok && tTok && fTok?.symbol === tTok?.symbol) {
      setToToken?.(undefined);
    }

    // 적용 후 URL 정리: router 대신 history 사용 (스크롤/리렌더 간섭 없음)
    if (didApply) {
      const url = new URL(window.location.href);
      if (fromSym) url.searchParams.delete("from");
      if (toSym) url.searchParams.delete("to");
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, [
    resolveBySymbol,
    fromToken?.symbol,
    toToken?.symbol,
    setFromTokenWithGuard,
    setFromToken,
    setToTokenWithGuard,
    setToToken,
    setFromAmount,
    setToAmount,
    setIsTyping,
  ]);

  // 최초 1회 + 내부 커스텀 이벤트 + 뒤/앞으로 이동에 반응
  useEffect(() => {
    applySwapParamsFromLocation(); // mount 시 한 번 처리
    const onEvt = () => applySwapParamsFromLocation();
    window.addEventListener("swap:query-updated", onEvt);
    window.addEventListener("popstate", onEvt);
    return () => {
      window.removeEventListener("swap:query-updated", onEvt);
      window.removeEventListener("popstate", onEvt);
    };
  }, [applySwapParamsFromLocation]);

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
            <Icons.ChangeArrow className="fill-foreground dark:fill-default-600" />
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
