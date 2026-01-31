import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";

import useAccountBalances from "./useAccountBalances";
import { useAssetValues } from "./useAssetValues";

import { FarmList } from "@/const/farmInfo";
import { calcFarmOnce, FarmCalc } from "@/utils/farm/calcFarmOnce";
import { BigDecimal } from "@/types/BigDecimal";
import {
  bumpFarmDataGeneration,
  prefetchFarmData,
} from "@/utils/farm/farmDataCache";
import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  isBirdieLPFarm,
  isBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import useAccountPoints from "./useAccountPoints";
import type { aprDataState as AprDataState } from "@/app/AssetsContextProvider";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { normalizeCoingeckoAddress } from "@/utils/prices/coingeckoUsd";
import { findSymbolByAddress } from "@/utils/assets/getTokenSymbol";
import { getUsdPriceWithFallback } from "@/utils/prices/getUsdPriceWithFallback";

type FarmValuesRecord = Record<
  string,
  { apy: BigDecimal; tvl: BigDecimal | null; price: BigDecimal | null }
>;

type AddrMap = Record<number | string, `0x${string}`>;

type UnderlyingTokenInfo = {
  address: `0x${string}` | null;
  balance: BigDecimal | null;
};

type UnderlyingEntry = {
  token0: UnderlyingTokenInfo;
  token1: UnderlyingTokenInfo | null;
};

type FarmRawSingle = {
  type: string;
  symbol: string;
  addresses: AddrMap;
  decimals: number;
  displayDecimals?: number;
  fullName?: string;
  iconSrc?: string;
  input: [any];
  totalUnderlyingToken: [
    { address: `0x${string}` | null; value: BigDecimal | null },
  ];
  totalSupply: BigDecimal | null;
};

type FarmRawLP = {
  type: string;
  symbol: string;
  addresses: AddrMap;
  decimals: number;
  displayDecimals?: number;
  fullName?: string;
  iconSrc?: string;
  input: [any, any];
  totalUnderlyingToken: [
    { address: `0x${string}` | null; value: BigDecimal | null },
    { address: `0x${string}` | null; value: BigDecimal | null },
  ];
  totalSupply: BigDecimal | null;
};

type FarmRaw = FarmRawSingle | FarmRawLP;

function normalizeBDMapFromMap(
  m: Map<string, BigDecimal | null>,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  m.forEach((v, k) => {
    out[k] = v ? v.toString() : null;
  });
  return out;
}

function normalizeUnderlyingMap(
  m: Map<string, UnderlyingEntry>,
): Record<string, string> {
  const out: Record<string, string> = {};
  m.forEach((v, k) => {
    const t0 = v?.token0;
    const t1 = v?.token1;
    out[k] =
      `${t0?.address ?? "null"}:${t0?.balance?.toString?.() ?? "null"}|` +
      `${t1?.address ?? "null"}:${t1?.balance?.toString?.() ?? "null"}`;
  });
  return out;
}

function shallowEqualNormalized(
  a: Record<string, string | null>,
  b: Record<string, string | null>,
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

function toScaled1e18FromDecimalString(s: string | null | undefined): bigint {
  if (!s) return BigInt(0);
  const raw = String(s).trim();
  if (!raw || raw === "NaN") return BigInt(0);

  const cleaned = raw.replace(/,/g, "");
  const [intPartRaw, fracRaw = ""] = cleaned.split(".");
  const intPart = intPartRaw.replace(/[^0-9]/g, "");
  const frac18 = (fracRaw.replace(/[^0-9]/g, "") + "0".repeat(18)).slice(0, 18);
  if (!intPart) return BigInt(0);

  try {
    return BigInt(intPart + frac18);
  } catch {
    return BigInt(0);
  }
}

const TargetBlockTime = 24 * 60 * 60;
const annualBlockQty = Math.floor((365 * 24 * 60 * 60) / TargetBlockTime);

export default function useAssets() {
  const { address } = useAccount();
  const chainId = useChainId();
  const client = usePublicClient();

  const assetValues = useAssetValues();
  const [aprDataState, setAprDataState] = useState<AprDataState | null>(null);
  const aprDataRef = useRef<AprDataState | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [farmRefreshIndex, setFarmRefreshIndex] = useState(0);

  const aprList = useMemo(() => aprDataState?.apr ?? [], [aprDataState]);
  const baseBalances = useAccountBalances(aprList, String(refreshIndex));

  const pointsQ = useAccountPoints(address);

  const farms = useMemo(() => {
    return FarmList.map((f) => {
      const farm = f?.wip_stakeToken as
        | IBirdieSingleFarm
        | IBirdieLPFarm
        | undefined;
      const address = farm?.addresses?.[chainId] as `0x${string}` | undefined;
      return { farm, address };
    }).filter(
      (
        x,
      ): x is { farm: NonNullable<typeof x.farm>; address: `0x${string}` } => {
        try {
          return (
            !!x.address &&
            /^0x[0-9a-fA-F]+$/.test(x.address) &&
            BigInt(x.address) !== BigInt(0)
          );
        } catch {
          return false;
        }
      },
    );
  }, [chainId]);

  const [apyMap, setApyMap] = useState<Map<string, BigDecimal>>(new Map());
  const [tvlMap, setTvlMap] = useState<Map<string, BigDecimal | null>>(
    new Map(),
  );
  const [priceMap, setPriceMap] = useState<Map<string, BigDecimal | null>>(
    new Map(),
  );
  const [underlyingMap, setUnderlyingMap] = useState<
    Map<string, UnderlyingEntry>
  >(new Map());
  const [totalSupplyMap, setTotalSupplyMap] = useState<
    Map<string, BigDecimal | null>
  >(new Map());

  const [farmRawMap, setFarmRawMap] = useState<Map<string, FarmRaw>>(new Map());

  const lastOutputsRef = useRef<{
    apyMap: Map<string, BigDecimal>;
    tvlMap: Map<string, BigDecimal | null>;
    priceMap: Map<string, BigDecimal | null>;
    underlyingMap: Map<string, UnderlyingEntry>;
    totalSupplyMap: Map<string, BigDecimal | null>;
  }>({
    apyMap: new Map(),
    tvlMap: new Map(),
    priceMap: new Map(),
    underlyingMap: new Map(),
    totalSupplyMap: new Map(),
  });

  const chainLinkVersion = useMemo(() => {
    const arr: string[] = [];
    assetValues.chainLinkPriceMap.forEach((v, k) => {
      arr.push(
        `${k}:${v.price?.toString?.() ?? "null"}:${v.roundId?.toString?.() ?? ""}`,
      );
    });
    return arr.sort().join("|");
  }, [assetValues.chainLinkPriceMap]);

  const uniswapVersion = useMemo(() => {
    const arr: string[] = [];
    assetValues.uniswapPriceMap.forEach((v, k) => {
      arr.push(
        `${k}:${v.baseBalance?.toString?.() ?? "0"}:${v.quoteBalance?.toString?.() ?? "0"}`,
      );
    });
    return arr.sort().join("|");
  }, [assetValues.uniswapPriceMap]);

  const coingeckoVersion = useMemo(() => {
    const arr: string[] = [];
    assetValues.coingeckoPriceMap?.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "null"}`);
    });
    return arr.sort().join("|");
  }, [assetValues.coingeckoPriceMap]);

  const coingeckoSymbolVersion = useMemo(() => {
    const arr: string[] = [];
    assetValues.coingeckoSymbolPriceMap?.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "null"}`);
    });
    return arr.sort().join("|");
  }, [assetValues.coingeckoSymbolPriceMap]);

  // ✅ balancesVersion 계산은 이미 OK. 단, 이걸 assets로 노출해야 함.
  const balancesVersion = useMemo(() => {
    const arr: string[] = [];

    baseBalances.tokenBalances.balanceMap.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "0"}`);
    });
    baseBalances.singleVaultBalances.balanceMap.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "0"}`);
    });
    baseBalances.lpVaultBalances.balanceMap.forEach((v, k) => {
      arr.push(`${k}:${v?.toString?.() ?? "0"}`);
    });

    const stakedByInput = (baseBalances as any)?.stakedBalances
      ?.byInputTokenAddress as Map<string, { value: any }> | undefined;

    if (stakedByInput) {
      stakedByInput.forEach((entry, k) => {
        arr.push(`staked:${k}:${entry?.value?.toString?.() ?? "0"}`);
      });
    }

    return arr.sort().join("|");
  }, [
    baseBalances.tokenBalances.balanceMap,
    baseBalances.singleVaultBalances.balanceMap,
    baseBalances.lpVaultBalances.balanceMap,
    (baseBalances as any)?.stakedBalances?.byInputTokenAddress,
  ]);

  const balances = baseBalances;

  const chainlinkReady = useMemo(() => {
    const data = assetValues?.chainLinkData?.data;
    if (!data) return false;
    return !assetValues?.chainLinkData?.isFetching;
  }, [
    assetValues?.chainLinkData?.data,
    assetValues?.chainLinkData?.isFetching,
  ]);

  const hasChainlinkPrice = useCallback(
    (symbol?: string) => {
      if (!symbol) return false;
      const map = assetValues.chainLinkPriceMap;
      const direct = map.get(`LINK:${symbol}_USD`)?.price;
      if (direct && !direct.isZero()) return true;
      if (symbol === "ETH") {
        const price = map.get("LINK:WETH_USD")?.price ?? null;
        return !!price && !price.isZero();
      }
      if (symbol === "WETH") {
        const price = map.get("LINK:ETH_USD")?.price ?? null;
        return !!price && !price.isZero();
      }
      return false;
    },
    [assetValues.chainLinkPriceMap],
  );

  useEffect(() => {
    if (!chainId) return;
    if (!chainlinkReady) return;
    if (!assetValues?.refetchCoingeckoPrices) return;
    if (!farms.length) return;

    const addrs: Array<string | null | undefined> = [];
    const symbols: Array<string | null | undefined> = [];
    const cgMap = assetValues.coingeckoPriceMap;
    const cgSymbolMap = assetValues.coingeckoSymbolPriceMap;

    for (const { farm } of farms) {
      if (isBirdieSingleFarm(farm)) {
        const token = farm.input;
        if (!hasChainlinkPrice(token?.symbol)) {
          const addr = getTokenAddress({ token, chainId });
          const normalized = normalizeCoingeckoAddress(addr, chainId);
          if (addr && normalized && !cgMap.has(normalized)) addrs.push(addr);
          const symbolKey = String(token?.symbol ?? "")
            .trim()
            .toLowerCase();
          if (symbolKey && !cgSymbolMap.has(symbolKey)) symbols.push(symbolKey);
        }
        continue;
      }
      if (isBirdieLPFarm(farm)) {
        const t0 = farm.swap?.input?.[0]?.input;
        const t1 = farm.swap?.input?.[1]?.input;
        if (!hasChainlinkPrice(t0?.symbol)) {
          const addr = getTokenAddress({ token: t0 as any, chainId });
          const normalized = normalizeCoingeckoAddress(addr, chainId);
          if (addr && normalized && !cgMap.has(normalized)) addrs.push(addr);
          const symbolKey = String(t0?.symbol ?? "")
            .trim()
            .toLowerCase();
          if (symbolKey && !cgSymbolMap.has(symbolKey)) symbols.push(symbolKey);
        }
        if (!hasChainlinkPrice(t1?.symbol)) {
          const addr = getTokenAddress({ token: t1 as any, chainId });
          const normalized = normalizeCoingeckoAddress(addr, chainId);
          if (addr && normalized && !cgMap.has(normalized)) addrs.push(addr);
          const symbolKey = String(t1?.symbol ?? "")
            .trim()
            .toLowerCase();
          if (symbolKey && !cgSymbolMap.has(symbolKey)) symbols.push(symbolKey);
        }
      }
    }

    if (addrs.length > 0) assetValues.refetchCoingeckoPrices(addrs);
    if (symbols.length > 0) assetValues.refetchCoingeckoSymbolPrices?.(symbols);
  }, [
    assetValues?.refetchCoingeckoPrices,
    assetValues?.refetchCoingeckoSymbolPrices,
    assetValues.coingeckoPriceMap,
    assetValues.coingeckoSymbolPriceMap,
    chainId,
    chainlinkReady,
    farms,
    hasChainlinkPrice,
  ]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      assetValues?.refetchUnderlying?.(),
      assetValues?.chainLinkData?.refetch?.(),
      balances?.query?.refetch?.(),
    ]);
  }, [
    assetValues?.refetchUnderlying,
    assetValues?.chainLinkData?.refetch,
    balances?.query?.refetch,
  ]);

  // ✅ “리렌더(=balancesVersion 반영)”까지 기다리는 함수
  const waitForBalancesVersionChange = useCallback(
    async (
      prevVersion: string,
      opts?: { timeoutMs?: number; intervalMs?: number },
    ) => {
      const timeoutMs = opts?.timeoutMs ?? 10000;
      const intervalMs = opts?.intervalMs ?? 80;

      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (balancesVersion !== prevVersion) return true;
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      return false;
    },
    [balancesVersion],
  );

  const forceRefresh = useCallback(async () => {
    // Farm TVL/price는 캐시를 쓰므로 강제 갱신 시 무효화 필요
    bumpFarmDataGeneration();
    setFarmRefreshIndex((i) => i + 1);

    const prevVersion = balancesVersion;
    await refetchAll();

    const changed = await waitForBalancesVersionChange(prevVersion, {
      timeoutMs: 2000,
      intervalMs: 80,
    });

    if (!changed) {
      setRefreshIndex((i) => i + 1);
    }
  }, [balancesVersion, refetchAll, waitForBalancesVersionChange]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!client || farms.length === 0) {
        if (!cancelled) {
          setApyMap(new Map());
          setTvlMap(new Map());
          setPriceMap(new Map());
          setUnderlyingMap(new Map());
          setTotalSupplyMap(new Map());
          setAprDataState(null);
          lastOutputsRef.current = {
            apyMap: new Map(),
            tvlMap: new Map(),
            priceMap: new Map(),
            underlyingMap: new Map(),
            totalSupplyMap: new Map(),
          };
        }
        return;
      }

      const nextApy = new Map<string, BigDecimal>();
      const nextTvl = new Map<string, BigDecimal | null>();
      const nextPrice = new Map<string, BigDecimal | null>();
      const nextUnderlying = new Map<string, UnderlyingEntry>();
      const nextTotalSupply = new Map<string, BigDecimal | null>();

      for (const { farm, address } of farms) {
        try {
          const { apy, tvl, price, underlying, totalSupply }: FarmCalc =
            await calcFarmOnce(client, farm as any, assetValues);
          nextApy.set(address, apy);
          nextTvl.set(address, tvl);
          nextPrice.set(address, price);
          nextUnderlying.set(address, underlying);
          nextTotalSupply.set(address, totalSupply ?? null);
        } catch {
          nextApy.set(address, BigDecimal.ZERO());
          nextTvl.set(address, null);
          nextPrice.set(address, null);
          nextUnderlying.set(address, {
            token0: { address: null, balance: null },
            token1: null,
          });
          nextTotalSupply.set(address, null);
        }
      }
      if (cancelled) return;

      const lastOut = lastOutputsRef.current;
      const lastTvlNorm = normalizeBDMapFromMap(lastOut.tvlMap as any);
      const nextTvlNorm = normalizeBDMapFromMap(nextTvl as any);
      const tvlChanged = !shallowEqualNormalized(lastTvlNorm, nextTvlNorm);

      const chainIdStr = (() => {
        const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
          .toString()
          .trim()
          .toLowerCase();
        return mode === "dev" ? "0" : String(chainId);
      })();

      if (aprDataRef.current === null || tvlChanged) {
        try {
          let data: any | null = null;
          try {
            const res = await fetch(`/apr/${chainIdStr}`, {
              cache: "no-store",
            });
            data = await res.json();
          } catch {
            const res2 = await fetch("/apr_data.json", { cache: "no-store" });
            data = await res2.json();
          }
          if (cancelled) return;

          aprDataRef.current = data;
          setAprDataState(data);
        } catch {
          // ignore
        }
      }

      if (
        aprDataRef.current &&
        aprDataRef.current.apr &&
        Array.isArray(aprDataRef.current.apr)
      ) {
        const list = aprDataRef.current.apr as any[];
        const apyByComposite = new Map<string, number>();
        const tokenPriceCache = new Map<string, BigDecimal | null>();

        const safeApr = (value: unknown) => {
          try {
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "bigint" ||
              typeof value === "boolean"
            ) {
              return BigInt(value);
            }
          } catch {}
          return BigInt(0);
        };

        const getTokenUsdPrice = async (
          address: `0x${string}` | null | undefined,
        ) => {
          if (!address || !assetValues || !chainId) return null;
          const key = address.toLowerCase();
          if (tokenPriceCache.has(key)) {
            return tokenPriceCache.get(key) ?? null;
          }
          const symbol = findSymbolByAddress(address, chainId);
          const price = await getUsdPriceWithFallback({
            assetValues,
            chainId,
            symbol,
            address,
          });
          tokenPriceCache.set(key, price ?? null);
          return price ?? null;
        };

        for (const entry of list) {
          const rawCid = (entry?.chainId ?? "").toString().trim();
          const cid = rawCid === "0" ? chainId : Number(rawCid);
          const addr: string | undefined = entry?.contractAddress;
          const vaults: any[] = Array.isArray(entry?.vaults)
            ? entry.vaults
            : [];
          if (!cid || !addr || vaults.length < 1) continue;

          const SUM_LIMIT = BigInt(4644420100000000000);
          const APY_CAP_PERCENT = 99.99999;
          const SCALE_1E18 = BigInt(10) ** BigInt(18);

          const apr0 = safeApr(vaults[0]?.apr7d);
          const apr1 = safeApr(vaults[1]?.apr7d);
          const apr2 = safeApr(vaults[2]?.apr7d);

          let sum = apr0 + apr1 + apr2;
          const underlying = nextUnderlying.get(addr as `0x${string}`);
          const tvlBD = nextTvl.get(addr as `0x${string}`);
          const tvlScaled = toScaled1e18FromDecimalString(tvlBD?.toString?.());

          if (tvlScaled > BigInt(0)) {
            let usd0Scaled = BigInt(0);
            let usd1Scaled = BigInt(0);

            if (underlying?.token0?.address && underlying?.token0?.balance) {
              const price0 = await getTokenUsdPrice(underlying.token0.address);
              if (price0) {
                const usd0 = underlying.token0.balance.mul(price0);
                usd0Scaled = toScaled1e18FromDecimalString(usd0.toString());
              }
            }

            if (underlying?.token1?.address && underlying?.token1?.balance) {
              const price1 = await getTokenUsdPrice(underlying.token1.address);
              if (price1) {
                const usd1 = underlying.token1.balance.mul(price1);
                usd1Scaled = toScaled1e18FromDecimalString(usd1.toString());
              }
            }

            if (usd0Scaled > BigInt(0) || usd1Scaled > BigInt(0)) {
              const weighted =
                (usd0Scaled * apr0 + usd1Scaled * apr1) / tvlScaled;
              sum = weighted + apr2;
            }
          }

          let extraScaledTotal = BigInt(0);
          const extraList: any[] = Array.isArray(entry?.staking?.extraRewards)
            ? entry.staking.extraRewards
            : [];

          if (extraList.length > 0) {
            const pBD = nextPrice.get(addr as `0x${string}`);
            const priceScaled = toScaled1e18FromDecimalString(
              pBD?.toString?.(),
            );

            if (priceScaled > BigInt(0)) {
              // console.log("[7d APY extra priceScaled]", {
              //   chainId: cid,
              //   address: addr,
              //   priceScaled: priceScaled.toString(),
              //   price: pBD?.toString?.(),
              // });
              for (const er of extraList) {
                const rawX18 = er?.dailyRewardPerTokenX18 ?? "0";
                const decimals = Number(er?.decimals ?? 18);
                let dailyX18 = BigInt(0);
                try {
                  dailyX18 = BigInt(rawX18);
                } catch {}
                if (dailyX18 <= BigInt(0)) continue;
                const denomPow = BigInt(10) ** BigInt(Math.max(0, decimals));

                let rewardPriceScaled = toScaled1e18FromDecimalString(
                  er?.priceUSD?.toString?.(),
                );

                if (rewardPriceScaled <= BigInt(0) && er?.contractAddress) {
                  const fallbackPrice = await getTokenUsdPrice(
                    er.contractAddress,
                  );
                  if (fallbackPrice) {
                    rewardPriceScaled = toScaled1e18FromDecimalString(
                      fallbackPrice.toString(),
                    );
                  }
                }

                if (rewardPriceScaled <= BigInt(0)) continue;

                const numerator = dailyX18 * BigInt(365) * rewardPriceScaled;
                const useTvl = tvlScaled > BigInt(0);
                const denominator =
                  denomPow * (useTvl ? tvlScaled : priceScaled);
                if (denominator === BigInt(0)) continue;

                // use TVL when available (RewardInfoPanel logic), fallback to price per share
                const extraScaled = numerator / denominator;
                if (extraScaled > BigInt(0)) extraScaledTotal += extraScaled;
              }
            }
          }

          const totalScaled = sum + extraScaledTotal;

          let apyNumber: number;
          if (totalScaled > SUM_LIMIT) {
            apyNumber = APY_CAP_PERCENT;
          } else {
            const totalAprDecimal = Number(totalScaled) / 1e18;
            const base = 1 + totalAprDecimal / annualBlockQty;
            apyNumber = Math.pow(base, annualBlockQty) - 1;
          }

          apyByComposite.set(makeCompositeKey(cid, addr), apyNumber);
        }

        for (const { address } of farms) {
          const key = makeCompositeKey(chainId, address);
          if (apyByComposite.has(key)) {
            const apyNumber = apyByComposite.get(key)!;
            try {
              const bd = new BigDecimal(apyNumber, 18);
              nextApy.set(address, bd);
            } catch {}
          }
        }
      }

      if (cancelled) return;

      const lastApyNorm = normalizeBDMapFromMap(lastOut.apyMap as any);
      const nextApyNorm = normalizeBDMapFromMap(nextApy as any);
      const lastPriceNorm = normalizeBDMapFromMap(lastOut.priceMap as any);
      const nextPriceNorm = normalizeBDMapFromMap(nextPrice as any);
      const lastUnderlyingNorm = normalizeUnderlyingMap(
        lastOut.underlyingMap as any,
      );
      const nextUnderlyingNorm = normalizeUnderlyingMap(nextUnderlying as any);
      const lastSupplyNorm = normalizeBDMapFromMap(
        lastOut.totalSupplyMap as any,
      );
      const nextSupplyNorm = normalizeBDMapFromMap(nextTotalSupply as any);

      const apyChanged = !shallowEqualNormalized(lastApyNorm, nextApyNorm);
      const priceChanged = !shallowEqualNormalized(
        lastPriceNorm,
        nextPriceNorm,
      );
      const underlyingChanged = !shallowEqualNormalized(
        lastUnderlyingNorm,
        nextUnderlyingNorm,
      );
      const totalSupplyChanged = !shallowEqualNormalized(
        lastSupplyNorm,
        nextSupplyNorm,
      );

      if (apyChanged) setApyMap(nextApy);
      if (tvlChanged) setTvlMap(nextTvl);
      if (priceChanged) setPriceMap(nextPrice);
      if (underlyingChanged) setUnderlyingMap(nextUnderlying);
      if (totalSupplyChanged) setTotalSupplyMap(nextTotalSupply);

      if (
        apyChanged ||
        tvlChanged ||
        priceChanged ||
        underlyingChanged ||
        totalSupplyChanged
      ) {
        lastOutputsRef.current = {
          apyMap: nextApy,
          tvlMap: nextTvl,
          priceMap: nextPrice,
          underlyingMap: nextUnderlying,
          totalSupplyMap: nextTotalSupply,
        };
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [
    client,
    farms,
    chainLinkVersion,
    uniswapVersion,
    coingeckoVersion,
    coingeckoSymbolVersion,
    balancesVersion,
    refreshIndex,
    chainId,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function runFarmRaw() {
      if (!client || farms.length === 0) {
        if (!cancelled) setFarmRawMap(new Map());
        return;
      }

      const next = new Map<string, FarmRaw>();

      const withTimeout = <T>(p: Promise<T>, ms: number, label: string) =>
        new Promise<T>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error(`timeout:${label}`)), ms);
          p.then((v) => {
            clearTimeout(t);
            resolve(v);
          }).catch((e) => {
            clearTimeout(t);
            reject(e);
          });
        });

      const results = await Promise.allSettled(
        farms.map(async ({ farm, address }) => {
          const tag = `${farm.type}:${farm.symbol}:${address}`;
          console.debug("[farmRaw] start", tag);

          const { liquidity, totalSupply } = await withTimeout(
            prefetchFarmData(client, farm),
            12000,
            `prefetch:${tag}`,
          );

          console.debug("[farmRaw] prefetch done", tag);

          if (farm.type === "BirdieSingle") {
            const underlyingAddr =
              ((farm as IBirdieSingleFarm)?.input?.addresses?.[chainId] as
                | `0x${string}`
                | undefined) ?? null;

            next.set(address, {
              type: farm.type,
              symbol: farm.symbol,
              addresses: farm.addresses as AddrMap,
              decimals: farm.decimals,
              displayDecimals: (farm as any).displayDecimals,
              fullName: (farm as any).fullName,
              iconSrc: (farm as any).iconSrc,
              input: [(farm as IBirdieSingleFarm).input],
              totalUnderlyingToken: [
                {
                  address: underlyingAddr,
                  value: (liquidity as BigDecimal | null) ?? null,
                },
              ],
              totalSupply: (totalSupply as BigDecimal | null) ?? null,
            } as FarmRawSingle);
          } else {
            const [addr0, val0, addr1, val1] = (
              Array.isArray(liquidity)
                ? (liquidity as [
                    `0x${string}` | null,
                    BigDecimal | null,
                    `0x${string}` | null,
                    BigDecimal | null,
                  ])
                : [null, null, null, null]
            ) as [
              `0x${string}` | null,
              BigDecimal | null,
              `0x${string}` | null,
              BigDecimal | null,
            ];

            const inputs = [
              (farm as IBirdieLPFarm)?.swap?.input?.[0],
              (farm as IBirdieLPFarm)?.swap?.input?.[1],
            ] as [any, any];

            next.set(address, {
              type: farm.type,
              symbol: farm.symbol,
              addresses: farm.addresses as AddrMap,
              decimals: farm.decimals,
              displayDecimals: (farm as any).displayDecimals,
              fullName: (farm as any).fullName,
              iconSrc: (farm as any).iconSrc,
              input: inputs,
              totalUnderlyingToken: [
                { address: addr0, value: val0 },
                { address: addr1, value: val1 },
              ],
              totalSupply: (totalSupply as BigDecimal | null) ?? null,
            } as FarmRawLP);
          }

          console.debug("[farmRaw] build done", tag);
          return { address: address as string, ok: true };
        }),
      );

      results.forEach((r, idx) => {
        const { farm, address } = farms[idx]!;
        const tag = `${farm.type}:${farm.symbol}:${address}`;
        if (r.status === "rejected") {
          console.warn("[farmRaw] failed", tag, r.reason?.message ?? r.reason);
        }
      });

      if (!cancelled) setFarmRawMap(next);
    }

    runFarmRaw();
    return () => {
      cancelled = true;
    };
  }, [client, farms, chainId, farmRefreshIndex]);

  const farmValues = useMemo(() => {
    return { apyMap, tvlMap, priceMap, underlyingMap, totalSupplyMap };
  }, [apyMap, tvlMap, priceMap, underlyingMap, totalSupplyMap]);

  const assets = useMemo(
    () => ({
      assetValues,
      balances,
      farmValues,
      farmRaw: farmRawMap,
      aprDataState,

      userPoints: pointsQ.data,
      isPointsLoading: pointsQ.isLoading,
      refetchPoints: pointsQ.refetch,

      refetchAll,
      forceRefresh,

      // ✅ 추가: 외부에서 “업데이트 완료 여부”를 기다리기 위해 노출
      balancesVersion,
      waitForBalancesVersionChange,

      isFetching:
        assetValues.isFetching || balances.isFetching || pointsQ.isLoading,
    }),
    [
      assetValues,
      balances,
      farmValues,
      aprDataState,
      farmRawMap,
      refetchAll,
      forceRefresh,
      balancesVersion,
      waitForBalancesVersionChange,
      assetValues.isFetching,
      balances.isFetching,
      pointsQ.data,
      pointsQ.isLoading,
    ],
  );

  console.log("useAssets assets", assets);
  return assets;
}
