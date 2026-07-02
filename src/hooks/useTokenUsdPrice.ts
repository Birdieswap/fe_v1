// src/hooks/prices/useTokenUsdPrice.ts
import { useEffect, useMemo, useState } from "react";
import useChainLinkPrice from "./useChainLinkPrice"; // 기존 훅

type TokenLike = {
  symbol?: string;
  decimals?: number;
  addresses?: Record<number, string> | string;
};

const CG_CACHE_MS = 60_000;
const cgCache = new Map<string, { ts: number; usd: number | null }>();

export default function useTokenUsdPrice(token?: TokenLike) {
  // 1) Chainlink 우선
  const chainlink = useChainLinkPrice(token as any); // BigDecimal | undefined
  const chainlinkUsd = useMemo(() => {
    if (!chainlink) return null;
    try {
      // BigDecimal -> number(가벼운 화면용)
      return Number(chainlink.toPrecisionString(false, false));
    } catch {
      return null;
    }
  }, [chainlink]);

  const [cgUsd, setCgUsd] = useState<number | null>(null);

  const cgSymbol = useMemo(() => {
    const s = String(token?.symbol ?? "").trim();
    return s ? s : null;
  }, [token?.symbol]);
  const cgSymbolLower = useMemo(
    () => (cgSymbol ? cgSymbol.toLowerCase() : null),
    [cgSymbol]
  );

  const shouldUseCg = useMemo(() => {
    // chainlink가 있으면 끝
    if (chainlinkUsd != null && Number.isFinite(chainlinkUsd)) return false;
    // 심볼이 없으면 못 침
    if (!cgSymbolLower) return false;
    // (선택) native ETH는 chainlink로 처리한다고 가정 → cg 미사용
    // if (String(token?.symbol ?? "").toUpperCase() === "ETH") return false;
    return true;
  }, [chainlinkUsd, cgSymbolLower, token?.symbol]);

  useEffect(() => {
    if (!shouldUseCg || !cgSymbolLower) {
      setCgUsd(null);
      return;
    }

    let cancelled = false;
    const cacheKey = cgSymbolLower;
    const cached = cgCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CG_CACHE_MS) {
      setCgUsd(cached.usd);
      return;
    }

    (async () => {
      try {
        const qs = new URLSearchParams({
          symbols: cgSymbolLower,
        });
        const res = await fetch(`/api/coingecko/usd?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const usd = Number(data?.usd);
        const finalUsd = Number.isFinite(usd) ? usd : null;
        cgCache.set(cacheKey, { ts: Date.now(), usd: finalUsd });
        if (!cancelled) setCgUsd(finalUsd);
      } catch {
        if (!cancelled) setCgUsd(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldUseCg, cgSymbol, cgSymbolLower]);

  // console.log("[useTokenUsdPrice]", {
  //   token: token?.symbol,
  //   cgSymbol,
  //   chainlinkUsd,
  //   cgUsd,
  //   finalUsd: chainlinkUsd != null ? chainlinkUsd : shouldUseCg ? cgUsd : null,
  //   source:
  //     chainlinkUsd != null ? "chainlink" : shouldUseCg ? "coingecko" : "none",
  // });

  return {
    priceUsd: chainlinkUsd ?? cgUsd, // 최종
    source:
      chainlinkUsd != null ? "chainlink" : shouldUseCg ? "coingecko" : "none",
    chainlinkUsd,
    coingeckoUsd: cgUsd,
  } as const;
}
