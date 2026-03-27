// /utils/wallet/copyToClipboard.ts
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Modern API (Navigator Clipboard) 우선 사용
  if (
    typeof window !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Clipboard API failed, falling back...", err);
    }
  }

  // 2. Fallback: execCommand('copy')
  if (copyFallback(text)) return true;

  // 3. 최후 fallback: 수동 복사 유도
  if (typeof window !== "undefined") {
    window.prompt("Copy to clipboard: Ctrl+C (or Cmd+C), Enter", text);
  }
  return false;
}

function copyFallback(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // 화면 밖으로 완전히 밀어내기
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.setAttribute("readonly", "true");
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed", err);
    // 3. 최후의 보루: Prompt (필요 시 유지)
    // window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    return false;
  }
}
