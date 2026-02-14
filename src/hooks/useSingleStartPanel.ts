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
import { ADDRESS } from "@/const/contracts/contractAddresses";
import useAccountBalances from "./assets/useAssets/useAccountBalances";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";
import {
  getFromContracts,
  isZeroAddress,
  ZERO_ADDRESS,
} from "@/utils/farm/getAddressHelpers";
import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";

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

  // 단일 입력 토큰 (프로젝트 구조별 안전 접근)
  const baseInput =
    (item as any)?.wip_stakeToken?.swap?.input?.[0]?.input ??
    (item as any)?.wip_stakeToken?.swap?.input?.input ??
    (item as any)?.wip_stakeToken?.input;

  // 주소 상수/참조
  const ETH_ZERO_ADDRESS: `0x${string}` =
    getFromContracts(ADDRESS.ETH, chainId) ?? ZERO_ADDRESS;
  const WETH_ADDRESS: `0x${string}` | null = getFromContracts(
    ADDRESS.WETH,
    chainId
  );

  const WRAPPER_PROVIDER = (stakingProviders as any)?.BIRDIESWAP_Wrapper;
  const ROUTER_PROVIDER = (stakingProviders as any)?.BIRDIESWAP_Router;
  const ROUTER_ADDRESS_FROM_CONTRACTS = getFromContracts(
    ADDRESS.ROUTER,
    chainId
  );
  const ROUTER_PROVIDER_FALLBACK = useMemo(() => {
    // stakingProviders에 Router 메타가 없을 때 대비
    return (
      ROUTER_PROVIDER ?? {
        name: "BIRDIESWAP_Router",
        addresses: {
          [chainId]:
            ROUTER_ADDRESS_FROM_CONTRACTS ?? ROUTER_PROVIDER?.addresses?.[chainId] ?? routerAddress,
        },
      }
    );
  }, [ROUTER_PROVIDER, chainId, ROUTER_ADDRESS_FROM_CONTRACTS, routerAddress]);

  // 기본 spender (provider) 주소
  const ROUTER_ADDRESS: `0x${string}` | null =
    ROUTER_ADDRESS_FROM_CONTRACTS ??
    ROUTER_PROVIDER?.addresses?.[chainId] ??
    ROUTER_PROVIDER_FALLBACK?.addresses?.[chainId]; // NEW: router 주소
  const WRAPPER_ADDRESS: `0x${string}` | null = getFromContracts(
    ADDRESS.WRAPPER,
    chainId
  ); //NEW: wrapper 주소

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

  // 표시용 토큰 메타
  const ethDisplayMeta = externalTokens.ETH;

  const wethDisplayMeta = externalTokens.WETH;

  // ETH/WETH 반영된 표시 토큰
  const displayToken = useMemo(() => {
    if (!defaultIsETH) return baseInput as any;
    return nativeMode === "WETH"
      ? (wethDisplayMeta as any)
      : (ethDisplayMeta as any);
  }, [defaultIsETH, nativeMode, ethDisplayMeta, wethDisplayMeta, baseInput]);

  const isETHDisplay = displayToken?.symbol === "ETH";
  const isWETHDisplay =
    !!WETH_ADDRESS &&
    (displayToken as any)?.addresses?.[chainId]?.toLowerCase?.() ===
      WETH_ADDRESS.toLowerCase?.();

  // 맵에서 주소 기반 잔액 조회
  const getBal = (addr?: `0x${string}` | string | null) => {
    if (!addr) return null;
    const lower = (addr as string).toLowerCase() as `0x${string}`;
    return (
      balanceMap.get(lower) ?? balanceMap.get(addr as `0x${string}`) ?? null
    );
  };

  // 잔액/승인 베이스
  const inputAddress = getTokenAddress({ token: baseInput, chainId });
  const balanceBase = useBalance(baseInput);

  // 표시 잔액: ETH 모드면 네이티브, WETH 모드면 WETH, 일반 ERC20이면 기존 balance
  const displayBalance = defaultIsETH
    ? nativeMode === "WETH"
      ? getBal(WETH_ADDRESS)
      : getBal(ETH_ZERO_ADDRESS)
    : balanceBase;

  const [amount, setAmount] = useState<BigDecimal | null>(null);

  // 부채/리스크 한도(있다면)
  const insolvency = useMemo(() => {
    return getInsolvencyAmount({
      contract: stakeToken,
      token: baseInput,
      chainId,
    });
  }, [stakeToken, baseInput, chainId]);

  const approveTargetToken = useMemo(
    () => (isETHDisplay ? null : (displayToken as any)),
    [isETHDisplay, displayToken]
  );

  const spenderProvider = useMemo(
    () => (isETHDisplay ? WRAPPER_PROVIDER : ROUTER_PROVIDER_FALLBACK),
    [isETHDisplay, WRAPPER_PROVIDER, ROUTER_PROVIDER_FALLBACK]
  );

  // console.log("useSingleStartPanel", spenderProvider, approveTargetToken, isETHDisplay, WRAPPER_PROVIDER, ROUTER_PROVIDER_FALLBACK, ROUTER_ADDRESS, WRAPPER_ADDRESS, routerAddress, displayToken)

  // 훅은 조건부 호출이 불가하므로 항상 호출하되, ETH일 때 결과는 UI에서 무시
  const { allowance, query: allowanceQuery } = useAllowance({
    token: (approveTargetToken ?? wethDisplayMeta) as any, // ETH일 때도 호출 유지를 위해 더미 WETH
    spender: spenderProvider,
  });

  const isApproved = useMemo<boolean>(() => {
    if (isETHDisplay) return true;
    const amt = amount || BigDecimal.ZERO();
    return allowance.gte(amt);
  }, [isETHDisplay, allowance, amount]);

  // Approve 훅 (refetch 추가)
  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress:
      (isETHDisplay
        ? (WRAPPER_ADDRESS as `0x${string}` | undefined)
        : (ROUTER_ADDRESS as `0x${string}`)) ??
      (ROUTER_ADDRESS as `0x${string}`),
    transactionContext,
    refetch: () =>
      Promise.all([allowanceQuery.refetch(), assetsContext.refetchAll?.()]),
    writeContract,
  });

  const [isApprovePending, setIsApprovePending] = useState(false);

  const approveWithPending = useCallback(
    async (token: any) => {
      setIsApprovePending(true);
      try {
        await approve(token); // useApprove가 Promise를 반환하지 않는다면 그대로 호출만 해도 OK
      } finally {
        setIsApprovePending(false); // 성공/실패 모두 off
      }
    },
    [approve]
  );
  // tokenStatus: 싱글 항목
  const tokenStatus: FarmStartTokenStatus = useMemo(
    () => ({
      index: 0 as 0,
      input: displayToken, // ETH/WETH 반영된 메타
      balance: displayBalance as any,
      amount: amount,
      isApproved,
      isActive: true,
      isImpermanentInsolvency:
        insolvency !== undefined && new BigDecimal(insolvency).lt(amount || 0),
      impermanentInsolvency: insolvency,
      isInsufficientBalance: displayBalance?.lt(amount || 0) ?? false,
      isApprovable:
        isConnected && !isApproved && !isETHDisplay && !isApprovePending,
      approve: () => {
        if (isETHDisplay) return;
        return approveWithPending(displayToken as any);
      },
    }),
    [
      displayToken,
      displayBalance,
      amount,
      isApproved,
      insolvency,
      isConnected,
      isETHDisplay,
      isApprovePending,
      approveWithPending,
    ]
  );

  const setMaxAmount = useCallback(() => {
    const maxAmount = BigDecimal.min(displayBalance, insolvency);
    setAmount(maxAmount ?? displayBalance ?? BigDecimal.ZERO());
  }, [displayBalance, insolvency]);

  // ====== Start Farming: WETH(기존) vs ETH(wrapper) 분기 ======
  const startFarming = useCallback(() => {
    if (!address) return;

    const transactionProps: TransactionStatusProps &
      StartFarmingTransactionProps = {
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
          allowanceQuery.refetch(),
          assetsContext.refetchAll(),
        ]);
      },
      afterReceipt: assetsContext.forceRefresh,
    });

    // === (A) ETH 모드: wrapper + payable(value) ===
    if (isETHDisplay) {
      if (!WRAPPER_ADDRESS) {
        console.error(
          "[startFarming] Missing WRAPPER_ADDRESS for chain:",
          chainId
        );
        return;
      }

      // value: ETH (wei)
      const nativeValue = parseUnits(
        (amount ?? BigDecimal.ZERO()).toString(),
        18 // ETH decimals
      );

      // console.log("useSingleStartPanel wrapper nativeValue", nativeValue);

      // writeContract: wrapper 호출 + value 첨부
      writeContract(
        {
          address: WRAPPER_ADDRESS,
          abi: birdieswap_wrapper_abi,
          functionName: "singleDepositWithETH",
          value: nativeValue, //  중요: payable
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

    // console.log("useSingleStartPanel routerAddress", routerAddress, inputAddress, "Amount",parseUnits((amount ?? BigDecimal.ZERO()).toString(), displayToken.decimals), "displayedToken", displayToken.addresses[chainId])
    // === (B) WETH 또는 일반 ERC20: 기존 router 경로 ===
    const tokenAddr = (displayToken as any)?.addresses?.[
      chainId
    ] as `0x${string}`;
    const parsed = parseUnits(
      (amount ?? BigDecimal.ZERO()).toString(),
      (displayToken as any).decimals
    );

    writeContract(
      {
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: birdieswap_router_abi,
        functionName: "singleDeposit", // ← 기존 단일 예시. 실제 함수명과 시그니처에 맞게 조정.
        args: [tokenAddr, parsed] as any,
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
    allowanceQuery,
    assetsContext,
    WRAPPER_ADDRESS,
    isETHDisplay,
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
    allowanceQuery.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING ||
    isApprovePending;

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

    isApprovePending,
  };
}

export type UseSingleStartPanelReturn = ReturnType<typeof useSingleStartPanel>;
