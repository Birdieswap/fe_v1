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

  // 체인링크 버전 키(과도한 차단 없이 변화 감지에만 사용)
  const priceFeedVersion = useMemo(() => {
    const keys: string[] = [];
    assetValues.chainLinkPriceMap.forEach((_, k) => keys.push(String(k)));
    return keys.sort().join("|");
  }, [assetValues.chainLinkPriceMap]);

  // 3) 계산 실행
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!client || farms.length === 0) {
        if (!cancelled) {
          // 수정: 상태 초기화 시에도 스냅샷 동기화
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

      // 새 Map 준비
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

      // 값 기반 비교로 동일하면 setState 스킵
      const lastOut = lastOutputsRef.current;

      const lastApyNorm = normalizeBDMapFromMap(lastOut.apyMap);
      const nextApyNorm = normalizeBDMapFromMap(nextApy);
      if (!shallowEqualNormalized(lastApyNorm, nextApyNorm)) {
        setApyMap(nextApy);
      }

      const lastTvlNorm = normalizeBDMapFromMap(lastOut.tvlMap);
      const nextTvlNorm = normalizeBDMapFromMap(nextTvl);
      if (!shallowEqualNormalized(lastTvlNorm, nextTvlNorm)) {
        setTvlMap(nextTvl);
      }

      const lastPriceNorm = normalizeBDMapFromMap(lastOut.priceMap);
      const nextPriceNorm = normalizeBDMapFromMap(nextPrice);
      if (!shallowEqualNormalized(lastPriceNorm, nextPriceNorm)) {
        setPriceMap(nextPrice);
      }

      // 스냅샷 갱신
      lastOutputsRef.current = { apyMap: nextApy, tvlMap: nextTvl, priceMap: nextPrice };
    }

    run();
    return () => { cancelled = true; };
  }, [client, farms, priceFeedVersion, assetValues.chainLinkPriceMap]);

  // 4) farmValues 안에 세 Map을 그대로 넣어서 노출
  const farmValues = useMemo(() => {
    return {
      apyMap,   // Map<string, BigDecimal>
      tvlMap,   // Map<string, BigDecimal | null>
      priceMap, // Map<string, BigDecimal | null>
    };
  }, [apyMap, tvlMap, priceMap]);

 // 9) refetchAll: 기존과 동일
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

  const assets = useMemo(
    () => ({
      assetValues,
      balances,
      farmValues,
      refetchAll,
      isFetching: assetValues.isFetching || balances.isFetching,
    }),
    [assetValues, balances, farmValues, refetchAll, assetValues.isFetching, balances.isFetching],
  );
  console.log("useAssets assets", assets);

  return assets;
}
