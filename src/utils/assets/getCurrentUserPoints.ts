import { useChainId } from "wagmi";
import { buildUrl } from "../wallet/buildUrl";

export type Address = `0x${string}`
export type PointsMap = Record<string, string>;

export type CurrentUserPointsResponse = {
  response: boolean;
  result: boolean;
  chainId: string;          
  totalPoints: string;      
  pointsDetail: {
    staking: PointsMap;             
    swapWithReferrals: PointsMap;   
    referrals: PointsMap;           
  };
}
const isDevLike =
  (process.env.NEXT_PUBLIC_OPERATION_MODE ?? "").trim().toLowerCase() === "dev" ||
  (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").trim().toLowerCase() === "preview";

const toChainIdParam = (id?: number) =>
  isDevLike ? "0" : (typeof id === "number" ? String(id) : undefined);

export async function getCurrentUserPoints(
  address: Address,
  opts: { signal?: AbortSignal;} = {}
): Promise<CurrentUserPointsResponse> {
  const { signal } = opts;
  const url = buildUrl("CurrentUserPoints", { address });
  // console.log("CurrentUserRewards URL:", url);
  const res = await fetch(url, { method: "GET", signal, credentials: "omit" });
  if (!res.ok) throw new Error(`CurrentUserPoints fetch failed: ${res.status}`);
  return res.json();
}
