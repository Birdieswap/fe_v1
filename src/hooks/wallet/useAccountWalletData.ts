"use client";

import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { getMyTransactionData } from "@/utils/wallet/getMyTransactionData";
import { isAddress } from "viem";

type Address = `0x${string}`;

export type AccountWalletData = {
  transactions?: Awaited<
    ReturnType<typeof getMyTransactionData>
  >["Transactions"];
  /** 보상 기능 제거: 항상 undefined */
  currentUserReward?: unknown | undefined;
  swapRewards?: unknown | undefined;
  referralRewards?: unknown | undefined;

  isLoading: boolean;
  isError: boolean;
  refetchAll: () => void;

  /** ▼ 인피니티 스크롤용 추가 노출 */
  loadMore?: () => void;
  endReached?: boolean;
  isFetchingNextPage?: boolean;
  earliestBlock?: number;
};

export function useAccountWalletData(
  address?: Address,
  blockHeight?: string | number,
  chainId?: number
): AccountWalletData {
  const validAddress = address && isAddress(address);
  const MODE = (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "")
    .trim()
    .toLowerCase();
  const DEV = MODE ? MODE === "dev" : process.env.NODE_ENV !== "production";
  const hasChainId = typeof chainId === "number" && !Number.isNaN(chainId);
  const publicClient = usePublicClient({
    chainId: hasChainId ? chainId : undefined,
  });

  // dev에선 address만 있어도 활성화, prod/stage는 chainId 필요
  const enabledTx = DEV
    ? Boolean(address && isAddress(address))
    : Boolean(address && isAddress(address) && hasChainId);

  const qc = useQueryClient();

  // ===== 인피니티 스크롤 내부 상태 =====
  const [cursor, setCursor] = useState<number | undefined>(undefined); // 다음 페이지 커서(blockHeight)
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined); // 다음 loadMore에서 사용할 커서
  const [endReached, setEndReached] = useState(false);
  const [earliestBlock, setEarliestBlock] = useState<number | undefined>(
    undefined
  );
  const [refreshNonce, setRefreshNonce] = useState(0);

  // 누적 트랜잭션(원본)과 dedupe 세트
  const [accTxs, setAccTxs] = useState<
    Awaited<ReturnType<typeof getMyTransactionData>>["Transactions"]
  >([]);

  // ===== 균일 페이스용 보강(autoboost) 파라미터 =====
  const PAGE_TARGET = 30;
  const BLOCK_WINDOW = 50_400;
  const preFetchLenRef = useRef(0); // fetch 시작 직전의 길이
  const boostCountRef = useRef(0); // 연속 보강 횟수 (무한 루프 방지)
  const MAX_BOOST = 3;

  const parseStartBlock = useCallback((v?: string | number) => {
    const n =
      typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }, []);

  // 주소/체인/초기 blockHeight 바뀌면 전체 리셋
  useEffect(() => {
    setAccTxs([]);
    const initial = parseStartBlock(blockHeight);
    setCursor(
      Number.isFinite(initial as number) ? (initial as number) : undefined
    );
    setNextCursor(
      Number.isFinite(initial as number) ? (initial as number) : undefined
    );
    setEndReached(false);
    setEarliestBlock(undefined);
    setRefreshNonce(0);

    boostCountRef.current = 0;
    preFetchLenRef.current = 0;

    // console.log("[useAWD] reset", { address, chainId, initialCursor: initial });
  }, [address, chainId, blockHeight, parseStartBlock]);

  // blockHeight를 명시하지 않은 경우 latest block으로 시작 커서 부트스트랩
  useEffect(() => {
    let cancelled = false;

    if (!enabledTx) return;
    if (Number.isFinite(cursor as number)) return;

    (async () => {
      try {
        const latest = await publicClient?.getBlockNumber();
        if (cancelled || latest == null) return;

        const latestNum = Number(latest);
        if (!Number.isFinite(latestNum)) return;

        setCursor(latestNum);
        setNextCursor(latestNum);
      } catch (e) {
        console.warn("[useAWD] latest block bootstrap failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabledTx, cursor, publicClient]);

  const baseKey = [
    "wallet",
    (address ?? "").toLowerCase(),
    hasChainId ? chainId! : "na",
    blockHeight ?? "na",
  ];

  const txQ = useQuery({
    queryKey: [...baseKey, "txs", cursor ?? "latest", refreshNonce],
    queryFn: () => {
      const raw = cursor ?? parseStartBlock(blockHeight);
      const safeBlockHeight =
        typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
      return getMyTransactionData(address as Address, {
        blockHeight: safeBlockHeight,
        chainId,
      });
    },
    enabled: enabledTx && Number.isFinite(cursor as number),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 5,
    retryDelay: 1000,
  });

  // === fetch 시작/끝 감지해서 preFetchLen 세팅 ===
  const wasFetchingRef = useRef(false);
  useEffect(() => {
    if (txQ.isFetching && !wasFetchingRef.current) {
      preFetchLenRef.current = accTxs.length;
      wasFetchingRef.current = true;
    } else if (!txQ.isFetching && wasFetchingRef.current) {
      wasFetchingRef.current = false;
    }
  }, [txQ.isFetching, accTxs.length]);

  const txKey = useCallback((t: (typeof accTxs)[number]) => {
    const block = String(t.blockNumber ?? "");
    const txIndex = String(t.transactionIndex ?? "0").padStart(4, "0");
    const logIndex = String(t.logIndex ?? "0").padStart(4, "0");
    return `${block}${txIndex}${logIndex}`;
  }, []);

  const txKeyNum = useCallback(
    (t: (typeof accTxs)[number]) => {
      const key = txKey(t).replace(/[^\d]/g, "");
      if (!key) return 0n;
      try {
        return BigInt(key);
      } catch {
        return 0n;
      }
    },
    [txKey]
  );

  // === 트랜잭션 페이지 병합 & 종료 조건 계산 ===
  useEffect(() => {
    if (!txQ.data) return;

    const page = txQ.data;
    const list = page.Transactions ?? [];
    // console.log("[useAWD] merge start", {
    //   pageLen: list.length,
    //   earliest: page.EarliestBlock,
    // });

    // EarliestBlock 갱신
    const pageEarliest = Number(page.EarliestBlock);
    if (!Number.isNaN(pageEarliest)) setEarliestBlock(pageEarliest);

    // 병합: blockNumber+transactionIndex+logIndex 조합으로 dedupe 후 정렬
    if (list.length > 0) {
      setAccTxs((prev) => {
        const map = new Map<string, (typeof prev)[number]>();
        for (const t of prev) map.set(txKey(t), t);
        for (const t of list) {
          const key = txKey(t);
          if (!map.has(key)) map.set(key, t);
        }
        const next = Array.from(map.values()).sort((a, b) => {
          const aKey = txKeyNum(a);
          const bKey = txKeyNum(b);
          if (aKey === bKey) return 0;
          return aKey > bKey ? -1 : 1;
        });
        // console.log("[useAWD] merged len", next.length);
        return next;
      });
    }

    // 다음 요청 커서 계산:
    // 1) 첫 호출(latest) 이후: "현재 페이지 기준 최신 block - 50,401"
    // 2) 그 다음부터는: "이전 요청 cursor - 50,400" 고정 간격
    const maxInPage =
      list.length > 0
        ? Math.max(...list.map((t) => Number(t.blockNumber)))
        : Number.NaN;
    const hasMaxInPage = Number.isFinite(maxInPage);
    const hasCursor = Number.isFinite(cursor as number);

    let computedNextCursor: number | undefined = undefined;
    if (!hasCursor && hasMaxInPage) {
      computedNextCursor = Math.max(maxInPage - (BLOCK_WINDOW + 1), 0);
    } else if (hasCursor) {
      computedNextCursor = Math.max((cursor as number) - BLOCK_WINDOW, 0);
    }

    if (Number.isFinite(computedNextCursor as number)) {
      setNextCursor(computedNextCursor as number);
    }

    // 종료 조건: 다음 커서가 EarliestBlock보다 작아지면 종료
    if (
      Number.isFinite(pageEarliest) &&
      Number.isFinite(computedNextCursor as number) &&
      (computedNextCursor as number) < pageEarliest
    ) {
      setEndReached(true);
      return;
    }

    // 안전장치: 초기 페이지부터 비어있고 다음 커서도 계산 불가하면 종료
    if (list.length === 0 && !Number.isFinite(computedNextCursor as number)) {
      setEndReached(true);
    }
  }, [txQ.data, cursor, txKey, txKeyNum]);

  // loadMore: nextCursor를 사용해 고정 window 간격으로 이동
  const loadMore = useCallback(() => {
    if (endReached) return;

    if (Number.isFinite(nextCursor as number)) {
      setCursor(nextCursor as number);
      return;
    }

    if (!accTxs.length) return;
    const maxBlock = Math.max(...accTxs.map((t) => Number(t.blockNumber)));
    if (Number.isNaN(maxBlock)) return;
    setCursor(Math.max(maxBlock - (BLOCK_WINDOW + 1), 0));
  }, [accTxs, endReached, nextCursor]);

  // ===== 자동 보강(autoboost): fetch가 끝난 뒤 추가된 개수가 30 미만이면 자동으로 더 가져오기 =====
  useEffect(() => {
    if (txQ.isFetching || endReached) return;

    const added = accTxs.length - preFetchLenRef.current;

    if (added >= PAGE_TARGET) {
      boostCountRef.current = 0;
      return;
    }

    if (added < PAGE_TARGET && boostCountRef.current < MAX_BOOST) {
      boostCountRef.current += 1;
      // console.log("[useAWD] autoboost", {
      //   added,
      //   target: PAGE_TARGET,
      //   boostTry: boostCountRef.current,
      // });
      loadMore();
    }
  }, [txQ.isFetching, accTxs.length, endReached, loadMore]);

  // 주소/체인 바뀌면 보수적으로 invalidate (기존 유지)
  useEffect(() => {
    if (enabledTx) {
      qc.invalidateQueries({
        queryKey: ["wallet", (address ?? "").toLowerCase(), chainId ?? "na"],
      });
    }
  }, [address, chainId, enabledTx, qc]);

  const isLoading = txQ.isLoading;
  const isError = txQ.isError;
  const isFetchingNextPage = !isLoading && txQ.isFetching;

  const refetchAll = useCallback(() => {
    setAccTxs([]);
    const initial = parseStartBlock(blockHeight);
    setCursor(
      Number.isFinite(initial as number) ? (initial as number) : undefined
    );
    setNextCursor(
      Number.isFinite(initial as number) ? (initial as number) : undefined
    );
    setEndReached(false);
    setEarliestBlock(undefined);
    boostCountRef.current = 0;
    preFetchLenRef.current = 0;
    setRefreshNonce((n) => n + 1);
  }, [blockHeight, parseStartBlock]);

  return useMemo(
    () => ({
      transactions: accTxs, // 누적된 결과 반환
      earliestBlock,

      isLoading,
      isError,
      refetchAll,

      loadMore,
      endReached,
      isFetchingNextPage,
    }),
    [
      accTxs,
      isLoading,
      isError,
      loadMore,
      endReached,
      isFetchingNextPage,
      earliestBlock,
    ]
  );
}

export default useAccountWalletData;
