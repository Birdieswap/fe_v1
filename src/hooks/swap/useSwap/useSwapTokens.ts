
import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from "react";
import { Config, usePublicClient, useReadContract } from "wagmi";
import { type UseReadContractReturnType } from "wagmi";
import { Client, erc20Abi, parseUnits, PublicClient, Address, formatUnits } from "viem";
import { Fraction } from "@uniswap/sdk-core";

import { contracts } from "@/const/contracts";
import { TransactionContextType } from "@/app/TransactionContextProvider";
import { BigDecimal } from "@/types/BigDecimal";
import isAmountInputValid from "@/utils/isAmountInputValid";
import { ICurrency } from "@/const/contracts/types/tokenTypes";
import getSwapPool from "@/utils/assets/getSwapPool";
import tokens from "@/const/contracts/tokens/tokens";

import getTokenAddress from "@/utils/assets/getTokenAddress";
import { useReferral } from "@/app/ReferralContextProvider";

import { UseSwapTokensProps, UseSwapTokensReturn } from "./useSwapToken/types";
import { derivePoolInfo } from "./useSwapToken/derivePoolInfo";
import { computeSqrtPriceLimitX96, receiveWithSlippage } from "./useSwapToken/priceMath";
import { getOtherAmount } from "./useSwapToken/quoteService";
import { approve as approveAction, swap as swapAction } from "./useSwapToken/actions";
import useTokenAddress from "@/hooks/useTokenAddress";
import { weth_abi } from "@/const/contracts/abis/weth_abi";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { ADDRESS } from "@/const/contracts/contractAddresses";
import { getFromContracts, isZeroAddress } from "@/utils/farm/getAddressHelpers";

type Token = { symbol?: string; decimals?: number; address?: `0x${string}` | null };

const isETH = (t?: Token | null)  => t?.symbol?.toUpperCase() === "ETH";
const isWETH = (t?: Token | null) => t?.symbol?.toUpperCase() === "WETH";
const isWrapPair = (a?: Token | null, b?: Token | null) =>
  (isETH(a) && isWETH(b)) || (isWETH(a) && isETH(b));

// 1:1 변환 (decimals 차이 보정)
function oneToOne(raw: string, from?: Token | null, to?: Token | null): string {
  if (!from || !to) return "0";
  const fromDec = from.decimals ?? 18;
  const toDec   = to.decimals ?? 18;
  try {
    const wei = parseUnits(raw || "0", fromDec);
    return formatUnits(wei, toDec);
  } catch {
    return "0";
  }
}

function isUserRejected(e: any) {
  // 표준 EIP-1193 코드
  if (e?.code === 4001 || e?.cause?.code === 4001) return true;
  // viem/wagmi의 메시지 패턴
  const msg = (e?.shortMessage || e?.message || "").toLowerCase();
  return msg.includes("user rejected") || msg.includes("user denied");
}

export default function useSwapTokens({
  chainId,
  address,
  writeContract,
  fromToken,
  fromAmount,
  setFromAmount,
  toToken,
  toAmount,
  setToAmount,
  client,
  transactionContext,
  isPendingWriteContract,
  isFetchingAssets,
  assetValues,
  balances,
  setPriceImpact,
  maxSlippage,
  isTyping,
  stopTyping,
}: UseSwapTokensProps): UseSwapTokensReturn {
  const { referralAddress } = useReferral();
  const publicClient = usePublicClient();
  const fromTokenAddress = useTokenAddress(fromToken);

  const ETH_ZERO_ADDRESS = getFromContracts(ADDRESS.ETH, chainId);
  const ROUTER_ADDRESS   = getFromContracts(ADDRESS.ROUTER, chainId);
  const WRAPPER_ADDRESS  = getFromContracts(ADDRESS.WRAPPER, chainId);

// provider 메타 (stakingProviders에 Router 메타가 없을 때 대비)
  const ROUTER_PROVIDER =
    (stakingProviders as any)?.BIRDIESWAP_Router ?? { addresses: { [chainId]: ROUTER_ADDRESS } };
  const WRAPPER_PROVIDER =
    (stakingProviders as any)?.BIRDIESWAP_Wrapper ?? { addresses: { [chainId]: WRAPPER_ADDRESS } };
  
  // toToken의 체인 주소
  const toTokenAddr = useMemo(
    () => getTokenAddress({ token: toToken as any, chainId }),
    [toToken, chainId]
  );

  // toToken이 네이티브 ETH인지 여부
  const isToETH = useMemo(() => {
    const sym = (toToken as any)?.symbol;
    return sym === "ETH" || isZeroAddress?.(toTokenAddr as `0x${string}`);
  }, [toToken, toTokenAddr]);

  const spenderAddress = useMemo(() => {
    const w = (WRAPPER_PROVIDER?.addresses?.[chainId] as `0x${string}` | undefined) ?? (WRAPPER_ADDRESS as `0x${string}` | undefined);
    const r = (ROUTER_PROVIDER?.addresses?.[chainId]  as `0x${string}` | undefined) ?? (contracts.birdieRouter.address as `0x${string}`);
    return (isToETH ? w : r) as `0x${string}`;
  }, [WRAPPER_PROVIDER, ROUTER_PROVIDER, WRAPPER_ADDRESS, chainId, isToETH]);
    // allowance 조회
  const {
    data: allowanceFromToken,
    isFetching: isFetchingAllowanceFromToken,
    refetch: refetchAllowanceFromToken,
  }: UseReadContractReturnType<typeof erc20Abi, "allowance"> = useReadContract({
    address: fromTokenAddress || undefined,
    abi: fromToken?.abi,
    functionName: "allowance",
    args: [address as `0x${string}`, spenderAddress],
    query: {
      enabled: !!fromTokenAddress && fromToken?.symbol !== "ETH" && !!spenderAddress,
    } as any,
  });

  // 풀 메타
  const swapPool = useMemo(() => {
    if (!fromToken || !toToken || !chainId) return null;
    return getSwapPool({ fromToken: fromToken as ICurrency, toToken: toToken as ICurrency, chainId });
  }, [fromToken, toToken, chainId]);

  // 풀 방향/주소/decimals
  const poolInfo = useMemo(() => derivePoolInfo(swapPool, chainId, fromTokenAddress), [swapPool, chainId, fromTokenAddress]);

  // 상태
  const [isLoadingFrom, setIsLoadingFrom] = useState<boolean>(false);
  const [isLoadingTo, setIsLoadingTo] = useState<boolean>(false);
  const [midPoolPrice, setMidPoolPrice] = useState<BigDecimal | null>(null);
  const [exchangeRateStr, setExchangeRateStr] = useState<string>("");
  const [exchangeRateBD, setExchangeRateBD] = useState<BigDecimal | null>(null);
  const [rExchangeRateStr, setRExchangeRateStr] = useState<string>("");
  const [rExchangeRateBD, setRExchangeRateBD] = useState<BigDecimal | null>(null);
  const [quoteReceive, setQuoteReceive] = useState<bigint | null>(null);

  const [isApprovePending, setIsApprovePending] = useState(false);

  // 타이핑 디바운스
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTypingRef = useRef<boolean>(false);
  useEffect(() => {
    const prev = prevTypingRef.current;
    if (isTyping && !prev) {
      setExchangeRateStr("");
      setExchangeRateBD(null);
      setPriceImpact?.(new BigDecimal(0, 18));
    }
    prevTypingRef.current = isTyping;
  }, [isTyping, setPriceImpact]);

  // Price Impact 계산
  const lastPIRef = useRef<string>("");
  const addrLower = (t?: ICurrency) => (getTokenAddress({ token: t as any, chainId }) ?? "").toLowerCase();
  const pairKey = useMemo(() => `${addrLower(fromToken)}_${addrLower(toToken)}`, [fromToken, toToken, chainId]);
  const midOwnerRef = useRef<string>("");
  useEffect(() => { midOwnerRef.current = ""; setMidPoolPrice(null); }, [pairKey]);

  useEffect(() => {
    // Pair changed: clear last snapshot and current amount refs to avoid stale refresh
    lastInputRef.current = null;
    curFromAmountRef.current = "";
    curToAmountRef.current = "";
    setQuoteReceive(null);
    setSqrtPriceX96(null);
  }, [pairKey]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLoadingFrom(false);
    setIsLoadingTo(false);
    setExchangeRateStr("");
    setExchangeRateBD(null);
    setRExchangeRateStr("");
    setRExchangeRateBD(null);
    setPriceImpact?.(new BigDecimal(0, 18));
  }, [pairKey]);

  useEffect(() => {
    if (midOwnerRef.current !== pairKey) { setPriceImpact?.(new BigDecimal(0, 18)); return; }
    if (!exchangeRateBD || !midPoolPrice) { setPriceImpact?.(new BigDecimal(0, 18)); return; }
    const pi = exchangeRateBD.sub(midPoolPrice).div(midPoolPrice).abs().roundToDecimals(18);
    const key = pi.toPrecisionString(true, false);
    if (lastPIRef.current !== key) { lastPIRef.current = key; setPriceImpact?.(pi); }
  }, [exchangeRateBD, midPoolPrice, setPriceImpact]);

  // sqrtPrice, minReceive
  const [sqrtPriceX96, setSqrtPriceX96] = useState<Fraction | null>(null);
  const sqrtPriceLimitX96 = useMemo(() => computeSqrtPriceLimitX96(sqrtPriceX96, !!poolInfo.zeroForOne), [sqrtPriceX96, poolInfo.zeroForOne]);
  const receiveAtLeast = useMemo(() => receiveWithSlippage(quoteReceive, maxSlippage), [quoteReceive, maxSlippage]);

  // 최신 입력/스냅샷 refs
  const lastInputRef = useRef<{ amount: string; side: "in" | "out"; withToToken?: ICurrency; withFromToken?: ICurrency } | null>(null);
  const curFromTokenRef = useRef<ICurrency | undefined>(fromToken);
  const curToTokenRef   = useRef<ICurrency | undefined>(toToken);
  const curFromAmountRef = useRef<string>(fromAmount);
  const curToAmountRef   = useRef<string>(toAmount);
  useEffect(() => { curFromTokenRef.current  = fromToken;  }, [fromToken]);
  useEffect(() => { curToTokenRef.current    = toToken;    }, [toToken]);
  useEffect(() => { curFromAmountRef.current = fromAmount; }, [fromAmount]);
  useEffect(() => { curToAmountRef.current   = toAmount;   }, [toAmount]);

  // 공통 업데이트
  const updateAmountCommon = useCallback(async (newAmount: string, side: "in" | "out", withToToken?: ICurrency, withFromToken?: ICurrency) => {
    // === [추가] ETH↔WETH 는 풀 없이 1:1 계산: quoteService 호출하지 않고 조기 반환 ===
  const aFrom = withFromToken ?? fromToken;
  const aTo   = withToToken   ?? toToken;

if (isWrapPair(aFrom, aTo)) {
    // side === "in"  : fromAmount 입력 -> toAmount 1:1
    // side === "out" : toAmount 입력   -> fromAmount 1:1
    const other = side === "in"
      ? oneToOne(newAmount || "0", aFrom, aTo)   // from -> to
      : oneToOne(newAmount || "0", aTo, aFrom);  // to   -> from

    if (side === "in") {
      setFromAmount?.(newAmount);
      setToAmount?.(other);
    } else {
      setToAmount?.(newAmount);
      setFromAmount?.(other);
    }

    // 표시(1:1, 0% PI/Slippage)는 SwapFeeInfo가 wrap을 감지해 처리하므로 여기선 끝.
    return;
  }

    const useToToken   = withToToken   ?? toToken;
    const useFromToken = withFromToken ?? fromToken;
    if (!useFromToken || !useToToken || !publicClient) return;

    lastInputRef.current = { amount: newAmount, side, withToToken: useToToken, withFromToken: useFromToken };

    const newAmountBD = new BigDecimal(newAmount);
    const setAmount = side === "in" ? setToAmount : setFromAmount;

    const fromTokenERC20 = useFromToken.symbol === "ETH" ? tokens.WETH : useFromToken;
    const toTokenERC20   = useToToken.symbol   === "ETH" ? tokens.WETH   : useToToken;

    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }

    if (newAmountBD.isZero() || fromTokenERC20.symbol === toTokenERC20.symbol) {
      setAmount("");
      setPriceImpact?.(new BigDecimal(0, 18));
      return;
    }

    timerRef.current = setTimeout(async () => {
      const setIsLoading = side === "in" ? setIsLoadingTo : setIsLoadingFrom;
      setIsLoading(true);
      try {
        const val = await getOtherAmount(
          {
            chainId,
            swapPool,
            poolInfo,
            assetValues,
            publicClient: publicClient as PublicClient,
            maxSlippage: maxSlippage ?? null,
            fromToken: useFromToken,
            toToken: useToToken,
            setMidPoolPrice,
            setSqrtPriceX96,
            setQuoteReceive,
            setMidOwner: (ownerKey: string) => { midOwnerRef.current = ownerKey; },
            pairKey,
            addrLower,
          },
          newAmount,
          side,
          useFromToken,
          useToToken,
        );

        setAmount(val);

        let latestFromBD: BigDecimal;
        let latestToBD: BigDecimal;
        if (side === "in") {
          latestFromBD = new BigDecimal(newAmount || "0", (useFromToken?.decimals ?? fromToken?.decimals) || 18);
          latestToBD   = new BigDecimal(val || "0", (useToToken?.decimals   ?? toToken?.decimals)   ?? 18);
        } else {
          latestFromBD = new BigDecimal(val || "0", (useFromToken?.decimals ?? fromToken?.decimals) || 18);
          latestToBD   = new BigDecimal(newAmount || "0", (useToToken?.decimals   ?? toToken?.decimals)   ?? 18);
        }

        if (latestFromBD.isZero() || latestToBD.isZero()) {
          setExchangeRateStr("");
          setExchangeRateBD(null);
          setRExchangeRateStr("");
          setRExchangeRateBD(null);
        } else {
          const ratio = latestToBD.div(latestFromBD);
          const Rratio = latestFromBD.div(latestToBD);
          setExchangeRateBD(ratio);
          setRExchangeRateBD(Rratio);
          setExchangeRateStr(ratio.toFixed((useToToken?.displayDecimals ?? toToken?.displayDecimals) ?? 8));
          setRExchangeRateStr(Rratio.toFixed((useFromToken?.displayDecimals ?? fromToken?.displayDecimals) ?? 8));
        }
      } catch (err) {
        console.error("getOtherAmount error", err);
        setAmount("");
        setExchangeRateStr("");
        setExchangeRateBD(null);
        setPriceImpact?.(new BigDecimal(0, 18));
      } finally {
        setIsLoading(false);
        stopTyping();
      }
    }, 750);
  }, [chainId, swapPool, poolInfo, assetValues, publicClient, maxSlippage, fromToken, toToken, setToAmount, setFromAmount, setPriceImpact, stopTyping]);

  // 입력 가드
  const setToTokenAmountWithGuard = useCallback((newAmount: SetStateAction<string>) => {
    setToAmount(prev => {
      if (!toToken) return prev;
      const next = typeof newAmount === "function" ? (newAmount as any)(prev) : newAmount;
      if (!next) { setFromAmount(""); if (fromToken) updateAmountCommon(next, "out"); return ""; }
      const isValid = isAmountInputValid(next, toToken); if (!isValid) return prev;
      if (fromToken) updateAmountCommon(next, "out");
      return next;
    });
  }, [toToken, fromToken, setToAmount, setFromAmount, updateAmountCommon]);

  const setFromTokenAmountWithGuard = useCallback((newAmount: SetStateAction<string>) => {
    setFromAmount(prev => {
      const next = typeof newAmount === "function" ? (newAmount as any)(prev) : newAmount;
      if (!next) { setToAmount(""); updateAmountCommon(next, "in"); return ""; }
      if (!fromToken) return prev;
      const isValid = isAmountInputValid(next, fromToken); if (!isValid) return prev;
      updateAmountCommon(next, "in");
      return next;
    });
  }, [fromToken, setFromAmount, setToAmount, updateAmountCommon]);

  // 15초 주기 재계산
  useEffect(() => {
    if (!publicClient) return;
    const id = setInterval(async () => {
      const snap = lastInputRef.current;
      if (!snap) return;
      const curFromToken = curFromTokenRef.current;
      const curToToken   = curToTokenRef.current;
      const nowFromAmount = (curFromAmountRef.current || "").trim();
      const nowToAmount   = (curToAmountRef.current   || "").trim();

      const curFromAddr  = addrLower(curFromToken);
      const curToAddr    = addrLower(curToToken);
      const snapFromAddr = addrLower(snap?.withFromToken);
      const snapToAddr   = addrLower(snap?.withToToken);
      const tokenMismatch = (curFromAddr !== snapFromAddr) || (curToAddr !== snapToAddr);

      if (tokenMismatch) {
        const curSide = nowFromAmount ? "in" : (nowToAmount ? "out" : null);
        if (curSide) {
          const curValue = curSide === "in" ? nowFromAmount : nowToAmount;
          updateAmountCommon(curValue, curSide as "in" | "out", curToToken ?? undefined, curFromToken ?? undefined);
        }
      } else {
        const { amount, side, withToToken, withFromToken } = snap as any;
        updateAmountCommon(amount, side, withToToken, withFromToken);
      }
    }, 15000);

    return () => clearInterval(id);
  }, [publicClient, updateAmountCommon]);

  // 승인 여부
  const isApproved = useMemo(() => {
    if (fromToken?.symbol === "ETH") return true;
    if (!fromToken) return false;
    if (allowanceFromToken == null) return false;
    try {
      const amountRaw = (fromAmount || "0").trim();
      const dec = fromToken.decimals ?? 18;
      const needed = parseUnits(amountRaw === "" ? "0" : amountRaw, dec);
      return allowanceFromToken >= needed;
    } catch {
      return false;
    }
  }, [allowanceFromToken, fromAmount, fromToken]);

  const isPending = isApprovePending || isPendingWriteContract || (fromToken?.symbol !== "ETH" && isFetchingAllowanceFromToken) || isFetchingAssets;

  const isZeroAmount = useMemo(() => {
    if (!fromAmount || !toAmount) return true;
    const fromAmountBD = new BigDecimal(fromAmount);
    const toAmountBD = new BigDecimal(toAmount);
    return fromAmountBD.isZero() || toAmountBD.isZero();
  }, [fromAmount, toAmount]);

  const exchangeRate = exchangeRateStr;
  const rExchangeRate = rExchangeRateStr;

  // 액션
  const approve = useCallback(async () => {
    // 네이티브 ETH는 approve 없음
    if (fromToken?.symbol === "ETH") return;

    setIsApprovePending(true);
    try {
      await approveAction({
        chainId,
        fromToken,
        fromTokenAddress: fromTokenAddress as any,
        writeContract,
        client,
        transactionContext,
        refetchAllowance: async () => {
          try { return await refetchAllowanceFromToken?.(); }
          catch { return undefined as unknown as Promise<unknown>; }
        },
        // 분기된 spenderAddress 전달(ETH로 받는 경우 Wrapper)
        spenderAddress,
      });
    } catch (e) {
    // 지갑 취소는 조용히 무시 (원하면 토스트만 띄우세요)
    if (isUserRejected(e)) {
      // toast.info("서명이 취소되었습니다");
      return;
    }
    // 그 외 에러는 그대로 전파(또는 여기서 처리)
    throw e;
  }finally {
      setIsApprovePending(false);
    }
  }, [chainId, fromToken, fromTokenAddress, writeContract, client, transactionContext, refetchAllowanceFromToken, spenderAddress]);


  const swap = useCallback(async () => {
    setPriceImpact?.(new BigDecimal(0, 18));
    if (!fromToken) return;

    try {
      await swapAction({
        chainId,
        userAddress: address as `0x${string}`,
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        writeContract,
        client,
        publicClient,
        transactionContext,
        referralAddress: referralAddress as any,
        swapPool,
        sqrtPriceLimitX96,
        receiveAtLeast,
        addrLower,
        lastInputRef,
        curFromTokenRef,
        curToTokenRef,
        curFromAmountRef,
        curToAmountRef,
        updateAmountCommon,
        setToAmount,
        balances,
      });
      } catch (e: any) {
    // 👇 사용자 취소는 조용히 반환 (모달은 onError로 FAIL 전환됨)
    if (e?.code === 4001 || e?.cause?.code === 4001 ||
        /user (rejected|denied)/i.test(e?.message || e?.shortMessage || "")) {
      return;
    }
      throw e;
    }
  }, [chainId, address, fromToken, toToken, fromAmount, toAmount, writeContract, client, publicClient, transactionContext, referralAddress, swapPool, sqrtPriceLimitX96, receiveAtLeast, balances, updateAmountCommon, setPriceImpact]);

  if (!fromToken && !toToken) {
    return {
      isFetchingAllowanceFromToken: false,
      isLoadingFrom: false,
      isLoadingTo: false,
      swapPool: null,
      exchangeRate: "",
      rExchangeRate: "",
      setToTokenAmountWithGuard: () => {},
      setFromTokenAmountWithGuard: () => {},
      swap: async () => {},
      approve: async() => {},
      isApproved: false,
      isApprovePending: false,
      isPending: false,
      isZeroAmount: true,
      updateAmount: async () => {},
    };
  }

  return {
    isFetchingAllowanceFromToken,
    isLoadingFrom,
    isLoadingTo,
    swapPool,
    exchangeRate,
    rExchangeRate,
    setToTokenAmountWithGuard,
    setFromTokenAmountWithGuard,
    swap,
    approve,
    isApproved,
    isPending,
    isApprovePending,
    isZeroAmount,
    updateAmount: updateAmountCommon,
  };
}
