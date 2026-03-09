import { useContext, useMemo, useState, useCallback, useEffect } from "react";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";

import useFarmStopPanelCommon, { StopRoute } from "./useFarmStopPanelCommon";
import { formatUnits, parseUnits, PublicClient } from "viem";
import { FarmTokenStatus as FarmStopTokenStatus } from "./FarmTokenStatus";
import useBalance from "./useBalance";
import { isZeroAddress } from "@/utils/farm/getAddressHelpers";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { useFarmCalcOnce } from "./farm/useFarmCalcOnce";
import { usePublicClient } from "wagmi";
import miscContracts from "@/const/contracts/tokens/others";
import { fetchV3Position } from "@/utils/uniswap/positionManager";
import { getPoolState } from "@/utils/uniswap/getPoolState";
import { quoteV3RemoveLiquidity } from "@/hooks/farm/useV3RemoveLiquidityQuote";
import previewRedeem from "@/utils/farm/previewRedeem";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

type NativeMode = "ETH" | "WETH" | null;

export function usePairStopPanel(item: FarmPair) {
  const client = usePublicClient();
  const { assetValues } = useContext(AssetsContext);
  const farmCalc = useFarmCalcOnce(
    client as PublicClient | undefined,
    item.wip_stakeToken,
    assetValues
  );

  const poolBalance0 = farmCalc?.poolBalance0 ?? BigDecimal.ZERO();
  const poolBalance1 = farmCalc?.poolBalance1 ?? BigDecimal.ZERO();
  const totalSupply = farmCalc?.totalSupply ?? BigDecimal.ZERO();
  const rawPrice = farmCalc?.price ?? null; // BigDecimal | null
  const price = rawPrice ?? BigDecimal.ZERO(); // UI용 안전한 값

  const [bToken0, bToken1] = item.wip_stakeToken.swap.input;
  const inputToken0 = bToken0.input;
  const inputToken1 = bToken1.input;

  // 기본 ETH/WETH 여부(심볼 기반)
  const defaultIsETH: [boolean, boolean] = [
    inputToken0?.symbol === "ETH",
    inputToken1?.symbol === "ETH",
  ];
  const hasWethLike: [boolean, boolean] = [
    defaultIsETH[0] || inputToken0?.symbol === "WETH",
    defaultIsETH[1] || inputToken1?.symbol === "WETH",
  ];

  // ETH/WETH 토글 상태(ETH/WETH가 있을 때만)
  const [nativeMode, setNativeMode] = useState<[NativeMode, NativeMode]>([
    hasWethLike[0] ? (defaultIsETH[0] ? "ETH" : "WETH") : null,
    hasWethLike[1] ? (defaultIsETH[1] ? "ETH" : "WETH") : null,
  ]);

  // 표기용 메타
  const ethDisplayMeta = externalTokens.ETH;
  const wethDisplayMeta = externalTokens.WETH;

  // 표시 토큰 (토글 반영)
  const displayTokens = useMemo(() => {
    const t0 = hasWethLike[0]
      ? nativeMode?.[0] === "ETH"
        ? ethDisplayMeta
        : wethDisplayMeta
      : (inputToken0 as any);
    const t1 = hasWethLike[1]
      ? nativeMode?.[1] === "ETH"
        ? ethDisplayMeta
        : wethDisplayMeta
      : (inputToken1 as any);
    return [t0, t1] as const;
  }, [
    hasWethLike,
    nativeMode,
    ethDisplayMeta,
    wethDisplayMeta,
    inputToken0,
    inputToken1,
  ]);

  // ETH 경로 포함 여부: displayToken으로 판별
  const isETH0 =
    (displayTokens[0] as any)?.symbol === "ETH" ||
    isZeroAddress((displayTokens[0] as any)?.addresses?.["" as any]);
  const isETH1 =
    (displayTokens[1] as any)?.symbol === "ETH" ||
    isZeroAddress((displayTokens[1] as any)?.addresses?.["" as any]);
  const anyETH = isETH0 || isETH1;

  // 공통 훅: anyETH면 Wrapper, 아니면 Router로 BLP allowance/approve 스펜더 지정
  const {
    address,
    isPendingWriteContract,
    isConnected,
    isWrongNetwork,
    chainId,
    stakeToken,
    performStop,
    approve,
    allowance,
    allowanceQuery,
  } = useFarmStopPanelCommon(item, {
    stopSpenderProvider: anyETH
      ? (stakingProviders as any).BIRDIESWAP_Wrapper
      : (stakingProviders as any).BIRDIESWAP_Router,
  });

  const balance = useBalance(stakeToken);

  // 청산 BLP 금액
  const [amount, setAmount] = useState<BigDecimal | null>(null);
  const setMaxAmount = useCallback(() => {
    setAmount(balance ?? BigDecimal.ZERO());
  }, [balance]);

  const [isApprovePending, setIsApprovePending] = useState(false);

  const approveWithPending = useCallback(
    async (token: any) => {
      setIsApprovePending(true);
      try {
        await approve(token);
      } finally {
        setIsApprovePending(false);
      }
    },
    [approve]
  );

  // AmountInput 상태
  const tokenStatus: FarmStopTokenStatus = useMemo(
    () => ({
      index: 0 as 0,
      input: stakeToken,
      balance,
      amount,
      isApproved: allowance.gte(amount || 0),
      isActive: true,
      isImpermanentInsolvency: false,
      impermanentInsolvency: undefined,
      isInsufficientBalance: balance.lt(amount || 0),
      isApprovable:
        isConnected && !allowance.gte(amount || 0) && !isApprovePending,
      approve: () => approveWithPending(stakeToken),
    }),
    [
      stakeToken,
      balance,
      amount,
      allowance,
      isConnected,
      isApprovePending,
      approveWithPending,
    ]
  );

  const [receiveAmount, setReceiveAmount] = useState<
    [BigDecimal, BigDecimal]
  >([BigDecimal.ZERO(), BigDecimal.ZERO()]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const blpAmount = amount ?? BigDecimal.ZERO();
      if (!blpAmount || blpAmount.lte(0) || !totalSupply || totalSupply.lte(0)) {
        if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
        return;
      }

      if (!client || !chainId) {
        if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
        return;
      }

      const uniswapPoolAddress = item.wip_stakeToken.swap.addresses?.[
        chainId
      ] as `0x${string}` | undefined;
      const rawTokenId = item.wip_stakeToken.swap.tokenId?.[chainId];
      const tokenId = rawTokenId ? BigInt(rawTokenId) : 0n;
      if (!uniswapPoolAddress || tokenId === 0n) {
        if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
        return;
      }

      const nfpmAddress = miscContracts.UniswapNonfungiblePositionManager
        .addresses[chainId] as `0x${string}` | undefined;
      if (!nfpmAddress) {
        if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
        return;
      }

      try {
        const poolName =
          item?.name ||
          (item as any)?.wip_stakeToken?.name ||
          `${bToken0?.symbol ?? "token0"}/${bToken1?.symbol ?? "token1"}`;
        const removeBpsRaw = blpAmount
          .mul(new BigDecimal("10000"))
          .div(totalSupply);
        const removeBpsNum = Math.floor(Number(removeBpsRaw.toString()));
        const removeBps = Math.max(0, Math.min(10_000, removeBpsNum));
        if (!Number.isFinite(removeBpsNum) || removeBps <= 0) {
          if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
          return;
        }

        console.log("[V3][RemoveQuote] read position start", {
          chainId,
          poolName,
          poolAddress: uniswapPoolAddress,
          tokenId: tokenId.toString(),
          blpAmount: blpAmount.toString(),
          totalSupply: totalSupply.toString(),
          removeBps,
        });

        const [position, poolState] = await Promise.all([
          fetchV3Position(client as PublicClient, nfpmAddress, tokenId),
          getPoolState(client as PublicClient, uniswapPoolAddress),
        ]);

        console.log("[V3][RemoveQuote] position loaded", {
          tokenId: tokenId.toString(),
          token0: position.token0,
          token1: position.token1,
          fee: Number(position.fee),
          tickLower: Number(position.tickLower),
          tickUpper: Number(position.tickUpper),
          liquidity: position.liquidity.toString(),
          tokensOwed0: position.tokensOwed0.toString(),
          tokensOwed1: position.tokensOwed1.toString(),
          sqrtPriceX96: poolState.sqrtPriceX96.toString(),
          tickCurrent: Number(poolState.tick),
          poolLiquidity: poolState.liquidity.toString(),
        });

        const poolToken0Addr = position.token0.toLowerCase();
        const poolToken1Addr = position.token1.toLowerCase();
        const b0Addr = (
          bToken0.addresses?.[chainId] as string | undefined
        )?.toLowerCase?.();
        const b1Addr = (
          bToken1.addresses?.[chainId] as string | undefined
        )?.toLowerCase?.();
        if (!b0Addr || !b1Addr) {
          if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
          return;
        }

        let poolBToken0 = bToken0 as any;
        let poolBToken1 = bToken1 as any;
        let amount0IsForBToken0 = true;
        if (poolToken0Addr === b0Addr && poolToken1Addr === b1Addr) {
          poolBToken0 = bToken0;
          poolBToken1 = bToken1;
          amount0IsForBToken0 = true;
        } else if (poolToken0Addr === b1Addr && poolToken1Addr === b0Addr) {
          poolBToken0 = bToken1;
          poolBToken1 = bToken0;
          amount0IsForBToken0 = false;
        } else {
          console.error("[V3] stop panel token mapping failed", {
            poolToken0Addr,
            poolToken1Addr,
            b0Addr,
            b1Addr,
          });
          if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
          return;
        }

        const quote = quoteV3RemoveLiquidity({
          token0: {
            chainId,
            address: position.token0,
            decimals: poolBToken0.decimals ?? 18,
            symbol: poolBToken0.symbol ?? "bToken0",
            name: poolBToken0.name,
          },
          token1: {
            chainId,
            address: position.token1,
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
          position: {
            tokenId,
            tickLower: Number(position.tickLower),
            tickUpper: Number(position.tickUpper),
            liquidity: position.liquidity,
            tokensOwed0: position.tokensOwed0,
            tokensOwed1: position.tokensOwed1,
          },
          removeBps,
          slippageBps: 50,
        });

        const b0Raw = amount0IsForBToken0
          ? quote.removePrincipal.amount0Raw
          : quote.removePrincipal.amount1Raw;
        const b1Raw = amount0IsForBToken0
          ? quote.removePrincipal.amount1Raw
          : quote.removePrincipal.amount0Raw;

        const b0Amount = new BigDecimal(
          formatUnits(BigInt(b0Raw), bToken0.decimals ?? 18),
        );
        const b1Amount = new BigDecimal(
          formatUnits(BigInt(b1Raw), bToken1.decimals ?? 18),
        );

        const [under0, under1] = await Promise.all([
          previewRedeem(client as PublicClient, bToken0, b0Amount),
          previewRedeem(client as PublicClient, bToken1, b1Amount),
        ]);

        if (!cancelled) {
          setReceiveAmount([
            (under0 ?? BigDecimal.ZERO()).roundToDecimals(
              inputToken0?.decimals ?? 18,
            ),
            (under1 ?? BigDecimal.ZERO()).roundToDecimals(
              inputToken1?.decimals ?? 18,
            ),
          ]);
        }

        console.log("[V3][RemoveQuote] receive result", {
          tokenId: tokenId.toString(),
          poolAddress: uniswapPoolAddress,
          removeBps,
          b0Raw,
          b1Raw,
          under0: under0?.toString?.(),
          under1: under1?.toString?.(),
          tokensOwed0: quote.storedOwed.amount0Raw,
          tokensOwed1: quote.storedOwed.amount1Raw,
        });
      } catch (e) {
        console.error("[V3] stop panel quote failed", e);
        if (!cancelled) setReceiveAmount([BigDecimal.ZERO(), BigDecimal.ZERO()]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    amount,
    totalSupply,
    client,
    chainId,
    item.wip_stakeToken.swap.addresses,
    item.wip_stakeToken.swap.tokenId,
    bToken0,
    bToken1,
    inputToken0?.decimals,
    inputToken1?.decimals,
  ]);

  // 실행: 어느 한쪽이라도 ETH 선택 → WRAPPER_PAIR, 아니면 ROUTER_PAIR
  const stopFarming = useCallback(() => {
    if (!address) return;

    const blpDecimals = stakeToken?.decimals ?? 18;
    const blpAmount = parseUnits(
      (amount ?? BigDecimal.ZERO()).toString(),
      blpDecimals
    );

    const route: StopRoute = anyETH ? "WRAPPER_PAIR" : "ROUTER_PAIR";

    performStop({
      route,
      blpAmount,
      onSuccess: () => setAmount(BigDecimal.ZERO()),
    });
  }, [address, amount, anyETH, stakeToken, performStop]);

  const isStoppable = useMemo(
    () =>
      tokenStatus.isApproved &&
      !tokenStatus.isImpermanentInsolvency &&
      !tokenStatus.isInsufficientBalance &&
      !!tokenStatus.amount &&
      tokenStatus.amount.gt(0),
    [tokenStatus]
  );

  const isPending =
    allowanceQuery.isFetching || isPendingWriteContract || isApprovePending;

  // 두 칸 모두 렌더
  const isActive = useMemo<[boolean, boolean]>(() => [true, true], []);

  return {
    // AmountInput
    amount,
    balance,
    isApproved: tokenStatus.isApproved,
    tokenStatus,
    setAmount,
    setMaxAmount,
    isAmountEditable: true,
    isImpermanentInsolvency: tokenStatus.isImpermanentInsolvency,

    // Receive
    isActive,
    receiveAmount,

    // 실행
    stopFarming,
    isStoppable,
    isPending,
    isConnected,
    isWrongNetwork,

    // ETH/WETH 토글
    nativeMode,
    setNativeMode,
    nativeToggleCanShow: [hasWethLike[0], hasWethLike[1]] as [boolean, boolean],
    displayTokens,

    chainId,
    poolBalance0,
    poolBalance1,
    price,
  };
}

export type UsePairStopPanelReturn = ReturnType<typeof usePairStopPanel>;
