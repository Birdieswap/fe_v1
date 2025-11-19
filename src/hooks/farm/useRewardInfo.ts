"use client";
import { useAccount, useChainId } from "wagmi";
import { useContext, useMemo } from "react";
import { AssetsContext, AprEntry } from "@/app/AssetsContextProvider";

import type { Farm } from "@/types/FarmListTableRowProps";
import type { BigDecimal } from "@/types/BigDecimal";

export function useRewardInfo(item: Farm, priceBD?: BigDecimal | null) {
  const chainId = useChainId();
  const { aprDataState } = useContext(AssetsContext);
  const price = useMemo(() => {
    const v: any = priceBD;
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v?.toNumber === "function") {
      try {
        return v.toNumber();
      } catch {
        return 0;
      }
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [priceBD]);

  const stakeAddr = item?.wip_stakeToken?.addresses?.[chainId];
  const stakeAddrLower = (stakeAddr ?? "").toLowerCase();
  const chainIdStr = (() => {
    const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
      .toString()
      .trim()
      .toLowerCase();
    return mode === "dev" ? "0" : String(chainId);
  })();

  const aprList: AprEntry[] = (aprDataState as any)?.apr ?? [];
  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chainId === chainIdStr &&
          (e.contractAddress ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddrLower]
  );

  const dprRaw = matched?.staking?.dailyPointRate as
    | string
    | number
    | undefined;
  const dailyPointRateNum = Number(
    typeof dprRaw === "string" || typeof dprRaw === "number" ? dprRaw : 0
  );
  const extraList = (matched?.staking?.extraRewards ?? []) as any[];

  const showStakingBlock =
    Boolean(matched?.staking?.contractAddress) &&
    ((Array.isArray(extraList) && extraList.length > 0) ||
      (Number.isFinite(dailyPointRateNum) && dailyPointRateNum > 0));

  // console.log("useRewardInfo render:", { dailyPointRateNum, price });
  // console.log("matched staking raw:", matched?.staking);

  return { price, matched, dailyPointRateNum, extraList, showStakingBlock };
}
