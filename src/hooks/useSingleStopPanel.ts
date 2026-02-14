import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";

import { FarmSingle } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";

import useFarmStopPanelCommon, { StopRoute } from "./useFarmStopPanelCommon";
import { FarmTokenStatus as FarmStopTokenStatus } from "./FarmTokenStatus";
import useBalance from "./useBalance";

import { isZeroAddress } from "@/utils/farm/getAddressHelpers";
import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

type NativeMode = "ETH" | "WETH" | null;

export function useSingleStopPanel(item: FarmSingle) {
  const receiveToken = item?.wip_stakeToken?.input;

  // 기본 ETH 여부(체인 의존 X: 심볼 우선)
  const defaultIsETH = receiveToken?.symbol === "ETH";

  // ETH/WETH 토글 (기본: ETH면 ETH)
  const [nativeMode, setNativeMode] = useState<NativeMode>(
    defaultIsETH ? "ETH" : null
  );

  // 표기용 메타
  const ethDisplayMeta = externalTokens.ETH;
  const wethDisplayMeta = externalTokens.WETH;

  // displayToken: 기본이 ETH일 때만 토글 적용
  const displayToken = useMemo(() => {
    if (!defaultIsETH) return receiveToken as any;
    return nativeMode === "WETH"
      ? (wethDisplayMeta as any)
      : (ethDisplayMeta as any);
  }, [defaultIsETH, nativeMode, ethDisplayMeta, wethDisplayMeta, receiveToken]);

  // 경로 판정: displayToken으로 ETH 경로 여부 (주소가 없거나 0x00.. 이면 ETH로 취급)
  const isETHPath =
    (displayToken as any)?.symbol === "ETH" ||
    isZeroAddress(
      (displayToken as any)?.addresses?.[
        /* chainId will be checked in common */ ""
      ] as any
    );

  // 공통 훅 호출: ETH 경로면 Wrapper, 아니면 Router로 승인/allowance 스펜더 지정
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
    stopSpenderProvider: isETHPath
      ? (stakingProviders as any).BIRDIESWAP_Wrapper
      : (stakingProviders as any).BIRDIESWAP_Router,
  });

  // BLP 잔액/승인
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

  // 실행: 경로 결정만 여기서 → 공통 performStop 호출
  const stopFarming = useCallback(() => {
    if (!address) return;

    const blpDecimals = stakeToken?.decimals ?? 18;
    const blpAmount = parseUnits(
      (amount ?? BigDecimal.ZERO()).toString(),
      blpDecimals
    );

    const route: StopRoute = isETHPath ? "WRAPPER_SINGLE" : "ROUTER_SINGLE";

    performStop({
      route,
      blpAmount,
      onSuccess: () => setAmount(BigDecimal.ZERO()),
    });
  }, [address, amount, isETHPath, stakeToken, performStop]);

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

  const isActive = useMemo<[boolean]>(() => [true], []);

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

    // Receive 표시
    displayToken,

    // 실행
    stopFarming,
    isStoppable,
    isPending,
    isConnected,
    isWrongNetwork,

    // ETH/WETH 토글 UI
    nativeMode,
    setNativeMode,
    nativeToggleCanShow: defaultIsETH, //
  };
}

export type UseSingleStopPanelReturn = ReturnType<typeof useSingleStopPanel>;
