import {
  isBirdieSingleFarm,
  IBirdieSingleFarm,
  ICurrency,
} from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

import { useAssetValues } from "../../hooks/assets/useAssets/useAssetValues";
import getSwapPool from "./getSwapPool";

// ✅ ETH -> WETH normalize 용 (프로젝트에 이미 쓰는 유틸/상수)
import { ADDRESS } from "@/const/contracts/contractAddresses";
import { getFromContracts, toLower } from "@/utils/farm/getAddressHelpers";
import getTokenAddress from "../assets/getTokenAddress"; // 경로는 너희 프로젝트 기준에 맞게 조정

export default function getLPPoolBalances<
  T extends ICurrency | IBirdieSingleFarm,
>(props: {
  fromToken: T;
  toToken: T;
  chainId: number;
  assetValues: ReturnType<typeof useAssetValues>;
}): [BigDecimal | null, BigDecimal | null] {
  const { fromToken, toToken, chainId, assetValues } = props;
  if (!fromToken || !toToken || !chainId || !assetValues) return [null, null];

  // ✅ 1) BirdieSingleFarm이면 underlying(Icurrency)로 언랩
  const fromUnderlying: ICurrency = isBirdieSingleFarm(fromToken)
    ? fromToken.input
    : (fromToken as ICurrency);

  const toUnderlying: ICurrency = isBirdieSingleFarm(toToken)
    ? toToken.input
    : (toToken as ICurrency);

  // ✅ 2) pool 찾기 (기존 로직 유지)
  const pool = getSwapPool({ fromToken, toToken, chainId });
  if (!pool) return [null, null];

  // ✅ 3) underlying 기준으로 만들어진 poolData를 가져옴
  const poolData = assetValues.uniswapPriceMap.get(pool.symbol);
  if (!poolData) return [null, null];

  // ✅ 4) 주소 normalize (ETH는 WETH로 비교)
  const WETH_ADDRESS = getFromContracts(ADDRESS.WETH, chainId);

  const normalizeAddr = (token: ICurrency) => {
    const raw = getTokenAddress({ token, chainId }); // token.addresses[chainId] 대신 이 유틸을 쓰면 ETH 처리도 더 안전
    const addr =
      token.symbol === "ETH" && WETH_ADDRESS
        ? (WETH_ADDRESS as `0x${string}`)
        : raw;
    return addr ? toLower(addr as `0x${string}`) : "";
  };

  const baseAddr = toLower(poolData.base.addresses[chainId]);
  const quoteAddr = toLower(poolData.quote.addresses[chainId]);

  const fromAddr = normalizeAddr(fromUnderlying);
  const toAddr = normalizeAddr(toUnderlying);

  // ✅ 5) from/to가 base/quote 중 어디에 해당하는지 매핑
  const pickBalance = (addr: string): BigDecimal | null => {
    if (!addr) return null;
    if (addr === baseAddr) return poolData.baseBalance;
    if (addr === quoteAddr) return poolData.quoteBalance;
    return null;
  };

  const fromBalance = pickBalance(fromAddr as string);
  const toBalance = pickBalance(toAddr as string);

  return [fromBalance, toBalance];
}
