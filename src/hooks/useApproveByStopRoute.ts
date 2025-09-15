
import useApprove from "./useApprove";

export type StopRoute =
  | "WRAPPER_SINGLE"
  | "WRAPPER_PAIR"
  | "ROUTER_SINGLE"
  | "ROUTER_PAIR"
  | string;

export type HexAddress = `0x${string}`;

export interface UseApproveByStopRouteParams {
  client: any;
  stakeToken: any;
  stakeTokenAddress: HexAddress;

  // 라우트별 routerAddress
  legacyRouterAddress: HexAddress;   // 기존 routerAddress
  wrapperRouterAddress: HexAddress;  // 반드시 WRAPPER_ADDRESS를 넘겨주세요 (fallback 금지)

  transactionContext: any;
  writeContract: any;

  // 승인 후 allowance 갱신 refetch (wagmi 타입 차이 대응을 위해 래핑)
  legacyRefetch?: (() => Promise<unknown>) | (() => unknown) | (() => void);
  wrapperRefetch?: (() => Promise<unknown>) | (() => unknown) | (() => void);
}

export interface UseApproveByStopRouteReturn {
  approveLegacy: (token: any) => void;
  approveWrapper: (token: any) => void;
  getApproveForRoute: (route: StopRoute) => (token: any) => void;
  // 하위 호환: 기본 legacy approve
  approve: (token: any) => void;
}

// refetch를 항상 Promise로 감싸는 유틸
function toAsyncRefetch(
  fn?: (() => Promise<unknown>) | (() => unknown) | (() => void),
): (() => Promise<unknown>) | undefined {
  if (!fn) return undefined;
  return async () => {
    return await Promise.resolve(fn());
  };
}

export function useApproveByStopRoute(params: UseApproveByStopRouteParams): UseApproveByStopRouteReturn {
  const {
    client,
    stakeToken,
    stakeTokenAddress,
    legacyRouterAddress,
    wrapperRouterAddress,
    transactionContext,
    writeContract,
    legacyRefetch,
    wrapperRefetch,
  } = params;

  const legacyRefetchAsync = toAsyncRefetch(legacyRefetch);
  const wrapperRefetchAsync = toAsyncRefetch(wrapperRefetch);

  // 1) Legacy approve
  const approveLegacy = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress,
    routerAddress: legacyRouterAddress,
    transactionContext,
    writeContract,
    refetch: legacyRefetchAsync,
  });

  // 2) Wrapper approve (⚠️ 반드시 WRAPPER_ADDRESS를 사용)
  const approveWrapper = useApprove({
    client,
    pool: stakeToken,
    poolAddress: stakeTokenAddress,
    routerAddress: wrapperRouterAddress,
    transactionContext,
    writeContract,
    refetch: wrapperRefetchAsync,
  });

  // 3) 선택자
  const getApproveForRoute = (route: StopRoute) => {
    const isWrapper = route === "WRAPPER_SINGLE" || route === "WRAPPER_PAIR";
    return isWrapper ? approveWrapper : approveLegacy;
  };

  return {
    approveLegacy,
    approveWrapper,
    getApproveForRoute,
    approve: approveLegacy,
  };
}

export default useApproveByStopRoute;
