import { buildUrl } from "./buildUrl";

type Address = `0x${string}`;

export type CurrentUserRewardsResponse = {
  response: boolean;
  result: boolean;
  SwapRewards: Record<Address, string>;
  ReferralRewards: Record<Address, string>;
};

export async function getMyCurrentUserReward(
  address: Address,
  signal?: AbortSignal
): Promise<CurrentUserRewardsResponse> {
  const url = buildUrl("CurrentUserRewards", { address });
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`CurrentUserRewards fetch failed: ${res.status}`);
  return res.json();
}
