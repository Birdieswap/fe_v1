// src/utils/wallet/getRewardList.ts

import { BigDecimal } from "@/types/BigDecimal";
import type { RewardItem } from "./typeReward";
import type { RewardRaw } from "@/utils/wallet/getRewardsTotal";

export type RewardListItem = {
  type: RewardItem["type"];
  symbol: string;
  amount: string;          // decimals 반영 + 뒤 0 제거
  blockTimestamp: string;  // 초 단위 문자열 그대로
  transactionHash: `0x${string}`;
};

const lc = (s?: string) => (s ? s.toLowerCase() : "");
const toExactTrimmed = (bd: BigDecimal) =>

  bd.toPrecisionString(true, false);

export function getRewardList(info: RewardItem[], raw: RewardRaw[]): RewardListItem[] {
  // 주소 → {symbol, decimals} 맵
  const byAddr = new Map<string, { symbol: string; decimals: number }>();
  for (const r of raw || []) {
    if (r?.address) byAddr.set(lc(r.address), { symbol: r.symbol, decimals: r.decimals });
  }

  if (!Array.isArray(info)) return [];

  return info.map((ev) => {
    const tokenAddr = lc(ev.data?.rewardToken as unknown as string);
    const amountRaw = String(ev.data?.rewardAmount ?? "0");

    const meta = byAddr.get(tokenAddr);
    const symbol = meta?.symbol ?? "UNKNOWN";
    const decimals = meta?.decimals ?? 18;

    const amount = toExactTrimmed(new BigDecimal(BigInt(Number(amountRaw)), decimals));

    return {
      type: ev.type,
      symbol,
      amount,
      blockTimestamp: String(ev.blockTimestamp ?? ""),
      transactionHash: ev.transactionHash,
    };
  });
}
