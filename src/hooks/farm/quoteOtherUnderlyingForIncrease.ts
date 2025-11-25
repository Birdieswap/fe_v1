import { PublicClient } from "viem";
import { BigDecimal } from "@/types/BigDecimal";
import type { Pool } from "@uniswap/v3-sdk";

import { getOtherAmountForIncrease } from "@/utils/uniswap/getOtherAmountForIncrease";
import previewFullDeposit from "@/utils/farm/previewFullDeposit";
import previewRedeem from "@/utils/farm/previewRedeem";
import type { V3PositionRaw } from "@/utils/uniswap/positionManager";

type Params = {
  client: PublicClient;
  chainId: number;

  // 이미 만들어 둔 V3 풀 & 포지션 (tokenId로 fetch해서 외부에서 주입)
  pool: Pool;
  position: V3PositionRaw;

  // Birdieswap 쪽 bToken 메타 (usePairStartPanel의 bToken0, bToken1)
  bToken0Meta: any;
  bToken1Meta: any;

  // 사용자가 입력한 underlying 금액 & 어느 인덱스인지
  underlyingAmount: BigDecimal;
  index: 0 | 1; // 0이면 첫 토큰, 1이면 두 번째 토큰
};

/**
 * 사용자가 underlying 한쪽을 넣었을 때,
 * V3 포지션에 맞는 반대편 underlying 수량을 계산해주는 quote 함수
 */
export async function quoteOtherUnderlyingForIncrease({
  client,
  chainId,
  pool,
  position,
  bToken0Meta,
  bToken1Meta,
  underlyingAmount,
  index,
}: Params): Promise<BigDecimal> {
  if (!underlyingAmount || underlyingAmount.lte(0)) {
    return BigDecimal.ZERO();
  }

  // 1) 입력한 underlying → 해당 bToken amount로 변환
  const bMetaIn = index === 0 ? bToken0Meta : bToken1Meta;
  const bAmountIn = await previewFullDeposit(client, bMetaIn, underlyingAmount);
  if (!bAmountIn || bAmountIn.value <= BigInt(0)) {
    return BigDecimal.ZERO();
  }

  // 2) 이 bToken이 pool.token0인지 token1인지 판별해서 side 결정
  const bAddr0 = bToken0Meta.addresses?.[chainId] as `0x${string}`;
  const bAddr1 = bToken1Meta.addresses?.[chainId] as `0x${string}`;

  const poolToken0Addr = pool.token0.address.toLowerCase();
  const poolToken1Addr = pool.token1.address.toLowerCase();

  // bToken0가 pool.token0인지 pool.token1인지 확인
  const b0IsPool0 = bAddr0.toLowerCase() === poolToken0Addr;
  const b0IsPool1 = bAddr0.toLowerCase() === poolToken1Addr;

  if (!b0IsPool0 && !b0IsPool1) {
    console.error("[quoteOtherUnderlying] bToken0 address not in pool");
    return BigDecimal.ZERO();
  }

  // index(underlying 쪽) → pool side("token0"/"token1") 매핑
  let side: "token0" | "token1";
  if (index === 0) {
    // 유저가 underlying0(=bToken0)의 amount를 입력
    side = b0IsPool0 ? "token0" : "token1";
  } else {
    // 유저가 underlying1(=bToken1)의 amount를 입력
    // bToken1은 pool의 나머지 토큰
    side = b0IsPool0 ? "token1" : "token0";
  }

  // 3) bAmountIn을 side에 맞는 decimals로 문자열로 변환
  const sideToken = side === "token0" ? pool.token0 : pool.token1;
  const bAmountInHuman = bAmountIn.toString();

  // 4) V3 수학으로 추가 bToken0/bToken1 수량 계산
  const { addAmount0Human, addAmount1Human } = getOtherAmountForIncrease({
    pool,
    position,
    side,
    amountHuman: bAmountInHuman,
  });

  // 5) 각 bToken 추가분을 다시 underlying으로 환산
  const addB0 = new BigDecimal(addAmount0Human, pool.token0.decimals);
  const addB1 = new BigDecimal(addAmount1Human, pool.token1.decimals);

  const [u0, u1] = await Promise.all([
    previewRedeem(client, bToken0Meta, addB0),
    previewRedeem(client, bToken1Meta, addB1),
  ]);

  const underlying0 = u0 ?? BigDecimal.ZERO();
  const underlying1 = u1 ?? BigDecimal.ZERO();

  // 6) 호출한 쪽이 index이니까, 반대편 underlying을 돌려줌
  return index === 0 ? underlying1 : underlying0;
}
