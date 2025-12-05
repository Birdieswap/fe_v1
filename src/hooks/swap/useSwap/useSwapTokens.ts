import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  SetStateAction,
} from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { type UseReadContractReturnType } from "wagmi";
import { erc20Abi, parseUnits, PublicClient, formatUnits } from "viem";
import { Fraction } from "@uniswap/sdk-core";

import { contracts } from "@/const/contracts";
import { BigDecimal } from "@/types/BigDecimal";
import isAmountInputValid from "@/utils/isAmountInputValid";
import { ICurrency } from "@/const/contracts/types/tokenTypes";
import getSwapPool from "@/utils/assets/getSwapPool";
import tokens from "@/const/contracts/tokens/tokens";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { useReferral } from "@/app/ReferralContextProvider";

import { UseSwapTokensProps, UseSwapTokensReturn } from "./useSwapToken/types";
import { derivePoolInfo } from "./useSwapToken/derivePoolInfo";
import {
  computeSqrtPriceLimitX96,
  receiveWithSlippage,
} from "./useSwapToken/priceMath";

import { getOtherAmount, DualQuoteResult } from "./useSwapToken/quoteService";

import {
  approve as approveAction,
  swap as swapAction,
} from "./useSwapToken/actions";
import useTokenAddress from "@/hooks/useTokenAddress";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { ADDRESS } from "@/const/contracts/contractAddresses";
import {
  getFromContracts,
  isZeroAddress,
} from "@/utils/farm/getAddressHelpers";

// =========================
// helpers (local)
// =========================
type Token = {
  symbol?: string;
  decimals?: number;
  address?: `0x${string}` | null;
};

const DEBUG_SWAP_PI = true;

const isETH = (t?: Token | null) => t?.symbol?.toUpperCase() === "ETH";
const isWETH = (t?: Token | null) => t?.symbol?.toUpperCase() === "WETH";
const isWrapPair = (a?: Token | null, b?: Token | null) =>
  (isETH(a) && isWETH(b)) || (isWETH(a) && isETH(b));

function oneToOne(raw: string, from?: Token | null, to?: Token | null): string {
  if (!from || !to) return "0";
  const fromDec = from.decimals ?? 18;
  const toDec = to.decimals ?? 18;
  try {
    const wei = parseUnits(raw || "0", fromDec);
    return formatUnits(wei, toDec);
  } catch {
    return "0";
  }
}

function isUserRejected(e: any) {
  if (e?.code === 4001 || e?.cause?.code === 4001) return true;
  const msg = (e?.shortMessage || e?.message || "").toLowerCase();
  return msg.includes("user rejected") || msg.includes("user denied");
}

/** ✅ getOtherAmount 반환을 안전하게 string으로 정규화 */
function normalizeQuote(raw: DualQuoteResult | string | null | undefined) {
  if (!raw) return { amount: "", benchmarkOut: null as string | null };

  if (typeof raw === "string") {
    return { amount: raw, benchmarkOut: null as string | null };
  }

  const amount = typeof raw.amount === "string" ? raw.amount : "";
  const benchmarkOut =
    raw.benchmarkOut != null && typeof raw.benchmarkOut === "string"
      ? raw.benchmarkOut
      : null;

  return { amount, benchmarkOut };
}

// =========================
// hook
// =========================
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

  // ✅ useSwap.ts 에서 내려준 toTokenUsd
  toTokenUsd,
}: UseSwapTokensProps & { toTokenUsd?: number | null }): UseSwapTokensReturn {
  const { referralAddress } = useReferral();
  const publicClient = usePublicClient();
  const fromTokenAddress = useTokenAddress(fromToken);

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
    [toToken, chainId]
  );

  const isToETH = useMemo(() => {
    const sym = (toToken as any)?.symbol;
    return sym === "ETH" || isZeroAddress?.(toTokenAddr as `0x${string}`);
  }, [toToken, toTokenAddr]);

  const spenderAddress = useMemo(() => {
    const w =
      (WRAPPER_PROVIDER?.addresses?.[chainId] as `0x${string}` | undefined) ??
      (WRAPPER_ADDRESS as `0x${string}` | undefined);
    const r =
      (ROUTER_PROVIDER?.addresses?.[chainId] as `0x${string}` | undefined) ??
      (contracts.birdieRouter.address as `0x${string}`);
    return (isToETH ? w : r) as `0x${string}`;
  }, [WRAPPER_PROVIDER, ROUTER_PROVIDER, WRAPPER_ADDRESS, chainId, isToETH]);

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
      enabled:
        !!fromTokenAddress && fromToken?.symbol !== "ETH" && !!spenderAddress,
    } as any,
  });

  // =========================
  // Pools
  // =========================
  const swapPool = useMemo(() => {
    if (!fromToken || !toToken || !chainId) return null;
    return getSwapPool({
      fromToken: fromToken as ICurrency,
      toToken: toToken as ICurrency,
      chainId,
    });
  }, [fromToken, toToken, chainId]);

  const externalSwapPool = null as any; // 외부 풀 선택로직이 있으면 여기로
  const activeSwapPool = externalSwapPool ?? swapPool;

  const poolInfo = useMemo(
    () => derivePoolInfo(activeSwapPool, chainId, fromTokenAddress),
    [activeSwapPool, chainId, fromTokenAddress]
  );

  // =========================
  // States
  // =========================
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);

  const [exchangeRateStr, setExchangeRateStr] = useState("");
  const [exchangeRateBD, setExchangeRateBD] = useState<BigDecimal | null>(null);
  const [rExchangeRateStr, setRExchangeRateStr] = useState("");
  const [rExchangeRateBD, setRExchangeRateBD] = useState<BigDecimal | null>(
    null
  );

  const [quoteReceive, setQuoteReceive] = useState<bigint | null>(null);
  const [isApprovePending, setIsApprovePending] = useState(false);
  const [sqrtPriceX96, setSqrtPriceX96] = useState<Fraction | null>(null);

  const [midPoolPrice, setMidPoolPrice] = useState<BigDecimal | null>(null);
  const benchmarkOutRef = useRef<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTypingRef = useRef(false);

  useEffect(() => {
    const prev = prevTypingRef.current;
    if (isTyping && !prev) {
      setExchangeRateStr("");
      setExchangeRateBD(null);
      setPriceImpact?.(new BigDecimal(0, 18));
    }
    prevTypingRef.current = isTyping;
  }, [isTyping, setPriceImpact]);

  // =========================
  // Price impact refs
  // =========================
  const lastPIRef = useRef("");
  const addrLower = (t?: ICurrency) =>
    (getTokenAddress({ token: t as any, chainId }) ?? "").toLowerCase();

  const poolAddrLC = useMemo(() => {
    const a = activeSwapPool?.addresses?.[chainId as any];
    return (a ?? "").toLowerCase();
  }, [activeSwapPool, chainId]);

  const pairKey = useMemo(
    () => `${addrLower(fromToken)}_${addrLower(toToken)}_${poolAddrLC}`,
    [fromToken, toToken, poolAddrLC]
  );

  const midOwnerRef = useRef("");
  useEffect(() => {
    midOwnerRef.current = "";
    setMidPoolPrice(null);
  }, [pairKey]);

  useEffect(() => {
    if (midOwnerRef.current !== pairKey) {
      setPriceImpact?.(new BigDecimal(0, 18));
      return;
    }
    if (!exchangeRateBD || !midPoolPrice) {
      setPriceImpact?.(new BigDecimal(0, 18));
      return;
    }

    const midIsZero = (midPoolPrice as any)?.isZero
      ? (midPoolPrice as any).isZero()
      : midPoolPrice.lte(0);

    if (midIsZero) {
      setPriceImpact?.(new BigDecimal(0, 18));
      return;
    }

    const pi = exchangeRateBD
      .sub(midPoolPrice)
      .div(midPoolPrice)
      .roundToDecimals(18);

    const key = pi.toPrecisionString(true, false);
    if (lastPIRef.current !== key) {
      lastPIRef.current = key;
      setPriceImpact?.(pi);

      if (DEBUG_SWAP_PI) {
        console.log("[swap PI]", {
          pairKey,
          midOwner: midOwnerRef.current,
          exchangeRate: exchangeRateBD.toPrecisionString(true, false),
          midPoolPrice: midPoolPrice.toPrecisionString(true, false),
          pi: pi.toPrecisionString(true, false),
        });
      }
    }
  }, [exchangeRateBD, midPoolPrice, pairKey, setPriceImpact]);

  const sqrtPriceLimitX96 = useMemo(
    () => computeSqrtPriceLimitX96(sqrtPriceX96, !!poolInfo.zeroForOne),
    [sqrtPriceX96, poolInfo.zeroForOne]
  );

  const receiveAtLeast = useMemo(
    () => receiveWithSlippage(quoteReceive, maxSlippage),
    [quoteReceive, maxSlippage]
  );

  // =========================
  // updateAmountCommon
  // =========================
  const updateAmountCommon = useCallback(
    async (
      newAmount: string,
      side: "in" | "out",
      withToToken?: ICurrency,
      withFromToken?: ICurrency
    ) => {
      const aFrom = withFromToken ?? fromToken;
      const aTo = withToToken ?? toToken;

      if (isWrapPair(aFrom as any, aTo as any)) {
        const other =
          side === "in"
            ? oneToOne(newAmount || "0", aFrom as any, aTo as any)
            : oneToOne(newAmount || "0", aTo as any, aFrom as any);

        if (side === "in") {
          setFromAmount?.(newAmount);
          setToAmount?.(other);
        } else {
          setToAmount?.(newAmount);
          setFromAmount?.(other);
        }
        benchmarkOutRef.current = null;
        return;
      }

      const useToToken = withToToken ?? toToken;
      const useFromToken = withFromToken ?? fromToken;
      if (!useFromToken || !useToToken || !publicClient) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      const newAmountBD = new BigDecimal(String(newAmount || "0"));
      const setAmount = side === "in" ? setToAmount : setFromAmount;

      const fromTokenERC20 =
        useFromToken.symbol === "ETH" ? tokens.WETH : useFromToken;
      const toTokenERC20 =
        useToToken.symbol === "ETH" ? tokens.WETH : useToToken;

      if (
        newAmountBD.isZero() ||
        fromTokenERC20.symbol === toTokenERC20.symbol
      ) {
        setAmount("");
        setPriceImpact?.(new BigDecimal(0, 18));
        benchmarkOutRef.current = null;
        return;
      }

      timerRef.current = setTimeout(async () => {
        const setIsLoading = side === "in" ? setIsLoadingTo : setIsLoadingFrom;
        setIsLoading(true);

        try {
          // console.log("[swap quote ctx]", {
          //   pool: (activeSwapPool as any)?.symbol,
          //   isInternal: (activeSwapPool as any)?.isInternal,
          //   poolAddr: (activeSwapPool as any)?.addresses?.[chainId],
          //   fee: (activeSwapPool as any)?.fee_tier,
          //   from: {
          //     sym: useFromToken?.symbol,
          //     addr: getTokenAddress({ token: useFromToken as any, chainId }),
          //   },
          //   to: {
          //     sym: useToToken?.symbol,
          //     addr: getTokenAddress({ token: useToToken as any, chainId }),
          //   },
          //   poolInfo,
          // });

          const raw = await getOtherAmount(
            {
              chainId,
              swapPool: activeSwapPool,
              poolInfo,
              assetValues,
              publicClient: publicClient as PublicClient,
              maxSlippage: maxSlippage ?? null,
              fromToken: useFromToken,
              toToken: useToToken,
              setMidPoolPrice,
              setSqrtPriceX96,
              setQuoteReceive,
              setMidOwner: (ownerKey: string) => {
                midOwnerRef.current = ownerKey;
              },
              pairKey,
              addrLower,
            } as any,
            newAmount,
            side,
            useFromToken,
            useToToken
          );

          // console.log("[quote raw]", raw);

          const { amount, benchmarkOut } = normalizeQuote(raw);

          // console.log("[quote norm]", {
          //   amount,
          //   benchmarkOut,
          //   t: typeof amount,
          // });

          setAmount(amount);
          benchmarkOutRef.current = benchmarkOut;

          const latestFromBD =
            side === "in"
              ? new BigDecimal(
                  String(newAmount || "0"),
                  useFromToken.decimals ?? 18
                )
              : new BigDecimal(
                  String(amount || "0"),
                  useFromToken.decimals ?? 18
                );

          const latestToBD =
            side === "in"
              ? new BigDecimal(String(amount || "0"), useToToken.decimals ?? 18)
              : new BigDecimal(
                  String(newAmount || "0"),
                  useToToken.decimals ?? 18
                );

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

            setExchangeRateStr(ratio.toFixed(useToToken.displayDecimals ?? 8));
            setRExchangeRateStr(
              Rratio.toFixed(useFromToken.displayDecimals ?? 8)
            );

            // console.log("[swap quote result]", {
            //   side,
            //   newAmount,
            //   amount,
            //   ratio: ratio.toPrecisionString(true, false),
            //   Rratio: Rratio.toPrecisionString(true, false),
            //   midPoolPrice: midPoolPrice?.toPrecisionString?.(true, false),
            //   benchmarkOut: benchmarkOut ?? null,
            // });
          }
        } catch (err) {
          console.error("getOtherAmount error", err);
          setAmount("");
          setExchangeRateStr("");
          setExchangeRateBD(null);
          setRExchangeRateStr("");
          setRExchangeRateBD(null);
          setPriceImpact?.(new BigDecimal(0, 18));
          benchmarkOutRef.current = null;
        } finally {
          setIsLoading(false);
          stopTyping();
        }
      }, 750);
    },
    [
      chainId,
      activeSwapPool,
      poolInfo,
      assetValues,
      publicClient,
      maxSlippage,
      fromToken,
      toToken,
      setToAmount,
      setFromAmount,
      setPriceImpact,
      stopTyping,
      pairKey,
      addrLower,
      midPoolPrice,
    ]
  );

  const setToTokenAmountWithGuard = useCallback(
    (newAmount: SetStateAction<string>) => {
      setToAmount((prev) => {
        if (!toToken) return prev;

        const next =
          typeof newAmount === "function"
            ? (newAmount as any)(prev)
            : newAmount;

        if (!next) {
          setFromAmount("");
          if (fromToken) updateAmountCommon(next, "out");
          return "";
        }

        if (!isAmountInputValid(next, toToken)) return prev;

        if (fromToken) updateAmountCommon(next, "out");
        return next;
      });
    },
    [toToken, fromToken, setToAmount, setFromAmount, updateAmountCommon]
  );

  const setFromTokenAmountWithGuard = useCallback(
    (newAmount: SetStateAction<string>) => {
      setFromAmount((prev) => {
        const next =
          typeof newAmount === "function"
            ? (newAmount as any)(prev)
            : newAmount;

        if (!next) {
          setToAmount("");
          updateAmountCommon(next, "in");
          return "";
        }

        if (!fromToken) return prev;
        if (!isAmountInputValid(next, fromToken)) return prev;

        updateAmountCommon(next, "in");
        return next;
      });
    },
    [fromToken, setFromAmount, setToAmount, updateAmountCommon]
  );

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

  const isPending =
    isApprovePending ||
    isPendingWriteContract ||
    (fromToken?.symbol !== "ETH" && isFetchingAllowanceFromToken) ||
    isFetchingAssets;

  const isZeroAmount = useMemo(() => {
    if (!fromAmount || !toAmount) return true;
    return (
      new BigDecimal(String(fromAmount || "0")).isZero() ||
      new BigDecimal(String(toAmount || "0")).isZero()
    );
  }, [fromAmount, toAmount]);

  const approve = useCallback(async () => {
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
          try {
            return await refetchAllowanceFromToken?.();
          } catch {
            return undefined as any;
          }
        },
        spenderAddress,
      });
    } catch (e) {
      if (isUserRejected(e)) return;
      throw e;
    } finally {
      setIsApprovePending(false);
    }
  }, [
    chainId,
    fromToken,
    fromTokenAddress,
    writeContract,
    client,
    transactionContext,
    refetchAllowanceFromToken,
    spenderAddress,
  ]);

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
        swapPool: activeSwapPool,
        sqrtPriceLimitX96,
        receiveAtLeast,
        balances,

        // ✅ 비교용 정보 전달
        benchmarkOut: benchmarkOutRef.current ?? null,
        toTokenUsd: toTokenUsd ?? null,
      } as any);
    } catch (e: any) {
      if (
        e?.code === 4001 ||
        e?.cause?.code === 4001 ||
        /user (rejected|denied)/i.test(e?.message || e?.shortMessage || "")
      ) {
        return;
      }
      throw e;
    }
  }, [
    chainId,
    address,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    writeContract,
    client,
    publicClient,
    transactionContext,
    referralAddress,
    activeSwapPool,
    sqrtPriceLimitX96,
    receiveAtLeast,
    balances,
    setPriceImpact,
    toTokenUsd,
  ]);

  return {
    isFetchingAllowanceFromToken,
    isLoadingFrom,
    isLoadingTo,
    swapPool: activeSwapPool,
    exchangeRate: exchangeRateStr,
    rExchangeRate: rExchangeRateStr,
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
