"use client";

import { HeroUIProvider } from "@heroui/react";
import { PropsWithChildren, useEffect } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider, useTheme } from "next-themes";
import {
  RainbowKitProvider,
  lightTheme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";

import {
  trustWallet,
  walletConnectWallet,
  coinbaseWallet,
  uniswapWallet,
  braveWallet,
  phantomWallet,
  rabbyWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, WagmiProvider, createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  arbitrum,
  polygon,
  scroll,
  baseFork,
  bsc,
  sepolia,
  giwaSepolia,
  base_custom,
  optimism_custom,
} from "@/const/networks";

import SettingsProvider from "./SettingsProvider";
import WalletContextProvider from "./WalletContextProvider";
import AssetsContextProvider from "./AssetsContextProvider";
import { ReferralProvider } from "./ReferralContextProvider";
import { http, fallback, webSocket } from "viem";

function ThemeColorMetaSync() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    // resolvedTheme가 undefined일 때도 html.class로 판단
    const htmlIsDark = document.documentElement.classList.contains("dark");
    const mode =
      (theme === "system" ? resolvedTheme : theme) ??
      (htmlIsDark ? "dark" : "light");

    const color = mode === "dark" ? "#14192A" : "#FFFFFF";

    // meta 태그 하나만 업데이트
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", color);
    document.documentElement.style.colorScheme = mode;

    // 사파리/iOS 타이밍 보강
    requestAnimationFrame(() => meta?.setAttribute("content", color));
    setTimeout(() => meta?.setAttribute("content", color), 0);

    if (process.env.NODE_ENV === "development") {
      console.log("[ThemeColorMetaSync]", {
        theme,
        resolvedTheme,
        mode,
        color,
      });
    }
  }, [theme, resolvedTheme]);

  return null;
}

const sepoliaUrls = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_INFURA,
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL_CHAINSTACK,
  "https://sepolia.drpc.org",
].filter(Boolean) as string[];

const baseUrls = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_BASE_RPC_URL_INFURA,
  "https://mainnet.base.org",
].filter(Boolean) as string[];
const giwaSepoliaUrls = [
  process.env.NEXT_PUBLIC_GIWA_SEPOLIA_RPC_URL,
  "https://sepolia-rpc-flashblocks.giwa.io",
  "https://sepolia-rpc.giwa.io",
].filter(Boolean) as string[];
const arbitrumUrls = [
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_INFURA,
  "https://arb1.arbitrum.io/rpc",
].filter(Boolean) as string[];

function isExactHttpsHost(raw: string, expectedHost: string) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && parsed.hostname === expectedHost;
  } catch {
    return false;
  }
}

if (
  process.env.NEXT_PUBLIC_VERCEL_ENV &&
  sepoliaUrls.length === 1 &&
  sepoliaUrls[0].includes("drpc")
) {
  console.warn(
    "[RPC] Only DRPC (Sepolia) configured on Vercel. Add ALCHEMY/INFURA to reduce timeouts.",
  );
}
if (
  process.env.NEXT_PUBLIC_VERCEL_ENV &&
  baseUrls.length === 1 &&
  isExactHttpsHost(baseUrls[0], "mainnet.base.org")
) {
  console.warn(
    "[RPC] Only mainnet.base.org configured for Base. Add ALCHEMY/INFURA for stability.",
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

// 2) 런타임에 따라 HTTP 팩토리 선택
const httpMaybeLogged = (url?: string, opts?: Parameters<typeof http>[1]) =>
  http(url, opts);
//로깅 가능한 http 트랜스포트 래퍼 사용시 http(url, opts); 를 아래 주석으로 해제하여 변경.
//typeof window === "undefined" ? http(url, opts) : httpWithLog(url!, opts);

/**
 * urls: [primary1, primary2, ..., lastFallback] 순서
 * - 마지막 하나는 전부 실패했을 때만 쓰는 최후 fallback
 * - primary 들은 매 요청마다 랜덤 순서로 시도
 */
function makeRandomRpcTransport(
  urls: string[],
  opts?: Parameters<typeof http>[1],
) {
  if (!urls.length) return http();

  if (urls.length === 1) {
    // URL 하나만 있으면 그냥 그것만 사용
    return httpMaybeLogged(urls[0], opts);
  }

  const primaryUrls = urls.slice(0, -1); // 마지막 제외
  const lastFallbackUrl = urls[urls.length - 1];

  return ((config: any) => {
    const primaryTransports = primaryUrls.map((url) =>
      httpMaybeLogged(url, opts)(config),
    );
    const lastTransport = httpMaybeLogged(lastFallbackUrl, opts)(config);

    return {
      // 첫 번째 transport의 메타 정보 복사 (type, key 등)
      ...primaryTransports[0],
      async request(args: any) {
        // 1) primary 들을 매 요청마다 랜덤 순서로 섞기
        const shuffled = [...primaryTransports];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 2) 랜덤 순서대로 시도
        let lastError: unknown;
        for (const t of shuffled) {
          try {
            return await t.request(args);
          } catch (e) {
            lastError = e;
          }
        }

        // 3) 전부 실패하면 마지막 fallback으로 한 번 더 시도
        return lastTransport.request(args).catch((e: unknown) => {
          throw e ?? lastError;
        });
      },
    };
  }) as any;
}

const chains = [
  base_custom,
  giwaSepolia,
  sepolia,
  arbitrum,
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
  transports[sepolia.id] = makeRandomRpcTransport(sepoliaUrls, {
    timeout: 15_000,
  });
}

if (baseUrls.length) {
  transports[base_custom.id] = makeRandomRpcTransport(baseUrls, {
    timeout: 15_000,
  });
}

if (giwaSepoliaUrls.length) {
  transports[giwaSepolia.id] = makeRandomRpcTransport(giwaSepoliaUrls, {
    timeout: 15_000,
  });
}

if (arbitrumUrls.length) {
  transports[arbitrum.id] = makeRandomRpcTransport(arbitrumUrls, {
    timeout: 15_000,
  });
}

// RainbowKit 커넥터
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "Birdieswap";
const enableCoinbaseWallet =
  process.env.NEXT_PUBLIC_ENABLE_COINBASE_WALLET === "1" ||
  process.env.NODE_ENV === "production";

const coinbaseWalletAll = Object.assign(coinbaseWallet, {
  preference: { options: "all" },
});

const metaMaskInjectedWallet = () => {
  const isMetaMaskInjected =
    typeof window !== "undefined" &&
    !!(
      (window as any)?.ethereum?.isMetaMask ||
      (window as any)?.ethereum?.providers?.some((p: any) => p?.isMetaMask)
    );
  const metaMaskProvider =
    typeof window !== "undefined"
      ? ((window as any)?.ethereum?.providers?.find(
          (p: any) => p?.isMetaMask,
        ) ?? (window as any)?.ethereum)
      : undefined;
  return {
    id: "metaMask",
    name: "MetaMask",
    rdns: "io.metamask",
    iconUrl: async () => "/wallets/metaMask.svg",
    iconAccent: "#f6851a",
    iconBackground: "#fff",
    installed: isMetaMaskInjected ? true : undefined,
    downloadUrls: {
      android: "https://play.google.com/store/apps/details?id=io.metamask",
      ios: "https://apps.apple.com/us/app/metamask/id1438144202",
      mobile: "https://metamask.io/download",
      qrCode: "https://metamask.io/download",
      chrome:
        "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
      edge: "https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm",
      firefox: "https://addons.mozilla.org/firefox/addon/ether-metamask",
      opera: "https://addons.opera.com/extensions/details/metamask-10",
      browserExtension: "https://metamask.io/download",
    },
    createConnector: (walletDetails: any) => {
      const injectedConfig = metaMaskProvider
        ? {
            target: () => ({
              id: walletDetails.rkDetails.id,
              name: walletDetails.rkDetails.name,
              provider: metaMaskProvider,
            }),
          }
        : {};
      return createConnector((config) => ({
        ...injected(injectedConfig)(config),
        ...walletDetails,
      }));
    },
  };
};

const popularWallets: any[] = [
  metaMaskInjectedWallet,
  walletConnectWallet,
  uniswapWallet,
  trustWallet,
  braveWallet,
  phantomWallet,
  rabbyWallet,
];

if (enableCoinbaseWallet) {
  popularWallets.splice(3, 0, coinbaseWalletAll);
}

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: popularWallets,
    },
  ],
  { appName, projectId },
);

// wagmiConfig 생성
export const wagmiConfig = createConfig({
  chains,
  transports,
  connectors,
  ssr: true,
});

// 🔥 디버깅 코드 추가
// if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
//   console.log("=== Wagmi Config 생성됨 ===");
//   console.log(
//     "등록된 Connectors:",
//     wagmiConfig.connectors.map((c) => ({
//       id: c.id,
//       name: c.name,
//       type: c.type,
//     }))
//   );
// }

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
  useEffect(() => {
    const notifyReady = async () => {
      try {
        const dynamicImport = new Function(
          "specifier",
          "return import(specifier)"
        ) as (specifier: string) => Promise<any>;
        const mod = await dynamicImport("@farcaster/miniapp-sdk");
        const miniAppSdk = mod?.sdk ?? mod?.default;
        if (!miniAppSdk?.actions?.ready) return;

        await miniAppSdk.actions.ready();
        setTimeout(() => {
          miniAppSdk.actions.ready?.();
        }, 500);
      } catch {
        // Mini app SDK가 없는 환경에서는 조용히 무시한다.
      }
    };

    if (typeof window !== "undefined") {
      notifyReady();
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      defaultTheme="system"
      nonce={nonce}
    >
      <ThemeColorMetaSync />
      <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
        <QueryClientProvider client={queryClient}>
          <AssetsContextProvider>
            <RainbowKitProvider
              initialChain={base_custom}
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
