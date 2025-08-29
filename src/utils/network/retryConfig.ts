export const retryConfig = {
  // async(함수 호출) 용
  maxAttempts: 5,
  baseDelayMs: 1000,        // 3초
  strategy: "fixed" as const, // 고정 간격 (원하면 "exponential"로)
  timeoutPerAttemptMs: 10_000,
  jitter: false,

  // React Query 용
  rqRetry: 3,
  rqRetryDelay: 3000,
};
