import { use } from "react";
import { buildUrl } from "./buildUrl";
import type { RewardItem } from "./typeReward";
import { useChainId } from "wagmi";

export type SwapRewardsResponse = {
  response: boolean;
  result: boolean;
  SwapRewards: RewardItem[];
};

const isDevLike =
  (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase() === "dev" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").trim().toLowerCase() === "preview";

const toChainIdParam = (id?: number) =>
  isDevLike ? "0" : (typeof id === "number" ? String(id) : undefined);

export async function getMySwapReward(
  address: `0x${string}`,
  opts: { blockHeight?: string | number; signal?: AbortSignal; chainId?: number } = {}
  ): Promise<SwapRewardsResponse> {
  const { blockHeight, signal, chainId } = opts;
  const url = buildUrl("SwapRewards", { address, blockHeight , chainId: toChainIdParam(chainId) });
  console.log("SwapRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`SwapRewards fetch failed: ${res.status}`);
  return res.json();
}
