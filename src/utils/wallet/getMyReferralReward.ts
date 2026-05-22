import { buildUrl } from "./buildUrl";
import type { RewardItem } from "./typeReward";


export type ReferralRewardsResponse = {
  response: boolean;
  result: boolean;
  ReferralRewards: RewardItem[];
};

export async function getMyReferralReward(
  address: `0x${string}`,
  blockHeight?: string | number,
  signal?: AbortSignal
): Promise<ReferralRewardsResponse> {
  const url = buildUrl("ReferralRewards", { address, blockHeight });
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`ReferralRewards fetch failed: ${res.status}`);
  return res.json();
}
