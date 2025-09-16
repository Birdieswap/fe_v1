import { PublicClient } from "viem";
import { BigDecimal } from "@/types/BigDecimal";
import { IBirdieLPFarm, IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import getLiquidity from "@/utils/farm/getLiquidity";
import getTotalSupply from "@/utils/farm/getTotalSupply";

type LPLiquidityResult =
  | [
      `0x${string}` | null,
      BigDecimal | null,
      `0x${string}` | null,
      BigDecimal | null
    ]
  | null;

type SingleLiquidityResult = BigDecimal | null;
type LiquidityResult = LPLiquidityResult | SingleLiquidityResult;

let generation = 0; // 세대키(강제 무효화용)

const liqCache = new Map<string, Promise<LiquidityResult> | LiquidityResult>();
const supplyCache = new Map<string, Promise<BigDecimal | null> | BigDecimal | null>();

function keyOf(
  type: "liq" | "supply",
  client: PublicClient | null | undefined,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  refreshKey?: string
) {
  const chainId = client?.chain?.id ?? 0;
  const addr = getTokenAddress({ token: farm, chainId }) ?? "0x0";
  const g = refreshKey ?? String(generation);
  return `${type}:${chainId}:${addr}:${g}`;
}

export function clearFarmDataCaches() {
  liqCache.clear();
  supplyCache.clear();
}
export function bumpFarmDataGeneration() {
  generation++;
  clearFarmDataCaches();
}

export async function getLiquidityCached(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  opts?: { refreshKey?: string }
): Promise<LiquidityResult> {
  const k = keyOf("liq", client, farm, opts?.refreshKey);
  const existing = liqCache.get(k);
  if (existing) return Promise.resolve(existing as LiquidityResult);

  const p = (async () => {
    try {
      // getLiquidity(LP의 경우 assetValues 인자 있지만 현재 구현상 미사용 → 캐시 안전)
      return await getLiquidity(client as any, farm as any);
    } catch (e) {
      liqCache.delete(k);
      throw e;
    }
  })();

  liqCache.set(k, p);
  const v = await p;
  liqCache.set(k, v);
  return v;
}

export async function getTotalSupplyCached(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  opts?: { refreshKey?: string }
): Promise<BigDecimal | null> {
  const k = keyOf("supply", client, farm, opts?.refreshKey);
  const existing = supplyCache.get(k);
  if (existing) return Promise.resolve(existing as BigDecimal | null);

  const p = (async () => {
    try {
      return await getTotalSupply(client as any, farm as any);
    } catch (e) {
      supplyCache.delete(k);
      throw e;
    }
  })();

  supplyCache.set(k, p);
  const v = await p;
  supplyCache.set(k, v);
  return v;
}

/** 두 값을 병렬 선요청(prefetch)해서 공유 */
export async function prefetchFarmData(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  opts?: { refreshKey?: string }
) {

  const [liquidity, totalSupply] = await Promise.all([
    getLiquidityCached(client, farm, opts),
    getTotalSupplyCached(client, farm, opts),
  ]);
  return { liquidity, totalSupply };
}
