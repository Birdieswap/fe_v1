import { useCallback, useMemo } from "react";
import {
  StopFarmingTransactionProps,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { FarmPair, FarmSingle, Farm } from "@/types/FarmListTableRowProps";
import { TransactionType } from "@/types/TransactionTypes";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";

import useFarmPanelCommon from "./useFarmPanelCommon";

import { birdieswap_router_abi } from "@/const/contracts/abis/birdieswap_router_abi";

import { ADDRESS } from "@/const/contracts/contractAddresses";
import { birdieswap_wrapper_abi } from "@/const/contracts/abis/birdieswap_wrapper_abi";

import useAllowance from "./useAllowance";
import useApprove from "./useApprove";
import { getFromContracts } from "@/utils/farm/getAddressHelpers";
import stakingProviders from "@/const/contracts/tokens/stakingProviders";
import { BigDecimal } from "@/types/BigDecimal";
import { formatUnits } from "viem";
import tokens from "@/const/contracts/tokens/tokens";

type AnyFarm = FarmPair | FarmSingle;

/** 단일/페어 공통 stop 실행 라우트 */
export type StopRoute =
  | "ROUTER_SINGLE"
  | "WRAPPER_SINGLE"
  | "ROUTER_PAIR"
  | "WRAPPER_PAIR";

// [NEW] override 타입: 슬라이더에 따라 spender(Provider)와 주소를 주입
type StopSpenderOverride = {
  stopSpenderProvider?: any; // stakingProviders.* 객체 (addresses[chainId]를 가짐)
  stopSpenderAddress?: `0x${string}`; // 위 provider에서 뽑은 체인별 주소
};

function isWETH(tok: any) {
  const sym = tok?.symbol?.toUpperCase?.() ?? "";
  return sym === "WETH" || sym === "WETH9";
}

function isETH(tok: any) {
  const sym = tok?.symbol?.toUpperCase?.() ?? "";
  return sym === "ETH";
}

export default function useFarmStopPanelCommon(
  item: Farm,
  override?: StopSpenderOverride
) {
  const base = useFarmPanelCommon(item);
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
  } = base;

  const ROUTER_PROVIDER_FALLBACK = useMemo(() => {
    // stakingProviders에 Router 메타가 없을 때 대비
    const meta = (stakingProviders as any)?.BIRDIESWAP_Router;
    return (
      meta ?? {
        name: "BIRDIESWAP_Router",
        addresses: { [chainId]: routerAddress },
      }
    );
  }, [chainId, routerAddress]);

  // 기본 spender (provider) 주소
  const ROUTER_ADDRESS: `0x${string}` | null =
    getFromContracts(ADDRESS.ROUTER, chainId) ??
    ROUTER_PROVIDER_FALLBACK?.addresses?.[chainId];

  const WRAPPER_ADDRESS = getFromContracts(ADDRESS.WRAPPER, chainId) as
    | `0x${string}`
    | null;

  const { allowance, query: allowanceQuery } = useAllowance({
    token: stakeToken,
    spender: override?.stopSpenderProvider ?? stakeToken.provider, // 🔁 분기 반영
  });

  // [CHANGED] approve 대상 주소도 override->routerAddress 순으로 사용
  const approve = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress as `0x${string}`,
    routerAddress: (override?.stopSpenderAddress ??
      (override?.stopSpenderProvider?.addresses?.[chainId] as
        | `0x${string}`
        | undefined) ??
      routerAddress) as `0x${string}`,
    transactionContext,
    refetch: allowanceQuery.refetch,
    writeContract,
  });

  /**
   * route에 맞춰 STOP_FARMING의 표시용 input/output 기본 형태를 구성
   * - input: 단일 객체 (해제 대상 토큰)
   * - output: 수신 예상 토큰 배열 (amount는 영수증으로 채워짐)
   */
  function buildStopDisplayTokens(route: StopRoute, blpAmount?: bigint) {
    // 입력표시용 수량(=사용자 입력) 생성
    const inputAmount =
      blpAmount !== undefined && stakeToken?.decimals !== undefined
        ? new BigDecimal(
            formatUnits(blpAmount, stakeToken.decimals),
            stakeToken.decimals
          )
        : undefined;

    // ─────────────────────────────────────────────────────────────────────────────
    // 언더라이잉 토큰 추출 로직 (가장 중요한 부분)
    // BirdieLP: stakeToken.lpPool.input[*].input  → CURRENCY 토큰 배열
    // BirdieSingle: stakeToken.input              → CURRENCY 토큰 1개
    // ─────────────────────────────────────────────────────────────────────────────
    const asAny = stakeToken as any;
    const lpInputs: any[] | undefined = asAny?.lpPool?.input; // [{ input: CURRENCY }, { input: CURRENCY }]
    const singleUnderlying: any | undefined = asAny?.input; // CURRENCY

    let underlyingTokens: any[] = [];
    if (Array.isArray(lpInputs) && lpInputs.length > 0) {
      underlyingTokens = lpInputs.map((x) => x?.input).filter(Boolean);
    } else if (singleUnderlying) {
      underlyingTokens = [singleUnderlying];
    }
    if (underlyingTokens.length === 0) {
      underlyingTokens = [stakeToken];
    }

    // 라우트가 WRAPPER_* 면, 언더라이잉 중 WETH → ETH로 치환
    const unwrapToEth = route === "WRAPPER_SINGLE" || route === "WRAPPER_PAIR";
    const keepAsWeth = route === "ROUTER_SINGLE" || route === "ROUTER_PAIR";

    const normalizedOutputs = underlyingTokens.map((t) => {
      // WRAPPER 경로: WETH → ETH
      if (unwrapToEth && isWETH(t)) return tokens.ETH;

      // ROUTER 경로: ETH가 언더라이잉에 섞여 있으면 WETH로 강제(받기옵션 WETH 보장)
      if (keepAsWeth && isETH(t)) return tokens.WETH;

      // ROUTER 경로: 언더라이잉이 WETH “유사 객체”면 공식 tokens.WETH로 통일
      if (keepAsWeth && isWETH(t)) return tokens.WETH;

      return t;
    });

    return {
      input: { token: stakeToken, amount: inputAmount }, // BLP 수량
      output: normalizedOutputs.map((t) => ({ token: t })), // 실제 수령(ETH/WETH 규칙 반영)
    };
  }

  // 실제 트랜잭션 실행은 여기서만!
  const performStop = useCallback(
    (args: {
      route: StopRoute;
      blpAmount: bigint; // decimals 반영된 BLP 수량
      onSuccess?: () => void;
      txLabel?: string;
    }) => {
      const { route, blpAmount, onSuccess } = args;

      const executorAddress =
        args.route === "WRAPPER_SINGLE" || args.route === "WRAPPER_PAIR"
          ? WRAPPER_ADDRESS
          : ROUTER_ADDRESS;

      // STOP_FARMING 표시 토큰을 route에 맞게 준비 (핵심 수정)
      const { input, output } = buildStopDisplayTokens(route, blpAmount);

      const transactionProps = {
        chainId,
        transactionType: TransactionType.STOP_FARMING,
        input, // 단일 객체
        output, // token만 채운 배열 (amount는 handleWriteTransaction에서 채움)
        address,
        executorAddress,
      } as unknown as TransactionStatusProps & StopFarmingTransactionProps;

      const handlers = getWriteTransactionHandlers({
        client,
        transactionContext,
        transactionProps,
        refetch: async () => {
          await Promise.all([assetsContext.refetchAll()]);
        },
      });

      if (route === "WRAPPER_SINGLE") {
        if (!WRAPPER_ADDRESS) {
          console.error(
            "[performStop] Missing WRAPPER_ADDRESS for chain:",
            chainId
          );
          return;
        }
        // wrapper: singleRedeemToETH(bToken, bAmount)

        // console.log(
        //   "useFarmStopPanelCommon WrapperSingleCall",
        //   WRAPPER_ADDRESS,
        //   stakeTokenAddress,
        //   blpAmount
        // );

        writeContract(
          {
            address: WRAPPER_ADDRESS,
            abi: birdieswap_wrapper_abi,
            functionName: "singleRedeemToETH",
            args: [stakeTokenAddress as `0x${string}`, blpAmount] as any,
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              try {
                await assetsContext.forceRefresh?.();
              } catch (e) {
                console.error("forceRefresh failed", e);
              }
              onSuccess?.();
            },
          }
        );
        return;
      }

      if (route === "WRAPPER_PAIR") {
        if (!WRAPPER_ADDRESS) {
          console.error(
            "[performStop] Missing WRAPPER_ADDRESS for chain:",
            chainId
          );
          return;
        }
        // wrapper: dualRedeemToETH(blpToken, blpAmount)
        // console.log(
        //   "useFarmStopPanelCommon WrapperPairCall",
        //   WRAPPER_ADDRESS,
        //   stakeTokenAddress,
        //   blpAmount
        // );

        writeContract(
          {
            address: WRAPPER_ADDRESS,
            abi: birdieswap_wrapper_abi,
            functionName: "dualRedeemToETH",
            args: [stakeTokenAddress as `0x${string}`, blpAmount] as any,
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              try {
                await assetsContext.forceRefresh?.();
              } catch (e) {
                console.error("forceRefresh failed", e);
              }
              onSuccess?.();
            },
          }
        );
        return;
      }

      if (route === "ROUTER_SINGLE") {
        // console.log(
        //   "useFarmStopPanelCommon routerSingleCall",
        //   routerAddress,
        //   stakeTokenAddress
        // );

        writeContract(
          {
            address: ROUTER_ADDRESS as `0x${string}`,
            abi: birdieswap_router_abi,
            functionName: "singleRedeem",
            args: [stakeTokenAddress as `0x${string}`, blpAmount] as any,
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              try {
                await assetsContext.forceRefresh?.();
              } catch (e) {
                console.error("forceRefresh failed", e);
              }
              onSuccess?.();
            },
          }
        );
        return;
      }

      if (route === "ROUTER_PAIR") {
        // console.log(
        //   "useFarmStopPanelCommon routerPairCall",
        //   routerAddress,
        //   stakeTokenAddress
        // );

        writeContract(
          {
            address: ROUTER_ADDRESS as `0x${string}`,
            abi: birdieswap_router_abi,
            functionName: "dualRedeem",
            args: [
              address,
              stakeTokenAddress as `0x${string}`,
              blpAmount,
            ] as any,
          },
          {
            onError: handlers.onError,
            onSuccess: async (v) => {
              handlers.onSuccess(v);
              try {
                await assetsContext.forceRefresh?.();
              } catch (e) {
                console.error("forceRefresh failed", e);
              }
              onSuccess?.();
            },
          }
        );
        return;
      }
    },
    [
      address,
      chainId,
      client,
      transactionContext,
      assetsContext,
      writeContract,
      routerAddress,
      stakeToken,
      stakeTokenAddress,
    ]
  );

  // 공통으로 내려주는 것들: 싱글/페어 훅이 그대로 사용
  return {
    ...base,
    performStop,
    client,
    approve,
    allowance,
    allowanceQuery,
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
  };
}
