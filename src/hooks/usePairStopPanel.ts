import { useContext, useMemo, useState, useCallback } from "react";

import { FarmPair } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import { AssetsContext } from "@/app/AssetsContextProvider";

import useFarmStopPanelCommon, { StopRoute } from "./useFarmStopPanelCommon";
import { parseUnits, PublicClient } from "viem";
import { FarmTokenStatus as FarmStopTokenStatus } from "./FarmTokenStatus";
import useBalance from "./useBalance";
import { isZeroAddress } from "@/utils/farm/getAddressHelpers";
import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { useFarmCalcOnce } from "./farm/useFarmCalcOnce";
import { useClient } from "wagmi";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

type NativeMode = "ETH" | "WETH" | null;

export function usePairStopPanel(item: FarmPair) {
  const client = useClient();
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

  const unlockAmounts = useMemo(() => {
    const token0 = item.wip_stakeToken.swap.input[0].input;
    const token1 = item.wip_stakeToken.swap.input[1].input;

    const blpAmount = amount ?? BigDecimal.ZERO();
    if (!blpAmount || blpAmount.lte(0)) return [BigDecimal.ZERO(), BigDecimal.ZERO()] as const;
    if (!totalSupply || totalSupply.lte(0)) return [BigDecimal.ZERO(), BigDecimal.ZERO()] as const;

    // Concentrated 기준에서도 BLP는 현재 vault underlying 총량에 대한 지분을 의미한다.
    const share = blpAmount.div(totalSupply).roundToDecimals(36);
    const out0 = poolBalance0
      .mul(share)
      .roundToDecimals(token0.decimals ?? 18);
    const out1 = poolBalance1
      .mul(share)
      .roundToDecimals(token1.decimals ?? 18);

    return [out0, out1] as const;
  }, [
    amount,
    item.wip_stakeToken.swap.input,
    poolBalance0,
    poolBalance1,
    totalSupply,
  ]);

  // 2) 화면 표시용 receiveAmount (토글과 무관)
  const receiveAmount = useMemo<[BigDecimal, BigDecimal]>(() => {
    const [amount0, amount1] = unlockAmounts;

    if (!amount0 || !amount1) {
      return [BigDecimal.ZERO(), BigDecimal.ZERO()];
    } else {
      return [amount0, amount1];
    }
  }, [unlockAmounts]);

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
  }, [address, amount, nativeMode, hasWethLike, stakeToken, performStop]);

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
