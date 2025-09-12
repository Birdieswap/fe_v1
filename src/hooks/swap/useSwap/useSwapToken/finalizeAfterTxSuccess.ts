import type React from "react";

type RefsBundle = {
  lastInputRef: React.MutableRefObject<any>;
  curFromTokenRef: React.MutableRefObject<any>;
  curToTokenRef: React.MutableRefObject<any>;
  curFromAmountRef: React.MutableRefObject<any>;
  curToAmountRef: React.MutableRefObject<any>;
};

export async function finalizeAfterTxSuccess(args: {
  hash: `0x${string}`;
  publicClient: any;     // viem PublicClient; 여기선 의존 줄이려 any
  handlers: any;         // getWriteTransactionHandlers() 결과
  balances?: any;        // useAssets() 반환 객체
  fromToken?: any;
  toToken?: any;
  refs: RefsBundle;
  updateAmountCommon: (
    amount: string,
    side: "in" | "out",
    withToToken?: any,
    withFromToken?: any
  ) => Promise<void>;
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

  // 모달 핸들러 성공 콜백 (기존 순서 유지)
  try { handlers.onSuccess?.(hash); } catch {}

  // 영수증 대기
  const receipt = await publicClient?.waitForTransactionReceipt?.({ hash });
  if (receipt?.status !== "success") return receipt;

  // === 기존 공통 후처리 블록 (토큰/사이드/스냅샷 방어) ===
  const snap = refs.lastInputRef.current;
  const curFromToken = refs.curFromTokenRef.current;
  const curToToken   = refs.curToTokenRef.current;
  const nowFromAmount = (refs.curFromAmountRef.current || "").trim();
  const nowToAmount   = (refs.curToAmountRef.current   || "").trim();

  const tokenMismatch =
    (curFromToken?.symbol !== fromToken?.symbol) ||
    (curToToken?.symbol   !== toToken?.symbol);

  if (tokenMismatch) {
    const curSide = nowFromAmount ? "in" : (nowToAmount ? "out" : null);
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
    await updateAmountCommon(
      snap.amount,
      snap.side,
      snap.withToToken,
      snap.withFromToken
    );
  }

  // === 잔액 리프레시 ===
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
