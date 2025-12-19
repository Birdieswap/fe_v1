export function copyToClipboard(text: string): boolean {
  if (!text) return false;

  // ✅ 1) 동기 fallback 먼저 (user gesture 유지에 유리)
  const ok = copyWithExecCommand(text);
  if (ok) return true;

  // ✅ 2) Clipboard API는 비동기라 여기서는 fire-and-forget으로만 시도
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText &&
      typeof window !== "undefined" &&
      window.isSecureContext
    ) {
      navigator.clipboard.writeText(text).catch(() => {
        // ignore
      });
      return true; // "시도"는 됨
    }
  } catch {
    // ignore
  }

  // ✅ 3) 최후의 보루: prompt (사용자가 직접 복사 가능)
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

    const el = document.createElement("textarea");
    el.value = text;

    // iOS/Safari 안정화 옵션
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.fontSize = "16px"; // iOS 줌/선택 이슈 완화

    document.body.appendChild(el);

    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(el);

    return ok;
  } catch {
    return false;
  }
}
