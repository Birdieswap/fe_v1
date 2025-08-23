import {
  Dispatch,
  SetStateAction,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Config, useAccount, usePublicClient, useReadContract } from "wagmi";
import { type UseReadContractReturnType } from "wagmi";
import { Client, erc20Abi, parseUnits, PublicClient, Abi } from "viem";
import { WriteContractMutate } from "wagmi/query";
import { Fraction } from "@uniswap/sdk-core";

import { contracts } from "@/const/contracts";
import {
  ApproveTransactionProps,
  SwapTransactionProps,
  TransactionContextType,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { BigDecimal } from "@/types/BigDecimal";
import isAmountInputValid from "@/utils/isAmountInputValid";
import { IBirdieSingleFarm, ICurrency } from "@/const/contracts/types/tokenTypes";
import getSwapPool from "@/utils/assets/getSwapPool";
//import { getSwapQuoteForProviders } from "@/utils/assets/getSwapQuote";
import { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";
import { useAccountBalancesReturnType } from "@/hooks/assets/useAssets/useAccountBalances";
import tokens from "@/const/contracts/tokens/tokens";
import { weth_abi } from "@/const/contracts/abis/weth_abi";
import mathUtils from "@/utils/mathUtils";

import useTokenAddress from "../../useTokenAddress";
import previewFullDeposit from "@/utils/farm/previewFullDeposit";
//import { get } from "http";
import getTokenAddress from "@/utils/assets/getTokenAddress";
//import { fetchPreviewBTokenAmount } from "@/utils/farm/fetchPreviewBTokenAmount";
import { quoteExactInputSingle, quoteExactOutputSingle } from "@/utils/uniswap/getSwapAmount";
import previewRedeem from "@/utils/farm/previewRedeem";
import { readContract } from "viem/actions";
import { getSlot0 } from "@/utils/uniswap/getPoolState";
import { getPoolPrice } from "@/utils/uniswap/getPoolPrice";

const erc20DecAbi: Abi = [
  { inputs: [], name: "decimals", outputs: [{ type: "uint8", name: "" }], stateMutability: "view", type: "function" },
];

async function fetchTokenDecimals(client: PublicClient, token: `0x${string}`): Promise<number | null> {
  try {
    const dec = await readContract(client, { address: token, abi: erc20DecAbi, functionName: "decimals" }) as number;
    return dec;
  } catch {
    return null;
  }
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
}: {
  chainId: number;
  address: `0x${string}` | undefined;
  writeContract: WriteContractMutate<Config, unknown>;
  fromToken: ICurrency | undefined; // undefined 허용;
  fromAmount: string;
  setFromAmount: Dispatch<SetStateAction<string>>;
  toToken?: ICurrency | undefined; // undefined 허용;
  toAmount: string;
  setToAmount: Dispatch<SetStateAction<string>>;
  client?: Client;
  transactionContext: TransactionContextType;
  isPendingWriteContract: boolean;
  isFetchingAssets: boolean;
  assetValues?: useAssetValuesReturnType;
  balances?: useAccountBalancesReturnType;
  setPriceImpact?: Dispatch<SetStateAction<BigDecimal | undefined>>;
  maxSlippage?: number;
  isTyping: boolean;
  stopTyping: () => void;
}) {

  
  const fromTokenAddress = useTokenAddress(fromToken);
  const {
    data: allowanceFromToken,
    isFetching: isFetchingAllowanceFromToken,
    // isError: isErrorAllowanceFromToken,
    refetch: refetchAllowanceFromToken,
  }: UseReadContractReturnType<typeof erc20Abi, "allowance"> = useReadContract({
    address: fromTokenAddress || undefined,
    abi: fromToken?.abi,
    functionName: "allowance",
    args: [
      address as `0x${string}`,
      contracts.birdieRouter.address as `0x${string}`,
    ],
  });

  const swapPool = useMemo(() => {
    if (!fromToken || !toToken || !chainId) return null;

    const pool = getSwapPool({
      fromToken: fromToken as ICurrency,
      toToken: toToken as ICurrency,
      chainId,
    });

    return pool;
  }, [fromToken, toToken, chainId]);

  type Addr = `0x${string}` | null;
  type zeroForOneResult = [Addr, boolean, Addr, IBirdieSingleFarm | null, number, number] | [null, false];

  const publicClient = usePublicClient();

  const [poolAddress, zeroForOne, outBToken, outBpool, token0Decimals, token1Decimals] = useMemo<zeroForOneResult>(() => {
    const poolAddress = swapPool?.addresses[chainId] ?? null;
    const input0Address = swapPool?.input[0].addresses[chainId];
    const input1Address = swapPool?.input[1].addresses[chainId];


    if (!poolAddress || !input0Address || !input1Address) {
      return [null, false];
    }

    let token0Address: Addr = null;
    let token1Address: Addr = null;
    let token0Decimals: number | undefined = undefined;
    let token1Decimals: number | undefined = undefined;

    if (input0Address < input1Address){
      token0Address = swapPool?.input[0].addresses[chainId];
      token0Decimals = swapPool?.input[0].decimals;
      token1Address = swapPool?.input[1].addresses[chainId];
      token1Decimals = swapPool?.input[1].decimals;
    } else {
      token0Address = swapPool?.input[1].addresses[chainId];
      token0Decimals = swapPool?.input[1].decimals;
      token1Address = swapPool?.input[0].addresses[chainId];
      token1Decimals = swapPool?.input[0].decimals;      
    }
    
    const check0Address =
      input0Address < input1Address
        ? swapPool?.input[0].input.addresses[chainId]
        : swapPool?.input[1].input.addresses[chainId];

    const zeroForOne = check0Address === fromTokenAddress ? true : false;

    const underlying0Address = swapPool?.input[0].input.addresses[chainId];
  

    let outBToken: Addr = null;
    let outBpool: IBirdieSingleFarm|null = null;

      if (underlying0Address === fromTokenAddress) {
		    outBToken = token1Address;
        outBpool = swapPool?.input[1] as IBirdieSingleFarm;
    	} else {
		    outBToken = token0Address;
        outBpool = swapPool?.input[0] as IBirdieSingleFarm;
	    }

    return [poolAddress, zeroForOne, outBToken, outBpool, token0Decimals, token1Decimals];
  }, [swapPool, fromTokenAddress, chainId]);



  const [isLoadingFrom, setIsLoadingFrom] = useState<boolean>(false);
  const [isLoadingTo, setIsLoadingTo] = useState<boolean>(false);
  const [midPoolPrice, setMidPoolPrice] = useState<BigDecimal | null>(null);

  // exchangeRate 문자열과 BD
  const [exchangeRateStr, setExchangeRateStr] = useState<string>("");
  const [exchangeRateBD, setExchangeRateBD] = useState<BigDecimal | null>(null);

  // CHANGE: 디바운스 ref 관리
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CHANGE: 타이핑 시작 초기화 false->true 전이 1회만
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

  // price impact = |(exchangeRate - midPoolPrice) / midPoolPrice|
  // CHANGE: 마지막 설정값 저장해 동일하면 setState 생략
  const lastPIRef = useRef<string>("");
  useEffect(() => {
    if (!setPriceImpact) return;

    if (!midPoolPrice || midPoolPrice.isZero() || !exchangeRateBD) {
      const zero = new BigDecimal(0, 18);
      const key = zero.toPrecisionString(true, false);
      if (lastPIRef.current !== key) {
        lastPIRef.current = key;
        setPriceImpact(zero);
      }
      return;
    }

    const pi = exchangeRateBD.sub(midPoolPrice).div(midPoolPrice).abs().roundToDecimals(18);
    const key = pi.toPrecisionString(true, false);
    if (lastPIRef.current !== key) {
      lastPIRef.current = key;
      setPriceImpact(pi);
    }
  }, [exchangeRateBD, midPoolPrice, setPriceImpact]);

  const getOtherAmount = useCallback(
  async (
    thisAmount: string,
    thisSide: "in" | "out",
  ) => {
    try {
      
      if (!thisAmount || !chainId || !assetValues || !fromToken || !toToken) {
        return "";
      }
      if (!swapPool || !poolAddress || !outBpool) {
        return "";
      }

      // --- 2) normalize eth -> WETH underlying
      const fromErc20 = fromToken.symbol === "ETH" ? tokens.WETH : fromToken;
      const toErc20 = toToken.symbol === "ETH" ? tokens.WETH : toToken;

      const inputUnderlying = fromErc20;
      const outputUnderlying = toErc20;

      const inputAddrUnderlying  = getTokenAddress(
        { 
          token: fromErc20, 
          chainId
        }) as `0x${string}`;
      const outputAddrUnderlying = getTokenAddress(
        { 
          token: toErc20, 
          chainId
        }) as `0x${string}`;

      if (!poolAddress) {
       return "";
      }

      // --- 5) slot0 -> pool price (정렬/decimals에 맞춰)
      const slot0Data = await getSlot0(publicClient as PublicClient, poolAddress as `0x${string}`);
      if (!slot0Data) {
        console.error("[getOtherAmount] slot0Data null");
        return "";
      }

      const swapPoolPrice = getPoolPrice({
      sqrtPriceX96: slot0Data.sqrtPriceX96,
      token0Decimals: token0Decimals as number,
      token1Decimals: token1Decimals as number,
      zeroForOne,
    });

      const midPoolPrice = await previewRedeem(publicClient as PublicClient, outBpool as IBirdieSingleFarm, swapPoolPrice);
      if (!midPoolPrice) {
        console.error("[getOtherAmount] previewRedeem returned null");
        return "";
      }

      // 상태 저장(전역 midPoolPrice state 사용중이면 덮어쓰기)
      setMidPoolPrice(midPoolPrice);


      const pickTokenMeta = (entry: any) => {
        const bAddr = entry?.addresses?.[chainId] as `0x${string}` | undefined; // bToken 주소(풀 토큰)
        const uAddr = entry?.input?.addresses?.[chainId] as
          | `0x${string}`
          | undefined; // underlying 주소
        const uSym = entry?.input?.symbol as string | undefined; // underlying 심볼
        const bDec = entry?.decimals as number | undefined; // bToken decimals(메타)
        return { bAddr, uAddr, uSym, bDec, raw: entry };
      };

      const meta0 = pickTokenMeta(swapPool.input[0]);
      const meta1 = pickTokenMeta(swapPool.input[1]);

      // 5) underlying 주소로 input/output bToken 매칭
      const inputMeta =
        inputAddrUnderlying?.toLowerCase() === meta0.uAddr?.toLowerCase()
          ? meta0
          : meta1;

      const outputMeta =
        outputAddrUnderlying?.toLowerCase() === meta0.uAddr?.toLowerCase()
          ? meta0
          : meta1;

      if (!inputMeta.bAddr || !outputMeta.bAddr) {
        console.error("[getOtherAmount] invalid bToken addresses", {
          inputMeta,
          outputMeta,
          chainId,
        });
        return "";
      }

      const feeTier = swapPool.fee_tier as number;

      if (thisSide === "in") {
        // =========================
        // Exact Input 경로
        // 사용자 입력: fromAmount
        // 흐름: underlying(from) -> bIn -> Quoter exactInput -> bOut -> underlying(to)
        // =========================

        // 6) from 입력값을 from.decimals로 파싱
        const latestBD = new BigDecimal(
          thisAmount,
          inputUnderlying.decimals ?? 18
        );
       
        if (latestBD.isZero()) return "";

        // 7) underlying(from) -> bToken(input)
        const bAmountIn = await previewFullDeposit(
          client as PublicClient,
          inputMeta.raw as IBirdieSingleFarm,
          latestBD
        );
        if (!bAmountIn) {
          console.error("[getOtherAmount] previewFullDeposit null (in)");
          return "";
        }
        // 8) Quoter exactInput: bIn -> bOut
        const quote = await quoteExactInputSingle(
          client as PublicClient,
          inputMeta.bAddr,
          outputMeta.bAddr,
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
        if (!quote) {
          console.error("[getOtherAmount] exactInput quote null");
          return "";
        }
        console.warn("[getOtherAmount] exactInput quote", {
          amountIn_b: bAmountIn.value.toString(),
          amountOut_b: quote.amountOut.toString(),
        });

        // 9) bOut -> underlying(output)
        const bOutBD = new BigDecimal(
          quote.amountOut,
          outputMeta.bDec ?? 18
        );
        const finalTokenAmount = await previewRedeem(
          client as PublicClient,
          outputMeta.raw as IBirdieSingleFarm,
          bOutBD
        );
        if (!finalTokenAmount) {
          console.error("[getOtherAmount] previewRedeem (output) null");
          return "";
        }
        console.warn("[getOtherAmount] final underlying OUT", {
          val_raw: finalTokenAmount.value.toString(),
          dec: finalTokenAmount.decimals,
          display: finalTokenAmount.toPrecisionString(true, false),
        });
        return finalTokenAmount.toPrecisionString(true, false);
      }

      const latestBD = new BigDecimal(
        thisAmount,
        outputUnderlying.decimals ?? 18
      );
      console.warn("[getOtherAmount] latestBD (out)", {
        value: latestBD.value.toString(),
        dec: latestBD.decimals,
      });
      if (latestBD.isZero()) return "";

      // 7) underlying(to) -> bToken(output)
      const desiredBOut = await previewFullDeposit(
        client as PublicClient,
        outputMeta.raw as IBirdieSingleFarm,
        latestBD
      );
      if (!desiredBOut) {
        console.error("[getOtherAmount] previewFullDeposit null (out)");
        return "";
      }
       
      const quote = await quoteExactOutputSingle(
        client as PublicClient,
        inputMeta.bAddr,
        outputMeta.bAddr,
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
      if (!quote) {
        console.error("[getOtherAmount] exactOutput quote null");
        return "";
      }
      // 9) 필요한 bIn -> underlying(from)
      const bInRequiredBD = new BigDecimal(
        quote.amountIn,
        inputMeta.bDec ?? 18
      );
      const requiredUnderlyingIn = await previewRedeem(
        client as PublicClient,
        inputMeta.raw as IBirdieSingleFarm,
        bInRequiredBD
      );
      if (!requiredUnderlyingIn) {
        console.error("[getOtherAmount] previewRedeem (input) null");
        return "";
      }
      
      return requiredUnderlyingIn.toPrecisionString(true, false);
    } catch (e) {
      console.error("[getOtherAmount] error", e);
      return "";
    }
  },
  [
    client, 
    chainId, 
    assetValues, 
    fromToken, 
    toToken, 
    swapPool, 
    poolAddress, 
    outBpool, 
    publicClient, 
    token0Decimals, 
    token1Decimals, 
    zeroForOne
  ]
);


  const [sqrtPriceX96, setSqrtPriceX96] = useState<Fraction | null>(null);
  const sqrtPriceLimitX96 = useMemo(() => {
    if (sqrtPriceX96) {
      console.log("zeroForOne...", zeroForOne);
      console.log("maxSlippage...", maxSlippage);
      const multiplier = zeroForOne
        ? new BigDecimal(1, 18)
            .sub(new BigDecimal(maxSlippage || 0.1, 18))
            .sqrt()
        : new BigDecimal(1, 18)
            .add(new BigDecimal(maxSlippage || 0.1, 18))
            .sqrt();

      console.log("multiplier...", multiplier.toFixed(18));
      const fSqrtPriceLimit = sqrtPriceX96.multiply(
        new Fraction(
          multiplier.roundToDecimals(18).value.toString(10),
          BigInt(1e18).toString(10),
        ),
      );
      const sqrtPriceLimit = mathUtils.fractionToQ6496(
        fSqrtPriceLimit.numerator,
        fSqrtPriceLimit.denominator,
      );

      console.log(
        "sqrtPrice...",
        mathUtils
          .fractionToQ6496(sqrtPriceX96.numerator, sqrtPriceX96.denominator)
          .toString(10),
      );
      console.log("sqrtPriceLimit...", sqrtPriceLimit.toString());

      return BigInt(sqrtPriceLimit.toString());
    } else {
      return BigInt(0);
    }
  }, [maxSlippage, sqrtPriceX96, zeroForOne]);

  const updateAmountCommon = useCallback(
    async (newAmount: string, side: "in" | "out", withToToken?: ICurrency) => {
      // const newToToken = withToToken ?? toToken;
      const newToToken = withToToken ?? toToken;

      if (!fromToken || !newToToken || !publicClient) return;

      const newAmountBD = new BigDecimal(newAmount);
      const setAmount = side === "in" ? setToAmount : setFromAmount;

      const fromTokenERC20 = fromToken.symbol === "ETH" ? tokens.WETH : fromToken;
      const toTokenERC20 = newToToken.symbol === "ETH" ? tokens.WETH : newToToken;

      // 기존 타이머 취소
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (newAmountBD.isZero() || fromTokenERC20.symbol === toTokenERC20.symbol) {
        setAmount("");
        setPriceImpact?.(new BigDecimal(0, 18));
        // stopTyping은 여기서 호출하지 않음(타이핑 계속 중일 수 있음)
        return;
      }

      timerRef.current = setTimeout(async () => {
        const setIsLoading = side === "in" ? setIsLoadingTo : setIsLoadingFrom;
        setIsLoading(true);

        try {
          const val = await getOtherAmount(newAmount, side); 

          setAmount(val);

          // 최종 환율 갱신
          let latestFromBD: BigDecimal;
          let latestToBD: BigDecimal;

          if (side === "in") {
            // 사용자가 fromAmount를 입력(newAmount), toAmount는 방금 산출(val)
            latestFromBD = new BigDecimal(newAmount || "0", fromToken?.decimals || 18);
            latestToBD = new BigDecimal(val || "0", toToken?.decimals ?? 18);
          } else {
            // 사용자가 toAmount를 입력(newAmount), fromAmount는 방금 산출(val)
            latestFromBD = new BigDecimal(val || "0", fromToken?.decimals || 18);
            latestToBD = new BigDecimal(newAmount || "0", toToken?.decimals ?? 18);
          }

          // 4) 환율 계산 및 저장
          if (latestFromBD.isZero() || latestToBD.isZero()) {
            setExchangeRateStr("");
            setExchangeRateBD(null);
          } else {
            const ratio = latestToBD.div(latestFromBD);
            setExchangeRateBD(ratio);
            setExchangeRateStr(ratio.toFixed(toToken?.displayDecimals ?? 8));
            console.log("setExchangeRateStr", ratio, ratio.toFixed(toToken?.displayDecimals ?? 8));
          }
        } catch (err) {
          console.error("getOtherAmount error", err);
          setAmount("");
          setExchangeRateStr("");
          setExchangeRateBD(null);
          setPriceImpact?.(new BigDecimal(0, 18));
        } finally {
          setIsLoading(false);
          stopTyping(); // 디바운스 완료
        }
      }, 1000);
    },
    [
      toToken,
      fromToken,
      publicClient,
      getOtherAmount,
      setFromAmount,
      setToAmount,
      setPriceImpact,
      setIsLoadingFrom,
      setIsLoadingTo,
      stopTyping,
      toAmount,
      fromAmount,
      toToken?.decimals,
      fromToken?.decimals,
    ],
  );

  useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
}, []);

    const exchangeRate = exchangeRateStr;

  // const exchangeRate = useMemo(() => {
  //   const toAmountBD = new BigDecimal(toAmount || "0", toToken?.decimals ?? 18);
  //   const fromAmountBD = new BigDecimal(
  //     fromAmount || "0",
  //     fromToken?.decimals || 18,
  //   );

  //   if (toAmountBD.isZero() || fromAmountBD.isZero()) return "";
  //     // return getOtherAmount("1", "in");

  //   return toAmountBD.div(fromAmountBD).toFixed(toToken?.displayDecimals ?? 8);
  // }, [
  //   toAmount,
  //   toToken?.decimals,
  //   toToken?.displayDecimals,
  //   fromAmount,
  //   fromToken?.decimals,
  //   //getOtherAmount,
  // ]);

  //  // 정확 계산용 BigDecimal 환율
  // const exchangeRateBD = useMemo(() => {
  //   const toAmountBD = new BigDecimal(toAmount || "0", toToken?.decimals ?? 18);
  //   const fromAmountBD = new BigDecimal(fromAmount || "0", fromToken?.decimals || 18);
  //   if (toAmountBD.isZero() || fromAmountBD.isZero()) return null;
  //   return toAmountBD.div(fromAmountBD);
  // }, [toAmount, toToken?.decimals, fromAmount, fromToken?.decimals]);

  // // price impact = |(exchangeRate - midPoolPrice) / midPoolPrice|
  // useEffect(() => {
  //   if (!setPriceImpact) return;

  //   if (!midPoolPrice || midPoolPrice.isZero()) {
  //     setPriceImpact(new BigDecimal(0, 18));
  //     return;
  //   }

  //   // exchangeRateBD가 아직 없으면 계산 보류
  //   if (!exchangeRateBD) {
  //     setPriceImpact(new BigDecimal(0, 18)); // 또는 이전값 유지하려면 이 줄 제거
  //     return;
  //   }

  //   const diff = exchangeRateBD.sub(midPoolPrice);
  //   const ratio = diff.div(midPoolPrice);
  //   const abs = ratio.abs();
  //   // 필요 시 프로젝트 표준으로 decimals 고정
  //   const pi = abs.roundToDecimals(18);
  //   setPriceImpact(pi);
  // }, [exchangeRateBD, midPoolPrice, setPriceImpact]);

  const setToTokenAmountWithGuard = useCallback(
    (newAmount: SetStateAction<string>) => {
      setToAmount((prev) => {
        if (!toToken) return prev;
        const newToAmount =
          typeof newAmount === "function" ? newAmount(prev) : newAmount;

        if (!newToAmount) {
          setFromAmount("");
          if (fromToken) {
            updateAmountCommon(newToAmount, "out");
          }

          return "";
        }
        const isValid = isAmountInputValid(newToAmount, toToken);

        if (!isValid) return prev;

        // fromToken이 undefined일 때는 updateAmountCommon을 호출하지 않음
        if (fromToken) {
          updateAmountCommon(newToAmount, "out");
        }

        return newToAmount;
      });
    },
    [setFromAmount, setToAmount, toToken, updateAmountCommon, fromToken],
  );

  const setFromTokenAmountWithGuard = useCallback(
    (newAmount: SetStateAction<string>) => {
      setFromAmount((prev) => {
        const newFromAmount =
          typeof newAmount === "function" ? newAmount(prev) : newAmount;

        if (!newFromAmount) {
          setToAmount("");
          updateAmountCommon(newFromAmount, "in");

          return "";
        }
        if (!fromToken) return prev;
        const isValid = isAmountInputValid(newFromAmount, fromToken);

        if (!isValid) return prev;
        updateAmountCommon(newFromAmount, "in");

        return newFromAmount;
      });
    },
    [fromToken, setFromAmount, setToAmount, updateAmountCommon],
  );

  const ethToWeth = useCallback(
    (amount: BigDecimal, side: "deposit" | "withdraw") => {
      const transactionProps: TransactionStatusProps & SwapTransactionProps = {
        chainId,
        transactionType: TransactionType.SWAP,
        input: {
          token: side === "deposit" ? tokens.ETH : tokens.WETH,
          amount,
        },
        output: {
          token: side === "deposit" ? tokens.WETH : tokens.ETH,
          amount,
        },
        address: address as `0x${string}`,
      };
      const tokenAddress = tokens.WETH.addresses[chainId] as `0x${string}`;

      if (!tokenAddress) return;

      const handlers = getWriteTransactionHandlers({
        client,
        transactionContext,
        transactionProps,
        refetch: async () => {
          await balances?.tokenBalances.query.refetch();
        },
      });

      if (side === "deposit") {
        return writeContract<typeof weth_abi, "deposit", [], number>(
          {
            address: tokenAddress,
            abi: weth_abi,
            functionName: "deposit",
            value: parseUnits(amount.toString(), tokens.WETH.decimals || 18),
          },
          {
            onError: handlers.onError,
            onSuccess: (v) => {
              handlers.onSuccess(v);
              setFromAmount("");
              setToAmount("");
            },
          },
        );
      } else {
        return writeContract<typeof weth_abi, "withdraw", [bigint], number>(
          {
            address: tokenAddress,
            abi: weth_abi,
            functionName: "withdraw",
            args: [parseUnits(amount.toString(), tokens.WETH.decimals || 18)],
          },
          {
            onError: handlers.onError,
            onSuccess: (v) => {
              handlers.onSuccess(v);
              setFromAmount("");
              setToAmount("");
            },
          },
        );
      }
    },
    [
      address,
      balances?.tokenBalances.query,
      chainId,
      client,
      setFromAmount,
      setToAmount,
      transactionContext,
      writeContract,
    ],
  );
  //function swap(address poolAddress, address recipient, bool zeroForOne, uint256 amountSpecified, uint160 sqrtPriceLimitX96) returns (uint256 amount0, uint256 amount1)
  const swap = useCallback(async () => {
    setPriceImpact?.(new BigDecimal(0, 18));

    if (!fromToken) return; // fromToken이 undefined인 경우 early return

    // TODO: handle other networks
    const isFromNativeToken = fromToken.symbol === "ETH";

    if (fromToken.symbol === "ETH" && toToken?.symbol === tokens.WETH.symbol) {
      return ethToWeth(
        new BigDecimal(fromAmount, fromToken.decimals || 18),
        "deposit",
      );
    } else if (
      fromToken.symbol === tokens.WETH.symbol &&
      toToken?.symbol === "ETH"
    ) {
      return ethToWeth(
        new BigDecimal(fromAmount, fromToken.decimals || 18),
        "withdraw",
      );
    }

    const transactionProps: TransactionStatusProps & SwapTransactionProps = {
      chainId,
      transactionType: TransactionType.SWAP,
      input: {
        token: fromToken!, // fromToken이 undefined인 경우는 이미 early return 처리됨
        amount: new BigDecimal(fromAmount),
      },
      output: {
        token: toToken,
        amount: new BigDecimal(toAmount),
      },
      address: address as `0x${string}`,
    };

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: async () => {
        await balances?.tokenBalances.query.refetch();
      },
    });

    const inputTokenAddress = getTokenAddress({
      token: fromToken,
      chainId,
    });
    const outputTokenAddress = getTokenAddress({
      token: toToken,
      chainId,
    });
    const amountBD = new BigDecimal(fromAmount, fromToken.decimals);
    const feeTier = swapPool?.fee_tier;
    const refereeAddress = address as `0x${string}`;
    writeContract(
      {
        address: contracts.birdieRouter.address as `0x${string}`,
        abi: contracts.birdieRouter.abi,
        functionName: "swap",
        args: [
          inputTokenAddress as `0x${string}`,
          feeTier as number,
          outputTokenAddress as `0x${string}`,
          amountBD.value,
          BigInt(1),
          BigInt(0),
          refereeAddress,
        ]
      },
      {
        onError: handlers.onError,
        onSuccess: (v) => {
          handlers.onSuccess(v);
          setFromAmount("");
          setToAmount("");
        },
      },
    );
  }, [
    address,
    balances?.tokenBalances.query,
    chainId,
    client,
    ethToWeth,
    fromAmount,
    fromToken,
    poolAddress,
    zeroForOne,
    setFromAmount,
    setPriceImpact,
    setToAmount,
    sqrtPriceLimitX96,
    toAmount,
    toToken,
    transactionContext,
    writeContract,
  ]);

  async function approve() {
    const transactionProps: TransactionStatusProps & ApproveTransactionProps = {
      transactionType: TransactionType.APPROVE,
      input: fromToken,
      chainId,
    };

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: refetchAllowanceFromToken,
    });

    writeContract(
      {
        address: fromTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        // TODO : amount logic
        //args: [contracts.birdieRouter.address as `0x${string}`, parseUnits(fromAmount, fromToken.decimals || 18)],
        args: [
          contracts.birdieRouter.address as `0x${string}`,
          BigInt(
            "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          ),
        ],
      },
      handlers,
    );
  }

  const isApproved = useMemo(
    () =>
      fromToken?.symbol === "ETH" ||
      (!!allowanceFromToken &&
        !!fromToken &&
        allowanceFromToken >= parseUnits(fromAmount, fromToken.decimals || 18)),
    [allowanceFromToken, fromAmount, fromToken],
  );

  const isPending =
    isPendingWriteContract ||
    (fromToken?.symbol !== "ETH" && isFetchingAllowanceFromToken) ||
    isFetchingAssets;

  const isZeroAmount = useMemo(() => {
    if (!fromAmount || !toAmount) return true;
    const fromAmountBD = new BigDecimal(fromAmount);
    const toAmountBD = new BigDecimal(toAmount);

    return fromAmountBD.isZero() || toAmountBD.isZero();
  }, [fromAmount, toAmount]);

  //fromToken이 undefined인 경우 처리
  if (!fromToken && !toToken) {
    return {
      isFetchingAllowanceFromToken: false,
      isLoadingFrom: false,
      isLoadingTo: false,
      exchangeRate: "",
      setToTokenAmountWithGuard: () => {},
      setFromTokenAmountWithGuard: () => {},
      swap: async () => {},
      approve: async () => {},
      isApproved: false,
      isPending: false,
      isZeroAmount: true,
      updateAmount: () => {},
      bumpGen: () => {},
    };
  }

  return {
    isFetchingAllowanceFromToken,
    isLoadingFrom,
    isLoadingTo,
    exchangeRate,
    setToTokenAmountWithGuard,
    setFromTokenAmountWithGuard,
    swap,
    approve,
    isApproved,
    isPending,
    isZeroAmount,
    updateAmount: updateAmountCommon,
  };
}


