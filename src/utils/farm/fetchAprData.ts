import { retryApiAsync, type RetryOptions } from "../network/retryApiAsync";
import { buildUrl } from "../wallet/buildUrl";
import { retryConfig } from "../network/retryConfig";


export type AprData = unknown;

export async function fetchAprDataOnce(params: {
  chainId: number;
  // 필요 시 추가 파라미터
}): Promise<AprData> {
  const endpoint = buildUrl("/api/apr", { chainId: params.chainId });
  console.log("Fetching APR data from:", endpoint);
  const res = await fetch(endpoint, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const e: any = new Error(`APR fetch failed: ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export async function fetchAprDataWithRetry(
  params: { chainId: number },
  retry: RetryOptions = {
    maxAttempts: retryConfig.maxAttempts,
    baseDelayMs: retryConfig.baseDelayMs,
    strategy: "fixed",
    timeoutPerAttemptMs: 10_000,
    jitter: false,
  }
): Promise<AprData> {
  return retryApiAsync<AprData>(() => fetchAprDataOnce(params), retry);
}
