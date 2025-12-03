import { chainlink_aggregator_v3_abi } from "../abis/chainlink_aggregator_v3_abi";

import {
  IBirdieLPFarm,
  IBirdieSingleFarm,
  WIP_ChainLinkPriceFeed,
  EContractType,
  ICurrency,
  IStakingProvider,
  ISwapPool,
  IToken,
  ITokenBase,
} from "./tokenTypes";

export function StakingProviderGuard<U extends IStakingProvider>(item: U) {
  return item as IStakingProvider & U;
}
export function CurrencyGuard<U extends ICurrency>(item: U) {
  return item as ICurrency & U;
}
export function SwapPoolGuard(
  item: ISwapPool<IBirdieSingleFarm>
): ISwapPool<IBirdieSingleFarm>;

export function SwapPoolGuard(item: ISwapPool<ICurrency>): ISwapPool<ICurrency>;

export function SwapPoolGuard<T extends ITokenBase>(
  item: ISwapPool<T>
): ISwapPool<T> {
  return item;
}
export function BirdieSingleFarmGuard<U extends IBirdieSingleFarm>(item: U) {
  return item as IBirdieSingleFarm & U;
}
export function BirdieLPFarmGuard<U extends IBirdieLPFarm>(item: U) {
  return item as IBirdieLPFarm & U;
}
export function TokenGuard<U extends IToken>(item: U) {
  return item as IToken & U;
}
export function PriceFeedGuard<
  U extends Omit<WIP_ChainLinkPriceFeed, "type" | "abi">,
>(item: U): WIP_ChainLinkPriceFeed & U {
  return {
    ...item,
    type: EContractType.CHAINLINK_PRICE_FEED,
    abi: chainlink_aggregator_v3_abi,
  };
}
