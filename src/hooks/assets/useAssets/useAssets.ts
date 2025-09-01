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

function makeCompositeKey(chainId: number | string, address: string) {
  const cid = typeof chainId === "string" ? Number(chainId) : chainId;
  return `${cid}:${address.toLowerCase()}`;
}

const TargetBlockTime = 24 * 60 * 60; // seconds
const annualBlockQty = Math.floor((365 * 24 * 60 * 60) / TargetBlockTime); // 정수
const SCALE_DECIMALS = 1e18;

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

  //console.log("useAssets farms", farms);

    // 2) 결과를 Map으로 관리
  const [apyMap, setApyMap] = useState<Map<string, BigDecimal>>(new Map());
  const [tvlMap, setTvlMap] = useState<Map<string, BigDecimal | null>>(new Map());
  const [priceMap, setPriceMap] = useState<Map<string, BigDecimal | null>>(new Map());
  
    // aprData (raw parsed data) — 한 번만 fetch하고 forceRefresh 시 초기화
  const [aprDataState, setAprDataState] = useState<any | null>(null);
    // apr 데이터 캐시용 ref (rerender를 억제하기 위해 useRef로 보관)
  const aprDataRef = useRef<any | null>(null);

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
      // aprData를 null로 만들어 다음 run에서 /apr를 재요청하게 함
      await refetchAll();
      await new Promise((res) => setTimeout(res, 50)); // 최신 블록 반영 대기
    } finally {
      setRefreshIndex((i) => i + 1);
    }
  }, [refetchAll]);
  
    useEffect(() => {
    let cancelled = false;

    async function run() {
      // client/ farms 없으면 초기화
      if (!client || farms.length === 0) {
        if (!cancelled) {
          setApyMap(new Map());
          setTvlMap(new Map());
          setPriceMap(new Map());
          // Data는 유지해도 무방하나, 초기 화면 단순화를 위해 null로
          setAprDataState(null);
          lastOutputsRef.current = { apyMap: new Map(), tvlMap: new Map(), priceMap: new Map() };
        }
        return;
      }

      // a) on-chain 계산 (기본값)
      const nextApy = new Map<string, BigDecimal>();
      const nextTvl = new Map<string, BigDecimal | null>();
      const nextPrice = new Map<string, BigDecimal | null>();

      for (const { farm, address } of farms) {
        try {
          const { apy, tvl, price }: FarmCalc = await calcFarmOnce(client, farm as any, assetValues);
          nextApy.set(address, apy);
          nextTvl.set(address, tvl);
          nextPrice.set(address, price);
        } catch (e) {
          // 실패한 vault도 앱 멈추지 않도록 안전한 기본값
          nextApy.set(address, BigDecimal.ZERO());
          nextTvl.set(address, null);
          nextPrice.set(address, null);
        }
      }
      if (cancelled) return;

      // b) TVL 변경 감지
      const lastOut = lastOutputsRef.current;
      const lastTvlNorm = normalizeBDMapFromMap(lastOut.tvlMap as any);
      const nextTvlNorm = normalizeBDMapFromMap(nextTvl as any);
      const tvlChanged = !shallowEqualNormalized(lastTvlNorm, nextTvlNorm);

      // c) /apr 필요 시 fetch (최초 or TVL 변경)
      //    - /apr 실패 → 기존 aprDataRef 유지(화면은 유지)
      //    - 우선 /apr 시도, 실패 시 /apr_data.json 폴백
      if (aprDataRef.current === null || tvlChanged) {
        try {
          let data: any | null = null;
          try {
            const res = await fetch("/apr", { cache: "no-store" });
            data = await res.json();
          } catch {
            // fallback
            const res2 = await fetch("/apr_data.json", { cache: "no-store" });
            data = await res2.json();
          }
          if (cancelled) return;

          aprDataRef.current = data;
          setAprDataState(data);
        } catch (err) {
          // 실패해도 멈추지 않음: 기존 Data 유지
          // aprDataRef.current 그대로 두기 (처음부터 실패라면 null 유지)
          // console.warn("fetch /apr failed", err);
        }
      }

      // d) APY 오버레이: aprDataRef가 있으면 오버레이 계산
      if (aprDataRef.current && aprDataRef.current.apr && Array.isArray(aprDataRef.current.apr)) {
        const list = aprDataRef.current.apr as any[];
        // compositeKey -> apy(decimal number)
        const apyByComposite = new Map<string, number>();

        for (const entry of list) {
          const cid = Number(entry?.chainId ?? 0);
          const addr: string | undefined = entry?.contractAddress;
          const vaults: any[] = Array.isArray(entry?.vaults) ? entry.vaults : [];
          if (!cid || !addr || vaults.length < 3) continue;

          let sum = BigInt(0);               // apr_7d (정수문자열, 18 decimals)
          for (let i = 0; i < 3; i++) {
            const s = vaults[i]?.apr7d ?? "0";
            try { sum += BigInt(s); } catch {}
          }
          const aprDecimal = Number(sum.toString()) / SCALE_DECIMALS; // ex: 0.05
          const base = 1 + aprDecimal / annualBlockQty;
          const apyNumber = Math.pow(base, annualBlockQty) - 1;   // ex: 0.052

          //console.log("useAssets sum",sum, "apyNumber",apyNumber, "addr", addr, "vaults",vaults)


          apyByComposite.set(makeCompositeKey(cid, addr), apyNumber);
          //console.log("useAssets apyByComposite", apyByComposite)
        }

        // farms에 덮어쓰기
        for (const { address } of farms) {
          const key = makeCompositeKey(chainId, address);
          if (apyByComposite.has(key)) {
            const apyNumber = apyByComposite.get(key)!;
            //console.log("useAssets apyNumber",apyNumber)
            try {
              const bd = new BigDecimal(apyNumber, 18); // 소수(18자리)로 저장 (표시는 % 변환)
              nextApy.set(address, bd);
              //console.log("useAssets bd",bd,"addr",address)
            } catch {
              // 변환 실패 시 on-chain 값 유지
            }
          }
        }
        
      }

      if (cancelled) return;

      // e) 변경분만 반영
      const lastApyNorm = normalizeBDMapFromMap(lastOut.apyMap as any);
      const nextApyNorm = normalizeBDMapFromMap(nextApy as any);
      const lastPriceNorm = normalizeBDMapFromMap(lastOut.priceMap as any);
      const nextPriceNorm = normalizeBDMapFromMap(nextPrice as any);

      const apyChanged = !shallowEqualNormalized(lastApyNorm, nextApyNorm);
      const tvlChangedFinal = tvlChanged; // 위에서 계산
      const priceChanged = !shallowEqualNormalized(lastPriceNorm, nextPriceNorm);

      if (apyChanged) setApyMap(nextApy);
      if (tvlChangedFinal) setTvlMap(nextTvl);
      if (priceChanged) setPriceMap(nextPrice);

      if (apyChanged || tvlChangedFinal || priceChanged) {
        lastOutputsRef.current = { apyMap: nextApy, tvlMap: nextTvl, priceMap: nextPrice };
      }
    }

    run();

    return () => { cancelled = true; };
    // 가격/밸런스/유니스왑 버전 + farms + refreshIndex 변화 시 run
  }, [client, farms, chainLinkVersion, uniswapVersion, balancesVersion, refreshIndex, assetValues, chainId]);

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
      aprDataState,
      refetchAll,
      forceRefresh, //추가
      isFetching: assetValues.isFetching || balances.isFetching,
    }),
    [assetValues, balances, farmValues, aprDataState, refetchAll, forceRefresh, assetValues.isFetching, balances.isFetching],
  );
  console.log("useAssets assets", assets);

  return assets;
}
