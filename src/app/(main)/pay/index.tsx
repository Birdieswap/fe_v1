"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import { defaultTransition } from "@/const/presenceTransition";

import { PayPanel } from "@/components/(main)/pay/PayPanel";
import { EnterPanel } from "@/components/(main)/pay/EnterPanel";
import PanelButtons, {
  type Mode,
} from "@/components/(main)/pay/common/PanelButton";
import { usePayContext } from "@/components/(main)/pay/PayProvider";

// --------------------
// URL 파싱/정규화 헬퍼
// --------------------
function normalizeMode(v: string | null): Mode | null {
  if (!v) return null;
  const u = v.trim().toUpperCase();
  if (u === "PAY" || u === "ENTER") return u as Mode;
  return null;
}

function inferModeFromParams(sp: ReturnType<typeof useSearchParams>): Mode {
  const hasPayHints = !!(
    sp.get("to") ||
    sp.get("amount") ||
    sp.get("receiver")
  );
  const hasEnterHints = !!sp.get("pool");
  if (hasPayHints) return "PAY";
  if (hasEnterHints) return "ENTER";
  return "ENTER";
}

function sanitizeDecimalString(v: string | null): string | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return "";
  if (/^(\d+(\.\d*)?)?$/.test(s)) return s;
  return null;
}

function sanitizeAddressString(v: string | null): string | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return "";
  return s;
}

export default function PayIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pay = usePayContext();

  const initialMode = useMemo<Mode>(() => {
    const m = normalizeMode(searchParams.get("mode"));
    return m ?? inferModeFromParams(searchParams);
  }, [searchParams]);

  const [selectedPanel, setSelectedPanel] = useState<Mode>(initialMode);
  const [isReady, setIsReady] = useState(false);

  const ENTER = { type: "tween", duration: 0.5, ease: [0.22, 0.61, 0.36, 1] };
  const EXIT = { type: "tween", duration: 0.32, ease: [0.4, 0.0, 1, 1] };

  // --------------------
  // 1) URL -> 상태
  // --------------------
  useEffect(() => {
    const rawMode = searchParams.get("mode");
    const mode = normalizeMode(rawMode) ?? inferModeFromParams(searchParams);

    // mode가 없거나 이상하면 정규화된 URL로 rewrite
    if (!normalizeMode(rawMode)) {
      const next = new URLSearchParams();
      next.set("mode", mode);

      if (mode === "ENTER") {
        const pool = searchParams.get("pool")?.trim();
        if (pool) next.set("pool", pool);
      } else {
        // PAY에서는 pool/enter 관련 param 제거
        const to = searchParams.get("to") ?? searchParams.get("receiver");
        const amount = searchParams.get("amount");
        const toSan = sanitizeAddressString(to);
        const amtSan = sanitizeDecimalString(amount);
        if (toSan != null && toSan !== "") next.set("to", toSan);
        if (amtSan != null && amtSan !== "") next.set("amount", amtSan);
      }

      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }

    setSelectedPanel(mode);

    // PAY일 때만 receiver/amount 주입
    if (mode === "PAY") {
      const to = sanitizeAddressString(
        searchParams.get("to") ?? searchParams.get("receiver")
      );
      const amount = sanitizeDecimalString(searchParams.get("amount"));

      if (to != null && to !== pay.receiver) pay.setReceiver(to);
      if (amount != null && amount !== pay.payAmount) pay.setPayAmount(amount);
    }

    // ENTER의 pool 주입은 PayAmountInput(ENTER)에서 pools 로딩 후 매칭

    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname, router]);

  // --------------------
  // 2) 상태 -> URL
  //    ✅ PAY에서는 pool을 절대 URL에 넣지 않음
  // --------------------
  const canonicalQuery = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("mode", selectedPanel);

    if (selectedPanel === "PAY") {
      const to = (pay.receiver ?? "").trim();
      const amount = (pay.payAmount ?? "").trim();
      if (to) sp.set("to", to);
      if (amount) sp.set("amount", amount);
      // ✅ pool은 넣지 않음 (선택은 UI/상태로만 존재)
    } else {
      const pool = pay.selectedPool?.address?.trim();
      if (pool) sp.set("pool", pool);
      // ✅ ENTER에서는 pool만 반영
    }

    return sp.toString();
  }, [selectedPanel, pay.receiver, pay.payAmount, pay.selectedPool?.address]);

  useEffect(() => {
    if (!isReady) return;
    const current = searchParams.toString();
    if (current !== canonicalQuery) {
      router.replace(`${pathname}?${canonicalQuery}`, { scroll: false });
    }
  }, [isReady, canonicalQuery, pathname, router, searchParams]);

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1, transition: ENTER }}
        exit={{ height: 0, opacity: 0, transition: EXIT }}
        style={{ overflow: "hidden", willChange: "height, opacity" }}
        className={clsx(
          "flex w-full flex-col gap-4 overflow-hidden px-4 py-6 rounded-2xl",
          "bg-default-100 dark:bg-dark-popup-bg",
          "md:col-span-full",
          "max-md:col-span-3 max-md:row-span-2"
        )}
      >
        <motion.div
          layout={false}
          {...defaultTransition}
          className="flex h-full grow basis-10 flex-col"
        >
          {/* 상단 PAY / ENTER 스위치 */}
          <motion.div
            layout={false}
            {...defaultTransition}
            className="flex h-12 flex-row"
          >
            <PanelButtons.Enter
              selectedPanel={selectedPanel}
              setSelectedPanel={setSelectedPanel}
            />
            <PanelButtons.Pay
              selectedPanel={selectedPanel}
              setSelectedPanel={setSelectedPanel}
            />
          </motion.div>

          {/* 패널 내용: 선택된 패널만 렌더링 */}
          <AnimatePresence initial={false} mode="wait">
            {selectedPanel === "PAY" ? (
              <PayPanel key="PAY" />
            ) : (
              <EnterPanel key="ENTER" />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// "use client";

// import { useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import clsx from "clsx";

// import { defaultTransition } from "@/const/presenceTransition";

// import { PayPanel } from "@/components/(main)/pay/PayPanel";
// import { EnterPanel } from "@/components/(main)/pay/EnterPanel";
// import PanelButtons, {
//   type Mode,
// } from "@/components/(main)/pay/common/PanelButton";

// export default function PayIndex() {
//   const [selectedPanel, setSelectedPanel] = useState<Mode>("ENTER");

//   const ENTER = { type: "tween", duration: 0.5, ease: [0.22, 0.61, 0.36, 1] };
//   const EXIT = { type: "tween", duration: 0.32, ease: [0.4, 0.0, 1, 1] };

//   return (
//     <AnimatePresence initial={false} mode="wait">
//       <motion.div
//         initial={{ height: 0, opacity: 0 }}
//         animate={{ height: "auto", opacity: 1, transition: ENTER }}
//         exit={{ height: 0, opacity: 0, transition: EXIT }}
//         style={{ overflow: "hidden", willChange: "height, opacity" }}
//         className={clsx(
//           "flex w-full flex-col gap-4 overflow-hidden px-4 py-6 rounded-2xl",
//           "bg-default-100 dark:bg-dark-popup-bg",
//           "md:col-span-full",
//           "max-md:col-span-3 max-md:row-span-2"
//         )}
//       >
//         <motion.div
//           layout={false}
//           {...defaultTransition}
//           className="flex h-full grow basis-10 flex-col"
//         >
//           {/* 상단 PAY / easy Enter 스위치 */}
//           <motion.div
//             layout={false}
//             {...defaultTransition}
//             className="flex h-12 flex-row"
//           >
//             <PanelButtons.Enter
//               selectedPanel={selectedPanel}
//               setSelectedPanel={setSelectedPanel}
//             />
//             <PanelButtons.Pay
//               selectedPanel={selectedPanel}
//               setSelectedPanel={setSelectedPanel}
//             />
//           </motion.div>

//           {/* 패널 내용: 선택된 패널만 렌더링 */}
//           <AnimatePresence initial={false} mode="wait">
//             {selectedPanel === "PAY" ? (
//               <PayPanel key="PAY" />
//             ) : (
//               <EnterPanel key="ENTER" />
//             )}
//           </AnimatePresence>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }
