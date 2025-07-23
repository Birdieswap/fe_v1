import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Config, usePublicClient, useReadContract } from "wagmi";
import { type UseReadContractReturnType } from "wagmi";
import { Client, erc20Abi, parseUnits } from "viem";
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
import { ICurrency } from "@/const/contracts/types/tokenTypes";
import getSwapResult from "@/utils/assets/getSwapResult";
import getSwapPool from "@/utils/assets/getSwapPool";
import { getSwapQuoteForProviders } from "@/utils/assets/getSwapQuote";
import { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";
import { useAccountBalancesReturnType } from "@/hooks/assets/useAssets/useAccountBalances";
import tokens from "@/const/contracts/tokens/tokens";
import { weth_abi } from "@/const/contracts/abis/weth_abi";
import mathUtils from "@/utils/mathUtils";

import useTokenAddress from "../../useTokenAddress";

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
}) {
  const fromTokenAddress = useTokenAddress(fromToken);
  const {
    data: allowanceFromToken,
    isFetching: isFetchingAllowanceFromToken,
    // isError: isErrorAllowanceFromToken,
    refetch: refetchAllowanceFromToken,
  }: UseReadContractReturnType<typeof erc20Abi, "allowance"> = useReadContract({
    address: fromTokenAddress || undefined,
    abi: erc20Abi,
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

  const [poolAddress, zeroForOne] = useMemo(() => {
    const poolAddress = swapPool?.addresses[chainId] ?? null;
    const input0Address = swapPool?.input[0].addresses[chainId];
    const input1Address = swapPool?.input[1].addresses[chainId];

    if (!poolAddress || !input0Address || !input1Address) {
      return [null, false];
    }
    const token0Address =
      input0Address < input1Address
        ? swapPool?.input[0].input.addresses[chainId]
        : swapPool?.input[1].input.addresses[chainId];
    const zeroForOne = token0Address === fromTokenAddress ? true : false;

    console.log("new zeroForOne: ", zeroForOne);

    return [poolAddress, zeroForOne];
  }, [swapPool, fromTokenAddress, chainId]);

  const publicClient = usePublicClient();

  const [isLoadingFrom, setIsLoadingFrom] = useState<boolean>(false);
  const [isLoadingTo, setIsLoadingTo] = useState<boolean>(false);

  const getOtherAmount = useCallback(
    (thisAmount: string, thisSide: "in" | "out") => {
      if (!thisAmount || !chainId || !assetValues || !fromToken || !toToken)
        return "";
      // Convert native token to ERC20
      // TODO: handle other networks
      const fromTokenERC20 =
        fromToken.symbol === "ETH" ? tokens.WETH : fromToken;
      const toTokenERC20 = toToken.symbol === "ETH" ? tokens.WETH : toToken;
      const input = thisSide === "in" ? fromTokenERC20 : toTokenERC20;
      const output = thisSide === "in" ? toTokenERC20 : fromTokenERC20;
      const amountBD = new BigDecimal(thisAmount, input.decimals);

      try {
        const other = getSwapResult({
          swapFrom: input,
          swapTo: output,
          amount: amountBD,
          chainId,
          assetValues,
        });

        return other?.toPrecisionString(true, false) ?? "";
      } catch (e) {
        console.error(e);

        return "";
      }
    },
    [chainId, assetValues, fromToken, toToken],
  );

  const updateAmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const updateAmountTimestampRef = useRef<number>(0);

  // const [sqrtX96PriceLimit, setSqrtX96PriceLimit] = useState<bigint>(BigInt(0));
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

      console.log("sqrtPrice...", sqrtPriceX96.toFixed(18));
      console.log("new sqrtPriceLimit...", fSqrtPriceLimit.toFixed(18));
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
    (newAmount: string, side: "in" | "out", withToToken?: ICurrency) => {
      const newToToken = withToToken ?? toToken;

      if (!fromToken || !newToToken || !publicClient) return;
      const newAmountBD = new BigDecimal(newAmount);
      const setAmount = side === "in" ? setToAmount : setFromAmount;
      const setIsLoading = side === "in" ? setIsLoadingTo : setIsLoadingFrom;
      // Convert native token to ERC20
      // TODO: handle other networks
      const fromTokenERC20 =
        fromToken.symbol === "ETH" ? tokens.WETH : fromToken;
      const toTokenERC20 =
        newToToken.symbol === "ETH" ? tokens.WETH : newToToken;

      const fetchRequestTimestamp = Date.now();

      updateAmountTimestampRef.current = fetchRequestTimestamp;

      if (updateAmountTimeoutRef.current) {
        clearTimeout(updateAmountTimeoutRef.current);
        updateAmountTimeoutRef.current = null;
      }

      if (
        newAmountBD.isZero() ||
        fromTokenERC20.symbol === toTokenERC20.symbol
      ) {
        console.log("resetting amount as it is zero or same token");
        setAmount("");
        setPriceImpact?.(new BigDecimal(0, 18));
        setIsLoading(false);

        return;
      }

      setIsLoading(true);
      setAmount(getOtherAmount(newAmount, side));
      console.log("fetching...", fromTokenERC20.symbol, toTokenERC20.symbol);

      updateAmountTimeoutRef.current = setTimeout(() => {
        getSwapQuoteForProviders(
          publicClient,
          fromTokenERC20,
          toTokenERC20,
          side,
          newAmountBD,
        )
          .then((result) => {
            if (updateAmountTimestampRef.current > fetchRequestTimestamp) {
              console.log("cancelling as there is a newer fetch req");

              // If the timestamp has changed, it means another request was made
              return;
            }
            if (result) {
              const results = [result.aave].filter((v) => !!v);

              if (results.length === 0) {
                console.log("no results found, resetting amount");
                setPriceImpact?.(new BigDecimal(0, 18));
                setAmount("");

                return;
              }
              const bestResult = results.reduce((prev, current) => {
                if (side === "in") {
                  return prev.amountOut.gt(current.amountOut) ? prev : current;
                } else {
                  return prev.amountIn.lt(current.amountIn) ? prev : current;
                }
              });
              const bestAmount =
                side === "in"
                  ? bestResult.amountOut.toFixed(toTokenERC20.decimals)
                  : bestResult.amountIn.toFixed(fromTokenERC20.decimals);

              setSqrtPriceX96(bestResult.sqrtPriceX96);

              setAmount(bestAmount);
              setPriceImpact?.(new BigDecimal(bestResult.priceImpact, 18));
            }
          })
          .catch((e) => {
            console.error("Error fetching swap quote:", e);
            setPriceImpact?.(new BigDecimal(0, 18));
            setAmount("");
          })
          .finally(() => {
            if (updateAmountTimestampRef.current === fetchRequestTimestamp) {
              setIsLoading(false);
            }
          });
      }, 200);
    },
    [
      fromToken,
      getOtherAmount,
      publicClient,
      setFromAmount,
      setPriceImpact,
      setToAmount,
      toToken,
    ],
  );

  const exchangeRate = useMemo(() => {
    const toAmountBD = new BigDecimal(toAmount || "0", toToken?.decimals ?? 18);
    const fromAmountBD = new BigDecimal(
      fromAmount || "0",
      fromToken?.decimals || 18,
    );

    if (toAmountBD.isZero() || fromAmountBD.isZero())
      return getOtherAmount("1", "in");

    return toAmountBD.div(fromAmountBD).toFixed(toToken?.displayDecimals ?? 8);
  }, [
    toAmount,
    toToken?.decimals,
    toToken?.displayDecimals,
    fromAmount,
    fromToken?.decimals,
    getOtherAmount,
  ]);

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

    console.log("swapping... zeroForOne: ", zeroForOne);
    console.log("swapping... sqrtX96PriceLimit: ", sqrtPriceLimitX96);
    writeContract(
      {
        address: contracts.birdieRouter.address as `0x${string}`,
        abi: contracts.birdieRouter.abi,
        functionName: "swap",
        args: [
          poolAddress as `0x${string}`,
          address as `0x${string}`,
          zeroForOne,
          isFromNativeToken
            ? BigInt(0)
            : parseUnits(fromAmount, fromToken?.decimals || 18),
          sqrtPriceLimitX96 || BigInt(0),
          // zeroForOne
          //   ? BigInt("4295128740")
          //   : BigInt("1461446703485210103287273052203988822378723970341"),
        ],
        // value: isFromNativeToken
        //   ? parseUnits(fromAmount, fromToken.decimals || 18)
        //   : BigInt(0),
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
