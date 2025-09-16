import { useChainId } from "wagmi";
import { buildUrl } from "./buildUrl";
import type { RewardItem } from "./typeReward";


export type ReferralRewardsResponse = {
  response: boolean;
  result: boolean;
  ReferralRewards: RewardItem[];
};

const isDevLike =
  (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase() === "dev" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").trim().toLowerCase() === "preview";

const toChainIdParam = (id?: number) =>
  isDevLike ? "0" : (typeof id === "number" ? String(id) : undefined);


export async function getMyReferralReward(
  address: `0x${string}`,
  opts: { blockHeight?: string | number; signal?: AbortSignal; chainId?: number } = {}
): Promise<ReferralRewardsResponse> {
  const { blockHeight, signal, chainId } = opts;
  const url = buildUrl("ReferralRewards", { address, blockHeight, chainId: toChainIdParam(chainId) });
  console.log("ReferralRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`ReferralRewards fetch failed: ${res.status}`);
  return res.json();
}

