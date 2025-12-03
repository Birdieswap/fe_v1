import type React from "react";
import { erc20Abi, formatUnits } from "viem";
import { BigDecimal } from "@/types/BigDecimal";
import getTokenAddress from "@/utils/assets/getTokenAddress";

type RefsBundle = {
  lastInputRef: React.MutableRefObject<any>;
  curFromTokenRef: React.MutableRefObject<any>;
  curToTokenRef: React.MutableRefObject<any>;
  curFromAmountRef: React.MutableRefObject<any>;
  curToAmountRef: React.MutableRefObject<any>;
};

type TxContextLite = {
  setTransactionProps: (p: any) => void;
};

export async function finalizeAfterTxSuccess(args: {
  hash: `0x${string}`;
  publicClient: any;
  handlers: any;
  balances?: any;
  fromToken?: any;
  toToken?: any;
  chainId: number;
  userAddress?: `0x${string}`;

  refs: RefsBundle;
  updateAmountCommon: (
    amount: string,
    side: "in" | "out",
    withToToken?: any,
    withFromToken?: any
  ) => Promise<void>;

  // ✅ 비교용
  transactionContext?: TxContextLite;
  benchmarkOut?: string | null; // token units string (유니스왑 기준 or external 기준)
  toTokenUsd?: number | null; // USD price per 1 toToken
  preToBalance?: bigint | null; // tx 직전 toToken balance raw
  usdThreshold?: number; // default=1
}) {
  const {
    hash,
    publicClient,
    handlers,
    balances,
    fromToken,
    toToken,
    refs,
    updateAmountCommon,
  } = args;

  // 1) 모달 핸들러 성공 콜백 (기존 순서 유지)
  try {
    handlers.onSuccess?.(hash);
  } catch {
    // modal handler 터져도 tx 후처리는 계속 진행
  }

  // 2) 영수증 대기
  const receipt = await publicClient?.waitForTransactionReceipt?.({ hash });
  if (receipt?.status !== "success") return receipt;

  // 3) swap 전용 "입력 스냅샷/토큰 변경 대응" 블록
  //    → refs / updateAmountCommon 이 둘 다 있을 때만 수행
  if (refs && updateAmountCommon) {
    const snap = refs.lastInputRef.current;
    const curFromToken = refs.curFromTokenRef.current;
    const curToToken = refs.curToTokenRef.current;
    const nowFromAmount = (refs.curFromAmountRef.current || "").trim();
    const nowToAmount = (refs.curToAmountRef.current || "").trim();

    const tokenMismatch =
      curFromToken?.symbol !== fromToken?.symbol ||
      curToToken?.symbol !== toToken?.symbol;

    if (tokenMismatch) {
      // 스왑 도중 from/to 토큰이 바뀐 상태 → 현재 화면 입력값 기준으로 다시 quote
      const curSide = nowFromAmount ? "in" : nowToAmount ? "out" : null;
      if (curSide) {
        const curValue = curSide === "in" ? nowFromAmount : nowToAmount;
        await updateAmountCommon(
          curValue,
          curSide as "in" | "out",
          curToToken ?? undefined,
          curFromToken ?? undefined
        );
      }
    } else if (snap?.amount && Number(snap.amount) > 0) {
      // 토큰은 그대로인데 마지막 입력 스냅샷이 남아 있는 경우 → 그 값으로 재계산
      await updateAmountCommon(
        snap.amount,
        snap.side,
        snap.withToToken,
        snap.withFromToken
      );
    }
  } else {
    // refs/updateAmountCommon 이 없는 호출(예: farming/claim 등)인 경우
    // 여기서는 단순히 잔액 리프레시만 수행하고 넘어간다.
    // console.debug("[finalizeAfterTxSuccess] refs or updateAmountCommon not provided, skip quote refresh");
  }

  // 4) 잔액 리프레시 (공통)
  if (typeof balances?.refetchAll === "function") {
    await balances.refetchAll();
  } else {
    // 통합 함수 없으면 ERC20 + ETH 병렬로
    await Promise.all([
      balances?.tokenBalances?.query?.refetch?.(),
      balances?.nativeBalance?.query?.refetch?.(),
    ]);
  }

  return receipt;
}
