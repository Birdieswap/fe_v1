import { useCallback, useState, useMemo } from "react";
import { parseUnits } from "viem";

import { FarmSingle } from "@/types/FarmListTableRowProps";
import { BigDecimal } from "@/types/BigDecimal";
import TransactionStatus from "@/types/TransactionStatus";
import {
  TransactionStatusProps,
  StartFarmingTransactionProps,
} from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import getInsolvencyAmount from "@/utils/assets/getImpermanentInsolvency";

import useFarmPanelCommon from "./useFarmPanelCommon";
import useApprove from "./useApprove";
import { FarmTokenStatus as FarmStartTokenStatus } from "./FarmTokenStatus";
import useBalance from "./useBalance";
import useAllowance from "./useAllowance";
import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { ADDRESS, } from "@/const/contracts/contractAddresses";
import useAccountBalances from "./assets/useAssets/useAccountBalances";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi"; 
import {  getFromContracts, isZeroAddress, ZERO_ADDRESS } from "@/utils/farm/getAddressHelpers";
import tokens from "@/const/contracts/tokens/tokens";

/** ETH/WETH 토글 */
type NativeMode = "ETH" | "WETH" | null;

export function useSingleStartPanel(item: FarmSingle) {
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

  // 🔹 단일 입력 토큰 (프로젝트 구조별 안전 접근)
  const baseInput =
    (item as any)?.wip_stakeToken?.swap?.input?.[0]?.input ??
    (item as any)?.wip_stakeToken?.swap?.input?.input ??
    (item as any)?.wip_stakeToken?.input;

  // 주소 상수/참조
  const ETH_ZERO_ADDRESS: `0x${string}` =
    getFromContracts(ADDRESS.ETH, chainId) ?? ZERO_ADDRESS;
  const WETH_ADDRESS: `0x${string}` | null =
    getFromContracts(ADDRESS.WETH, chainId);
  const WRAPPER_ADDRESS: `0x${string}` | null =
    getFromContracts(ADDRESS.WRAPPER, chainId); // ✅ NEW: wrapper 주소

  // 기본 ETH 판정
    const defaultIsETH =
    baseInput?.symbol === "ETH" ||
    isZeroAddress((baseInput as any)?.addresses?.[chainId]);

  // ETH/WETH 토글 상태
  const [nativeMode, setNativeMode] = useState<NativeMode>(
    defaultIsETH ? "ETH" : null
  );

  // 노출 조건: 기본 토큰이 ETH일 때만
  const nativeToggleCanShow = defaultIsETH;

  // 잔액/승인 베이스
  const inputAddress = getTokenAddress({ token: baseInput, chainId });
  const balanceBase = useBalance(baseInput);
  const { allowance: allowanceBase, query: allowanceQueryBase } = useAllowance({
    token: baseInput,
    spender: stakeToken.provider,
  });

  const [amount, setAmount] = useState<BigDecimal | null>(null);

  // 부채/리스크 한도(있다면)
  const insolvency = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: baseInput,
      chainId,
    });
  }, [stakeToken, baseInput, chainId]);

  // 표시용 토큰 메타
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

  const wethDisplayMeta = tokens.WETH;
  // const wethDisplayMeta = useMemo(
  //   () =>
  //     ({
  //       symbol: "WETH",
  //       name: "Wrapped Ether",
  //       decimals: 18,
  //       addresses: { [chainId]: WETH_ADDRESS },
  //       iconSrc: "/tokens/weth.svg",
  //     } as any),
  //   [chainId, WETH_ADDRESS]
  // );

  // ETH/WETH 반영된 표시 토큰
  const displayToken = useMemo(() => {
    if (!defaultIsETH) return baseInput as any;
    return nativeMode === "WETH" ? (wethDisplayMeta as any) : (ethDisplayMeta as any);
  }, [defaultIsETH, nativeMode, ethDisplayMeta, wethDisplayMeta, baseInput]);

  // 맵에서 주소 기반 잔액 조회
  const getBal = (addr?: `0x${string}` | string | null) => {
    if (!addr) return null;
    const lower = (addr as string).toLowerCase() as `0x${string}`;
    return balanceMap.get(lower) ?? balanceMap.get(addr as `0x${string}`) ?? null;
  };

  // 표시 잔액: ETH 모드면 네이티브, WETH 모드면 WETH, 일반 ERC20이면 기존 balance
  const displayBalance = defaultIsETH
    ? nativeMode === "WETH"
      ? getBal(WETH_ADDRESS)
      : getBal(ETH_ZERO_ADDRESS)
    : balanceBase;

  //  승인: ETH=true(자물쇠 숨김), WETH=WETH allowance, ERC20=기존 allowance
  const { allowance: allowanceWETH, query: allowanceQueryWETH } = useAllowance({
    token: wethDisplayMeta as any,
    spender: stakeToken.provider,
  });

  const isApproved = useMemo<boolean>(() => {
    const amt = amount || BigDecimal.ZERO();
    if (defaultIsETH) {
      return nativeMode === "ETH" ? true : allowanceWETH.gte(amt);
    }
    return allowanceBase.gte(amt);
  }, [defaultIsETH, nativeMode, allowanceBase, allowanceWETH, amount]);

  // Approve 훅 (refetch 추가)
  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: routerAddress as `0x${string}`,
    transactionContext,
    refetch: () =>
      Promise.all([
        allowanceQueryBase.refetch(),
        allowanceQueryWETH.refetch(),
        assetsContext.refetchAll?.(),
      ]),
    writeContract,
  });

  // tokenStatus: 싱글 항목
  const tokenStatus: FarmStartTokenStatus = useMemo(
    () => ({
      index: 0 as 0,
      input: displayToken,         // ✅ ETH/WETH 반영된 메타
      balance: displayBalance as any,
      amount: amount,
      isApproved,
      isActive: true,
      isImpermanentInsolvency:
        insolvency !== undefined && new BigDecimal(insolvency).lt(amount || 0),
      impermanentInsolvency: insolvency,
      isInsufficientBalance: displayBalance?.lt(amount || 0) ?? false,
      isApprovable: isConnected && !isApproved,
      approve: () => approve(displayToken as any),
    }),
    [
      displayToken,
      displayBalance,
      amount,
      isApproved,
      insolvency,
      isConnected,
      approve,
    ]
  );

  const setMaxAmount = useCallback(() => {
    const maxAmount = BigDecimal.min(displayBalance, insolvency);
    setAmount(maxAmount ?? displayBalance ?? BigDecimal.ZERO());
  }, [displayBalance, insolvency]);

  // ====== Start Farming: WETH(기존) vs ETH(wrapper) 분기 ======
  const startFarming = useCallback(() => {
    if (!address) return;

    const transactionProps: TransactionStatusProps & StartFarmingTransactionProps = {
      chainId,
      transactionType: TransactionType.START_FARMING,
      input: [{ token: displayToken as any, amount: amount ?? undefined }],
      output: { token: stakeToken },
      address,
    };

    const handlers = getWriteTransactionHandlers({
      client,
      transactionContext,
      transactionProps,
      refetch: async () => {
        await Promise.all([
          allowanceQueryBase.refetch(),
          allowanceQueryWETH.refetch(),
          assetsContext.refetchAll(),
        ]);
      },
    });

    // === (A) ETH 모드: wrapper + payable(value) ===
    if (defaultIsETH && nativeMode === "ETH") {
      if (!WRAPPER_ADDRESS) {
        console.error("[startFarming] Missing WRAPPER_ADDRESS for chain:", chainId);
        return;
      }

      // value: ETH (wei)
      const nativeValue = parseUnits(
        (amount ?? BigDecimal.ZERO()).toString(),
        18 // ETH decimals
      );

      // ⚠️ 함수 시그니처는 프로젝트마다 다름 — 실제 ABI 확인하여 "args" 한 줄만 선택하세요.
      // 1) 예시 A: singleDepositWithETH(address stakingToken)
      // const args: any[] = [stakeTokenAddress];

      // 2) 예시 B: singleDepositWithETH(address stakingToken, address receiver)
      // const args: any[] = [stakeTokenAddress, address];

      // 3) 예시 C: singleDepositWithETH(address stakingToken, uint256 minShares)
      // const args: any[] = [stakeTokenAddress, 0n];

  
      console.log("useSingleStartPanel wrapper nativeValue", nativeValue);

      // writeContract: wrapper 호출 + value 첨부
      writeContract(
        {
          address: WRAPPER_ADDRESS,
          abi: birdieswap_wrapper_abi,
          functionName: "singleDepositWithETH",
          value: nativeValue, // ✅ 중요: payable
        },
        {
          onError: handlers.onError,
          onSuccess: async (v) => {
            handlers.onSuccess(v);
            setAmount(BigDecimal.ZERO());
            try {
              await assetsContext.forceRefresh?.();
            } catch (e) {
              console.error("forceRefresh failed", e);
            }
          },
        }
      );
      return;
    }

    console.log("useSingleStartPanel routerAddress", routerAddress, inputAddress, "Amount",parseUnits((amount ?? BigDecimal.ZERO()).toString(), displayToken.decimals), "displayedToken", displayToken.addresses[chainId])
    // === (B) WETH 또는 일반 ERC20: 기존 router 경로 ===
    writeContract(
      {
        address: routerAddress as `0x${string}`,
        abi: birdieswap_router_abi,
        functionName: "singleDeposit", // ← 기존 단일 예시. 실제 함수명과 시그니처에 맞게 조정.
        args: [
          displayToken.addresses[chainId] as `0x${string}`,
          parseUnits((amount ?? BigDecimal.ZERO()).toString(), displayToken.decimals),
        ] as any,
      },
      {
        onError: handlers.onError,
        onSuccess: async (v) => {
          handlers.onSuccess(v);
          setAmount(BigDecimal.ZERO());
          try {
            await assetsContext.forceRefresh?.();
          } catch (e) {
            console.error("forceRefresh failed", e);
          }
        },
      }
    );
  }, [
    address,
    chainId,
    displayToken,
    amount,
    stakeToken,
    client,
    transactionContext,
    writeContract,
    routerAddress,
    allowanceQueryBase,
    allowanceQueryWETH,
    assetsContext,
    nativeMode,
    defaultIsETH,
    WRAPPER_ADDRESS,
    inputAddress,
    stakeTokenAddress,
  ]);

  const isStartable = useMemo(
    () =>
      tokenStatus.isApproved &&
      !tokenStatus.isImpermanentInsolvency &&
      !tokenStatus.isInsufficientBalance &&
      !!tokenStatus.amount &&
      tokenStatus.amount.gt(0),
    [tokenStatus]
  );

  const isPending =
    allowanceQueryBase.isFetching ||
    allowanceQueryWETH.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING;

  return {
    // === 기존 API 유지 ===
    tokenStatus,
    setAmount,
    setMaxAmount,
    startFarming,
    isStartable,
    approve,
    isPending,
    isConnected,
    isWrongNetwork,

    // === ETH/WETH 토글 제공 ===
    nativeMode,
    setNativeMode,
    nativeToggleCanShow,
  };
}

export type UseSingleStartPanelReturn = ReturnType<typeof useSingleStartPanel>;
