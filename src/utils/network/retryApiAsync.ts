export type RetryStrategy = "fixed" | "linear" | "exponential";
export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  strategy?: RetryStrategy;
  jitter?: boolean;
  timeoutPerAttemptMs?: number;
  retryOn?: (error: unknown, attempt: number) => boolean | Promise<boolean>;
  onAttempt?: (attempt: number) => void;
};

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const withTimeout = async <T,>(p: Promise<T>, ms = 0): Promise<T> => {
  if (!ms) return p;
  return Promise.race<T>([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms)),
  ]);
};

const calcDelay = (attempt: number, base: number, strategy: RetryStrategy, jitter: boolean) => {
  let ms = base;
  if (strategy === "linear") ms = base * attempt;
  if (strategy === "exponential") ms = base * Math.pow(2, attempt - 1);
  if (jitter) ms = Math.floor(ms * (0.5 + Math.random() * 0.5));
  return ms;
};

export async function retryApiAsync<T>(
  fn: (attempt: number) => Promise<T>,
  {
    maxAttempts = 5,
    baseDelayMs = 1000,
    strategy = "fixed",
    jitter = false,
    timeoutPerAttemptMs = 10_000,
    retryOn = (err) => {
      const status = (err as any)?.status ?? (err as any)?.response?.status;
      if ((err as any)?.message === "Timeout") return true;
      if (status === 429) return true;
      if (typeof status === "number" && status >= 500) return true;
      return false;
    },
    onAttempt,
  }: RetryOptions = {}
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      onAttempt?.(attempt);
      const result = await withTimeout(fn(attempt), timeoutPerAttemptMs);
      return result;
    } catch (err) {
      if (attempt >= maxAttempts || !(await retryOn(err, attempt))) throw err;
      await sleep(calcDelay(attempt, baseDelayMs, strategy, jitter));
    }
  }
  throw new Error("retryAsync: exhausted");
}
