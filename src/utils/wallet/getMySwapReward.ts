import { use } from "react";
import { buildUrl } from "./buildUrl";
import type { RewardItem } from "./typeReward";
import { useChainId } from "wagmi";

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
  const chainId= useChainId(); 
  const chainIdStr = (() => {
        const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
          .toString()
          .trim()
          .toLowerCase();
        return mode === "dev" ? "0" : String(chainId);
      })();
  const url = buildUrl("SwapRewards", { address, chainId: chainIdStr, blockHeight });
  console.log("SwapRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`SwapRewards fetch failed: ${res.status}`);
  return res.json();
}
