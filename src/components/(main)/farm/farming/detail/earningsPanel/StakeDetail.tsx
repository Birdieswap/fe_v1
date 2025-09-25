"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import StakePanel from "./stakingPanels/StakePanel";
import UnStakePanel from "./stakingPanels/UnStakePanel";
import StakePanelButton from "./stakingPanels/StakePanelButtons";
import type { Farm } from "@/types/FarmListTableRowProps";
import { AprEntry } from "@/app/AssetsContextProvider";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function StakeDetail({
  item,
  selectedRow,
  matched,
}: {
  item: Farm; // 필요 시 Farm 타입으로 바꾸세요
  selectedRow: string | null;
  matched: AprEntry | undefined;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const lastTriggerRef = useRef<string>("");
  const readUrl = useCallback(() => {
    if (typeof window === "undefined") {
      // 서버/폴백: next/navigation 훅
      const p = (searchParams.get("stakePanel") || "").toLowerCase();
      const amt = searchParams.get("unstakeAmount") || "";
      const open = (searchParams.get("open") || "").toLowerCase();
      return { panel: p, amount: amt, open };
    }
    const sp = new URLSearchParams(window.location.search);
    const p = (sp.get("stakePanel") || "").toLowerCase();
    const amt = sp.get("unstakeAmount") || "";
    const open = (sp.get("open") || "").toLowerCase();
    return { panel: p, amount: amt, open };
  }, [searchParams]);

  const applyAndCleanUrl = useCallback(
    (panel: string, amount: string) => {
      // URL에서 stakePanel, unstakeAmount 삭제
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
          window.dispatchEvent(new CustomEvent("farm:query-updated")); // 일관성 유지
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
    },
    [pathname, router, searchParams]
  );

  const [selectedPanel, setSelectedPanel] = useState<"STAKE" | "UNSTAKE">(
    "STAKE"
  );
  const [applyToken, setApplyToken] = useState(0);
  const [awaitingApply, setAwaitingApply] = useState(false);

  const presetMaxRef = useRef(false);

  const pendingCleanRef = useRef<{ panel?: string; amount?: string } | null>(
    null
  );

  // FarmDetail과 동일한 방식으로 활성화 판단 (키는 프로젝트 규칙에 맞게)
  const activeKey = item?.wip_stakeToken?.fullName ?? item?.name ?? "";
  const isActive = selectedRow === activeKey;

  const consumeUrlOnce = useCallback(() => {
    const { panel, amount, open } = readUrl();
    const sig = `${open}|${panel}|${amount}`;
    if (sig === lastTriggerRef.current) return;
    lastTriggerRef.current = sig;

    if (panel === "unstake") setSelectedPanel("UNSTAKE");
    else if (panel === "stake") setSelectedPanel("STAKE");

    // ★ "max" 감지: 값 state 없이 ref + token만!
    if (panel === "unstake" && amount.toLowerCase() === "max") {
      presetMaxRef.current = true; // 다음에 한 번 max
      setApplyToken((t) => t + 1); // 신호 토큰 증가 → 자식에서 이 변화만 트리거
      setAwaitingApply(true);
      pendingCleanRef.current = { panel, amount }; // URL 정리는 나중에
    }
  }, [readUrl]);

  useEffect(() => {
    if (isActive) consumeUrlOnce();
  }, [isActive, consumeUrlOnce]);

  // history.replaceState / 뒤로가기 신호 구독
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

  // 비활성화 시 정리(선택 사항): 다시 열릴 때 새 서명으로 인식
  useEffect(() => {
    if (!isActive) {
      lastTriggerRef.current = ""; // 리셋
    }
  }, [isActive]);

  // 비활성화 시 URL 잔여 파라미터 정리(양쪽 모두)
  useEffect(() => {
    if (!isActive) {
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
      setAwaitingApply(false);
    }
  }, [isActive, pathname, router, searchParams]);

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          layout={false}
          {...defaultTransition}
          className="flex h-full grow basis-0 flex-col"
        >
          <motion.div
            layout={false}
            {...defaultTransition}
            className="flex h-full grow basis-10 flex-col"
          >
            <motion.div
              layout={false}
              {...defaultTransition}
              className="flex h-8 flex-row"
            >
              <StakePanelButton.Stake
                selectedPanel={selectedPanel}
                setSelectedPanel={setSelectedPanel}
              />
              <StakePanelButton.Unstake
                selectedPanel={selectedPanel}
                setSelectedPanel={setSelectedPanel}
              />
            </motion.div>
            <motion.div
              className={clsx("rounded-b-xl bg-background px-4 py-4")}
            >
              <AnimatePresence initial={false}>
                {selectedPanel === "STAKE" ? (
                  <StakePanel item={item} matched={matched} />
                ) : (
                  <UnStakePanel
                    item={item}
                    matched={matched}
                    presetMaxToken={applyToken}
                    onPresetApplied={() => {
                      // URL 정리: 이제서야 삭제
                      if (pendingCleanRef.current) {
                        const { panel = "", amount = "" } =
                          pendingCleanRef.current;
                        pendingCleanRef.current = null;
                        applyAndCleanUrl(panel, amount);
                      }
                      // 래치 해제
                      presetMaxRef.current = false;
                      setAwaitingApply(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
