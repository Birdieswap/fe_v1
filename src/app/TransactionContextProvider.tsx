"use client";

import { createContext, ReactNode, useState, Fragment } from "react";

import TransactionProgressModal from "@/components/modals/TransactionProgressModal";
import TransactionStatus from "@/types/TransactionStatus";
import { TransactionType } from "@/types/TransactionTypes";
import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

type TransactionTokenDisplayProps = {
  token?: IToken;
  amount?: BigDecimal;
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

export type TransactionStatusProps = {
  chainId: number;
  transactionStatus?: TransactionStatus;
  transactionType?: TransactionType;
  txid?: `0x${string}`;
  onSubmittedInfo?: ReactNode;
  onConfirmedInfo?: ReactNode;
  onTryAgain?: () => void;
} & (
  | ApproveTransactionProps
  | SwapTransactionProps
  | StartFarmingTransactionProps
  | StopFarmingTransactionProps
);

export type TransactionContextType = {
  transactionProps: TransactionStatusProps | null;
  setTransactionProps: (props: TransactionStatusProps | null) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export const TransactionContext = createContext<TransactionContextType>({
  transactionProps: null,
  setTransactionProps: () => {},
  isOpen: false,
  onClose: () => {},
  onOpen: () => {},
});

export default function TransactionContextProvider(props: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => {
    setIsOpen(false);
  };
  const onOpen = () => {
    setIsOpen(true);
  };
  const [transactionProps, setTransactionProps] =
    useState<TransactionStatusProps | null>(null);

  return (
    <Fragment>
      <TransactionContext.Provider
        value={{
          isOpen,
          onClose,
          onOpen,
          transactionProps,
          setTransactionProps,
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
