import {
  baseFork,
  sepolia,
  giwaSepolia,
  arbitrum,
  base_custom,
  optimism_custom,
  bsc,
  polygon,
  scroll,
} from "@/const/networks";

type ChainLike = {
  id: number;
  blockExplorers?: { default?: { url?: string } };
};

// 배열로 모은 뒤, Record로 바꿔 O(1) 조회
const CHAINS: ChainLike[] = [
  baseFork,
  sepolia,
  giwaSepolia,
  arbitrum,
  base_custom,
  optimism_custom,
  bsc,
  polygon,
  scroll,
];

const CHAINS_BY_ID: Record<number, ChainLike> = Object.fromEntries(
  CHAINS.map((c) => [c.id, c]),
);

/** chainId로 block explorer base URL을 반환 */
export function getBlockExplorerUrl(chainId: number): string | undefined {
  return CHAINS_BY_ID[chainId]?.blockExplorers?.default?.url;
}

/** (선택) 주소 상세로 바로 이동하는 링크를 만들고 싶다면 */
export function getExplorerAddressUrl(
  chainId: number,
  address: string,
): string | undefined {
  const base = getBlockExplorerUrl(chainId);
  return base ? `${base}/address/${address}` : undefined;
}

/** (선택) 트랜잭션 상세 링크 */
export function getExplorerTxUrl(
  chainId: number,
  txHash: string,
): string | undefined {
  const base = getBlockExplorerUrl(chainId);
  return base ? `${base}/tx/${txHash}` : undefined;
}
