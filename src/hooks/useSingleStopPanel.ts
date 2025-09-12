import { useCallback, useMemo, useState, useContext } from "react";
import { parseUnits } from "viem";

import { FarmSingle } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";

import { AssetsContext } from "@/app/AssetsContextProvider";

import useFarmStopPanelCommon, { StopRoute }  from "./useFarmStopPanelCommon";
import { FarmTokenStatus as FarmStopTokenStatus } from "./FarmTokenStatus";
import useBalance from "./useBalance";
import { ADDRESS, } from "@/const/contracts/contractAddresses";
import {  getFromContracts, isZeroAddress, ZERO_ADDRESS } from "@/utils/farm/getAddressHelpers";

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}

type NativeMode = "ETH" | "WETH" | null;

export function useSingleStopPanel(item: FarmSingle) {
  const {
    address,
    isPendingWriteContract,
    isConnected,
    isWrongNetwork,
    chainId,
    routerAddress,
    stakeToken,
    performStop,
    approve,
    allowance,
    allowanceQuery,
  } = useFarmStopPanelCommon(item);

  // BLP 잔액/승인
  const balance = useBalance(stakeToken);
  // 청산 BLP 금액
  const [amount, setAmount] = useState<BigDecimal | null>(null);
  const setMaxAmount = useCallback(() => {
    setAmount(balance ?? BigDecimal.ZERO());
  }, [balance]);
  // 싱글: 받는 토큰
  
  const receiveToken = item?.wip_stakeToken?.input;

  // 체인별 주소
  const ETH_ZERO_ADDRESS: `0x${string}` =
    getFromContracts(ADDRESS.ETH, chainId) ?? ZERO_ADDRESS;
  const WETH_ADDRESS: `0x${string}` | null =
    getFromContracts(ADDRESS.WETH, chainId);

  // 기본 ETH 판정 → Single은 ETH일 때만 슬라이더 노출
  const defaultIsETH =
    receiveToken?.symbol === "ETH" ||
    isZeroAddress((receiveToken as any)?.addresses?.[chainId]);

  // ETH/WETH 토글
  const [nativeMode, setNativeMode] = useState<NativeMode>(
    defaultIsETH ? "ETH" : null
  );

  // 표기용 메타
  const ethDisplayMeta = useMemo(
    () =>
      ({
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        addresses: { [chainId]: ETH_ZERO_ADDRESS },
        iconSrc: "/tokens/eth.svg",
      } as any),
    [chainId, ETH_ZERO_ADDRESS]
  );
  const wethDisplayMeta = useMemo(
    () =>
      ({
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        addresses: { [chainId]: WETH_ADDRESS },
        iconSrc: "/tokens/weth.svg",
      } as any),
    [chainId, WETH_ADDRESS]
  );

  const displayToken = useMemo(() => {
    if (!defaultIsETH) return receiveToken as any;
    return nativeMode === "WETH" ? wethDisplayMeta : ethDisplayMeta;
  }, [defaultIsETH, nativeMode, ethDisplayMeta, wethDisplayMeta, receiveToken]);



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
      isApprovable: isConnected && !allowance.gte(amount || 0),
      approve: () => approve(stakeToken), // 필요 시 교체
    }),
    [stakeToken, balance, amount, allowance, isConnected]
  );

  // 실행: 경로 결정만 여기서 → 공통 performStop 호출
  const stopFarming = useCallback(() => {
    if (!address) return;

    const blpDecimals = stakeToken?.decimals ?? 18;
    const blpAmount = parseUnits(
      (amount ?? BigDecimal.ZERO()).toString(),
      blpDecimals
    );

    const isETHPath = defaultIsETH && nativeMode === "ETH";
    const route: StopRoute = isETHPath ? "WRAPPER_SINGLE" : "ROUTER_SINGLE";

    performStop({
      route,
      blpAmount,
      onSuccess: () => setAmount(BigDecimal.ZERO()),
    });
  }, [
    address,
    amount,
    defaultIsETH,
    nativeMode,
    stakeToken,
    performStop,
  ]);

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
    allowanceQuery.isFetching || isPendingWriteContract || false;

  // Single은 한 칸
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
