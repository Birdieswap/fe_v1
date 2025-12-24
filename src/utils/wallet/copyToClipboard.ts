// /utils/wallet/copyToClipboard.ts
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // ✅ 1) 먼저 동기 복사 (user gesture 유지에 가장 유리)
  const okSync = copyWithExecCommand(text);
  if (okSync) return true;

  // ✅ 2) Clipboard API (지원되는 환경에서만)
  try {
    if (typeof window !== "undefined") {
      console.log("[copyToClipboard] trying clipboard api", {
        isSecureContext: window.isSecureContext,
      });
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.log("[copyToClipboard] clipboard api failed", error);
  }

  // ✅ 3) 최후의 보루: prompt
  try {
    if (typeof window !== "undefined") {
      window.prompt("Copy to clipboard:", text);
      return true;
    }
  } catch {}

  return false;
}

function copyWithExecCommand(text: string): boolean {
  try {
    if (typeof document === "undefined") return false;

    // ✅ input보다 textarea가 iOS/WebView에서 더 안정적인 편
    const el = document.createElement("textarea");
    el.value = text;

    el.setAttribute("readonly", "");
    el.setAttribute("aria-hidden", "true");

    // 화면에 영향 최소화
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "1px";
    el.style.height = "1px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.userSelect = "text";
    // @ts-ignore
    el.style.webkitUserSelect = "text";
    el.style.fontSize = "16px";

    document.body.appendChild(el);

    el.focus();
    el.select();
    try {
      el.setSelectionRange(0, text.length);
    } catch {
      // ignore
    }

    const ok = document.execCommand("copy");

    document.body.removeChild(el);
    document.getSelection()?.removeAllRanges();

    return ok;
  } catch {
    return false;
  }
}
