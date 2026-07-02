import { useChainId } from "wagmi";

export const SUPPORTED_CHAIN_IDS = [11155111, 91342, 8453] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function isSupportedChainId(chainId?: number) {
  return (
    chainId != null &&
    (SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId)
  );
}

export default function useIsWrongNetwork(chainIdOverride?: number) {
  const wagmiChainId = useChainId();
  const chainId = chainIdOverride ?? wagmiChainId;

  return !isSupportedChainId(chainId);
}
