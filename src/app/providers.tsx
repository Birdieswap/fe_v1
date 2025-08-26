"use client";

import { HeroUIProvider } from "@heroui/react";
import { PropsWithChildren } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "next-themes";
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  trustWallet,
  walletConnectWallet,
  coinbaseWallet,
  uniswapWallet,
  braveWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  arbitrum,
  polygon,
  scroll,
  baseFork,
  bsc,
  sepolia,
  base_custom,
  optimism_custom,
} from "@/const/networks";

import SettingsProvider from "./SettingsProvider";
import WalletContextProvider from "./WalletContextProvider";
import AssetsContextProvider from "./AssetsContextProvider";
import { ReferralProvider } from "./ReferralContextProvider";

/*
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"); */

/*
// ⭐ 사용 가능한 지갑 목록 내보내기
export const getAvailableWallets = () => {
  const baseWallets = [metaMaskWallet, walletConnectWallet, uniswapWallet];

  // ⭐ 로컬 환경이 아닐 때만 Coinbase Wallet 추가 (CORS 에러 방지)
  if (!isLocal) {
    baseWallets.push(
      coinbaseWallet({
        appName: "Birdieswap",
        appIcon: "./wallets/coinbase.svg", // ⭐ 필수 appName 파라미터 제공
      }),
    );
  }

  // 로컬 환경이 아닌 경우에만 추가 지갑 포함
  if (!isLocal) {
    baseWallets.push(phantomWallet, trustWallet, braveWallet);
  }

  // ⭐ 디버깅용 로그
  if (process.env.NODE_ENV === "development") {
    console.log("=== Wallet Configuration ===");
    console.log("Is Local Environment:", isLocal);
    console.log(
      "Available Wallets:",
      baseWallets.map((w) => w.name || "Unknown"),
    );
    console.log("Coinbase Wallet Included:", !isLocal);
  }

  return baseWallets;
};

// ⭐ 지갑 키 매핑 - RainbowKit 지갑 함수에서 실제 키로 매핑
export const getAvailableWalletKeys = () => {
  const baseKeys = ["metaMask", "walletConnect", "uniswap", "coinbase"];

  if (!isLocal) {
    baseKeys.push("phantom", "trust", "brave");
  }

  return baseKeys;
};

/* ⭐ Coinbase Wallet 설정 개선
const coinbaseWalletConfig = coinbaseWallet({
  appName: "Birdieswap",
  appLogoUrl: "/wallets/coinbase.svg", // public 폴더의 로고 경로
}); */

/*
export const wagmiConfig = getDefaultConfig({
  appName: "Birdieswap",
  projectId: "YOUR_PROJECT_ID",
  chains: [arbitrum, base, optimism, bsc, polygon, scroll, sepolia, baseFork],
  ssr: true, // If your dApp uses server side rendering (SSR)

  // ⭐ 핵심 수정: multiInjectedProviderDiscovery를 false로 설정하여 다중 지갑 감지 문제 해결
  multiInjectedProviderDiscovery: false,
  wallets: [
    {
      groupName: "Default",
      wallets: getAvailableWallets() /*[
        metaMaskWallet,
        walletConnectWallet,
        uniswapWallet,
        coinbaseWallet,
        // ⭐ 로컬 환경에서는 phantom과 brave 제외
        ...(isLocal ? [] : [phantomWallet, trustWallet, braveWallet]),
        // keplrWallet,
      ],*/ /*,
    },
  ],
});
*/

/* ⭐ 핵심: RainbowKit 기본 설정 사용
export const wagmiConfig = getDefaultConfig({
  appName: "Birdie", // 앱 이름
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID", // WalletConnect Project ID
  chains: [arbitrum, base, optimism, bsc, polygon, scroll, sepolia, baseFork], // 지원할 체인들
  ssr: true, // Next.js SSR 지원
  multiInjectedProviderDiscovery: false, // 다중 지갑 감지 비활성화 (충돌 방지)
  // ⭐ wallets 설정 생략 시 기본 지갑들 자동 포함:
  // - MetaMask, WalletConnect, Coinbase Wallet, Rainbow, Trust Wallet 등
}); */

// ⭐ RainbowKit 기본 설정 (CORS 에러 방지를 위한 조건부 설정)
// ⭐ 핵심 수정: 올바른 RainbowKit 기본 설정
export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Birdieswap",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id",
  chains: [
    arbitrum,
    base_custom,
    optimism_custom,
    bsc,
    polygon,
    scroll,
    sepolia,
    baseFork,
  ],
  ssr: true,
  //multiInjectedProviderDiscovery: false,

  // ⭐ 조건부 지갑 설정 - 타입 안전하게
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet, // "metaMask"
        walletConnectWallet, // "walletConnect"
        uniswapWallet, // "uniswap"
        coinbaseWallet,
        // 기타 지갑들은 프로덕션에서만
        trustWallet,
        braveWallet,
        phantomWallet,
      ],
    },
  ],
});

console.log("MY_RPC_URL", process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);

// 🔥 디버깅 코드 추가
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("=== Wagmi Config 생성됨 ===");
  console.log(
    "등록된 Connectors:",
    wagmiConfig.connectors.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    })),
  );
}

/*
// ⭐ 함수 중복 제거 - 한 번만 선언
export const getAvailableWalletKeys = () => {
  // ⭐ 로컬 환경 감지

  if (isLocal) {
    return ["metaMask", "walletConnect", "uniswap"];
  }

  return [
    "metaMask",
    "walletConnect",
    "coinbaseWallet",
    "uniswap",
    "trustWallet",
    "phantomWallet",
    "braveWallet",
  ];
};
*/

const theme = lightTheme();

theme.colors.accentColor = "#00c9cc";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function Providers({ children }: PropsWithChildren) {
  /*
  // ⭐ 로컬 환경에서 로컬스토리지 정리
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 기존 wagmi 연결 정보 완전 정리
      const keysToRemove = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith("wagmi.") ||
          key.startsWith("rainbowkit.") ||
          key.startsWith("@rainbow-me/rainbowkit.") ||
          key.includes("wallet") ||
          key.includes("connector"),
      );

      // ⭐ 실제로 keysToRemove 사용 - forEach로 제거
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // ⭐ sessionStorage도 정리
      const sessionKeysToRemove = Object.keys(sessionStorage).filter(
        (key) =>
          key.startsWith("wagmi.") ||
          key.startsWith("rainbowkit.") ||
          key.includes("wallet") ||
          key.includes("connector"),
      );

      sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
    }
  }, []);   */

  // 개발환경에서 디버그 로그 활성화

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AssetsContextProvider>
          <RainbowKitProvider
            locale="en"
            showRecentTransactions={true}
            theme={theme}
          >
            <HeroUIProvider>
              <ThemeProvider enableSystem attribute="class">
                <ReferralProvider>
                  <WalletContextProvider>                 
                    <SettingsProvider>{children}</SettingsProvider>
                  </WalletContextProvider>
                </ReferralProvider>
              </ThemeProvider>
            </HeroUIProvider>
          </RainbowKitProvider>
        </AssetsContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
