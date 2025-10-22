import { buildUrl } from "./buildUrl";

type Address = `0x${string}`;

export type TransactionEvent = {
  type: string; // e.g. "swap" | "DualDeposit" | "DualWithdraw" ...
  chainId?: string;
  blockNumber: string;
  blockTimestamp: string; // unix seconds (string)
  transactionHash: `0x${string}`;
  transactionIndex?: string;
  vaultName?: string;
  data: Record<string, string>; // 모든 필드 string
};

export type TransactionsResponse = {
  response: boolean;
  result: boolean;
  EarliestBlock: string;
  Transactions: TransactionEvent[];
};

const isDevLike =
  (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase() ===
    "dev" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").trim().toLowerCase() === "preview";

const toChainIdParam = (id?: number) =>
  isDevLike ? "0" : typeof id === "number" ? String(id) : undefined;

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

  try {
    console.log("[tx fetch] GET", url);

    const res = await fetch(url, {
      method: "GET",
      signal,
      credentials: "omit",
    }).catch((e) => {
      console.error("[tx fetch] network error(fetch):", e);
      throw new Error("NETWORK_ERROR");
    });

    const ct = res.headers.get("content-type") || "";
    const statusInfo = `[status=${res.status} ${res.statusText}] [ct=${ct}]`;

    // 🔐 본문 읽기 단계에서 AbortError가 나기도 하므로 try/catch
    let raw = "";
    try {
      raw = await res.text();
    } catch (e) {
      console.error("[tx fetch] network error(read):", e, statusInfo);
      throw new Error("NETWORK_READ_ERROR");
    }

    const looksJson =
      ct.includes("application/json") || /^[\s\r\n]*[\{\[]/.test(raw);

    if (!res.ok) {
      console.warn("[tx fetch] non-OK", statusInfo, "body:", raw.slice(0, 400));
      throw new Error(`HTTP_${res.status}`);
    }

    if (!looksJson) {
      console.warn(
        "[tx fetch] not JSON",
        statusInfo,
        "body:",
        raw.slice(0, 400)
      );
      throw new Error("INVALID_JSON");
    }

    const json = JSON.parse(raw) as TransactionsResponse;

    console.log(
      "[tx fetch] status",
      res.status,
      "len",
      Array.isArray(json?.Transactions) ? json.Transactions.length : -1,
      "Earliest",
      json?.EarliestBlock
    );

    return json;
  } catch (e) {
    console.error("[tx fetch] error", e);
    throw e;
  }
}
