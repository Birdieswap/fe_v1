import {
  useCallback,
  useMemo,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { formatUnits, parseUnits, PublicClient } from "viem";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import {
  StartFarmingTransactionProps,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { TransactionType } from "@/types/TransactionTypes";
import TransactionStatus from "@/types/TransactionStatus";
import { AssetsContext } from "@/app/AssetsContextProvider";
import getInsolvencyAmount from "@/utils/assets/getImpermanentInsolvency";

import useApprove from "./useApprove";
import { FarmStartTokenStatus } from "./FarmTokenStatus";
import useFarmPanelCommon from "./useFarmPanelCommon";
import useBalance from "./useBalance";
import useAllowance from "./useAllowance";
import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";

import { ADDRESS } from "@/const/contracts/contractAddresses";
import useAccountBalances from "./assets/useAssets/useAccountBalances";
import {
  getFromContracts,
  isZeroAddress,
  ZERO_ADDRESS,
} from "@/utils/farm/getAddressHelpers";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";

import { useFarmCalcOnce } from "./farm/useFarmCalcOnce";

import previewFullDeposit from "@/utils/farm/previewFullDeposit";
import previewRedeem from "@/utils/farm/previewRedeem";
import { useV3UnderlyingFromTokenId } from "@/utils/farm/useV3UnderlyingFromTokenId";
import { getPoolImmutables } from "@/utils/uniswap/getPoolImmutables";
import { getPoolState } from "@/utils/uniswap/getPoolState";
import miscContracts from "@/const/contracts/tokens/others";
import { fetchV3Position } from "@/utils/uniswap/positionManager";
import { quoteV3AddLiquidity } from "@/hooks/farm/useV3AddLiquidityQuote";

type NativeMode = "ETH" | "WETH" | null;

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

export function usePairStartPanel(
  item: FarmPair,
  tokenId?: bigint,
  uniswapPoolAddress?: `0x${string}`,
) {
  const {
    client,
    transactionContext,
    writeContract,
    isPendingWriteContract,
    address,
    isConnected,
    chainId,
    isWrongNetwork,
    assetsContext,
    stakeToken,
    stakeTokenAddress,
    routerAddress,
  } = useFarmPanelCommon(item);

  const accountBalances = useAccountBalances();

  const balanceMap: Map<`0x${string}`, any> = useMemo(() => {
    return (
      (accountBalances as any)?.tokenBalances?.balanceMap ||
      (accountBalances as any)?.balanceMap ||
      new Map()
    );
  }, [accountBalances]);

  const [bToken0, bToken1] = item.wip_stakeToken.swap.input;
  const inputToken0 = bToken0.input;
  const inputToken1 = bToken1.input;

  const ETH_ZERO_ADDRESS: `0x${string}` =
    getFromContracts(ADDRESS.ETH, chainId) ?? ZERO_ADDRESS;
  const WETH_ADDRESS: `0x${string}` | null = getFromContracts(
    ADDRESS.WETH,
    chainId,
  );
  const WRAPPER_ADDRESS: `0x${string}` | null = getFromContracts(
    ADDRESS.WRAPPER,
    chainId,
  );
  const ROUTER_ADDRESS: `0x${string}` | null = getFromContracts(
    ADDRESS.ROUTER,
    chainId,
  );

  const ROUTER_PROVIDER = (stakingProviders as any)?.BIRDIESWAP_Router;
  const WRAPPER_PROVIDER = (stakingProviders as any)?.BIRDIESWAP_Wrapper;

  const routerAddressResolved: `0x${string}` | null =
    ROUTER_ADDRESS ??
    ROUTER_PROVIDER?.addresses?.[chainId] ??
    (routerAddress as `0x${string}` | null);

  const wrapperAddressResolved: `0x${string}` | null =
    WRAPPER_ADDRESS ?? WRAPPER_PROVIDER?.addresses?.[chainId] ?? null;

  const defaultIsETH: [boolean, boolean] = [
    inputToken0?.symbol === "ETH" ||
      isZeroAddress((inputToken0 as any)?.addresses?.[chainId]),
    inputToken1?.symbol === "ETH" ||
      isZeroAddress((inputToken1 as any)?.addresses?.[chainId]),
  ];

  const [nativeMode, setNativeMode] = useState<[NativeMode, NativeMode]>([
    defaultIsETH[0] ? "ETH" : null,
    defaultIsETH[1] ? "ETH" : null,
  ]);

  const setNativeMode0 = useCallback((m: any) => {
    const s = (m ?? "").toString().trim().toUpperCase();
    setNativeMode((prev) => [s === "WETH" ? "WETH" : "ETH", prev[1]]);
  }, []);
  const setNativeMode1 = useCallback((m: any) => {
    const s = (m ?? "").toString().trim().toUpperCase();
    setNativeMode((prev) => [prev[0], s === "WETH" ? "WETH" : "ETH"]);
  }, []);

  const nativeToggleCanShow: [boolean, boolean] = [
    defaultIsETH[0],
    defaultIsETH[1],
  ];

  const insolvency0 = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: inputToken0,
      chainId,
    });
  }, [stakeToken, inputToken0, chainId]);

  const insolvency1 = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: inputToken1,
      chainId,
    });
  }, [stakeToken, inputToken1, chainId]);

  const balance0 = useBalance(inputToken0);
  const balance1 = useBalance(inputToken1);

  const ethDisplayMeta = externalTokens.ETH;
  const wethDisplayMeta = externalTokens.WETH;

  const displayTokens = useMemo(() => {
    const t0 = defaultIsETH[0]
      ? nativeMode[0] === "WETH"
        ? wethDisplayMeta
        : ethDisplayMeta
      : (inputToken0 as any);
    const t1 = defaultIsETH[1]
      ? nativeMode[1] === "WETH"
        ? wethDisplayMeta
        : ethDisplayMeta
      : (inputToken1 as any);
    return [t0, t1] as const;
  }, [
    defaultIsETH,
    nativeMode,
    wethDisplayMeta,
    ethDisplayMeta,
    inputToken0,
    inputToken1,
  ]);

  const sideAddr0 = (displayTokens[0] as any)?.addresses?.[chainId] as
    | `0x${string}`
    | undefined;
  const sideAddr1 = (displayTokens[1] as any)?.addresses?.[chainId] as
    | `0x${string}`
    | undefined;

  const isETH0 =
    (displayTokens[0] as any)?.symbol === "ETH" || isZeroAddress(sideAddr0);
  const isETH1 =
    (displayTokens[1] as any)?.symbol === "ETH" || isZeroAddress(sideAddr1);

  const isWETH0 =
    !!WETH_ADDRESS &&
    sideAddr0?.toLowerCase?.() === WETH_ADDRESS.toLowerCase?.();
  const isWETH1 =
    !!WETH_ADDRESS &&
    sideAddr1?.toLowerCase?.() === WETH_ADDRESS.toLowerCase?.();

  const anyETH = isETH0 || isETH1;

  const getBal = (addr?: `0x${string}` | string | null) => {
    if (!addr) return null;
    const lower = (addr as string).toLowerCase() as `0x${string}`;
    return (
      balanceMap.get(lower) ?? balanceMap.get(addr as `0x${string}`) ?? null
    );
  };

  const displayBalances: [any, any] = [
    defaultIsETH[0]
      ? isWETH0
        ? getBal(WETH_ADDRESS)
        : getBal(ETH_ZERO_ADDRESS)
      : balance0,
    defaultIsETH[1]
      ? isWETH1
        ? getBal(WETH_ADDRESS)
        : getBal(ETH_ZERO_ADDRESS)
      : balance1,
  ];

  const token0ForAllowance = isETH0
    ? (wethDisplayMeta as any)
    : (displayTokens[0] as any);
  const token1ForAllowance = isETH1
    ? (wethDisplayMeta as any)
    : (displayTokens[1] as any);

  const resolvedRouterProvider = useMemo(
    () => ({
      ...(ROUTER_PROVIDER ?? { name: "Birdieswap Router", addresses: {} }),
      addresses: {
        ...(ROUTER_PROVIDER?.addresses ?? {}),
        ...(routerAddressResolved ? { [chainId]: routerAddressResolved } : {}),
      },
    }),
    [ROUTER_PROVIDER, routerAddressResolved, chainId],
  );

  const resolvedWrapperProvider = useMemo(
    () => ({
      ...(WRAPPER_PROVIDER ?? { name: "Birdieswap Wrapper", addresses: {} }),
      addresses: {
        ...(WRAPPER_PROVIDER?.addresses ?? {}),
        ...(wrapperAddressResolved ? { [chainId]: wrapperAddressResolved } : {}),
      },
    }),
    [WRAPPER_PROVIDER, wrapperAddressResolved, chainId],
  );

  const spender0Provider = anyETH ? resolvedWrapperProvider : resolvedRouterProvider;
  const spender1Provider = anyETH ? resolvedWrapperProvider : resolvedRouterProvider;

  const { allowance: allowance0, query: allowanceQuery0 } = useAllowance({
    token: token0ForAllowance,
    spender: spender0Provider,
  });
  const { allowance: allowance1, query: allowanceQuery1 } = useAllowance({
    token: token1ForAllowance,
    spender: spender1Provider,
  });

  const [amounts, setAmounts] = useState<
    [BigDecimal | null, BigDecimal | null]
  >([null, null]);

  const { assetValues } = useContext(AssetsContext);

  // ✅ 최신 방식: poolBalance/price는 useFarmCalcOnce로
  const farmCalc = useFarmCalcOnce(
    client as PublicClient | undefined,
    item.wip_stakeToken,
    assetValues,
  );

  const poolBalance0 = farmCalc?.poolBalance0 ?? BigDecimal.ZERO();
  const poolBalance1 = farmCalc?.poolBalance1 ?? BigDecimal.ZERO();

  const rawPrice = farmCalc?.price ?? null; // BigDecimal | null
  const price = rawPrice ?? BigDecimal.ZERO(); // UI용 안전한 값

  const [isActive, _setIsActive] = useState<[boolean, boolean]>([true, true]);

  // ✅ V3 slot0 기반 fallback을 위한 훅
  const {
    underlying0: underlyingBalance0,
    underlying1: underlyingBalance1,
    v3Pool,
    v3Position,
  } = useV3UnderlyingFromTokenId({
    client: client as any,
    chainId,
    tokenId,
    uniswapPoolAddress,
    bToken0,
    bToken1,
  });

  // console.log("[V3] usePairStartPanel V3 inputs", {
  //   chainId,
  //   tokenId: tokenId?.toString?.(),
  //   uniswapPoolAddress,
  //   bToken0: bToken0?.symbol,
  //   bToken1: bToken1?.symbol,
  //   bToken0Address: bToken0?.addresses?.[chainId as number],
  //   bToken1Address: bToken1?.addresses?.[chainId as number],
  // });

  const [isApprovePending, setIsApprovePending] = useState<[boolean, boolean]>([
    false,
    false,
  ]);

  const approveWithPending = useCallback(
    (i: 0 | 1, fn: (t: any) => any) => async (token: any) => {
      setIsApprovePending((p) => {
        const next = [...p] as [boolean, boolean];
        next[i] = true;
        return next;
      });
      try {
        await Promise.resolve(fn(token));
      } finally {
        setIsApprovePending((p) => {
          const next = [...p] as [boolean, boolean];
          next[i] = false;
          return next;
        });
      }
    },
    [],
  );

  const isApproved = useMemo<[boolean, boolean]>(() => {
    const amt0 = amounts[0] || BigDecimal.ZERO();
    const amt1 = amounts[1] || BigDecimal.ZERO();
    const approved0 = isETH0 ? true : allowance0.gte(amt0);
    const approved1 = isETH1 ? true : allowance1.gte(amt1);
    return [approved0, approved1];
  }, [amounts, allowance0, allowance1, isETH0, isETH1]);

  const displayApproved: [boolean, boolean] = useMemo(
    () => isApproved,
    [isApproved],
  );

  const isInsufficientBalance: [boolean, boolean] = useMemo(() => {
    return [
      (displayBalances[0] ?? BigDecimal.ZERO()).lt(amounts[0] || 0),
      (displayBalances[1] ?? BigDecimal.ZERO()).lt(amounts[1] || 0),
    ];
  }, [amounts, displayBalances]);

  const isImpermanentInsolvency: [boolean, boolean] = useMemo(() => {
    return [
      insolvency0 !== undefined &&
        new BigDecimal(insolvency0).lt(amounts[0] || 0),
      insolvency1 !== undefined &&
        new BigDecimal(insolvency1).lt(amounts[1] || 0),
    ];
  }, [insolvency0, amounts, insolvency1]);

  /**
   * ✅ getOtherAmount (Concentrated range 전용):
   * slot0로 bToken 교환비를 구하고,
   * previewFullDeposit/previewRedeem를 통해 underlying otherAmount를 계산한다.
   */
  const getOtherAmount = useCallback(
    async (value: BigDecimal, index: 0 | 1): Promise<BigDecimal> => {
      const baseUnderlying = index === 0 ? inputToken0 : inputToken1;
      const otherUnderlyingToken = index === 0 ? inputToken1 : inputToken0;

      const baseBToken = index === 0 ? bToken0 : bToken1;
      const otherBToken = index === 0 ? bToken1 : bToken0;

      // 메타 없으면 계산 불가
      if (!baseUnderlying || !otherUnderlyingToken) return BigDecimal.ZERO();

      // 음수/0 방어
      if (!value || value.lte(0)) return BigDecimal.ZERO();

      // [Disabled] 기존 full-range 분기 (poolBalance/underlying 비율)
      // const thisPool = index === 0 ? poolBalance0 : poolBalance1;
      // const otherPool = index === 0 ? poolBalance1 : poolBalance0;
      // if (thisPool && otherPool && !thisPool.eq(0) && !otherPool.eq(0)) {
      //   return value
      //     .mul(otherPool)
      //     .div(thisPool)
      //     .roundToDecimals(otherUnderlyingToken.decimals ?? 18);
      // }
      // const thisUnderlying =
      //   (index === 0 ? underlyingBalance0 : underlyingBalance1) ??
      //   BigDecimal.ZERO();
      // const otherUnderlying =
      //   (index === 0 ? underlyingBalance1 : underlyingBalance0) ??
      //   BigDecimal.ZERO();
      // if (!thisUnderlying.eq(0) && !otherUnderlying.eq(0)) {
      //   return value
      //     .mul(otherUnderlying)
      //     .div(thisUnderlying)
      //     .roundToDecimals(otherUnderlyingToken.decimals ?? 18);
      // }

      // slot0 + preview 단일 경로
      if (!client || !chainId || !uniswapPoolAddress) {
        // console.log("[V3] getOtherAmount skipped: missing deps", {
        //   hasClient: !!client,
        //   chainId,
        //   uniswapPoolAddress,
        // });
        return BigDecimal.ZERO();
      }

      try {
        // console.log("[V3] getOtherAmount slot0-flow start", {
        //   chainId,
        //   baseIndex: index,
        //   baseUnderlying: baseUnderlying?.symbol,
        //   otherUnderlying: otherUnderlyingToken?.symbol,
        //   baseBToken: baseBToken?.symbol,
        //   otherBToken: otherBToken?.symbol,
        //   baseAddress: baseBToken?.addresses?.[chainId],
        //   otherAddress: otherBToken?.addresses?.[chainId],
        //   poolToken0: v3Pool?.token0?.address,
        //   poolToken1: v3Pool?.token1?.address,
        //   tickLower: v3Position?.tickLower,
        //   tickUpper: v3Position?.tickUpper,
        //   inputValue: value?.toString?.(),
        // });
        const baseProvider = (baseBToken as any)?.provider;
        const wrapperProvider = (stakingProviders as any)?.BIRDIESWAP_Wrapper;
        const routerProvider = (stakingProviders as any)?.BIRDIESWAP_Router;

        const isWrapperProvider = baseProvider === wrapperProvider;

        const providerOverride =
          isWrapperProvider && routerProvider?.addresses?.[chainId]
            ? {
                address: routerProvider.addresses?.[chainId] as `0x${string}`,
                abi: routerProvider.abi as any,
              }
            : undefined;

        // 3-1) underlying 입력값 -> base bToken 수량으로 변환
        const bBase = await previewFullDeposit(
          client as PublicClient,
          baseBToken,
          value,
          providerOverride,
        );
        if (!bBase || bBase.eq(0)) {
          // console.log("[V3] previewFullDeposit empty", {
          //   bBase: bBase?.toString?.(),
          //   baseBToken: baseBToken?.symbol,
          //   baseAddress: baseBToken?.addresses?.[chainId],
          // });
          return BigDecimal.ZERO();
        }

        if (!tokenId || tokenId === 0n) {
          console.error("[V3] tokenId missing for add-liquidity quote");
          return BigDecimal.ZERO();
        }

        const nfpmAddress = miscContracts.UniswapNonfungiblePositionManager
          .addresses[chainId] as `0x${string}` | undefined;
        if (!nfpmAddress) {
          console.error("[V3] nfpm address missing", { chainId });
          return BigDecimal.ZERO();
        }

        const poolName =
          item?.name ||
          (item as any)?.wip_stakeToken?.name ||
          `${bToken0?.symbol ?? "token0"}/${bToken1?.symbol ?? "token1"}`;
        console.log("[V3][AddQuote] read position start", {
          chainId,
          poolName,
          poolAddress: uniswapPoolAddress,
          tokenId: tokenId.toString(),
          baseIndex: index,
          baseUnderlying: baseUnderlying?.symbol,
          otherUnderlying: otherUnderlyingToken?.symbol,
          baseBToken: baseBToken?.symbol,
          inputUnderlying: value?.toString?.(),
          inputBToken: bBase?.toString?.(),
        });

        const [position, poolState, imm] = await Promise.all([
          fetchV3Position(client as PublicClient, nfpmAddress, tokenId),
          getPoolState(client as PublicClient, uniswapPoolAddress),
          getPoolImmutables(client as PublicClient, uniswapPoolAddress),
        ]);

        console.log("[V3][AddQuote] position loaded", {
          tokenId: tokenId.toString(),
          token0: position.token0,
          token1: position.token1,
          fee: Number(position.fee),
          tickLower: Number(position.tickLower),
          tickUpper: Number(position.tickUpper),
          liquidity: position.liquidity.toString(),
          sqrtPriceX96: poolState.sqrtPriceX96.toString(),
          tickCurrent: Number(poolState.tick),
          poolLiquidity: poolState.liquidity.toString(),
        });

        const poolToken0Addr = (imm.token0 as string).toLowerCase();
        const poolToken1Addr = (imm.token1 as string).toLowerCase();

        const baseAddr = (
          baseBToken.addresses?.[chainId] as string | undefined
        )?.toLowerCase?.();
        const baseIsToken0 = !!baseAddr && baseAddr === poolToken0Addr;
        const baseIsToken1 = !!baseAddr && baseAddr === poolToken1Addr;
        if (!baseIsToken0 && !baseIsToken1) {
          console.error("[V3] base token not in pool tokens", {
            baseAddr,
            poolToken0Addr,
            poolToken1Addr,
            baseBToken: baseBToken?.symbol,
            otherBToken: otherBToken?.symbol,
          });
          return BigDecimal.ZERO();
        }

        const b0Addr = (
          bToken0.addresses?.[chainId] as string | undefined
        )?.toLowerCase?.();
        const b1Addr = (
          bToken1.addresses?.[chainId] as string | undefined
        )?.toLowerCase?.();

        let poolBToken0 = bToken0 as any;
        let poolBToken1 = bToken1 as any;
        if (poolToken0Addr === b0Addr && poolToken1Addr === b1Addr) {
          poolBToken0 = bToken0;
          poolBToken1 = bToken1;
        } else if (poolToken0Addr === b1Addr && poolToken1Addr === b0Addr) {
          poolBToken0 = bToken1;
          poolBToken1 = bToken0;
        } else {
          console.error("[V3] pool token/bToken mapping failed", {
            poolToken0Addr,
            poolToken1Addr,
            b0Addr,
            b1Addr,
          });
          return BigDecimal.ZERO();
        }

        const quote = quoteV3AddLiquidity({
          token0: {
            chainId,
            address: poolToken0Addr as `0x${string}`,
            decimals: poolBToken0.decimals ?? 18,
            symbol: poolBToken0.symbol ?? "bToken0",
            name: poolBToken0.name,
          },
          token1: {
            chainId,
            address: poolToken1Addr as `0x${string}`,
            decimals: poolBToken1.decimals ?? 18,
            symbol: poolBToken1.symbol ?? "bToken1",
            name: poolBToken1.name,
          },
          pool: {
            fee: Number(position.fee),
            sqrtPriceX96: poolState.sqrtPriceX96,
            tickCurrent: Number(poolState.tick),
            poolLiquidity: poolState.liquidity,
          },
          range: {
            tickLower: Number(position.tickLower),
            tickUpper: Number(position.tickUpper),
          },
          input: baseIsToken0
            ? { side: "token0", amount: bBase.toString() }
            : { side: "token1", amount: bBase.toString() },
          slippageBps: 50,
        });

        if (!quote.requiredAmounts) {
          console.error("[V3] add quote requiredAmounts is null");
          return BigDecimal.ZERO();
        }

        const otherBAmountRaw = baseIsToken0
          ? quote.requiredAmounts.amount1Raw
          : quote.requiredAmounts.amount0Raw;
        const otherDecimals = (otherBToken as any)?.decimals ?? 18;
        const otherBAmountBD = new BigDecimal(
          formatUnits(BigInt(otherBAmountRaw), otherDecimals),
        );

        const otherUnderlyingBD = await previewRedeem(
          client as PublicClient,
          otherBToken,
          otherBAmountBD,
        );
        if (!otherUnderlyingBD) {
          // console.log("[V3] previewRedeem empty", {
          //   otherBAmount: otherBAmountBD?.toString?.(),
          //   otherBToken: otherBToken?.symbol,
          //   otherAddress: otherBToken?.addresses?.[chainId],
          // });
          return BigDecimal.ZERO();
        }

        console.log("[V3][AddQuote] getOtherAmount result", {
          tokenId: tokenId.toString(),
          poolAddress: uniswapPoolAddress,
          baseIsToken0,
          bBase: bBase?.toString?.(),
          quotePrice: quote.spotPrice,
          otherBAmount: otherBAmountBD?.toString?.(),
          otherUnderlying: otherUnderlyingBD?.toString?.(),
        });

        return otherUnderlyingBD.roundToDecimals(
          otherUnderlyingToken.decimals ?? 18,
        );
      } catch (e) {
        console.error("[V3] getOtherAmount fallback failed", e);
        return BigDecimal.ZERO();
      }
    },
    [
      client,
      chainId,
      inputToken0,
      inputToken1,
      bToken0,
      bToken1,
      v3Pool,
      v3Position,
      tokenId,
      uniswapPoolAddress,
    ],
  );

  const setMaxAmount = useCallback(() => {
    (async () => {
      const maxAmount0 = BigDecimal.min(balance0, insolvency0);
      const maxAmount1 = BigDecimal.min(balance1, insolvency1);

      const [maxSwapped0, maxSwapped1] = await Promise.all([
        getOtherAmount(maxAmount1, 1),
        getOtherAmount(maxAmount0, 0),
      ]);

      let result: [BigDecimal | null, BigDecimal | null];

      if (!isActive[0]) {
        result = [null, maxAmount1];
      } else if (!isActive[1]) {
        result = [maxAmount0, null];
      } else if (maxSwapped1.lt(maxAmount1)) {
        result = [maxAmount0, maxSwapped1];
      } else {
        result = [maxSwapped0, maxAmount1];
      }

      setAmounts(result);
    })();
  }, [balance0, insolvency0, balance1, insolvency1, getOtherAmount, isActive]);

  const setIsActive = useCallback(
    (state: [boolean, boolean]) => {
      _setIsActive(state);
      setAmounts((prev) => {
        if (!state[0]) return [null, prev[1]];
        if (!state[1]) return [prev[0], null];
        return prev;
      });
    },
    [_setIsActive],
  );

  const setAmountBase = useCallback(
    (value: BigDecimal | null, index: 0 | 1) => {
      setAmounts((prev) => {
        if (isActive.every(Boolean)) {
          return [index === 0 ? value : prev[0], index === 1 ? value : prev[1]];
        }
        return [index === 0 ? value : null, index === 1 ? value : null];
      });
    },
    [isActive],
  );

  const isZeroish = (v: any) => {
    if (v == null) return true;
    const n =
      typeof v?.toNumber === "function"
        ? v.toNumber()
        : typeof v?.toString === "function"
          ? Number(v.toString())
          : Number(v);
    return !Number.isFinite(n) || n === 0;
  };

  const amountsRef = useRef(amounts);
  const displayTokensRef = useRef(displayTokens);

  useEffect(() => {
    amountsRef.current = amounts;
  }, [amounts]);

  useEffect(() => {
    displayTokensRef.current = displayTokens;
  }, [displayTokens]);

  const DEBOUNCE_MS = 750;
  const lastTypedIndexRef = useRef<0 | 1 | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAmount = (value: BigDecimal | null, index: 0 | 1) => {
    setAmountBase(value as BigDecimal, index);
    lastTypedIndexRef.current = index;

    if (isZeroish(value)) {
      const other = (index === 0 ? 1 : 0) as 0 | 1;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setAmountBase(BigDecimal.ZERO(), other);
      return;
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      const i = lastTypedIndexRef.current;
      if (i !== 0 && i !== 1) return;

      const other = (i === 0 ? 1 : 0) as 0 | 1;
      const tokens = displayTokensRef.current;

      const srcAmount = amountsRef.current?.[i] ?? null;
      if (isZeroish(srcAmount)) {
        setAmountBase(null, other);
        return;
      }

      getOtherAmount(srcAmount as BigDecimal, i).then((nextRaw) => {
        const next = nextRaw?.roundToDecimals(tokens?.[other]?.decimals ?? 8);

        const cur = amountsRef.current?.[other] ?? null;
        const curN = cur ? Number(cur?.toString?.() ?? cur) : null;
        const nextN = next ? Number(next?.toString?.() ?? next) : null;

        if (curN !== nextN) {
          setAmountBase(next, other);
        }
      });
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const spender0Addr =
    (spender0Provider?.addresses?.[chainId] as `0x${string}` | undefined) ??
    undefined;
  const spender1Addr =
    (spender1Provider?.addresses?.[chainId] as `0x${string}` | undefined) ??
    undefined;

  const approve0 = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: spender0Addr as `0x${string}`,
    transactionContext,
    refetch: () =>
      Promise.all([
        allowanceQuery0.refetch(),
        allowanceQuery1.refetch(),
        assetsContext.refetchAll(),
      ]),
    writeContract,
  });

  const approve1 = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: spender1Addr as `0x${string}`,
    transactionContext,
    refetch: () =>
      Promise.all([
        allowanceQuery0.refetch(),
        allowanceQuery1.refetch(),
        assetsContext.refetchAll(),
      ]),
    writeContract,
  });

  const tokenStatuses = useMemo(
    () =>
      [0, 1].map((i) => {
        const input = displayTokens[i] as any;
        const bal = displayBalances[i] ?? BigDecimal.ZERO();
        const amt = amounts[i];
        return {
          index: i,
          input,
          balance: bal,
          amount: amt,
          isApproved: isApproved[i],
          isActive: isActive[i],
          isImpermanentInsolvency:
            i === 0
              ? insolvency0 !== undefined &&
                new BigDecimal(insolvency0).lt(amounts[0] || 0)
              : insolvency1 !== undefined &&
                new BigDecimal(insolvency1).lt(amounts[1] || 0),
          impermanentInsolvency: i === 0 ? insolvency0 : insolvency1,
          isInsufficientBalance: bal.lt(amt || 0),
          isApprovable: isConnected && !isApproved[i] && !isApprovePending[i],
          approve: () =>
            i === 0
              ? approveWithPending(0, approve0)(input)
              : approveWithPending(1, approve1)(input),
        } as FarmStartTokenStatus;
      }) as [FarmStartTokenStatus, FarmStartTokenStatus],
    [
      displayTokens,
      displayBalances,
      amounts,
      isApproved,
      isActive,
      insolvency0,
      insolvency1,
      isConnected,
      approve0,
      approve1,
      isApprovePending,
    ],
  );

  const startFarming = useCallback(() => {
    if (!address) return;

    const transactionProps: TransactionStatusProps &
      StartFarmingTransactionProps = {
      chainId,
      transactionType: TransactionType.START_FARMING,
      input: tokenStatuses
        .map((v) => ({ token: v.input, amount: v.amount ?? undefined }))
        .filter((v) => !!v.token),
      output: { token: stakeToken },
      address,
    };

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: async () => {
        await Promise.all([
          allowanceQuery0.refetch(),
          allowanceQuery1.refetch(),
          assetsContext.refetchAll(),
        ]);
      },
      afterReceipt: assetsContext.forceRefresh,
    });

    const anyETHLocal = isETH0 || isETH1;
    if (isETH0 && isETH1) {
      console.error(
        "[startFarming] both sides are ETH — unsupported combination",
      );
      return;
    }

    if (anyETHLocal) {
      if (!WRAPPER_ADDRESS) {
        console.error(
          "[startFarming] Missing WRAPPER_ADDRESS for chain:",
          chainId,
        );
        return;
      }

      const ethIndex: 0 | 1 = isETH0 ? 0 : 1;
      const otherIndex: 0 | 1 = isETH0 ? 1 : 0;

      const ethAmountBD = tokenStatuses[ethIndex].amount ?? BigDecimal.ZERO();
      const ethValue = parseUnits(ethAmountBD.toFixed(18), 18);

      const otherTokenAddr = (
        (otherIndex === 0 ? isWETH0 : isWETH1)
          ? (WETH_ADDRESS ?? ETH_ZERO_ADDRESS)
          : (displayTokens[otherIndex] as any).addresses[chainId]
      ) as `0x${string}`;

      const otherDecimals =
        displayTokens?.[otherIndex]?.decimals ??
        (otherIndex === 0 ? inputToken0?.decimals : inputToken1?.decimals) ??
        18;

      const otherAmountBD =
        tokenStatuses[otherIndex].amount ?? BigDecimal.ZERO();
      const otherAmount = parseUnits(otherAmountBD.toString(), otherDecimals);

      writeContract(
        {
          address: WRAPPER_ADDRESS,
          abi: birdieswap_wrapper_abi,
          functionName: "dualDepositWithETH",
          args: [otherTokenAddr, otherAmount],
          value: ethValue,
        },
        {
          onError: handlers.onError,
          onSuccess: async (v) => {
            handlers.onSuccess(v);
            setAmounts([BigDecimal.ZERO(), BigDecimal.ZERO()]);
            try {
              await assetsContext.forceRefresh?.();
            } catch (e) {
              console.error("forceRefresh failed", e);
            }
          },
        },
      );
      return;
    }

    if (!ROUTER_ADDRESS) {
      console.error(
        "[startFarming] Missing ROUTER_ADDRESS for chain:",
        chainId,
      );
      return;
    }

    const addr0 = displayTokens[0].addresses[chainId] as `0x${string}`;
    const addr1 = displayTokens[1].addresses[chainId] as `0x${string}`;
    const amount0Str = tokenStatuses[0].amount?.toString() || "0";
    const amount1Str = tokenStatuses[1].amount?.toString() || "0";
    const amount0Raw = parseUnits(amount0Str, tokenStatuses[0].input.decimals);
    const amount1Raw = parseUnits(amount1Str, tokenStatuses[1].input.decimals);

    // console.log("[startFarming] dualDeposit args", {
    //   account: address,
    //   addr0,
    //   symbol0: tokenStatuses[0].input?.symbol,
    //   decimals0: tokenStatuses[0].input?.decimals,
    //   amount0: amount0Str,
    //   amount0Raw: amount0Raw.toString(),
    //   addr1,
    //   symbol1: tokenStatuses[1].input?.symbol,
    //   decimals1: tokenStatuses[1].input?.decimals,
    //   amount1: amount1Str,
    //   amount1Raw: amount1Raw.toString(),
    // });

    writeContract(
      {
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: birdieswap_router_abi,
        functionName: "dualDeposit",
        args: [
          address,
          addr0,
          amount0Raw,
          addr1,
          amount1Raw,
        ],
      },
      {
        onError: handlers.onError,
        onSuccess: async (v) => {
          handlers.onSuccess(v);
          setAmounts([BigDecimal.ZERO(), BigDecimal.ZERO()]);
          try {
            await assetsContext.forceRefresh?.();
          } catch (e) {
            console.error("forceRefresh failed", e);
          }
        },
      },
    );
  }, [
    chainId,
    tokenStatuses,
    stakeToken,
    address,
    client,
    transactionContext,
    writeContract,
    allowanceQuery0,
    allowanceQuery1,
    assetsContext,
    displayTokens,
    inputToken0?.decimals,
    inputToken1?.decimals,
    WETH_ADDRESS,
    WRAPPER_ADDRESS,
    ROUTER_ADDRESS,
    isETH0,
    isETH1,
    isWETH0,
    isWETH1,
    ETH_ZERO_ADDRESS,
  ]);

  const isStartable = useMemo(
    () =>
      tokenStatuses
        .filter((v) => v.isActive)
        .every(
          (v) =>
            v.isApproved &&
            !v.isImpermanentInsolvency &&
            !v.isInsufficientBalance &&
            !!v.amount &&
            v.amount.gt(0),
        ),
    [tokenStatuses],
  );

  const isPending =
    allowanceQuery0.isFetching ||
    allowanceQuery1.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING ||
    isApprovePending[0] ||
    isApprovePending[1];

  return {
    setAmount,
    setMaxAmount,
    isActive,
    setIsActive,
    tokenStatuses,
    isStartable,
    startFarming,
    isPending,
    isConnected,
    isWrongNetwork,
    chainId,
    poolBalance0,
    poolBalance1,
    nativeMode,
    setNativeMode,
    setNativeMode0,
    setNativeMode1,
    nativeToggleCanShow,
    displayTokens,
    displayBalances,
    displayApproved,
    price,
  };
}

export type UsePairStartPanelReturn = ReturnType<typeof usePairStartPanel>;
