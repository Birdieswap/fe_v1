"use client";

import { HeroUIProvider } from "@heroui/react";
import { PropsWithChildren } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "next-themes";
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
  connectorsForWallets,
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
import { createConfig, WagmiProvider } from "wagmi";
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
import { http, fallback, webSocket } from "viem";

const sepoliaUrls = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_INFURA,
  "https://sepolia.drpc.org",
].filter(Boolean) as string[];

const baseUrls = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_BASE_RPC_URL_INFURA,
  "https://mainnet.base.org",
].filter(Boolean) as string[];
const arbitrumUrls = [
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_INFURA,
  "https://arb1.arbitrum.io/rpc",
].filter(Boolean) as string[];

if (
  process.env.NEXT_PUBLIC_VERCEL_ENV &&
  sepoliaUrls.length === 1 &&
  sepoliaUrls[0].includes("drpc")
) {
  console.warn(
    "[RPC] Only DRPC (Sepolia) configured on Vercel. Add ALCHEMY/INFURA to reduce timeouts."
  );
}
if (
  process.env.NEXT_PUBLIC_VERCEL_ENV &&
  baseUrls.length === 1 &&
  baseUrls[0].includes("mainnet.base.org")
) {
  console.warn(
    "[RPC] Only mainnet.base.org configured for Base. Add ALCHEMY/INFURA for stability."
  );
}

// 2) 로깅 가능한 http 트랜스포트 래퍼 (Transport 타입 의존 X)
// function httpWithLog(url: string, opts?: Parameters<typeof http>[1]) {
//   const baseFactory = http(url, opts);
//   return ((config: Parameters<typeof baseFactory>[0]) => {
//     const baseT = baseFactory(config);
//     return {
//       ...baseT,
//       async request(args: any) {
//         const start = Date.now();
//         const method = args?.method ?? "unknown_method";
//         try {
//           console.info(`[RPC ->] ${url} ${method}`);
//           const res = await baseT.request(args);
//           const ms = Date.now() - start;
//           console.info(`[RPC <-] ${url} ${method} (${ms}ms)`);
//           return res;
//         } catch (e) {
//           const ms = Date.now() - start;
//           console.warn(`[RPC xx] ${url} ${method} failed in ${ms}ms`, e);
//           throw e;
//         }
//       },
//     };
//   }) as typeof baseFactory;
// }
// ──────────────────────────────────────────────────────────────

const chains = [
  sepolia,
  arbitrum,
  base_custom,
  optimism_custom,
  bsc,
  polygon,
  scroll,
  baseFork,
] as const;

// 체인별 transports 정의
const transports: Record<number, any> = {};
for (const ch of chains) transports[ch.id] = http(); // 기본값

if (sepoliaUrls.length) {
  transports[sepolia.id] = fallback(
    sepoliaUrls.map((url) => http(url, { timeout: 15_000 })),
    { rank: false, retryCount: 3, retryDelay: 3000 }
  );
}

if (baseUrls.length) {
  transports[base_custom.id] = fallback(
    baseUrls.map((url) => http(url, { timeout: 15_000 })),
    { rank: false, retryCount: 3, retryDelay: 3000 }
  );
}

if (arbitrumUrls.length) {
  transports[arbitrum.id] = fallback(
    arbitrumUrls.map((url) => http(url, { timeout: 15_000 })),
    { rank: false, retryCount: 3, retryDelay: 3000 }
  );
}

// RainbowKit 커넥터
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "Birdieswap";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        uniswapWallet,
        coinbaseWallet,
        trustWallet,
        braveWallet,
        phantomWallet,
      ],
    },
  ],
  { appName, projectId }
);

// wagmiConfig 생성 (★ autoConnect:false 설정)
export const wagmiConfig = createConfig({
  chains,
  transports,
  connectors,
  ssr: true,
});

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

export default function Providers({
  children,
  nonce,
}: PropsWithChildren<{ nonce?: string }>) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      defaultTheme="system"
      nonce={nonce}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AssetsContextProvider>
            <RainbowKitProvider
              initialChain={sepolia}
              locale="en"
              showRecentTransactions={true}
              theme={theme}
            >
              <HeroUIProvider>
                <ReferralProvider>
                  <WalletContextProvider>
                    <SettingsProvider>{children}</SettingsProvider>
                  </WalletContextProvider>
                </ReferralProvider>
              </HeroUIProvider>
            </RainbowKitProvider>
          </AssetsContextProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
