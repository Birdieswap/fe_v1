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
];

// const transports: Record<number, any> = {};
// for (const ch of chains) transports[ch.id] = http(); // 체인 정의의 rpcUrls.default 사용

// transports[sepolia.id] = fallback(
//   (sepoliaUrls.length ? sepoliaUrls : ["https://sepolia.drpc.org"]).map((url) =>
//     httpWithLog(url, { timeout: 15_000 })
//   ),
//   { rank: false, retryCount: 3, retryDelay: 3000 }
// );

// transports[base_custom.id] = fallback(
//   (baseUrls.length ? baseUrls : ["https://mainnet.base.org"]).map((url) =>
//     httpWithLog(url, { timeout: 15_000 })
//   ),
//   { rank: false, retryCount: 3, retryDelay: 3000 }
// );

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Birdieswap",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id",
  chains: [
    sepolia,
    arbitrum,
    base_custom,
    optimism_custom,
    bsc,
    polygon,
    scroll,
    baseFork,
  ],

  // transports,
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
            initialChain={sepolia}
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
