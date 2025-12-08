import { disconnect } from "wagmi/actions";
import { isInjectedLike, isWalletConnectLike } from "./connectorUtils";

/** wagmi.persisted store를 강제로 'disconnected' 상태로 만든다. */
function forceWagmiDisconnected() {
  try {
    const raw = localStorage.getItem("wagmi.store");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.state) {
      // wagmi v1/v2 모두 여기에 connections/status가 들어있음
      data.state.connections = [];
      data.state.status = "disconnected";
      if ("current" in data.state) data.state.current = null;
    }
    localStorage.setItem("wagmi.store", JSON.stringify(data));
  } catch {}
}

/** RainbowKit 측 캐시도 광범위하게 제거 */
function clearKnownCaches() {
  try {
    // 개별 키 제거
    const KEYS = [
      // wagmi
      "wagmi.store",
      "wagmi.connected",
      "wagmi.cache",
      // rainbowkit
      "rainbowkit.connectedWallets",
      "rainbowkit:connectedWallets",
      "rk-last-connector",
      "rainbowkit.wallet",
      // walletconnect v1/v2
      "walletconnect",
      "walletconnectv2",
      "WALLETCONNECT_DEEPLINK_CHOICE",
      "wc@2:client",
      // coinbase
      "coinbaseWalletSDK",
      "walletlink",
      "walletlink:https://www.walletlink.org:session",
    ];
    KEYS.forEach((k) => localStorage.removeItem(k));
    // prefix 기반 정리
    const PREFIXES = [
      "wagmi.",
      "rainbowkit.",
      "wc@",
      "walletconnect",
      "coinbaseWallet:",
      "walletlink:",
    ];
    Object.keys(localStorage).forEach((k) => {
      if (PREFIXES.some((p) => k.startsWith(p))) {
        localStorage.removeItem(k);
      }
    });
  } catch {}
}

export async function safeDisconnect(params: {
  config: any;
  connector?: any;
  provider?: any;
  hardReloadOnInjected?: boolean; // MetaMask 등 injected에 한해 리로드 여부
}) {
  const { config, connector, provider, hardReloadOnInjected = true } = params;
  const connectorId: string | undefined = connector?.id;

  // 1) wagmi state 끊기
  try {
    await disconnect(config, { connector });
  } catch {}

  // 2) 커넥터 자체 세션 끊기 시도
  try {
    await connector?.disconnect?.();
  } catch {}
  try {
    await (connector as any)?.deactivate?.();
  } catch {}

  // 3) WalletConnect는 provider 쪽도 끊기
  if (isWalletConnectLike(connectorId)) {
    try {
      await (connector as any)?.walletConnectProvider?.disconnect?.();
    } catch {}
    try {
      await (connector as any)?.walletConnectProvider?.destroy?.();
    } catch {}
  }

  // 4) 로컬스토리지 캐시/세션 강제 초기화
  clearKnownCaches();
  forceWagmiDisconnected();

  // 5) Injected(메타마스크) 계열: 완전한 세션 종료가 불가 → 리로드 옵션
  if (isInjectedLike(connectorId, provider)) {
    // soft-block 플래그는 유지 (원하는 UX에 맞춰)
    try {
      sessionStorage.setItem("__CONSENT_BLOCKED_UNTIL_SIGN__", "1");
    } catch {}

    if (hardReloadOnInjected) {
      try {
        location.reload();
      } catch {}
    }
  }
}
