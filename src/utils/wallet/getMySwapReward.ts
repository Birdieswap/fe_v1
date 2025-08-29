import { buildUrl } from "./buildUrl";
import type { RewardItem } from "./typeReward";

export type SwapRewardsResponse = {
  response: boolean;
  result: boolean;
  SwapRewards: RewardItem[];
};

export async function getMySwapReward(
  address: `0x${string}`,
  blockHeight?: string | number,
  signal?: AbortSignal
): Promise<SwapRewardsResponse> {
  const url = buildUrl("SwapRewards", { address, blockHeight });
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`SwapRewards fetch failed: ${res.status}`);
  return res.json();
}
