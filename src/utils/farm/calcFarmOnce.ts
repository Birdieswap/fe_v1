// src/hooks/farm/calcFarmOnce.ts
import { PublicClient } from "viem";
import {
  IBirdieSingleFarm,
  IBirdieLPFarm,
  isBirdieLPFarm,
  isBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";
import type { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";
import { findSymbolByAddress } from "../assets/getTokenSymbol";
import {
  getLiquidityCached,
  getTotalSupplyCached,
} from "@/utils/farm/farmDataCache";

export type FarmCalc = {
  apy: BigDecimal;
  tvl: BigDecimal | null;
  price: BigDecimal | null;
  totalSupply: BigDecimal | null;

  underlying: {
    token0: { address: `0x${string}` | null; balance: BigDecimal | null };
    token1: { address: `0x${string}` | null; balance: BigDecimal | null } | null;
  };

  // LP farm용 언더라이잉 풀 밸런스
  poolBalance0: BigDecimal | null;
  poolBalance1: BigDecimal | null;
};

export async function calcFarmOnce(
  client: PublicClient,
  farm: IBirdieSingleFarm | IBirdieLPFarm,
  assetValues: useAssetValuesReturnType
): Promise<FarmCalc> {
  // console.log("calcFarmOnce called", farm.fullName, farm);
  const chainId = client.chain?.id;

  const apy = BigDecimal.ZERO();

  const data = await getLiquidityCached(client, farm);
  const supply = await getTotalSupplyCached(client, farm);

  let tvl: BigDecimal | null = null;

  // 새로 추가되는 부분: LP 풀 밸런스
  let poolBalance0: BigDecimal | null = null;
  let poolBalance1: BigDecimal | null = null;
  let token0Addr: `0x${string}` | null = null;
  let token1Addr: `0x${string}` | null = null;
  let underlyingToken0Bal: BigDecimal | null = null;
  let underlyingToken1Bal: BigDecimal | null = null;

  if (data !== null && data !== undefined) {
    // ─────────────────────────────────────────────
    // LP Farm인 경우: [token0Addr, liq0, token1Addr, liq1]
    // ─────────────────────────────────────────────
    if (isBirdieLPFarm(farm) && Array.isArray(data)) {
      const [rawToken0Addr, liq0, rawToken1Addr, liq1] = data;
      token0Addr = rawToken0Addr ?? null;
      token1Addr = rawToken1Addr ?? null;

      // 1) 주소 기준으로 poolBalance0 / poolBalance1 정렬
      //    - farm.swap.input[0].input 이 "우리가 토큰0으로 보고 싶은 것"
      //    - 그 토큰의 주소와 token0Addr / token1Addr 를 비교해서 순서 맞춤
      if (chainId) {
        const lpFarm = farm as IBirdieLPFarm;
        const desiredToken0 =
          lpFarm.swap.input[0]?.input?.addresses?.[chainId] ?? null;

        if (desiredToken0 && token0Addr && token1Addr) {
          const desired = desiredToken0.toLowerCase();
          const addr0 = token0Addr.toLowerCase();
          const addr1 = token1Addr.toLowerCase();

          if (desired === addr0) {
            // data의 token0이 우리가 생각하는 토큰0 → 그대로 사용
            poolBalance0 = liq0 ?? null;
            poolBalance1 = liq1 ?? null;
            underlyingToken0Bal = poolBalance0;
            underlyingToken1Bal = poolBalance1;
          } else if (desired === addr1) {
            // data의 token1이 우리가 생각하는 토큰0 → 스왑
            poolBalance0 = liq1 ?? null;
            poolBalance1 = liq0 ?? null;
            token0Addr = rawToken1Addr ?? null;
            token1Addr = rawToken0Addr ?? null;
            underlyingToken0Bal = poolBalance0;
            underlyingToken1Bal = poolBalance1;
          } else {
            // 주소가 안 맞으면 일단 원래 순서 유지 (fallback)
            poolBalance0 = liq0 ?? null;
            poolBalance1 = liq1 ?? null;
            underlyingToken0Bal = poolBalance0;
            underlyingToken1Bal = poolBalance1;
          }
        } else {
          // 주소 정보를 제대로 못 가져오면 역시 원래 순서 유지
          poolBalance0 = liq0 ?? null;
          poolBalance1 = liq1 ?? null;
          underlyingToken0Bal = poolBalance0;
          underlyingToken1Bal = poolBalance1;
        }
      } else {
        // chainId 없으면 걍 원래 순서
        poolBalance0 = liq0 ?? null;
        poolBalance1 = liq1 ?? null;
        underlyingToken0Bal = poolBalance0;
        underlyingToken1Bal = poolBalance1;
      }

      // 2) TVL 계산 (기존 로직 유지)
      const symbol0 = token0Addr
        ? findSymbolByAddress(token0Addr as `0x${string}`, chainId as number)
        : undefined;
      const symbol1 = token1Addr
        ? findSymbolByAddress(token1Addr as `0x${string}`, chainId as number)
        : undefined;

      // 주의: 심볼 기반 키는 충돌 위험. 추후 주소 기반으로 개선 권장.
      const price0 = symbol0
        ? assetValues.chainLinkPriceMap.get(`LINK:${symbol0}_USD`)?.price
        : undefined;
      const price1 = symbol1
        ? assetValues.chainLinkPriceMap.get(`LINK:${symbol1}_USD`)?.price
        : undefined;

      if (liq0 && liq1 && price0 && price1) {
        tvl = new BigDecimal(liq0.mul(price0).add(liq1.mul(price1)).toString());
      }
    }
    // ─────────────────────────────────────────────
    // Single Farm인 경우: data가 BigDecimal 하나 (totalUnderlying)
    // ─────────────────────────────────────────────
    else if (isBirdieSingleFarm(farm) && data instanceof BigDecimal) {
      token0Addr = farm.input?.addresses?.[chainId as number] ?? null;
      token1Addr = null;
      underlyingToken0Bal = data;
      underlyingToken1Bal = null;
      const tokenPrice = assetValues.chainLinkPriceMap.get(
        `LINK:${farm.input.symbol}_USD`
      )?.price;
      if (tokenPrice) {
        tvl = new BigDecimal(data.mul(tokenPrice).toString());
      }
      // Single farm에선 poolBalance0/1 의미 없음 → null 유지
    }
  }
  // ─────────────────────────────────────────────
  // 토큰 1개당 가격 (BLP or Single Farm share 가격)
  // ─────────────────────────────────────────────
  let price: BigDecimal | null = null;
  if (tvl && supply instanceof BigDecimal && supply.value !== BigInt(0)) {
    price = tvl.div(supply);
  }

  // console.log(
  //   "calcFarmOnce",
  //   farm,
  //   data,
  //   supply,
  //   price,
  //   poolBalance0,
  //   poolBalance1
  // );
  return {
    apy,
    tvl,
    price,
    totalSupply: supply instanceof BigDecimal ? supply : null,
    underlying: {
      token0: { address: token0Addr, balance: underlyingToken0Bal },
      token1: isBirdieLPFarm(farm)
        ? { address: token1Addr, balance: underlyingToken1Bal }
        : null,
    },
    poolBalance0,
    poolBalance1,
  };
}
