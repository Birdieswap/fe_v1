"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChainId } from "wagmi";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { defaultTransition } from "@/const/presenceTransition";
import type { Farm } from "@/types/FarmListTableRowProps";
import StakePanel from "./stakingPanels/StakePanel";
import UnStakePanel from "./stakingPanels/UnStakePanel";
import { AssetsContext, AprEntry } from "@/app/AssetsContextProvider";
import { useContext } from "react";
import PanelButtons, { PanelMode } from "./PanelButtons";
import { BigDecimal } from "@/types/BigDecimal";

export default function StakingPanels({
  item,
  selectedRow,
  lpBalance,
  stakedBalance,
  totalBalance,
  price,
}: {
  item: Farm;
  selectedRow: string | null;
  lpBalance?: BigDecimal;
  stakedBalance?: BigDecimal;
  totalBalance?: BigDecimal;
  price?: BigDecimal | null;
}) {
  // --- EarningsPanel에서 하던 matched 계산을 이곳으로 이동 ---
  const chainId = useChainId();
  const { aprDataState } = useContext(AssetsContext);
  const aprList: AprEntry[] = aprDataState?.apr ?? [];

  const stakeAddr = item?.wip_stakeToken?.addresses?.[chainId];
  const stakeAddrLower = (stakeAddr ?? "").toLowerCase();
  const chainIdStr = (() => {
    const mode = (process?.env?.NEXT_PUBLIC_OPERATION_MODE ?? "")
      .toString()
      .trim()
      .toLowerCase();
    return mode === "dev" ? "0" : String(chainId);
  })();

  const matched = useMemo(
    () =>
      aprList.find(
        (e) =>
          e.chainId === chainIdStr &&
          (e.contractAddress ?? "").toLowerCase() === stakeAddrLower
      ),
    [aprList, chainIdStr, stakeAddrLower]
  );

  // --- URL 파라미터 프리셋 로직 (StakeDetail과 동일) ---
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const readUrl = useCallback(() => {
    if (typeof window === "undefined") {
      const p = (searchParams.get("stakePanel") || "").toLowerCase();
      const amt = searchParams.get("unstakeAmount") || "";
      const open = (searchParams.get("open") || "").toLowerCase();
      return { panel: p, amount: amt, open };
    }
    const sp = new URLSearchParams(window.location.search);
    return {
      panel: (sp.get("stakePanel") || "").toLowerCase(),
      amount: sp.get("unstakeAmount") || "",
      open: (sp.get("open") || "").toLowerCase(),
    };
  }, [searchParams]);

  const applyAndCleanUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.has("stakePanel")) {
        url.searchParams.delete("stakePanel");
        changed = true;
      }
      if (url.searchParams.has("unstakeAmount")) {
        url.searchParams.delete("unstakeAmount");
        changed = true;
      }
      if (changed) {
        window.history.replaceState(null, "", url.toString());
        window.dispatchEvent(new CustomEvent("farm:query-updated"));
      }
    } else {
      const sp2 = new URLSearchParams(searchParams.toString());
      let changed = false;
      if (sp2.has("stakePanel")) {
        sp2.delete("stakePanel");
        changed = true;
      }
      if (sp2.has("unstakeAmount")) {
        sp2.delete("unstakeAmount");
        changed = true;
      }
      if (changed)
        router.replace(`${pathname}?${sp2.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const [selectedPanel, setSelectedPanel] = useState<PanelMode>("STAKE");
  const [applyToken, setApplyToken] = useState(0);
  const presetMaxRef = useRef(false);
  const lastSigRef = useRef("");

  // FarmDetail과 동일 키 규칙
  const activeKey = item?.wip_stakeToken?.fullName ?? item?.name ?? "";
  const isActive = selectedRow === activeKey;

  const consumeUrlOnce = useCallback(() => {
    const { panel, amount, open } = readUrl();
    const sig = `${open}|${panel}|${amount}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    if (panel === "unstake") setSelectedPanel("UNSTAKE");
    else if (panel === "stake") setSelectedPanel("STAKE");

    if (panel === "unstake" && amount.toLowerCase() === "max") {
      presetMaxRef.current = true;
      setApplyToken((t) => t + 1);
      // URL 정리는 자식이 프리셋 적용 후 신호 줄 때 처리
    }
  }, [readUrl]);

  useEffect(() => {
    if (isActive) consumeUrlOnce();
  }, [isActive, consumeUrlOnce]);

  useEffect(() => {
    const onSignal = () => {
      if (isActive) consumeUrlOnce();
    };
    window.addEventListener("farm:query-updated", onSignal as EventListener);
    window.addEventListener("popstate", onSignal);
    return () => {
      window.removeEventListener(
        "farm:query-updated",
        onSignal as EventListener
      );
      window.removeEventListener("popstate", onSignal);
    };
  }, [isActive, consumeUrlOnce]);

  // --- FarmingPanels와 동일한 레이아웃 클래스 ---
  return (
    <motion.div
      layout={false}
      {...defaultTransition}
      className="flex h-full grow basis-10 flex-col"
    >
      <motion.div
        layout={false}
        {...defaultTransition}
        className="flex h-12 flex-row"
      >
        <PanelButtons.Stake
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
        <PanelButtons.Unstake
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
      </motion.div>

      <AnimatePresence initial={false} mode="wait">
        {selectedPanel === "STAKE" ? (
          <StakePanel
            key="stake"
            item={item}
            matched={matched}
            lpBalance={lpBalance}
            stakedBalance={stakedBalance}
            totalBalance={totalBalance}
            price={price}
          />
        ) : (
          <UnStakePanel
            key="unstake"
            item={item}
            lpBalance={lpBalance}
            stakedBalance={stakedBalance}
            totalBalance={totalBalance}
            price={price}
            matched={matched}
            presetMaxToken={presetMaxRef.current ? applyToken : undefined}
            onPresetApplied={() => {
              presetMaxRef.current = false;
              applyAndCleanUrl();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
