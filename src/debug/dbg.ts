"use client";

/** 단순 전역 버퍼 + 브로드캐스트 */
export type DEvent = { t: number; tag: string; data?: any };

export function dbg(tag: string, data?: any) {
  try {
    const w = window as any;
    const buf: DEvent[] = (w.__DBG ||= []);
    buf.push({ t: Date.now(), tag, data });

    // HUD에게 즉시 반영하도록 이벤트 브로드캐스트
    w.dispatchEvent(new CustomEvent("__DBG_EVENT__", { detail: { tag, data } }));
  } catch {}
}

/** 버퍼 지우기 */
export function clearDbg() {
  try {
    (window as any).__DBG = [];
  } catch {}
}

/** 현재 버퍼 가져오기 */
export function getDbg(): DEvent[] {
  try {
    return (window as any).__DBG || [];
  } catch {
    return [];
  }
}
