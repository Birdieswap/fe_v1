import { useChainId } from "wagmi";
import { buildUrl } from "./buildUrl";

type Address = `0x${string}`;

export type CurrentUserRewardsResponse = {
  response: boolean;
  result: boolean;
  SwapRewards: Record<Address, string>;
  ReferralRewards: Record<Address, string>;
};
const isDevLike =
  (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase() === "dev" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").trim().toLowerCase() === "preview";

const toChainIdParam = (id?: number) =>
  isDevLike ? "0" : (typeof id === "number" ? String(id) : undefined);

export async function getMyCurrentUserReward(
  address: Address,
  opts: { signal?: AbortSignal; chainId?: number } = {}
): Promise<CurrentUserRewardsResponse> {
  const { signal, chainId } = opts;
  const url = buildUrl("CurrentUserRewards", { address, chainId: toChainIdParam(chainId) });
  console.log("CurrentUserRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`CurrentUserRewards fetch failed: ${res.status}`);
  return res.json();
}
