export enum TransactionStatus {
  CONFIRM_NEEDED = "CONFIRM_NEEDED",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  CANCELED = "CANCELED",
}

export const CONFIRM_NEEDED = TransactionStatus.CONFIRM_NEEDED;
export const PENDING = TransactionStatus.PENDING;
export const SUCCESS = TransactionStatus.SUCCESS;
export const FAILED = TransactionStatus.FAILED;
export const CANCELED = TransactionStatus.CANCELED;

export default TransactionStatus;
