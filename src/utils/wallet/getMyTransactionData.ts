// src/utils/wallet/getMyTransactionData.ts
import { buildUrl } from "./buildUrl";

type Address = `0x${string}`;

export type TransactionEvent = {
  type: string;
  chainId?: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: `0x${string}`;
  transactionIndex?: string;
  logIndex?: string;
  vaultName?: string;
  data: Record<string, string>;
};

export type TransactionsResponse = {
  response: boolean;
  result: boolean;
  EarliestBlock: string;
  Transactions: TransactionEvent[];
};

export async function getMyTransactionData(
  address: Address,
  opts: {
    blockHeight?: string | number;
    signal?: AbortSignal;
    chainId?: number;
  } = {}
): Promise<TransactionsResponse> {
  const { blockHeight, signal, chainId } = opts;

  const url = buildUrl("Transactions", { address, blockHeight, chainId });

  // 원본 URL 기준으로 /api 판별
  const isProxy = typeof url === "string" && url.startsWith("/api/");
  // 절대 URL 보정
  const absoluteUrl =
    isProxy && typeof window !== "undefined"
      ? new URL(url, window.location.origin).toString()
      : url;

  // /api 프록시 → 타임아웃 걸지 않음 (서버가 8초 내 항상 JSON 반환)
  const res = await fetch(absoluteUrl, {
    method: "GET",
    signal, // 상위 취소만 반영
    credentials: "same-origin",
    cache: "no-store",
    headers: { accept: "application/json, text/plain, */*" },
  });

  const ct = res.headers.get("content-type") || "";
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    console.warn("[tx] non-OK", res.status, res.statusText, raw.slice(0, 300));
    throw new Error(`HTTP_${res.status}`);
  }
  const looksJson =
    ct.includes("application/json") || /^[\s\r\n]*[\{\[]/.test(raw);
  if (!looksJson) throw new Error("INVALID_JSON");

  return JSON.parse(raw) as TransactionsResponse;
}
