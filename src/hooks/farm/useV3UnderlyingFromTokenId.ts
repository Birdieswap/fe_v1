import { useEffect, useState } from "react";
import { formatUnits, PublicClient } from "viem";
import { readContract } from "viem/actions";
import { Pool as V3Pool, Position as V3Position } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";

import { BigDecimal } from "@/types/BigDecimal";
import miscContracts from "@/const/contracts/tokens/others";
import { uniswap_pool_v3_abi } from "@/const/contracts/abis/uniswap_pool_v3_abi";
import {
  fetchV3Position,
  type V3PositionRaw,
} from "@/utils/uniswap/positionManager";
import previewRedeem from "@/utils/farm/previewRedeem";

type UseV3UnderlyingParams = {
  client: PublicClient | undefined;
  chainId?: number;
  tokenId?: bigint;
  uniswapPoolAddress?: `0x${string}`;
  bToken0: any;
  bToken1: any;
};

type UseV3UnderlyingResult = {
  underlying0: BigDecimal | null;
  underlying1: BigDecimal | null;
  v3Position: V3PositionRaw | null;
  v3Pool: V3Pool | null;
};

export function useV3UnderlyingFromTokenId(
  params: UseV3UnderlyingParams
): UseV3UnderlyingResult {
  const { client, chainId, tokenId, uniswapPoolAddress, bToken0, bToken1 } =
    params;

  const [underlying0, setUnderlying0] = useState<BigDecimal | null>(null);
  const [underlying1, setUnderlying1] = useState<BigDecimal | null>(null);
  const [v3Position, setV3Position] = useState<V3PositionRaw | null>(null);
  const [v3Pool, setV3Pool] = useState<V3Pool | null>(null);

  useEffect(() => {
    // 기본 가드
    if (
      !client ||
      !chainId ||
      !tokenId ||
      tokenId === 0n ||
      !uniswapPoolAddress
    ) {
      setUnderlying0(null);
      setUnderlying1(null);
      setV3Position(null);
      setV3Pool(null);
      return;
    }

    const nfpmAddress = miscContracts.UniswapNonfungiblePositionManager
      .addresses[chainId] as `0x${string}` | undefined;

    if (!nfpmAddress) {
      console.error("[V3] NFPM address not found for chain", chainId);
      setUnderlying0(null);
      setUnderlying1(null);
      setV3Position(null);
      setV3Pool(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // 1. NFPM position
        const pos = await fetchV3Position(
          client as PublicClient,
          nfpmAddress,
          tokenId
        );
        if (cancelled) return;

        // 2. Pool slot0/liquidity
        const [slot0Raw, poolLiquidityRaw] = await Promise.all([
          readContract(client as PublicClient, {
            address: uniswapPoolAddress,
            abi: uniswap_pool_v3_abi,
            functionName: "slot0",
          }),
          readContract(client as PublicClient, {
            address: uniswapPoolAddress,
            abi: uniswap_pool_v3_abi,
            functionName: "liquidity",
          }),
        ]);

        let sqrtPriceX96: bigint;
        let tick: number;
        if (Array.isArray(slot0Raw)) {
          sqrtPriceX96 = slot0Raw[0] as bigint;
          tick = Number(slot0Raw[1]);
        } else {
          const slot0 = slot0Raw as any;
          sqrtPriceX96 = BigInt(slot0.sqrtPriceX96 ?? slot0[0] ?? 0n);
          tick = Number(slot0.tick ?? slot0[1] ?? 0);
        }
        const poolLiquidity = BigInt(poolLiquidityRaw as bigint);

        // 3. NFPM token0/1 과 Birdieswap bToken 주소 매핑
        const posToken0 = pos.token0.toLowerCase();
        const posToken1 = pos.token1.toLowerCase();
        const b0Addr = (bToken0.addresses?.[chainId] as string).toLowerCase();
        const b1Addr = (bToken1.addresses?.[chainId] as string).toLowerCase();

        let poolBToken0 = bToken0;
        let poolBToken1 = bToken1;
        let amount0IsForBToken0 = true;

        if (posToken0 === b0Addr && posToken1 === b1Addr) {
          amount0IsForBToken0 = true;
        } else if (posToken0 === b1Addr && posToken1 === b0Addr) {
          poolBToken0 = bToken1;
          poolBToken1 = bToken0;
          amount0IsForBToken0 = false;
        } else {
          console.error("[V3] NFPM token0/1 does not match bTokens", {
            posToken0: pos.token0,
            posToken1: pos.token1,
            bToken0: bToken0.addresses?.[chainId],
            bToken1: bToken1.addresses?.[chainId],
          });
          return;
        }

        // 4. SDK Pool / Position 생성 (pool token = bToken 기준)
        const sdkToken0 = new Token(
          chainId,
          pos.token0 as `0x${string}`,
          poolBToken0.decimals,
          poolBToken0.symbol
        );
        const sdkToken1 = new Token(
          chainId,
          pos.token1 as `0x${string}`,
          poolBToken1.decimals,
          poolBToken1.symbol
        );

        const pool = new V3Pool(
          sdkToken0,
          sdkToken1,
          pos.fee,
          sqrtPriceX96.toString(),
          poolLiquidity.toString(),
          tick
        );
        if (cancelled) return;
        setV3Pool(pool);

        const sdkPos = new V3Position({
          pool,
          liquidity: pos.liquidity.toString(),
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
        });

        const amount0Raw = BigInt((sdkPos.amount0 as any).quotient.toString());
        const amount1Raw = BigInt((sdkPos.amount1 as any).quotient.toString());

        const amount0Human = formatUnits(
          amount0Raw,
          poolBToken0.decimals ?? 18
        );
        const amount1Human = formatUnits(
          amount1Raw,
          poolBToken1.decimals ?? 18
        );

        let bToken0AmountHuman: string;
        let bToken1AmountHuman: string;
        if (amount0IsForBToken0) {
          bToken0AmountHuman = amount0Human;
          bToken1AmountHuman = amount1Human;
        } else {
          bToken0AmountHuman = amount1Human;
          bToken1AmountHuman = amount0Human;
        }

        // 5. previewRedeem → underlying 수량
        const b0AmountBD = new BigDecimal(bToken0AmountHuman);
        const b1AmountBD = new BigDecimal(bToken1AmountHuman);

        const [under0, under1] = await Promise.all([
          previewRedeem(client as PublicClient, bToken0, b0AmountBD),
          previewRedeem(client as PublicClient, bToken1, b1AmountBD),
        ]);

        if (!cancelled) {
          setV3Position(pos);
          setUnderlying0(under0 ?? BigDecimal.ZERO());
          setUnderlying1(under1 ?? BigDecimal.ZERO());
        }
      } catch (e) {
        console.error("[V3] useV3UnderlyingFromTokenId failed", e);
        if (!cancelled) {
          setV3Position(null);
          setV3Pool(null);
          setUnderlying0(BigDecimal.ZERO());
          setUnderlying1(BigDecimal.ZERO());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, chainId, tokenId, uniswapPoolAddress, bToken0, bToken1]);

  return { underlying0, underlying1, v3Position, v3Pool };
}
