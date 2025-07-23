import { useCallback, useRef } from "react";

export default function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId.current) return;

      timeoutId.current = setTimeout(() => {
        timeoutId.current = null;
      }, delay);

      return callback(...args);
    },
    [callback, delay],
  ) as T;
}
