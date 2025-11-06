// src/utils/points/getCurrentUserPoints.ts
import { buildUrl } from "../wallet/buildUrl";

export type Address = `0x${string}`;
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
};

export async function getCurrentUserPoints(
  address: Address,
  opts: { signal?: AbortSignal } = {}
): Promise<CurrentUserPointsResponse> {
  const { signal } = opts;

  const url = buildUrl("CurrentUserPoints", { address });

  const isProxy = typeof url === "string" && url.startsWith("/api/");
  const absoluteUrl =
    isProxy && typeof window !== "undefined"
      ? new URL(url, window.location.origin).toString()
      : url;

  const res = await fetch(absoluteUrl, {
    method: "GET",
    signal,
    credentials: "same-origin",
    cache: "no-store",
    headers: { accept: "application/json, text/plain, */*" },
  });

  const ct = res.headers.get("content-type") || "";
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    console.warn(
      "[points] non-OK",
      res.status,
      res.statusText,
      raw.slice(0, 300)
    );
    throw new Error(`CurrentUserPoints fetch failed: ${res.status}`);
  }
  const looksJson =
    ct.includes("application/json") || /^[\s\r\n]*[\{\[]/.test(raw);
  if (!looksJson) throw new Error("CurrentUserPoints invalid JSON");

  return JSON.parse(raw) as CurrentUserPointsResponse;
}
