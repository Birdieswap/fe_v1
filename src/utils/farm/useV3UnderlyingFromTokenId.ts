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
import { serializeError, stringifyForLog } from "@/utils/error/serializeError";

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
  params: UseV3UnderlyingParams,
): UseV3UnderlyingResult {
  const { client, chainId, tokenId, uniswapPoolAddress, bToken0, bToken1 } =
    params;

  const [underlying0, setUnderlying0] = useState<BigDecimal | null>(null);
  const [underlying1, setUnderlying1] = useState<BigDecimal | null>(null);
  const [v3Position, setV3Position] = useState<V3PositionRaw | null>(null);
  const [v3Pool, setV3Pool] = useState<V3Pool | null>(null);

  useEffect(() => {
    console.log("[V3] useV3UnderlyingFromTokenId effect deps", {
      client: !!client,
      chainId,
      tokenId: tokenId?.toString(),
      uniswapPoolAddress,
      bToken0,
      bToken1,
    });

    // 기본 가드
    if (
      !client ||
      !chainId ||
      !tokenId ||
      tokenId === 0n ||
      !uniswapPoolAddress
    ) {
      console.log("[V3] Guard failed, resetting state", {
        hasClient: !!client,
        chainId,
        tokenId: tokenId?.toString(),
        uniswapPoolAddress,
      });
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

    console.log("[V3] Start fetch with params", {
      chainId,
      tokenId: tokenId.toString(),
      uniswapPoolAddress,
      nfpmAddress,
    });

    let cancelled = false;

    (async () => {
      let stage = "init";
      try {
        // 1. NFPM position
        stage = "fetchV3Position";
        console.log("[V3] fetchV3Position start", {
          nfpmAddress,
          tokenId: tokenId.toString(),
        });
        const pos = await fetchV3Position(
          client as PublicClient,
          nfpmAddress,
          tokenId,
        );
        if (cancelled) {
          console.log("[V3] cancelled after fetchV3Position");
          return;
        }

        console.log("[V3] pos", {
          tokenId: tokenId.toString(),
          token0: pos.token0,
          token1: pos.token1,
          fee: pos.fee,
          liquidity: pos.liquidity.toString(),
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
        });

        // 2. Pool slot0/liquidity
        stage = "readPoolState";
        console.log("[V3] readContract slot0/liquidity start", {
          uniswapPoolAddress,
        });
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

        console.log("[V3] slot0Raw", slot0Raw);
        console.log("[V3] poolLiquidityRaw", poolLiquidityRaw);

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

        console.log("[V3] decoded slot0 / liquidity", {
          sqrtPriceX96: sqrtPriceX96.toString(),
          tick,
          poolLiquidity: poolLiquidity.toString(),
        });

        // 3. NFPM token0/1 과 Birdieswap bToken 주소 매핑
        const posToken0 = pos.token0.toLowerCase();
        const posToken1 = pos.token1.toLowerCase();
        const b0AddrRaw = bToken0?.addresses?.[chainId] as string | undefined;
        const b1AddrRaw = bToken1?.addresses?.[chainId] as string | undefined;
        if (!b0AddrRaw || !b1AddrRaw) {
          console.error("[V3] bToken address missing for chain", {
            chainId,
            bToken0: bToken0?.symbol,
            bToken1: bToken1?.symbol,
            b0AddrRaw,
            b1AddrRaw,
          });
          if (!cancelled) {
            setV3Position(null);
            setV3Pool(null);
            setUnderlying0(BigDecimal.ZERO());
            setUnderlying1(BigDecimal.ZERO());
          }
          return;
        }
        const b0Addr = b0AddrRaw.toLowerCase();
        const b1Addr = b1AddrRaw.toLowerCase();

        let poolBToken0 = bToken0;
        let poolBToken1 = bToken1;
        let amount0IsForBToken0 = true;

        console.log("[V3] token mapping check", {
          posToken0,
          posToken1,
          b0Addr,
          b1Addr,
        });

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
          if (!cancelled) {
            setV3Position(null);
            setV3Pool(null);
            setUnderlying0(BigDecimal.ZERO());
            setUnderlying1(BigDecimal.ZERO());
          }
          return;
        }

        console.log("[V3] token mapping result", {
          poolBToken0Symbol: poolBToken0.symbol,
          poolBToken1Symbol: poolBToken1.symbol,
          amount0IsForBToken0,
        });

        // 4. SDK Pool 생성 (pool token = bToken 기준)
        stage = "buildSdkPool";
        const sdkToken0 = new Token(
          chainId,
          pos.token0 as `0x${string}`,
          poolBToken0.decimals,
          poolBToken0.symbol,
        );
        const sdkToken1 = new Token(
          chainId,
          pos.token1 as `0x${string}`,
          poolBToken1.decimals,
          poolBToken1.symbol,
        );

        console.log("[V3] SDK Pool params", {
          chainId,
          token0: sdkToken0.address,
          token1: sdkToken1.address,
          decimals0: poolBToken0.decimals,
          decimals1: poolBToken1.decimals,
          fee: pos.fee,
          sqrtPriceX96: sqrtPriceX96.toString(),
          poolLiquidity: poolLiquidity.toString(),
          tick,
        });

        const pool = new V3Pool(
          sdkToken0,
          sdkToken1,
          pos.fee,
          sqrtPriceX96.toString(),
          poolLiquidity.toString(), // 0일 수도 있음
          tick,
        );
        if (cancelled) {
          console.log("[V3] cancelled after V3Pool creation");
          return;
        }
        setV3Pool(pool);
        setV3Position(pos);

        // 🔴 유동성 0이면 underlying 은 항상 0 (포지션은 closed 상태)
        if (pos.liquidity === 0n || poolLiquidity === 0n) {
          console.log("[V3] zero liquidity (position or pool). Underlying = 0");
          if (!cancelled) {
            setUnderlying0(BigDecimal.ZERO());
            setUnderlying1(BigDecimal.ZERO());
          }
          return;
        }

        // 5. SDK Position 생성 (기존 로직)
        stage = "buildSdkPosition";
        const sdkPos = new V3Position({
          pool,
          liquidity: pos.liquidity.toString(),
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
        });

        console.log("[V3] sdkPos constructed", {
          liquidity: pos.liquidity.toString(),
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
        });

        const amount0Raw = BigInt((sdkPos.amount0 as any).quotient.toString());
        const amount1Raw = BigInt((sdkPos.amount1 as any).quotient.toString());

        console.log("[V3] raw amounts", {
          amount0Raw: amount0Raw.toString(),
          amount1Raw: amount1Raw.toString(),
        });

        const amount0Human = formatUnits(
          amount0Raw,
          poolBToken0.decimals ?? 18,
        );
        const amount1Human = formatUnits(
          amount1Raw,
          poolBToken1.decimals ?? 18,
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

        console.log("[V3] mapped bToken human amounts", {
          amount0IsForBToken0,
          bToken0Symbol: bToken0.symbol,
          bToken1Symbol: bToken1.symbol,
          bToken0AmountHuman,
          bToken1AmountHuman,
        });

        // 6. previewRedeem → underlying 수량
        stage = "previewRedeem";
        const b0AmountBD = new BigDecimal(bToken0AmountHuman);
        const b1AmountBD = new BigDecimal(bToken1AmountHuman);

        console.log("[V3] previewRedeem input", {
          bToken0: bToken0.symbol,
          bToken1: bToken1.symbol,
          b0AmountBD: b0AmountBD.toString?.() ?? b0AmountBD,
          b1AmountBD: b1AmountBD.toString?.() ?? b1AmountBD,
        });

        const [under0, under1] = await Promise.all([
          previewRedeem(client as PublicClient, bToken0, b0AmountBD),
          previewRedeem(client as PublicClient, bToken1, b1AmountBD),
        ]);

        console.log("[V3] previewRedeem output", {
          under0: under0?.toString?.() ?? under0,
          under1: under1?.toString?.() ?? under1,
        });

        if (!cancelled) {
          setUnderlying0(under0 ?? BigDecimal.ZERO());
          setUnderlying1(under1 ?? BigDecimal.ZERO());
        }
      } catch (e) {
        console.error(
          "[V3] useV3UnderlyingFromTokenId failed",
          stringifyForLog({
            stage,
            error: serializeError(e),
            chainId,
            tokenId: tokenId?.toString?.(),
            uniswapPoolAddress,
            nfpmAddress:
              miscContracts.UniswapNonfungiblePositionManager.addresses[
                chainId as number
              ],
            hasClient: !!client,
          }),
        );
        if (!cancelled) {
          setV3Position(null);
          setV3Pool(null);
          setUnderlying0(BigDecimal.ZERO());
          setUnderlying1(BigDecimal.ZERO());
        }
      }
    })();

    return () => {
      console.log("[V3] cleanup, set cancelled = true");
      cancelled = true;
    };
  }, [client, chainId, tokenId, uniswapPoolAddress, bToken0, bToken1]);

  return { underlying0, underlying1, v3Position, v3Pool };
}
