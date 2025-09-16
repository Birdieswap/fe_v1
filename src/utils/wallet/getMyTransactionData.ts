
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

const isDevLike =
  (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase() === "dev" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").trim().toLowerCase() === "preview";

const toChainIdParam = (id?: number) =>
  isDevLike ? "0" : (typeof id === "number" ? String(id) : undefined);

export async function getMyTransactionData(
  address: Address,
  opts: { blockHeight?: string | number; signal?: AbortSignal; chainId?: number } = {}
): Promise<TransactionsResponse> {
  const { blockHeight, signal, chainId } = opts;
  const url = buildUrl("Transactions", { address, blockHeight, chainId: toChainIdParam(chainId) });
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`Transactions fetch failed: ${res.status}`);
  return res.json();
}
