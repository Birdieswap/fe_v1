import { useChainId } from "wagmi";
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
  const chainId= useChainId();
  const chainIdStr = (() => {
        const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
          .toString()
          .trim()
          .toLowerCase();
        return mode === "dev" ? "0" : String(chainId);
      })();
  const url = buildUrl("ReferralRewards", { address, chainId: chainIdStr, blockHeight });
  console.log("ReferralRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`ReferralRewards fetch failed: ${res.status}`);
  return res.json();
}
