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
    }))
  );
}

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
