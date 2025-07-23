import { useContext, useState } from "react";
import { useAccount, useChainId, useClient, useWriteContract } from "wagmi";

import { TransactionContext } from "@/app/TransactionContextProvider";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { ICurrency } from "@/const/contracts/types/tokenTypes";
import getSwapResult from "@/utils/assets/getSwapResult";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import tokens from "@/const/contracts/tokens/tokens";

import useBalance from "../useBalance";
import useTokenAddress from "../useTokenAddress";
import useChainLinkPrice from "../useChainLinkPrice";

import useSwapTokens from "./useSwap/useSwapTokens";

export default function useSwap() {
  const chainId = useChainId();
  const [fromToken, setFromToken] = useState<ICurrency | undefined>(
    tokens.WETH,
  );
  const [toToken, setToToken] = useState<ICurrency | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [maxSlippage, setMaxSlippage] = useState<"auto" | number>("auto");
  const { address, isConnected } = useAccount();
  const fromTokenAddress = useTokenAddress(fromToken);
  const toTokenAddress = useTokenAddress(toToken);
  const {
    assetValues,
    balances,
    isFetching: isFetchingAssets,
  } = useContext(AssetsContext);
  const fromPrice = useChainLinkPrice(fromToken);
  const toPrice = useChainLinkPrice(toToken);
  const client = useClient();

  const fromBalance = useBalance(fromToken);
  const toBalance = useBalance(toToken);

  const { isPending: isPendingWriteContract, writeContract } =
    useWriteContract();

  const transactionContext = useContext(TransactionContext);

  const [priceImpact, setPriceImpact] = useState<BigDecimal | undefined>(
    undefined,
  );

  const tempStuff = useSwapTokens({
    client,
    chainId,
    address,
    writeContract,
    fromToken: fromToken,
    fromAmount,
    setFromAmount,
    toToken,
    toAmount,
    setToAmount,
    transactionContext,
    isPendingWriteContract,
    isFetchingAssets,
    assetValues,
    balances,
    setPriceImpact,
    maxSlippage: maxSlippage === "auto" ? 0.005 : maxSlippage / 100, // 0.5% when auto
  });

  /*
  function switchTokens() {
    if (!toToken) return;

    const prevFromToken = fromToken;
    const prevToToken = toToken;
    const prevFromAmount = fromAmount;
    const prevToAmount = toAmount;

    setFromToken(prevToToken);
    setToToken(prevFromToken);
    setFromAmount(prevToAmount);
    setToAmount(prevFromAmount);
  }

  */

  function setFromTokenWithGuard(token: ICurrency | undefined) {
    if (!token) {
      setFromToken(undefined);
      setFromAmount("");
      setToAmount("");

      return;
    }
    const tokenAddress = getTokenAddress({
      token,
      chainId,
    });

    if (tokenAddress === fromTokenAddress) return;
    setPriceImpact(new BigDecimal(0, 18));
    if (tokenAddress === toTokenAddress) {
      //  switchTokens();
      setFromToken(token);
      setToToken(undefined);
      setToAmount("");
      setFromAmount("");

      return;
    } else {
      // toToken이 선택되어 있고 toAmount가 입력되어 있는 경우
      if (toToken && toAmount) {
        setFromToken(token);

        // toAmount를 기준으로 fromAmount 계산
        const toAmountBD = new BigDecimal(toAmount, toToken.decimals || 18);

        if (!toAmountBD.isZero() && chainId && assetValues) {
          const newFromAmount =
            getSwapResult({
              swapFrom: toToken,
              swapTo: token,
              amount: toAmountBD,
              chainId,
              assetValues,
            })?.toPrecisionString(true, false) ?? "";

          setFromAmount(newFromAmount);
          // toAmount는 유지 (setToAmount 호출하지 않음)

          // updateAmount 호출로 정확한 계산 수행
          tempStuff.updateAmount(toAmount, "out", token);
        } else {
          setFromAmount("");
        }
      } else {
        // toToken이 없거나 toAmount가 없는 경우 기존 동작
        setFromToken(token);
        setFromAmount("");
        setToAmount("");
      }
    }
  }

  function setToTokenWithGuard(token: ICurrency | undefined) {
    if (!token) {
      setToToken(undefined);
      setToAmount("");
      setFromAmount("");

      return;
    }
    const tokenAddress = getTokenAddress({
      token,
      chainId,
    });

    if (tokenAddress === toTokenAddress) return;

    setPriceImpact(new BigDecimal(0, 18));
    if (tokenAddress === fromTokenAddress) {
      //switchTokens();
      setFromToken(undefined);
      setToToken(token);
      setToAmount("");
      setFromAmount("");

      return;
    } else {
      // fromToken이 undefined인 경우 처리
      if (!fromToken) {
        setToToken(token);
        setToAmount("");
        setFromAmount("");

        return;
      }

      const fromAmountBD = new BigDecimal(
        fromAmount || "0",
        fromToken?.decimals ?? 18,
      );

      const newToAmount =
        !chainId || !assetValues || fromAmountBD.isZero()
          ? ""
          : (getSwapResult({
              swapFrom: fromToken,
              swapTo: token,
              amount: fromAmountBD,
              chainId,
              assetValues,
            })?.toPrecisionString(true, false) ?? "");

      setToToken(token);
      tempStuff.updateAmount(fromAmount, "in", token);

      if (!newToAmount) {
        setToAmount("");
        setFromAmount("");
      } else {
        setToAmount(newToAmount);
      }
    }
  }

  return {
    maxSlippage,
    setMaxSlippage,
    isApproved: tempStuff.isApproved,
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    fromAmount,
    setFromAmount,
    fromPrice,
    toPrice,
    toAmount,
    setToAmount,
    isZeroAmount: tempStuff.isZeroAmount,
    fromBalance,
    toBalance,
    isConnected,
    isPending: tempStuff.isPending,
    swap: tempStuff.swap,
    approve: tempStuff.approve,
    setToTokenWithGuard,
    setFromTokenWithGuard,
    setToTokenAmountWithGuard: tempStuff.setToTokenAmountWithGuard,
    setFromTokenAmountWithGuard: tempStuff.setFromTokenAmountWithGuard,
    isLoadingFrom: tempStuff.isLoadingFrom,
    isLoadingTo: tempStuff.isLoadingTo,
    chainId,
    exchangeRate: tempStuff.exchangeRate,
    priceImpact,
  };
}
