"use client";

import { createContext, ReactNode, useState, Fragment, useMemo } from "react";

import TransactionProgressModal from "@/components/modals/TransactionProgressModal";
import TransactionStatus from "@/types/TransactionStatus";
import { TransactionType } from "@/types/TransactionTypes";
import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

type TransactionTokenDisplayProps = {
  token?: IToken;
  amount?: BigDecimal;
};

type TransactionClaimDisplayProps = {
  symbol?: string;
  amount?: number;
};

export type ApproveTransactionProps = {
  chainId: number;
  transactionType: TransactionType.APPROVE;
  input?: IToken;
};

export type SwapTransactionProps = {
  chainId: number;
  transactionType: TransactionType.SWAP;
  input: TransactionTokenDisplayProps;
  output: TransactionTokenDisplayProps;
  address?: `0x${string}`;
};

export type StartFarmingTransactionProps = {
  chainId: number;
  transactionType: TransactionType.START_FARMING;
  input: TransactionTokenDisplayProps[];
  output: TransactionTokenDisplayProps;
  address?: `0x${string}`;
};

export type StopFarmingTransactionProps = {
  chainId: number;
  transactionType: TransactionType.STOP_FARMING;
  input: TransactionTokenDisplayProps;
  output: TransactionTokenDisplayProps[];
  address?: `0x${string}`;
};

export type stakeTransactionProps = {
  chainId: number;
  transactionType: TransactionType.STAKING;
  input: TransactionTokenDisplayProps;
  output?: TransactionTokenDisplayProps[];
  address?: `0x${string}`;
};

export type claimTransactionProps = {
  chainId: number;
  transactionType: TransactionType.CLAIM;
  output?: TransactionClaimDisplayProps;
  address?: `0x${string}`;
};

export type signTransactionProps = {
  transactionType: TransactionType.SIGN;
};

export type PayTransactionProps = {
  chainId: number;
  transactionType: TransactionType.PAY;
  address?: `0x${string}`; // 연결 지갑(계산/표시용)
  // PAY에서는 input=staked pool, output=USDC로 보면 일관성이 좋아서 아래처럼 둠
  input: TransactionTokenDisplayProps; // staked token (pool token)
  output: TransactionTokenDisplayProps; // USDC (exactOut)
  receiver?: `0x${string}`; // beneficiary 표시용
};

export type EnterTransactionProps = {
  chainId: number;
  transactionType: TransactionType.ENTER;
  address?: `0x${string}`; // 연결 지갑(beneficiary/dustReceiver)
  input: TransactionTokenDisplayProps; // ETH/WETH amount
  // ENTER는 타겟 풀이 핵심이라 pool을 별도로 둠
  pool?: {
    address: `0x${string}`; // staking pool address
    symbol?: string;
    fullName?: string;
    iconSrc?: string;
  };
};

export type TransactionStatusProps = {
  chainId?: number;
  transactionStatus?: TransactionStatus;
  transactionType?: TransactionType;
  txid?: `0x${string}`;
  onSubmittedInfo?: ReactNode;
  onConfirmedInfo?: ReactNode;
  onTryAgain?: () => void;

  // ✅ 새로 추가: 스왑 벤치마크 / 이펙트용
  fireConfetti?: boolean;
  swapBenchmarkInfo?: {
    profitUsd: string; // "0.3486"
    actualOut: string; // "30.5784"
    benchmarkOutAfterFee: string | null; // "30.23" or null
  };
} & (
  | ApproveTransactionProps
  | SwapTransactionProps
  | StartFarmingTransactionProps
  | StopFarmingTransactionProps
  | stakeTransactionProps
  | claimTransactionProps
  | signTransactionProps
  | PayTransactionProps
  | EnterTransactionProps
);

export type TransactionContextType = {
  transactionProps: TransactionStatusProps | null;
  setTransactionProps: React.Dispatch<
    React.SetStateAction<TransactionStatusProps | null>
  >;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  isBusy: boolean;
};

export const TransactionContext = createContext<TransactionContextType>({
  transactionProps: null,
  setTransactionProps: () => {},
  isOpen: false,
  onClose: () => {},
  onOpen: () => {},
  isBusy: false,
});

export default function TransactionContextProvider(props: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionProps, setTransactionProps] =
    useState<TransactionStatusProps | null>(null);

  const onClose = () => {
    setIsOpen(false);
  };
  const onOpen = () => {
    setIsOpen(true);
  };

  const isBusy = useMemo(() => {
    const st = transactionProps?.transactionStatus;
    return (
      st === TransactionStatus.CONFIRM_NEEDED ||
      st === TransactionStatus.PENDING
    );
  }, [transactionProps?.transactionStatus]);

  return (
    <Fragment>
      <TransactionContext.Provider
        value={{
          isOpen,
          onClose,
          onOpen,
          transactionProps,
          setTransactionProps,
          isBusy,
        }}
      >
        {props.children}
      </TransactionContext.Provider>
      <TransactionProgressModal
        isOpen={isOpen}
        transactionProps={transactionProps}
        onClose={onClose}
      />
    </Fragment>
  );
}
