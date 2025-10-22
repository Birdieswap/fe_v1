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
            // 너무 길어지지 않게 제한
            const s = JSON.stringify(arr);
            sessionStorage.setItem(KEY, s.length > 20000 ? s.slice(-20000) : s);
          } catch {}
        };

        ["debug", "log", "warn", "error"].forEach((lv) => {
          const orig = (console as any)[lv] || console.log;
          (console as any)[lv] = function (...args: any[]) {
            push(lv, args);
            try {
              orig.apply(console, args);
            } catch {}
          };
        });

        window.addEventListener("error", (e) => {
          push("error", [
            "window.error:",
            (e as any)?.error?.stack || e?.message || String(e),
          ]);
        });
        window.addEventListener("unhandledrejection", (e: any) => {
          push("error", [
            "unhandledrejection:",
            e?.reason?.stack || e?.reason || String(e),
          ]);
        });

        (window as any).__dumpConsentLogs = () => {
          try {
            const arr: any[] = JSON.parse(sessionStorage.getItem(KEY) || "[]");
            console.table(arr);
            return arr;
          } catch (e) {
            console.error("dumpLogs fail", e);
            return [];
          }
        };

        (window as any).__clearConsentLogs = () => {
          try {
            sessionStorage.removeItem(KEY);
            console.log("cleared consent logs");
          } catch {}
        };
      }
    } catch {}
  }, []);

  if (!enabled) return null;
  return <DebugHUD />;
}
