"use client";

import { HeroUIProvider } from "@heroui/react";
import { PropsWithChildren, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";

import AssetsContextProvider from "./AssetsContextProvider";
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

function ThemeColorMetaSync() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const htmlIsDark = document.documentElement.classList.contains("dark");
    const mode =
      (theme === "system" ? resolvedTheme : theme) ??
      (htmlIsDark ? "dark" : "light");

    const color = mode === "dark" ? "#14192A" : "#FFFFFF";

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", color);
    document.documentElement.style.colorScheme = mode;

    requestAnimationFrame(() => meta?.setAttribute("content", color));
    setTimeout(() => meta?.setAttribute("content", color), 0);
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

const arbitrumUrls = [
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_ALCHEMY,
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL_INFURA,
  "https://arb1.arbitrum.io/rpc",
].filter(Boolean) as string[];

function makeRandomRpcTransport(
  urls: string[],
  opts?: Parameters<typeof http>[1],
) {
  if (!urls.length) return http();
  if (urls.length === 1) return http(urls[0], opts);

  const primaryUrls = urls.slice(0, -1);
  const lastFallbackUrl = urls[urls.length - 1];

  return ((config: any) => {
    const primaryTransports = primaryUrls.map((url) => http(url, opts)(config));
    const lastTransport = http(lastFallbackUrl, opts)(config);

    return {
      ...primaryTransports[0],
      async request(args: any) {
        const shuffled = [...primaryTransports];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        let lastError: unknown;
        for (const t of shuffled) {
          try {
            return await t.request(args);
          } catch (e) {
            lastError = e;
          }
        }

        return lastTransport.request(args).catch((e: unknown) => {
          throw e ?? lastError;
        });
      },
    };
  }) as any;
}

const chains = [
  base_custom,
  sepolia,
  arbitrum,
  optimism_custom,
  bsc,
  polygon,
  scroll,
  baseFork,
] as const;

const transports: Record<number, any> = {};
for (const ch of chains) transports[ch.id] = http();

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

if (arbitrumUrls.length) {
  transports[arbitrum.id] = makeRandomRpcTransport(arbitrumUrls, {
    timeout: 15_000,
  });
}

const wagmiConfigLanding = createConfig({
  chains,
  transports,
  connectors: [],
  ssr: true,
});

const queryClientLanding = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function LandingProviders({
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
      <ThemeColorMetaSync />
      <WagmiProvider config={wagmiConfigLanding} reconnectOnMount={false}>
        <QueryClientProvider client={queryClientLanding}>
          <AssetsContextProvider>
            <HeroUIProvider>{children}</HeroUIProvider>
          </AssetsContextProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

