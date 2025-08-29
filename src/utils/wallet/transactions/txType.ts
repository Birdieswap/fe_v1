// src/utils/wallet/txTypes.ts
export enum TransactionType {
  SWAP = "swap",
  START_FARM = "start_farm",
  STOP_FARM = "stop_farm",
}

export type TransactionTokenInfo = {
  symbol: string;
  amount: string;   // decimals 반영 + 뒤 0 제거된 문자열
  src?: string;     // iconSrc
  usdAmount?: string;
};

export type TransactionProps =
  | {
      type: TransactionType.SWAP;
      hash: string;
      timestamp: string;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo;
    }
  | {
      type: TransactionType.START_FARM;
      hash: string;
      timestamp: string;
      from: TransactionTokenInfo[];
      to: TransactionTokenInfo;  // LP
    }
  | {
      type: TransactionType.STOP_FARM;
      hash: string;
      timestamp: string;
      from: TransactionTokenInfo; // LP
      to: TransactionTokenInfo[];
    };
