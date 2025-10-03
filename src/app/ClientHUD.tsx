"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DebugHUD = dynamic(() => import("@/debug/DebugHUD"), { ssr: false });

const LS_KEY = "birdie:debugHUD";

export default function ClientHUD() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // 1) URL 파라미터 처리 (?debugHUD=1 | 0)
    try {
      const url = new URL(window.location.href);
      const v = url.searchParams.get("debugHUD");
      if (v === "1") {
        localStorage.setItem(LS_KEY, "1");
        setEnabled(true);
        // 깔끔하게 파라미터 제거
        url.searchParams.delete("debugHUD");
        window.history.replaceState({}, "", url.toString());
      } else if (v === "0") {
        localStorage.removeItem(LS_KEY);
        setEnabled(false);
        url.searchParams.delete("debugHUD");
        window.history.replaceState({}, "", url.toString());
      } else {
        // 파라미터 없으면 localStorage 상태 반영
        setEnabled(!!localStorage.getItem(LS_KEY));
      }
    } catch {
      setEnabled(!!localStorage.getItem(LS_KEY));
    }

    // 2) 콘솔/북마클릿에서 쓸 수 있는 전역 토글 함수
    (window as any).__DBG_HUD_TOGGLE = (on?: boolean) => {
      const cur = !!localStorage.getItem(LS_KEY);
      const next = on ?? !cur;
      if (next) {
        localStorage.setItem(LS_KEY, "1");
        setEnabled(true);
      } else {
        localStorage.removeItem(LS_KEY);
        setEnabled(false);
      }
      console.log("[DebugHUD]", next ? "ENABLED" : "DISABLED");
    };
  }, []);

  if (!enabled) return null;
  return <DebugHUD />;
}
