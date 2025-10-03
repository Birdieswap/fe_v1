import { isInjectedLike } from "@/utils/wallet/connectorUtils";

export function isMetaMaskInAppEnv(connector?: { id?: string }, provider?: any) {
  try {
    const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "") || "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const isMMUA = /\bMetaMask\b/i.test(ua) || /\bMetaMaskMobile\b/i.test(ua);
    const isMMInjected = !!(provider && provider.isMetaMask);
    // Injected + 모바일 + UA에 MetaMask → 인앱으로 간주
    return isInjectedLike(connector?.id, provider) && isMobile && isMMUA && isMMInjected;
  } catch {
    return false;
  }
}
