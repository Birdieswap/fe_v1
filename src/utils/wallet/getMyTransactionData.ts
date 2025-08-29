import { buildUrl } from "./buildUrl";

type Address = `0x${string}`;

export type TransactionEvent = {
  type: string; // e.g. "swap" | "DualDeposit" | "DualWithdraw" ...
  chainId?: string;
  blockNumber: string;
  blockTimestamp: string; // unix seconds (string)
  transactionHash: `0x${string}`;
  transactionIndex?: string;
  vaultName? : string;
  data: Record<string, string>; // 모든 필드 string
};

export type TransactionsResponse = {
  response: boolean;
  result: boolean;
  Transactions: TransactionEvent[];
};

export async function getMyTransactionData(
  address: Address,
  blockHeight?: string | number,
  signal?: AbortSignal
): Promise<TransactionsResponse> {
  const url = buildUrl("Transactions", { address, blockHeight });
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`Transactions fetch failed: ${res.status}`);
  return res.json();
}
