"use client";

import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useQueries, UseQueryOptions, useQueryClient } from "@tanstack/react-query";

import { getMyCurrentUserReward } from "@/utils/wallet/getMyCurrentUserReward";
import { getMyTransactionData } from "@/utils/wallet/getMyTransactionData";
import { getMyReferralReward } from "@/utils/wallet/getMyReferralReward";
import { getMySwapReward } from "@/utils/wallet/getMySwapReward";
import { isAddress } from "viem";
import { buildUrl } from "@/utils/wallet/buildUrl";

type Address = `0x${string}`;

export type AccountWalletData = {
  transactions?: Awaited<ReturnType<typeof getMyTransactionData>>["Transactions"];
  currentUserReward?: Awaited<ReturnType<typeof getMyCurrentUserReward>>;
  swapRewards?: Awaited<ReturnType<typeof getMySwapReward>>["SwapRewards"];
  referralRewards?: Awaited<ReturnType<typeof getMyReferralReward>>["ReferralRewards"];
  isLoading: boolean;
  isError: boolean;
  refetchAll: () => void;

  /** ▼ 인피니티 스크롤용 추가 노출 */
  loadMore?: () => void;
  endReached?: boolean;
  isFetchingNextPage?: boolean;
  earliestBlock?: number;
};

export function useAccountWalletData(address?: Address, blockHeight?: string | number, chainId?: number): AccountWalletData {
  const validAddress = address && isAddress(address);
  const MODE = (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase();
  const DEV = MODE ? MODE === "dev" : (process.env.NODE_ENV !== "production");
  const hasChainId = typeof chainId === "number" && !Number.isNaN(chainId);
  // dev에선 address만 있어도 활성화, prod/stage는 chainId 필요
  const enabledTx = DEV ? Boolean(address && isAddress(address)) : Boolean(address && isAddress(address) && hasChainId);
  const enabledRewards = DEV ? Boolean(address && isAddress(address)) : Boolean(address && isAddress(address) && hasChainId);
  const qc = useQueryClient();

  // ===== 인피니티 스크롤 내부 상태 =====
  const [cursor, setCursor] = useState<number | undefined>(undefined); // 다음 페이지 커서(blockHeight)
  const [endReached, setEndReached] = useState(false);
  const [earliestBlock, setEarliestBlock] = useState<number | undefined>(undefined);

  // 누적 트랜잭션(원본)과 dedupe 세트
  const [accTxs, setAccTxs] =
    useState<Awaited<ReturnType<typeof getMyTransactionData>>["Transactions"]>([]);

  // ===== 균일 페이스용 보강(autoboost) 파라미터 =====
  const PAGE_TARGET = 30;
  const preFetchLenRef = useRef(0);     // fetch 시작 직전의 길이
  const boostCountRef = useRef(0);      // 연속 보강 횟수 (무한 루프 방지)
  const MAX_BOOST = 3;
  
  // 주소/체인/초기 blockHeight 바뀌면 전체 리셋
  useEffect(() => {
    setAccTxs([]);
    const initial =
      typeof blockHeight === "number"
        ? blockHeight
        : typeof blockHeight === "string"
        ? parseInt(blockHeight, 10)
        : undefined;
    setCursor(Number.isFinite(initial as number) ? (initial as number) : undefined);
    setEndReached(false);
    setEarliestBlock(undefined);

    boostCountRef.current = 0;
    preFetchLenRef.current = 0;

    console.log("[useAWD] reset", { address, chainId, initialCursor: initial });
  }, [address, chainId, blockHeight]);

  const baseKey = ["wallet", (address ?? "").toLowerCase(), hasChainId ? chainId! : "na", blockHeight ?? "na"];

  const results = useQueries({
    queries: [
      {
        queryKey: [...baseKey, "txs", cursor ?? "latest"],
        queryFn: () => {
          const raw =
            cursor ??
            (typeof blockHeight === "number"
              ? blockHeight
              : typeof blockHeight === "string"
              ? parseInt(blockHeight, 10)
              : undefined);
          const safeBlockHeight =
            typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
          return getMyTransactionData(address as Address, {
            blockHeight: safeBlockHeight,
            chainId,
          });
        },
        enabled: enabledTx,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
      {
        queryKey: [...baseKey, "current-user-reward"],
        queryFn: () => getMyCurrentUserReward(address as Address, { chainId }),
        enabled: enabledRewards,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
      {
        queryKey: [...baseKey, "swap-reward", blockHeight ?? "na"],
        queryFn: () => getMySwapReward(address as Address, { blockHeight, chainId }),
        enabled: enabledRewards,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
      {
        queryKey: [...baseKey, "referral-reward", blockHeight ?? "na"],
        queryFn: () => getMyReferralReward(address as Address, { blockHeight, chainId }),
        enabled: enabledRewards,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 5,                // 재시도 횟수
        retryDelay: 1000,        // 재시도 지연 시간
      } satisfies UseQueryOptions,
    ],
  });

  // console.log("[wallet] useAccountWalletData", { address, chainId, blockHeight, enabled }, "result", results); 

  const [txQ, curQ, swapQ, refQ] = results;

  // === fetch 시작/끝 감지해서 preFetchLen 세팅 ===
  const wasFetchingRef = useRef(false);
  useEffect(() => {
    if (txQ.isFetching && !wasFetchingRef.current) {
      // fetch 막 시작: 현재 길이를 저장
      preFetchLenRef.current = accTxs.length;
      wasFetchingRef.current = true;
      // 새 요청 시작 시에는 보강 카운트 초기화하지 않음(연속 보강 허용)
      // console.log("[useAWD] fetch start, preLen =", preFetchLenRef.current);
    } else if (!txQ.isFetching && wasFetchingRef.current) {
      // fetch 끝
      wasFetchingRef.current = false;
      // console.log("[useAWD] fetch end");
    }
  }, [txQ.isFetching, accTxs.length]);

  // === 트랜잭션 페이지 병합 & 종료 조건 계산 ===
  useEffect(() => {
    if (!txQ.data) return;

    const page = txQ.data;
    const list = page.Transactions ?? [];
    console.log("[useAWD] merge start", { pageLen: list.length, earliest: page.EarliestBlock });

    // EarliestBlock 갱신
    const pageEarliest = Number(page.EarliestBlock);
    if (!Number.isNaN(pageEarliest)) setEarliestBlock(pageEarliest);

    // 병합(dedupe by transactionHash) + blockNumber 내림차순 정렬 유지
    if (list.length > 0) {
      setAccTxs(prev => {
        // prev(현재 상태) 기준으로만 중복 제거 → 외부 ref 레이스 아웃
        const map = new Map<string, typeof prev[number]>();
        for (const t of prev) map.set(t.transactionHash, t);
        for (const t of list) if (!map.has(t.transactionHash)) map.set(t.transactionHash, t);
        const next = Array.from(map.values()).sort(
          (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
        );
        console.log("[useAWD] merged len", next.length);
        return next;
      });
    }

    // 종료 조건: 빈 페이지거나, 이번 페이지의 최소 blockNumber가 EarliestBlock 이하
    if (list.length === 0) {
      setEndReached(true);
      console.log("[useAWD] endReached by empty page");
    } else {
      const minInPage = Math.min(...list.map(t => Number(t.blockNumber)));
      if (!Number.isNaN(minInPage) && !Number.isNaN(pageEarliest) && minInPage <= pageEarliest) {
        setEndReached(true);
        console.log("[useAWD] endReached by earliest");
      }
    }
  }, [txQ.data]);

  // loadMore: 현재까지 누적된 최소 blockNumber - 1 로 커서 갱신
  const loadMore = useCallback(() => {
    if (endReached) return;
    if (!accTxs.length) return;
    const minBlock = Math.min(...accTxs.map(t => Number(t.blockNumber)));
    if (Number.isNaN(minBlock)) return;
    console.log("[useAWD] loadMore → cursor", minBlock-1);
    setCursor(minBlock - 1);
  }, [accTxs, endReached]);

  // ===== 자동 보강(autoboost): fetch가 끝난 뒤 추가된 개수가 30 미만이면 자동으로 더 가져오기 =====
  useEffect(() => {
    // fetch가 진행 중이거나, 이미 끝까지 도달하면 보강하지 않음
    if (txQ.isFetching || endReached) return;

    const added = accTxs.length - preFetchLenRef.current;

    // 새로 늘어난 항목이 충분하면 보강 카운터 리셋
    if (added >= PAGE_TARGET) {
      boostCountRef.current = 0;
      return;
    }

    // 부족하면 보강 시도 (최대 3회 연속)
    if (added < PAGE_TARGET && boostCountRef.current < MAX_BOOST) {
      boostCountRef.current += 1;
      console.log(
        "[useAWD] autoboost",
        { added, target: PAGE_TARGET, boostTry: boostCountRef.current }
      );
      loadMore();
    }
    // added < PAGE_TARGET 이고 boost가 이미 MAX면 그냥 종료(다음 사용자 스크롤을 기다림)
  }, [txQ.isFetching, accTxs.length, endReached, loadMore]);

  // 디버그용 URL 출력 (Transactions는 내부 cursor를 사용)
  useEffect(() => {
    if (!enabledTx || !address) return;
    const txBlock = cursor ?? (typeof blockHeight === "number"
      ? blockHeight
      : typeof blockHeight === "string" 
        ? parseInt(blockHeight, 10)
        : undefined);
       
    console.log("[useAWD] dbg URLs",
      buildUrl("Transactions", { address, blockHeight: txBlock, chainId }),
    );

    const safeTxBlock =
      typeof txBlock === "number" && Number.isFinite(txBlock) ? txBlock : undefined;

    console.log("[wallet] URLs:",
      buildUrl("CurrentUserRewards", { address }),
      buildUrl("Transactions", { address, blockHeight: safeTxBlock }),
      buildUrl("SwapRewards", { address, blockHeight }),
      buildUrl("ReferralRewards", { address, blockHeight }),
    );
  }, [enabledTx, enabledRewards, address, chainId, blockHeight, cursor]);

  // 주소/체인 바뀌면 보수적으로 invalidate (기존 유지)
  useEffect(() => {
    if (enabledTx || enabledRewards)
      qc.invalidateQueries({ queryKey: ["wallet", (address ?? "").toLowerCase(), chainId ?? "na"] });
  }, [address, chainId, enabledTx, enabledRewards, qc]);

  
  const isLoading = results.some((q) => q.isLoading);
  const isError = results.some((q) => q.isError);

  const isFetchingNextPage = !isLoading && txQ.isFetching;

  const refetchAll = () => results.forEach((q) => q.refetch());

  return useMemo(
    () => ({
      transactions: accTxs,                   // 누적된 결과 반환
      currentUserReward: curQ.data,
      swapRewards: swapQ.data?.SwapRewards,
      referralRewards: refQ.data?.ReferralRewards,
      earliestBlock,
      isLoading,
      isError,
      refetchAll,

      loadMore,
      endReached,
      isFetchingNextPage,
    }),
    [accTxs, curQ.data, swapQ.data, refQ.data, isLoading, isError, loadMore, endReached, isFetchingNextPage]
  );
}
export default useAccountWalletData;
