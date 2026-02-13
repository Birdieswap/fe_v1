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
import {
  getFromContracts,
  isZeroAddress,
} from "@/utils/farm/getAddressHelpers";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { ADDRESS } from "@/const/contracts/contractAddresses";

export default function useSwap() {
  const chainId = useChainId();
  const [fromToken, setFromToken] = useState<ICurrency | undefined>(
    tokens.USDC,
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

  // ✅ 가격은 여기서만 계산 (inner: chainlink, external: coingecko 로직은 useTokenUsdPrice 내부)
  const { priceUsd: fromUsd } = useTokenUsdPrice(fromToken);
  const { priceUsd: toUsd } = useTokenUsdPrice(toToken);

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
    undefined,
  );

  // ===== Router / Wrapper 주소
  const ROUTER_ADDRESS = getFromContracts(ADDRESS.ROUTER, chainId);
  const WRAPPER_ADDRESS = getFromContracts(ADDRESS.WRAPPER, chainId);

  const ROUTER_PROVIDER = (stakingProviders as any)?.BIRDIESWAP_Router ?? {
    addresses: { [chainId]: ROUTER_ADDRESS },
  };
  const WRAPPER_PROVIDER = (stakingProviders as any)?.BIRDIESWAP_Wrapper ?? {
    addresses: { [chainId]: WRAPPER_ADDRESS },
  };

  const toTokenAddr = useMemo(
    () => getTokenAddress({ token: toToken as any, chainId }),
    [toToken, chainId],
  );

  const isToETH = useMemo(() => {
    const sym = (toToken as any)?.symbol;
    return sym === "ETH" || isZeroAddress?.(toTokenAddr as `0x${string}`);
  }, [toToken, toTokenAddr]);

  // ===== 내부 useSwapTokens 사용
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
    isTyping,
    stopTyping: () => setIsTyping(false),

    // ✅ 여기서 toToken 의 USD 가격을 그대로 내려준다
    toTokenUsd: toUsd ?? null,
  });

  // ===== external / internal 풀 정규화
  const externalSwapPool = (tempStuff as any).externalSwapPool ?? null;
  const activeSwapPool = externalSwapPool ?? tempStuff.swapPool ?? null;

  const isExternalSwapPool = useMemo(() => {
    if (!activeSwapPool) return false;
    return (activeSwapPool as any).isInternal === false;
  }, [activeSwapPool]);

  const prevFromTokenRef = useRef<ICurrency | undefined>(fromToken);
  const prevToTokenRef = useRef<ICurrency | undefined>(toToken);
  const prevChainIdRef = useRef<number | undefined>(chainId);

  // ===== 체인 변경 시 초기화
  useEffect(() => {
    const prev = prevChainIdRef.current;
    if (!chainId || prev === chainId) return;

    setFromToken(tokens.ETH);
    setToToken(undefined);
    setFromAmount("");
    setToAmount("");
    setPriceImpact(undefined);
    setIsTyping(false);

    prevFromTokenRef.current = tokens.ETH;
    prevToTokenRef.current = undefined;
    prevChainIdRef.current = chainId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  // ===== fromToken 변경 시 초기화
  useEffect(() => {
    const prev = prevFromTokenRef.current;
    const changed =
      (prev?.symbol || prev?.fullName || prev?.addresses?.[chainId!]) !==
      (fromToken?.symbol ||
        fromToken?.fullName ||
        fromToken?.addresses?.[chainId!]);

    if (changed) {
      setFromAmount("");
      setToAmount("");
    }

    prevFromTokenRef.current = fromToken;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, chainId]);

  // ===== toToken 변경 시 초기화
  useEffect(() => {
    const prev = prevToTokenRef.current;
    const changed =
      (prev?.symbol || prev?.fullName || prev?.addresses?.[chainId!]) !==
      (toToken?.symbol || toToken?.fullName || toToken?.addresses?.[chainId!]);

    if (changed) {
      setFromAmount("");
      setToAmount("");
    }

    prevToTokenRef.current = toToken;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toToken, chainId]);

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
      setFromToken(token);
      setToToken(undefined);
      setToAmount("");
      setFromAmount("");
      return;
    } else {
      if (toToken && toAmount) {
        setFromToken(token);

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
          tempStuff.updateAmount(toAmount, "out", token);
        } else {
          setFromAmount("");
        }
      } else {
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
      setFromToken(undefined);
      setToToken(token);
      setToAmount("");
      setFromAmount("");
      return;
    } else {
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
    isApprovePending: tempStuff.isApprovePending,
    swap: tempStuff.swap,
    swapPool: tempStuff.swapPool,
    externalSwapPool,
    activeSwapPool,
    isExternalSwapPool,
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
