"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";

const DebugHUD = dynamic(() => import("@/debug/DebugHUD"), { ssr: false });

const LS_KEY = "birdie:debugHUD";

export default function ClientHUD() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    // 1) URL 파라미터 처리 (?debugHUD=1 | 0)
    try {
      const url = new URL(window.location.href);
      const v = url.searchParams.get("debugHUD");
      if (v === "1") {
        localStorage.setItem(LS_KEY, "1");
        setEnabled(true);
        url.searchParams.delete("debugHUD");
        window.history.replaceState({}, "", url.toString());
      } else if (v === "0") {
        localStorage.removeItem(LS_KEY);
        setEnabled(false);
        url.searchParams.delete("debugHUD");
        window.history.replaceState({}, "", url.toString());
      } else {
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

    // 3) 콘솔 로그 버퍼링 (리로드 후에도 복구)
    try {
      const KEY = "__CONSENT_DEBUG_LOGS__";
      if (!(window as any).__CONSENT_LOG_HOOKED__) {
        (window as any).__CONSENT_LOG_HOOKED__ = true;

        const shouldDrop = (args: any[]) => {
          // DebugHUD가 꺼져있으면 이 패턴 로그는 콘솔/버퍼 둘 다 무시
          if (enabledRef.current) return false;
          const first = args?.[0];
          return (
            typeof first === "string" &&
            first.includes("[QuoterV2 exactInput] call")
          );
        };

        const push = (level: string, args: any[]) => {
          try {
            const arr: any[] = JSON.parse(sessionStorage.getItem(KEY) || "[]");
            arr.push({
              t: new Date().toISOString(),
              level,
              msg: args
                .map((a) => {
                  try {
                    return typeof a === "string" ? a : JSON.stringify(a);
                  } catch {
                    return String(a);
                  }
                })
                .join(" "),
            });
            const MAX = 1000;
            if (arr.length > MAX) arr.splice(0, arr.length - MAX);
            sessionStorage.setItem(KEY, JSON.stringify(arr));
          } catch {}
        };

        ["debug", "log", "warn", "error"].forEach((lv) => {
          const orig = (console as any)[lv] || console.log;
          (console as any)[lv] = function (...args: any[]) {
            if (shouldDrop(args)) return; // ✅ 여기서 필터
            push(lv, args);
            try {
              orig.apply(console, args);
            } catch {}
          };
        });

        // ... window error / unhandledrejection 기존 그대로
      }
    } catch {}
  }, []);

  if (!enabled) return null;
  return <DebugHUD />;
}
