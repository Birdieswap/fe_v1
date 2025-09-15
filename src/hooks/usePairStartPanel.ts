import { useCallback, useMemo, useState, useContext, useEffect, useRef } from "react";
import { parseUnits, PublicClient } from "viem";

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
import useFarmLPBalances from "./useFarmLPBalances";
import useBalance from "./useBalance";
import useAllowance from "./useAllowance";
import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import previewRedeem from "@/utils/farm/previewRedeem";
import { ADDRESS, contractAddresses } from "@/const/contracts/contractAddresses";
import useAccountBalances from "./assets/useAssets/useAccountBalances";
import { getFromContracts, isZeroAddress, ZERO_ADDRESS } from "@/utils/farm/getAddressHelpers";
import tokens from "@/const/contracts/tokens/tokens";

type NativeMode = 'ETH' | 'WETH' | null;

export enum InvalidStatuses {
  AMOUNT = "AMOUNT",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  IMPERMANENT_INSOLVENCY = "IMPERMANENT_INSOLVENCY",
}
export function usePairStartPanel(item: FarmPair) {
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

  // [ADDED] balances -> plain Map으로 정리 (useMemo 내부에서 훅 호출 금지)
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

// === addresses 안전 조회 (ETH 등 addresses 없는 토큰도 안전)
// [ADDED] === ETH/WETH 토글/주소/표시용 상수 ===
const ETH_ZERO_ADDRESS: `0x${string}` = getFromContracts(ADDRESS.ETH, chainId) ?? ZERO_ADDRESS;
const WETH_ADDRESS: `0x${string}` | null = getFromContracts(ADDRESS.WETH, chainId);
const WRAPPER_ADDRESS: `0x${string}` | null = getFromContracts(ADDRESS.WRAPPER, chainId);

// 기본 토큰이 ETH인지 판정: symbol === 'ETH' 또는 0x000... 주소 컨벤션
const defaultIsETH: [boolean, boolean] = [
  inputToken0?.symbol === "ETH" || isZeroAddress((inputToken0 as any)?.addresses?.[chainId]),
  inputToken1?.symbol === "ETH" || isZeroAddress((inputToken1 as any)?.addresses?.[chainId]),
];
// [ADDED] 슬라이더 선택 상태 (기본이 ETH면 'ETH')
const [nativeMode, setNativeMode] = useState<[NativeMode, NativeMode]>([
  defaultIsETH[0] ? "ETH" : null,
  defaultIsETH[1] ? "ETH" : null,
]);

// [ADDED] 노출 조건: 기본이 ETH일 때만
const nativeToggleCanShow: [boolean, boolean] = [defaultIsETH[0], defaultIsETH[1]];

// [ADDED] 표시용 토큰/잔액/승인

  const inputToken0Address = getTokenAddress({
           token: inputToken0,
           chainId,
         });
  const inputToken1Address = getTokenAddress({
           token: inputToken1,
           chainId,
         });

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

  const { allowance: allowance0, query: allowanceQuery0 } = useAllowance({
    token: inputToken0,
    spender: stakeToken.provider,
  });
  const { allowance: allowance1, query: allowanceQuery1 } = useAllowance({
    token: inputToken1,
    spender: stakeToken.provider,
  });

  const [amounts, setAmounts] = useState<
    [BigDecimal | null, BigDecimal | null]
  >([null, null]);

  const { assetValues } = useContext(AssetsContext);
  const { poolBalance0, poolBalance1 } = useFarmLPBalances(item, assetValues);

  const [isActive, _setIsActive] = useState<[boolean, boolean]>([true, true]);

  const [underlyingBalance0, setUnderlyingBalance0] = useState<BigDecimal | null>(null);
  const [underlyingBalance1, setUnderlyingBalance1] = useState<BigDecimal | null>(null);

  // [추가] poolBalance0/1, client, bToken0/1 변경 시 previewRedeem 호출
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 필수 의존성 가드
        if (!client) return;

        // poolBalance가 BigDecimal이라고 가정. null/undefined 가드
        if (!poolBalance0 || !poolBalance1) return;

        const [u0, u1] = await Promise.all([
          previewRedeem(client as PublicClient, bToken0, poolBalance0),
          previewRedeem(client as PublicClient, bToken1, poolBalance1),
        ]);

        if (!cancelled) {
          // 실패/undefined/null 시 0으로 폴백 (계산부 안전을 위해)
          setUnderlyingBalance0(u0 ?? BigDecimal.ZERO());
          setUnderlyingBalance1(u1 ?? BigDecimal.ZERO());
        }
      } catch {
        if (!cancelled) {
          setUnderlyingBalance0(BigDecimal.ZERO());
          setUnderlyingBalance1(BigDecimal.ZERO());
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [client, bToken0, bToken1, poolBalance0, poolBalance1]);

  const ethDisplayMeta = tokens.ETH
  // const ethDisplayMeta = useMemo(() => ({
  //   symbol: "ETH",
  //   name: "Ether",
  //   decimals: 18,
  //   addresses: { [chainId]: ETH_ZERO_ADDRESS },
  //   iconSrc: "/tokens/eth.svg",
  // } as any), [chainId, ETH_ZERO_ADDRESS]);

   const wethDisplayMeta = tokens.WETH;
  // const wethDisplayMeta = useMemo(() => ({
  //   symbol: "WETH",
  //   name: "Wrapped Ether",
  //   decimals: 18,
  //   addresses: { [chainId]: WETH_ADDRESS },
  //   iconSrc: "/tokens/weth.svg",
  // } as any), [chainId, WETH_ADDRESS]);

  const displayTokens = useMemo(() => {
    const mode0 = (nativeMode?.[0] ?? (defaultIsETH[0] ? "ETH" : null)) as "ETH" | "WETH" | null;
    const mode1 = (nativeMode?.[1] ?? (defaultIsETH[1] ? "ETH" : null)) as "ETH" | "WETH" | null;

    return [
      defaultIsETH[0] ? (mode0 === "WETH" ? wethDisplayMeta : ethDisplayMeta) : (inputToken0 as any),
      defaultIsETH[1] ? (mode1 === "WETH" ? wethDisplayMeta : ethDisplayMeta) : (inputToken1 as any),
    ] as const;
  }, [defaultIsETH[0], defaultIsETH[1], nativeMode, wethDisplayMeta, ethDisplayMeta, inputToken0, inputToken1]);

  // (선택) 표시용 잔액(네이티브/WETH)
  const getBal = (addr?: `0x${string}` | string | null) => {
    if (!addr) return null;
    const lower = (addr as string).toLowerCase() as `0x${string}`;
    return balanceMap.get(lower) ?? balanceMap.get(addr as `0x${string}`) ?? null;
  };

  const displayBalances: [any, any] = [
    defaultIsETH[0] ? (nativeMode?.[0] === "WETH" ? getBal(WETH_ADDRESS) : getBal(ETH_ZERO_ADDRESS)) : balance0,
    defaultIsETH[1] ? (nativeMode?.[1] === "WETH" ? getBal(WETH_ADDRESS) : getBal(ETH_ZERO_ADDRESS)) : balance1,
  ];

    // ====== WETH allowance (ETH 모드에선 사용 X, WETH 모드에서 사용) ======
  const { allowance: allowanceWETH, query: allowanceQueryWETH } = useAllowance({
    token: wethDisplayMeta as any,
    spender: stakeToken.provider,
  });

  // ====== 승인 상태 (ETH=항상 true, WETH=WETH allowance) ======
  const isApproved = useMemo<[boolean, boolean]>(() => {
    const amt0 = amounts[0] || BigDecimal.ZERO();
    const amt1 = amounts[1] || BigDecimal.ZERO();
    const mode0 = nativeMode?.[0];
    const mode1 = nativeMode?.[1];

    const approved0 =
      defaultIsETH[0]
        ? (mode0 === "ETH" ? true : allowanceWETH.gte(amt0))
        : allowance0.gte(amt0);

    const approved1 =
      defaultIsETH[1]
        ? (mode1 === "ETH" ? true : allowanceWETH.gte(amt1))
        : allowance1.gte(amt1);

    return [approved0, approved1];
  }, [amounts, nativeMode, defaultIsETH, allowance0, allowance1, allowanceWETH]);

  const displayApproved: [boolean, boolean] = useMemo(() => {
    const a0 = defaultIsETH[0] && nativeMode?.[0] === "ETH" ? true : isApproved[0];
    const a1 = defaultIsETH[1] && nativeMode?.[1] === "ETH" ? true : isApproved[1];
    return [a0, a1];
  }, [defaultIsETH, nativeMode, isApproved]);

  const isInsufficientBalance: [boolean, boolean] = useMemo(() => {
    return [balance0.lt(amounts[0] || 0), balance1.lt(amounts[1] || 0)];
  }, [amounts, balance0, balance1]);

  const isImpermanentInsolvency: [boolean, boolean] = useMemo(() => {
    return [
      insolvency0 !== undefined && new BigDecimal(insolvency0).lt(amounts[0] || 0),
      insolvency1 !== undefined && new BigDecimal(insolvency1).lt(amounts[1] || 0),
    ];
  }, [insolvency0, amounts, insolvency1]);

  const getOtherAmount = useCallback(
    (value: BigDecimal, index: 0 | 1) => {
      const otherToken = index === 0 ? inputToken1 : inputToken0;

      // null 가드 및 폴백
      const thisUnderlying = (index === 0 ? underlyingBalance0 : underlyingBalance1) ?? BigDecimal.ZERO();
      const otherUnderlying = (index === 0 ? underlyingBalance1 : underlyingBalance0) ?? BigDecimal.ZERO();

      if (thisUnderlying.eq(0)) {
        return BigDecimal.ZERO();
      }
      console.log("getOtherAmount", { "bToken0": bToken0, "bToken1": bToken1, "inputToken0": inputToken0, "inputToken1": inputToken1, "balance0": balance0, "balance1": balance1, "poolBalance0.value": poolBalance0.value, "poolBalance1.value": poolBalance1.value, "value": value, "thisUnderlying": thisUnderlying, "otherUnderlying": otherUnderlying });
      return value
        .mul(otherUnderlying)
        .div(thisUnderlying)
        .roundToDecimals(otherToken.decimals ?? 18);
    },
    [inputToken0, inputToken1, underlyingBalance0, underlyingBalance1],
  );

  const getMaxAmount = useCallback(() => {
    const maxAmount = [
      BigDecimal.min(balance0, insolvency0),
      BigDecimal.min(balance1, insolvency1),
    ];
    const maxSwappedAmount = [
      getOtherAmount(maxAmount[1], 1),
      getOtherAmount(maxAmount[0], 0),
    ];

    if (!isActive[0]) {
      return [null, maxAmount[1]] as [BigDecimal | null, BigDecimal | null];
    } else if (!isActive[1]) {
      return [maxAmount[1], null] as [BigDecimal | null, BigDecimal | null];
    } else if (maxSwappedAmount[1].lt(maxAmount[1])) {
      return [maxAmount[0], maxSwappedAmount[1]] as [
        BigDecimal | null,
        BigDecimal | null,
      ];
    } else {
      return [maxSwappedAmount[0], maxAmount[1]] as [
        BigDecimal | null,
        BigDecimal | null,
      ];
    }
  }, [balance0, insolvency0, balance1, insolvency1, getOtherAmount, isActive]);

  const setMaxAmount = useCallback(() => {
    setAmounts(getMaxAmount());
  }, [getMaxAmount, setAmounts]);

  const setIsActive = useCallback(
    (state: [boolean, boolean]) => {
      _setIsActive((v) => {
        if (!state[0]) {
          setAmounts([null, amounts[1]]);
        } else if (!state[1]) {
          setAmounts([amounts[0], null]);
        } else {
          if (!v[0]) {
            const otherAmount = getOtherAmount(
              amounts[1] || BigDecimal.ZERO(),
              1,
            );

            setAmounts([otherAmount, amounts[1]]);
          } else if (!v[1]) {
            const otherAmount = getOtherAmount(
              amounts[0] || BigDecimal.ZERO(),
              0,
            );

            setAmounts([amounts[0], otherAmount]);
          }
        }

        return state;
      });
    },
    [_setIsActive, amounts, setAmounts, getOtherAmount],
  );

  const setAmountBase = useCallback(
  (value: BigDecimal | null, index: 0 | 1) => {
    setAmounts((prev) => {
      if (isActive.every(Boolean)) {
        //  양쪽 활성: 지금은 '입력한 쪽'만 즉시 반영, 반대편은 유지
        return [
          index === 0 ? value : prev[0],
          index === 1 ? value : prev[1],
        ];
      } else {
        //  한쪽만 활성: 반대편은 항상 null (비활성 인풋은 비워둠)
        return [
          index === 0 ? value : null,
          index === 1 ? value : null,
        ];
      }
    });
  },
  [isActive],
);

  const isZeroish = (v: any) => {
  if (v == null) return true;
  const n =
    typeof v?.toNumber === "function" ? v.toNumber() :
    typeof v?.toString === "function" ? Number(v.toString()) :
    Number(v);
  return !Number.isFinite(n) || n === 0;
};

const amountsRef = useRef(amounts);
const displayTokensRef = useRef(displayTokens);
useEffect(() => { amountsRef.current = amounts; }, [amounts]);
useEffect(() => { displayTokensRef.current = displayTokens; }, [displayTokens]);

// [ADDED] 디바운스 상태/타이머
const DEBOUNCE_MS = 750;
const lastTypedIndexRef = useRef<0 | 1 | null>(null);
const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// [ADDED] 새 setAmount (디바운스 + 지우면 즉시 반대편 클리어)
const setAmount = (value: BigDecimal | null, index: 0 | 1) => {
  // 1) 입력값은 "즉시" 반영 (사용감)
  setAmountBase(value as BigDecimal, index);

  // 2) 최근 입력 인덱스 기록
  lastTypedIndexRef.current = index;

  // 3) 지우기(빈/0)면 반대편도 즉시 0으로 + 타이머 클리어
  if (isZeroish(value)) {
    const other = (index === 0 ? 1 : 0) as 0 | 1;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setAmountBase(BigDecimal.ZERO(), other);
    return;
  }

  // 4) 연속 입력 →  디바운스 후에만 반대편 계산
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

    const next = getOtherAmount(srcAmount as BigDecimal, i)
      ?.roundToDecimals(tokens?.[other]?.decimals ?? 8) ?? null;

    const cur = amountsRef.current?.[other] ?? null;
    const curN = cur ? Number(cur?.toString?.() ?? cur) : null;
    const nextN = next ? Number(next?.toString?.() ?? next) : null;

    // 동일하면 스킵(불필요 렌더/깜빡임 방지)
    if (curN !== nextN) {
      setAmountBase(next, other);
    }
  }, DEBOUNCE_MS);
};

// [ADDED] unmount 시 타이머 정리
useEffect(() => {
  return () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };
}, []);

const approve = useApprove({
  client,
  pool: stakeToken,
  poolAddress: stakeTokenAddress as `0x${string}`,
  routerAddress: routerAddress as `0x${string}`,
  transactionContext,
  refetch: () =>
    Promise.all([
      allowanceQuery0.refetch(), 
      allowanceQuery1.refetch(),
      allowanceQueryWETH.refetch(),
      assetsContext.refetchAll(),
    ]),
  writeContract,
});

const tokenStatuses = useMemo(
    () =>
      [0, 1].map((i) => {
        const input = displayTokens[i] as any; // ETH/WETH 반영된 토큰
        return {
          index: i,
          input,
          balance: i === 0 ? balance0 : balance1,
          amount: amounts[i],
          isApproved: isApproved[i],
          isActive: isActive[i],
          isImpermanentInsolvency:
            i === 0
              ? (insolvency0 !== undefined && new BigDecimal(insolvency0).lt(amounts[0] || 0))
              : (insolvency1 !== undefined && new BigDecimal(insolvency1).lt(amounts[1] || 0)),
          impermanentInsolvency: i === 0 ? insolvency0 : insolvency1,
          isInsufficientBalance: i === 0 ? balance0.lt(amounts[0] || 0) : balance1.lt(amounts[1] || 0),
          isApprovable: isConnected && !isApproved[i],
          approve: () => approve(input), // ETH 모드라면 버튼이 안 보이므로 호출되지 않음
        } as FarmStartTokenStatus;
      }) as [FarmStartTokenStatus, FarmStartTokenStatus],
  [displayTokens, balance0, balance1, amounts, isApproved, isActive, insolvency0, insolvency1, isConnected, approve]);

  // ====== Start Farming: 선택 결과에 따른 실제 주소 매핑 ======
  const effectiveAddr = (i: 0 | 1): `0x${string}` => {
    const mode = nativeMode?.[i];
    const isDefETH = defaultIsETH[i];
    if (isDefETH) {
      if (mode === "ETH") return ETH_ZERO_ADDRESS;                            // 네이티브
      if (mode === "WETH") return (WETH_ADDRESS ?? ETH_ZERO_ADDRESS);         // WETH
    }
    // 일반 ERC20
    return (i === 0 ? inputToken0Address : inputToken1Address) as `0x${string}`;
  };

// [ADDED] --- 최신 값 ref로 보관 (state 참조 없이 내부 계산에 사용) ---
const poolBalance0Ref = useRef(poolBalance0);
const poolBalance1Ref = useRef(poolBalance1);
const tokenStatusesRef = useRef(tokenStatuses);

useEffect(() => { poolBalance0Ref.current = poolBalance0; }, [poolBalance0]);
useEffect(() => { poolBalance1Ref.current = poolBalance1; }, [poolBalance1]);
useEffect(() => { tokenStatusesRef.current = tokenStatuses; }, [tokenStatuses]);


  const startFarming = useCallback(() => {
    if (!address) return;
    const transactionProps: TransactionStatusProps &
      StartFarmingTransactionProps = {
      chainId,
      transactionType: TransactionType.START_FARMING,
      input: tokenStatuses
        .map((v) => ({
          token: v.input,
          amount: v.amount ?? undefined,
        }))
        .filter((v) => !!v.token),
      output: {
        token: stakeToken,
      },
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
          allowanceQueryWETH.refetch(),
          assetsContext.refetchAll(),
        ]);
      },
    });

    // 한쪽이라도 네이티브 ETH인가?
    const side0IsNativeETH = defaultIsETH[0] && nativeMode?.[0] === "ETH";
    const side1IsNativeETH = defaultIsETH[1] && nativeMode?.[1] === "ETH";

    // === (A) 한쪽이라도 ETH면: wrapper.dualDepositWithETH(payable) ===
    if (side0IsNativeETH || side1IsNativeETH) {
      if (!WRAPPER_ADDRESS) {
        console.error("[startFarming] Missing WRAPPER_ADDRESS for chain:", chainId);
        return;
      }

      const ethIndex: 0 | 1 = side0IsNativeETH ? 0 : 1;
      const otherIndex: 0 | 1 = side0IsNativeETH ? 1 : 0;

      // ETH value
      const ethAmountBD = tokenStatuses[ethIndex].amount ?? BigDecimal.ZERO();
      const ethValue = parseUnits(ethAmountBD.toFixed(18), 18);
      
      // other token address (WETH 모드면 WETH, 그 외엔 ERC20 원주소)
      let otherTokenAddress: `0x${string}` = effectiveAddr(otherIndex);
      if (defaultIsETH[otherIndex] && nativeMode?.[otherIndex] === "WETH") {
        otherTokenAddress = (WETH_ADDRESS ?? ETH_ZERO_ADDRESS) as `0x${string}`;
      }

      // other token amount (해당 토큰 decimals)
      const otherDecimals =
        (displayTokens?.[otherIndex]?.decimals ??
         (otherIndex === 0 ? inputToken0?.decimals : inputToken1?.decimals) ??
         18);
      const otherAmountBD = tokenStatuses[otherIndex].amount ?? BigDecimal.ZERO();
      const otherAmount = parseUnits(otherAmountBD.toString(), otherDecimals);

      console.log("usePairStartPanel wrapperDualDepositWithETH", tokenStatuses[ethIndex].amount,ethAmountBD, ethValue, otherAmountBD, otherAmount);
      // wrapper 호출
      writeContract(
        {
          address: WRAPPER_ADDRESS,
          abi: birdieswap_wrapper_abi,
          functionName: "dualDepositWithETH",
          args: [otherTokenAddress, otherAmount],
          value: ethValue, // payable
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

    // === (B) 둘 다 ETH가 아닌 경우: 기존 router.dualDeposit ===
    console.log("usePairStartPanel routerPairDepositCall", inputToken0Address,parseUnits(
            tokenStatuses[0].amount?.toString() || "0",
            tokenStatuses[0].input.decimals,
          ),inputToken1Address,parseUnits(
            tokenStatuses[1].amount?.toString() || "0",
            tokenStatuses[1].input.decimals,
          ),displayTokens,displayTokens[0].addresses[chainId],displayTokens[1].addresses[chainId]);

    writeContract(
      {
        address: routerAddress as `0x${string}`,
        abi: birdieswap_router_abi,
        functionName: "dualDeposit",
        args: [
          displayTokens[0].addresses[chainId] as `0x${string}`,
          parseUnits(
            tokenStatuses[0].amount?.toString() || "0",
            tokenStatuses[0].input.decimals,
          ),
          displayTokens[1].addresses[chainId] as `0x${string}`,
          parseUnits(
            tokenStatuses[1].amount?.toString() || "0",
            tokenStatuses[1].input.decimals,
          ),
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
    defaultIsETH,
    nativeMode,
    stakeToken,
    routerAddress,
    address,
    client,
    transactionContext,
    writeContract,
    stakeTokenAddress,
    allowanceQuery0,
    allowanceQuery1,
    allowanceQueryWETH,
    assetsContext,
    WETH_ADDRESS,
    WRAPPER_ADDRESS,
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
    allowanceQueryWETH.isFetching ||
    isPendingWriteContract ||
    transactionContext.transactionProps?.transactionStatus ===
      TransactionStatus.PENDING;

  return {
    setAmount,
    setMaxAmount,
    isActive,
    setIsActive,
    tokenStatuses,
    isStartable,
    approve,
    startFarming,
    isPending,
    isConnected,
    isWrongNetwork,
    chainId,
    poolBalance0,
    poolBalance1,
    nativeMode,
    setNativeMode,
    nativeToggleCanShow: [
    displayTokens[0]?.symbol === "ETH",
    displayTokens[1]?.symbol === "ETH",
  ] as [boolean, boolean],
    displayTokens,
    displayBalances,
    displayApproved,
  };
}

export type UsePairStartPanelReturn = ReturnType<typeof usePairStartPanel>;
