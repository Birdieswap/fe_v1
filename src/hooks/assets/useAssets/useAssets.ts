import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useChainId, usePublicClient } from "wagmi"; //farmValue를 위해 추가

import useAccountBalances from "./useAccountBalances";
import { useAssetValues } from "./useAssetValues";


import { FarmList } from "@/const/farmInfo";
import { calcFarmOnce, FarmCalc } from "@/utils/farm/calcFarmOnce";
import { BigDecimal } from "@/types/BigDecimal";

type FarmValuesRecord = Record<
  string,
  { apy: BigDecimal; tvl: BigDecimal | null; price: BigDecimal | null }
>;


// BigDecimal 맵을 값 문자열로 normalize
function normalizeBDMapFromMap(
  m: Map<string, BigDecimal | null>
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  m.forEach((v, k) => {
    out[k] = v ? v.toString() : null;
  });
  return out;
}

// 문자열 normalize된 두 Record 얕은 비교
function shallowEqualNormalized(
  a: Record<string, string | null>,
  b: Record<string, string | null>
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export default function useAssets() {
  // 1) 여기서만 훅 호출 (고정 순서)
  const chainId = useChainId();
  const client = usePublicClient();

  const assetValues = useAssetValues();
  const balances = useAccountBalances();

    // 2) FarmList에서 현재 체인 주소 확정
  const farms = useMemo(() => {
    return FarmList
      .map((f) => {
        const farm = f?.wip_stakeToken; // IBirdieSingleFarm | IBirdieLPFarm 로 가정
        const address = farm?.addresses?.[chainId] as `0x${string}` | undefined;
        return { farm, address };
      })
      .filter((x): x is { farm: NonNullable<typeof x.farm>; address: `0x${string}` } => {
        try {
          return !!x.address && /^0x[0-9a-fA-F]+$/.test(x.address) && BigInt(x.address) !== BigInt(0);
        } catch {
          return false;
        }
      });
  }, [chainId]);

    // 2) 결과를 Map으로 관리
  const [apyMap, setApyMap] = useState<Map<string, BigDecimal>>(new Map());
  const [tvlMap, setTvlMap] = useState<Map<string, BigDecimal | null>>(new Map());
  const [priceMap, setPriceMap] = useState<Map<string, BigDecimal | null>>(new Map());
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => setRefreshIndex(i => i + 1), []);
  // 이전 출력 스냅샷(ref)도 Map으로 유지
  const lastOutputsRef = useRef<{
    apyMap: Map<string, BigDecimal>;
    tvlMap: Map<string, BigDecimal | null>;
    priceMap: Map<string, BigDecimal | null>;
  }>({
    apyMap: new Map(),
    tvlMap: new Map(),
    priceMap: new Map(),
  });

  // [수정] chainlink/uniswap 맵의 버전 문자열 생성 (reference 변하지 않아도 값 변하면 캐치)
  const chainLinkVersion = useMemo(() => {
    const arr: string[] = [];
    assetValues.chainLinkPriceMap.forEach((v, k) => {
      // v.price.toString() + 메타로 버전화
      arr.push(`${k}:${v.price?.toString?.() ?? "null"}:${v.roundId?.toString?.() ?? ""}`);
    });
    return arr.sort().join("|");
  }, [assetValues.chainLinkPriceMap]);

  const uniswapVersion = useMemo(() => {
    const arr: string[] = [];
    assetValues.uniswapPriceMap.forEach((v, k) => {
      arr.push(`${k}:${v.baseBalance?.toString?.() ?? "0"}:${v.quoteBalance?.toString?.() ?? "0"}`);
    });
    return arr.sort().join("|");
  }, [assetValues.uniswapPriceMap]);

  // [수정] balances의 버전 키 (토큰 주소별 balance 총합의 해시 유사 문자열)
  const balancesVersion = useMemo(() => {
    const arr: string[] = [];
    balances.tokenBalances.balanceMap.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "0"}`);
    });
    balances.singleVaultBalances.balanceMap.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "0"}`);
    });
    balances.lpVaultBalances.balanceMap.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "0"}`);
    });
    return arr.sort().join("|");
  }, [balances.tokenBalances.balanceMap, balances.singleVaultBalances.balanceMap, balances.lpVaultBalances.balanceMap]);

  // 3) 계산 실행
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!client || farms.length === 0) {
        if (!cancelled) {
          const emptyA = new Map<string, BigDecimal>();
          const emptyT = new Map<string, BigDecimal | null>();
          const emptyP = new Map<string, BigDecimal | null>();
          setApyMap(emptyA);
          setTvlMap(emptyT);
          setPriceMap(emptyP);
          lastOutputsRef.current = { apyMap: new Map(), tvlMap: new Map(), priceMap: new Map() };
        }
        return;
      }

      const nextApy = new Map<string, BigDecimal>();
      const nextTvl = new Map<string, BigDecimal | null>();
      const nextPrice = new Map<string, BigDecimal | null>();

      for (const { farm, address } of farms) {
        try {
          const { apy, tvl, price }: FarmCalc = await calcFarmOnce(client, farm as any, assetValues);
          if (cancelled) return;
          nextApy.set(address, apy);
          nextTvl.set(address, tvl);
          nextPrice.set(address, price);
        } catch {
          nextApy.set(address, BigDecimal.ZERO());
          nextTvl.set(address, null);
          nextPrice.set(address, null);
        }
      }

      if (cancelled) return;

      // [수정] 동일성 비교 완화 + refreshIndex 기반 강제 업데이트 선택
      const lastOut = lastOutputsRef.current;

      const lastApyNorm = normalizeBDMapFromMap(lastOut.apyMap as any);
      const nextApyNorm = normalizeBDMapFromMap(nextApy as any);
      const lastTvlNorm = normalizeBDMapFromMap(lastOut.tvlMap as any);
      const nextTvlNorm = normalizeBDMapFromMap(nextTvl as any);
      const lastPriceNorm = normalizeBDMapFromMap(lastOut.priceMap as any);
      const nextPriceNorm = normalizeBDMapFromMap(nextPrice as any);

      const apyChanged = !shallowEqualNormalized(lastApyNorm, nextApyNorm);
      const tvlChanged = !shallowEqualNormalized(lastTvlNorm, nextTvlNorm);
      const priceChanged = !shallowEqualNormalized(lastPriceNorm, nextPriceNorm);

      // [수정] 어떤 변경이든 있으면 업데이트
      if (apyChanged) setApyMap(nextApy);
      if (tvlChanged) setTvlMap(nextTvl);
      if (priceChanged) setPriceMap(nextPrice);

      // [수정] 강제 업데이트 직후 스냅샷 갱신
      if (apyChanged || tvlChanged || priceChanged) {
        lastOutputsRef.current = { apyMap: nextApy, tvlMap: nextTvl, priceMap: nextPrice };
      }
    }

    run();
    return () => { cancelled = true; };
  // [수정] 의존성 확장: refreshIndex, chainLinkVersion, uniswapVersion, balancesVersion
  }, [client, farms, chainLinkVersion, uniswapVersion, balancesVersion, refreshIndex]);

  
  const refetchAll = useCallback(async () => {
    await Promise.all([
      assetValues?.uniswapBaseTokenData?.refetch(),
      assetValues?.uniswapQuoteTokenData?.refetch(),
      assetValues?.chainLinkData?.refetch(),
      balances?.lpVaultBalances.query.refetch(),
      balances?.singleVaultBalances.query.refetch(),
      balances?.tokenBalances.query.refetch(),
    ]);
  }, [
    assetValues?.uniswapBaseTokenData?.refetch,
    assetValues?.uniswapQuoteTokenData?.refetch,
    assetValues?.chainLinkData?.refetch,
    balances?.lpVaultBalances.query.refetch,
    balances?.singleVaultBalances.query.refetch,
    balances?.tokenBalances.query.refetch,
  ]);

  // [수정] 강제 재계산 도우미 (refetch 후 refreshIndex bump)
  const forceRefresh = useCallback(async () => {
    try {
      await refetchAll();
      await new Promise((res) => setTimeout(res, 50)); // 최신 블록 반영 대기
    } finally {
      setRefreshIndex((i) => i + 1);
    }
  }, [refetchAll]);
  
  // 4) farmValues 안에 세 Map을 그대로 넣어서 노출
  const farmValues = useMemo(() => {
    return {
      apyMap, // Map
      tvlMap, // Map
      priceMap, // Map
    };
  }, [apyMap, tvlMap, priceMap]);
 // 9) refetchAll: 기존과 동일

  const assets = useMemo(
    () => ({
      assetValues,
      balances,
      farmValues,
      refetchAll,
      forceRefresh, //추가
      isFetching: assetValues.isFetching || balances.isFetching,
    }),
    [assetValues, balances, farmValues, refetchAll, forceRefresh, assetValues.isFetching, balances.isFetching],
  );
  console.log("useAssets assets", assets);

  return assets;
}
