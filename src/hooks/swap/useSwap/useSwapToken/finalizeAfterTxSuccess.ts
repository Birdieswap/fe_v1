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
  transactionProps?: any;
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
  usdThreshold?: number; // default=0.1
}) {
  const {
    hash,
    publicClient,
    handlers,
    balances,
    fromToken,
    toToken,
    chainId,
    userAddress,
    refs,
    updateAmountCommon,

    transactionContext,
    benchmarkOut,
    toTokenUsd,
    preToBalance,
    usdThreshold = 1,
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
      await updateAmountCommon(
        snap.amount,
        snap.side,
        snap.withToToken,
        snap.withFromToken
      );
    }
  }

  // 4) 실제 수령 vs benchmark 비교 + 모달로 전달
  try {
    if (
      publicClient &&
      userAddress &&
      toToken &&
      typeof preToBalance === "bigint"
    ) {
      let postToBalance: bigint | null = null;

      if (toToken.symbol === "ETH") {
        postToBalance = await publicClient.getBalance({ address: userAddress });
      } else {
        const toAddr = getTokenAddress({
          token: toToken,
          chainId,
        }) as `0x${string}` | null;

        if (toAddr) {
          postToBalance = await publicClient.readContract({
            address: toAddr,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [userAddress],
          });
        }
      }

      if (postToBalance != null) {
        const deltaRaw = postToBalance - preToBalance;

        if (deltaRaw > 0n) {
          const decimals = toToken.decimals ?? 18;
          const actualToken = Number(formatUnits(deltaRaw, decimals));

          let benchToken: number | null = null;
          if (benchmarkOut != null) {
            benchToken = Number(benchmarkOut);
          }

          const diffToken =
            benchToken != null ? actualToken - benchToken : null;

          const usdPrice = toTokenUsd ?? null;
          const diffUsd =
            diffToken != null && usdPrice != null ? diffToken * usdPrice : null;

          // console.log("[swap benchmark]", {
          //   symbol: toToken.symbol,
          //   actualToken,
          //   benchToken,
          //   diffToken,
          //   diffUsd,
          //   usdThreshold,
          // });

          if (diffUsd != null && diffUsd >= usdThreshold) {
            // console.log(
            //   `[swap benchmark] 🎉 You gained ~$${diffUsd.toFixed(
            //     4
            //   )} vs benchmark`
            // );

            // ✅ 모달에 보낼 예쁘게 포맷된 값들
            const displayDecimals =
              toToken.displayDecimals ?? Math.min(decimals, 6);

            const profitUsd = diffUsd.toFixed(4);
            const actualOutStr = actualToken.toFixed(displayDecimals);
            const benchmarkOutStr =
              benchToken != null ? benchToken.toFixed(displayDecimals) : null;

            // ✅ 여기서 "기존 transactionProps"를 보존하면서 merge 해야 함
            if (transactionContext?.setTransactionProps) {
              transactionContext.setTransactionProps((prev: any) => {
                if (!prev) return prev; // 아직 세팅 안 되었으면 건드리지 않음

                return {
                  ...prev,
                  fireConfetti: true,
                  swapBenchmarkInfo: {
                    profitUsd,
                    actualOut: actualOutStr,
                    benchmarkOutAfterFee: benchmarkOutStr,
                  },
                };
              });
            }
          }
        } else {
          // console.log("[swap benchmark] deltaRaw <= 0, skipped", {
          //   symbol: toToken.symbol,
          //   preToBalance: preToBalance.toString(),
          //   postToBalance: postToBalance.toString(),
          // });
        }
      }
    }
  } catch (e) {
    console.warn("[swap benchmark] post-balance/compare failed", e);
  }

  // 5) 잔액 리프레시 (공통)
  if (typeof balances?.refetchAll === "function") {
    await balances.refetchAll();
  } else {
    await Promise.all([
      balances?.tokenBalances?.query?.refetch?.(),
      balances?.nativeBalance?.query?.refetch?.(),
    ]);
  }

  return receipt;
}
