import { useEffect } from "react";

export default function useInterval(
  callback: () => void,
  delay: number = 10000,
) {
  useEffect(() => {
    callback(); // Call immediately on mount
    const interval = setInterval(callback, delay);

    return () => {
      clearInterval(interval);
    };
  }, [callback, delay]);
}
