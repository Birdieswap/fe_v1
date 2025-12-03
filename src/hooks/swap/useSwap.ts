import { useContext, useState, useRef, useEffect, useMemo } from "react";
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
import useTokenUsdPrice from "../useTokenUsdPrice";

export default function useSwap() {
  const chainId = useChainId();
  const [fromToken, setFromToken] = useState<ICurrency | undefined>(tokens.ETH);
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
  // const fromPrice = useChainLinkPrice(fromToken);
  // const toPrice = useChainLinkPrice(toToken);

  const { priceUsd: fromUsd } = useTokenUsdPrice(fromToken);
  const { priceUsd: toUsd } = useTokenUsdPrice(toToken);

  // 기존 컴포넌트들이 BigDecimal을 기대하면 변환해서 내려주기
  const fromPrice =
    fromUsd != null ? new BigDecimal(String(fromUsd)) : undefined;
  const toPrice = toUsd != null ? new BigDecimal(String(toUsd)) : undefined;

  const client = useClient();

  const fromBalance = useBalance(fromToken);
  const toBalance = useBalance(toToken);

  const { isPending: isPendingWriteContract, writeContract } =
    useWriteContract();

  const transactionContext = useContext(TransactionContext);

  const [isTyping, setIsTyping] = useState(false);

  const [priceImpact, setPriceImpact] = useState<BigDecimal | undefined>(
    undefined
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
    isTyping, // 추가: 입력중 여부
    stopTyping: () => setIsTyping(false), // 디바운스 완료시 호출'
  });

  // ===== [추가] external/internal 풀 중 "표시할 풀"을 정규화 =====
  // - externalSwapPool이 존재하면 activeSwapPool로 쓰고
  // - 없으면 기존 swapPool 사용
  const externalSwapPool = (tempStuff as any).externalSwapPool ?? null; // ✅ 없을 수도 있으니 안전하게
  const activeSwapPool = externalSwapPool ?? tempStuff.swapPool ?? null;

  const isExternalSwapPool = useMemo(() => {
    // external 풀은 isInternal: false 로 구분 가능
    if (!activeSwapPool) return false;
    return (activeSwapPool as any).isInternal === false;
  }, [activeSwapPool]);

  const prevFromTokenRef = useRef<ICurrency | undefined>(fromToken);
  const prevToTokenRef = useRef<ICurrency | undefined>(toToken);

  const prevChainIdRef = useRef<number | undefined>(chainId);

  // CHANGE(필수): chain 변경 시 입력값 초기화

  useEffect(() => {
    const prev = prevChainIdRef.current;
    if (!chainId || prev === chainId) return;

    // ✅ 체인 변경 시: 초기 상태로 리셋
    setFromToken(tokens.ETH);
    setToToken(undefined);

    setFromAmount("");
    setToAmount("");

    setPriceImpact(undefined); // 또는 new BigDecimal(0, 18)
    setIsTyping(false);

    // 필요하면: 스왑 관련 상태도 초기화 호출(가능한 경우)
    // tempStuff.reset?.();

    // ref도 같이 갱신 (토큰 변경 useEffect들의 "prev" 기준도 맞춰줌)
    prevFromTokenRef.current = tokens.ETH;
    prevToTokenRef.current = undefined;

    prevChainIdRef.current = chainId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  // CHANGE(필수): fromToken 변경 시 입력값 초기화
  useEffect(() => {
    const prev = prevFromTokenRef.current;
    const changed =
      (prev?.symbol || prev?.fullName || prev?.addresses?.[chainId!]) !==
      (fromToken?.symbol ||
        fromToken?.fullName ||
        fromToken?.addresses?.[chainId!]);

    if (changed) {
      // console.log("[reset] fromToken changed → reset fromAmount/toAmount", {
      //   prev: prev?.symbol,
      //   next: fromToken?.symbol,
      // });
      setFromAmount(""); // CHANGE(필수): 초기화
      setToAmount(""); // CHANGE(필수): 초기화
    }

    prevFromTokenRef.current = fromToken;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, chainId]); // chainId도 키로 넣어 체인 변경 시 처리 일관성 강화

  // CHANGE(필수): toToken 변경 시 입력값 초기화
  useEffect(() => {
    const prev = prevToTokenRef.current;
    const changed =
      (prev?.symbol || prev?.fullName || prev?.addresses?.[chainId!]) !==
      (toToken?.symbol || toToken?.fullName || toToken?.addresses?.[chainId!]);

    if (changed) {
      // console.log("[reset] toToken changed → reset fromAmount/toAmount", {
      //   prev: prev?.symbol,
      //   next: toToken?.symbol,
      // });
      setFromAmount(""); // CHANGE(필수): 초기화
      setToAmount(""); // CHANGE(필수): 초기화
    }

    prevToTokenRef.current = toToken;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toToken, chainId]);

  //============================여기까지 토큰 변경시 초기화

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

    // 토큰 스위치 시 PI 리셋
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
        fromToken?.decimals ?? 18
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
    isApprovePending: tempStuff.isApprovePending,
    swap: tempStuff.swap,
    swapPool: tempStuff.swapPool,

    // ===== [추가] external도 노출 + UI에서 쓸 "activeSwapPool" 노출 =====
    externalSwapPool, // 있을 경우만 채워짐
    activeSwapPool, // SwapFeeInfo는 이거만 보면 됨
    isExternalSwapPool, // external일 때 포인트 UI 숨기기용

    approve: tempStuff.approve,
    setToTokenWithGuard,
    setFromTokenWithGuard,
    setToTokenAmountWithGuard: tempStuff.setToTokenAmountWithGuard,
    setFromTokenAmountWithGuard: tempStuff.setFromTokenAmountWithGuard,
    isLoadingFrom: tempStuff.isLoadingFrom,
    isLoadingTo: tempStuff.isLoadingTo,
    chainId,
    exchangeRate: tempStuff.exchangeRate,
    rExchangeRate: tempStuff.rExchangeRate,
    priceImpact,
    updateAmount: tempStuff.updateAmount,
    isTyping,
    setIsTyping,
  };
}
