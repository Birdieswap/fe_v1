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

  // 2) URL -> 패널 문자열 파싱 유틸
  const parsePanelFromUrl = useCallback((): "STAKE" | "UNSTAKE" => {
    const p = (searchParams.get("stakePanel") || "").toLowerCase();
    return p === "unstake" ? "UNSTAKE" : "STAKE";
  }, [searchParams]);

  const [selectedPanel, setSelectedPanel] = useState<"STAKE" | "UNSTAKE">(
    "STAKE"
  );

  // FarmDetail과 동일한 방식으로 활성화 판단 (키는 프로젝트 규칙에 맞게)
  const activeKey = item?.wip_stakeToken?.fullName ?? item?.name ?? "";
  const isActive = selectedRow === activeKey;

  const initFromUrlRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;

    if (!initFromUrlRef.current) {
      const next = parsePanelFromUrl();
      setSelectedPanel(next);
      initFromUrlRef.current = true;
    }
  }, [isActive, parsePanelFromUrl]);

  useEffect(() => {
    if (!isActive) return;

    const sp = searchParams;
    const open = (sp.get("open") || "").toLowerCase();
    const panel = (sp.get("stakePanel") || "").toLowerCase(); // "unstake"|"stake"|""
    const amount = sp.get("unstakeAmount") || ""; // 값 or ""

    // ★ 현재 트리거 서명
    const curSig = `${open}|${panel}|${amount}`;

    // ★ 직전과 다를 때만 소비 (같은 값 계속 들어와도, URL이 깨끗했다가 다시 들어오면 curSig가 달라짐)
    if (curSig !== lastTriggerRef.current) {
      lastTriggerRef.current = curSig;

      // 1) 패널 적용 (URL → 상태)
      if (panel === "unstake") setSelectedPanel("UNSTAKE");
      else if (panel === "stake") setSelectedPanel("STAKE");
      // panel이 없으면 상태 유지

      // 2) URL 정리: stakePanel만 *지연 삭제
      if (panel) {
        setTimeout(() => {
          const sp2 = new URLSearchParams(searchParams.toString());
          sp2.delete("stakePanel");
          const q = sp2.toString();
          router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
        }, 0);
      }
    }
  }, [isActive, searchParams, router, pathname, setSelectedPanel]);

  // 비활성화 시 정리(선택 사항): 다시 열릴 때 새 서명으로 인식
  useEffect(() => {
    if (!isActive) {
      lastTriggerRef.current = ""; // 리셋
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      const sp = new URLSearchParams(searchParams.toString());
      if (sp.has("stakePanel")) {
        sp.delete("stakePanel");
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      }
    }
  }, [isActive, router, pathname, searchParams]);

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          layout
          {...defaultTransition}
          className="flex h-full grow basis-0 flex-col"
        >
          <motion.div
            layout
            {...defaultTransition}
            className="flex h-full grow basis-10 flex-col"
          >
            <motion.div
              layout
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
                  <UnStakePanel item={item} matched={matched} />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
