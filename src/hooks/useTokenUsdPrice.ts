// src/hooks/prices/useTokenUsdPrice.ts
import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";
import useChainLinkPrice from "./useChainLinkPrice"; // 기존 훅
import tokens from "@/const/contracts/tokens/tokens";

type TokenLike = {
  symbol?: string;
  decimals?: number;
  addresses?: Record<number, string> | string;
};

const CG_SUPPORTED_CHAINS = new Set([1, 8453, 42161, 10, 137, 56]);
const CG_FALLBACK_CHAIN_ORDER = [8453, 42161, 1, 10, 137, 56];

function getTokenAddressByChain(token?: any, chainId?: number): string | null {
  if (!token || !chainId) return null;

  // ETH -> WETH (원하면 여기서 native는 null 반환해서 CoinGecko 안 치게 해도 됨)
  if (String(token.symbol ?? "").toUpperCase() === "ETH") {
    return (tokens.WETH?.addresses?.[chainId] ?? null) as string | null;
  }

  const addr =
    typeof token.addresses === "string"
      ? token.addresses
      : token.addresses?.[chainId];

  return typeof addr === "string" && addr.length > 0 ? addr : null;
}

function resolveCgTarget(
  token?: any,
  chainId?: number
): { address: string; chainId: number } | null {
  if (!token) return null;

  if (chainId && CG_SUPPORTED_CHAINS.has(chainId)) {
    const addr = getTokenAddressByChain(token, chainId);
    if (addr) return { address: addr, chainId };
  }

  if (typeof token.addresses === "string") {
    if (chainId && CG_SUPPORTED_CHAINS.has(chainId)) {
      return { address: token.addresses, chainId };
    }
    return null;
  }

  const map = token.addresses as Record<number, string> | undefined;
  if (!map) return null;

  for (const cid of CG_FALLBACK_CHAIN_ORDER) {
    const addr = map[cid];
    if (addr) return { address: addr, chainId: cid };
  }

  return null;
}

export default function useTokenUsdPrice(token?: TokenLike) {
  const chainId = useChainId();

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

  const cgTarget = useMemo(
    () => resolveCgTarget(token, chainId),
    [token, chainId]
  );

  const shouldUseCg = useMemo(() => {
    // chainlink가 있으면 끝
    if (chainlinkUsd != null && Number.isFinite(chainlinkUsd)) return false;
    // 주소가 없으면 못 침
    if (!cgTarget?.address || !cgTarget?.chainId) return false;
    // (선택) native ETH는 chainlink로 처리한다고 가정 → cg 미사용
    // if (String(token?.symbol ?? "").toUpperCase() === "ETH") return false;
    return true;
  }, [chainlinkUsd, cgTarget, token?.symbol]);

  useEffect(() => {
    if (!shouldUseCg || !cgTarget?.chainId || !cgTarget?.address) {
      setCgUsd(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const qs = new URLSearchParams({
          chainId: String(cgTarget.chainId),
          address: cgTarget.address,
        });
        const res = await fetch(`/api/coingecko/usd?${qs.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        console.log("[coingecko usd]", {
          qs: qs.toString(),
          chainId: cgTarget.chainId,
          tokenAddress: cgTarget.address,
          httpStatus: res.status,
          data, // { usd, reason, ok, platform, ... }
        });
        const usd = Number(data?.usd);
        const finalUsd = Number.isFinite(usd) ? usd : null;
        if (!cancelled) setCgUsd(finalUsd);
      } catch {
        if (!cancelled) setCgUsd(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldUseCg, cgTarget]);

  console.log("[useTokenUsdPrice]", {
    cgTarget,
    token: token?.symbol,
    chainId,
    chainlinkUsd,
    cgUsd,
    finalUsd: chainlinkUsd != null ? chainlinkUsd : shouldUseCg ? cgUsd : null,
    source:
      chainlinkUsd != null ? "chainlink" : shouldUseCg ? "coingecko" : "none",
  });

  return {
    priceUsd: chainlinkUsd ?? cgUsd, // 최종
    source:
      chainlinkUsd != null ? "chainlink" : shouldUseCg ? "coingecko" : "none",
    chainlinkUsd,
    coingeckoUsd: cgUsd,
  } as const;
}
