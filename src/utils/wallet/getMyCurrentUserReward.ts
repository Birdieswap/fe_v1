import { useChainId } from "wagmi";
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
  const chainId = useChainId();
  const chainIdStr = (() => {
        const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
          .toString()
          .trim()
          .toLowerCase();
        return mode === "dev" ? "0" : String(chainId);
      })();
  const url = buildUrl("CurrentUserRewards", { address, chainId: chainIdStr });
  console.log("CurrentUserRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`CurrentUserRewards fetch failed: ${res.status}`);
  return res.json();
}
