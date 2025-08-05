"use client";

import { motion } from "framer-motion";

import SwapFormAmount from "@/components/(main)/swap/SwapFormSellAmount";
import Icons from "@/assets/icons/icons";
import { useSwapContext } from "@/components/(main)/swap/SwapProvider";
import SwapConfirmButton from "@/components/(main)/swap/swapConfirmButton/SwapConfirmButton";

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
    isLoadingFrom,
    isLoadingTo,
    isApproved
  } = useSwapContext();

  return (
    <motion.section layout className="flex w-full flex-col items-center gap-9">
      <motion.div layout className="flex w-full flex-col items-center gap-2">
        <SwapFormAmount
          amount={fromAmount}
          balance={fromBalance}
          isDisabled={isLoadingFrom}
          isPending={isPending}
          price={fromPrice}
          setAmount={setFromTokenAmountWithGuard}
          setToken={setFromTokenWithGuard}
          token={fromToken}
          isApproved ={isApproved}
          type="sell"
        />
        <div className="flex items-center justify-center">
          <button
            className="size-[30px]"
            //disabled={!toToken}
            onClick={() => {
              if (!fromToken && !toToken) return;
              const prevFromToken = fromToken;
              const prevFromAmount = fromAmount;

              setFromToken(toToken);
              setToToken(prevFromToken);
              setFromAmount(toAmount);
              setToAmount(prevFromAmount);
            }}
          >
            <Icons.ChangeArrow className="fill-foreground" />
          </button>
        </div>
        <SwapFormAmount
          amount={toAmount}
          balance={toBalance}
          isDisabled={isLoadingTo}
          isPending={isPending}
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
