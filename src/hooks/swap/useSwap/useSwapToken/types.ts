// ===============================
// File: hooks/swap/types.ts
// 목적: 타입과 공용 인터페이스 정의 (동일 동작 유지)
// ===============================
import { Dispatch, SetStateAction } from "react";
import { Config } from "wagmi";
import { Client, PublicClient } from "viem";
import { WriteContractMutate } from "wagmi/query";
import { ICurrency, IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";
import { useAssetValuesReturnType } from "@/hooks/assets/useAssets/useAssetValues";
import { useAccountBalancesReturnType } from "@/hooks/assets/useAssets/useAccountBalances";
import { BigDecimal } from "@/types/BigDecimal";
import { TransactionContextType } from "@/app/TransactionContextProvider";

export interface UseSwapTokensProps {
  chainId: number;
  address: `0x${string}` | undefined;
  writeContract: WriteContractMutate<Config, unknown>;
  fromToken: ICurrency | undefined;
  fromAmount: string;
  setFromAmount: Dispatch<SetStateAction<string>>;
  toToken?: ICurrency | undefined;
  toAmount: string;
  setToAmount: Dispatch<SetStateAction<string>>;
  client?: Client;
  transactionContext: TransactionContextType;
  isPendingWriteContract: boolean;
  isFetchingAssets: boolean;
  assetValues?: useAssetValuesReturnType;
  balances?: useAccountBalancesReturnType;
  setPriceImpact?: Dispatch<SetStateAction<BigDecimal | undefined>>;
  maxSlippage?: number; // 0~1 범위(예: 0.005 = 0.5%)
  isTyping: boolean;
  stopTyping: () => void;
}

export interface UseSwapTokensReturn {
  isFetchingAllowanceFromToken: boolean;
  isLoadingFrom: boolean;
  isLoadingTo: boolean;
  swapPool: any | null;
  exchangeRate: string;     // from→to 환율 표시 문자열 (기존과 동일)
  rExchangeRate: string;    // to→from 역환율 표시 문자열 (기존과 동일)
  setToTokenAmountWithGuard: (n: SetStateAction<string>) => void;
  setFromTokenAmountWithGuard: (n: SetStateAction<string>) => void;
  swap: () => Promise<void>;
  approve: () => void;
  isApproved: boolean;
  isPending: boolean;
  isZeroAmount: boolean;
  updateAmount: (newAmount: string, side: "in" | "out", withToToken?: ICurrency, withFromToken?: ICurrency) => Promise<void>;
}

export type Addr = `0x${string}` | null;

export interface PoolInfo {
  poolAddress: Addr;
  zeroForOne: boolean;
  outBToken: Addr;
  outBpool: IBirdieSingleFarm | null;
  token0Decimals?: number;
  token1Decimals?: number;
}

export interface QuoteCtx {
  chainId: number;
  swapPool: any;
  poolInfo: PoolInfo;
  assetValues?: useAssetValuesReturnType;
  publicClient?: PublicClient | null;
  maxSlippage?: number | null;
  fromToken?: ICurrency;
  toToken?: ICurrency;
  // state setters (동일 동작 유지)
  setMidPoolPrice: (v: BigDecimal | null) => void;
  setSqrtPriceX96: (f: import("@uniswap/sdk-core").Fraction | null) => void;
  setQuoteReceive: (v: bigint | null) => void;
  setMidOwner?: (ownerKey: string) => void; // PriceImpact 계산용 pairKey 소유자
  pairKey: string;
  addrLower: (t?: ICurrency) => string;
}
