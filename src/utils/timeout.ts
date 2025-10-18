export function withTimeout<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>
) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  return fn(c.signal).finally(() => clearTimeout(id));
}
