import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import clsx from "clsx";

import Providers from "./providers";
import LandingProviders from "./landing-providers";
import TransactionContextProvider from "./TransactionContextProvider";
import DeniedWalletModalHost from "@/components/modals/DeniedWalletModalHost";
import RiskConsentModalHost from "@/components/modals/RiskConsentModalHost";
import ClientHUD from "./ClientHUD";
import { headers } from "next/headers";
import AddMiniAppFab from "@/components/atoms/AddMiniAppFab";

export const dynamic = "force-dynamic";

const LANDING_HOSTS = new Set([
  "www.birdieswap.com",
  "birdieswap.com",
  "birdieswap-landing.vercel.app",
  "www.birdieswap.local",
]);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS 변수로 노출
  display: "swap",
  preload: false,
});

const frameMetadata = JSON.stringify({
  version: "next",
  imageUrl: "https://birdieswap-dev.vercel.app/base-preview.png",
  button: {
    title: "Launch App",
    action: {
      type: "launch_frame", // ★ 중요: launch_frame (X) -> launch_miniapp (O)
      name: "Birdieswap",
      url: "https://birdieswap-dev.vercel.app",
      splashImageUrl: "https://birdieswap-dev.vercel.app/splash-logo.png",
      splashBackgroundColor: "#14192A",
    },
  },
});

export const metadata: Metadata = {
  title: "Birdieswap",
  description: "Birdieswap - Interest-bearing liquidity routing software",
  manifest: "/manifest.json",
  other: {
    "fc:frame": frameMetadata,
    "theme-color": "#FFFFFF", // 초기값: 라이트 기준 하나만!
    //"base:app_id": "697c60d477db5d481cffc815",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isDev = process.env.NODE_ENV !== "production";
  const reqHeaders = await headers();
  const headerNonce = reqHeaders.get("x-csp-nonce") ?? undefined;
  const reqHost = (reqHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const isLanding = LANDING_HOSTS.has(reqHost);

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={clsx(inter.className)}>
        <Script
          id="lit-dev-flags"
          strategy="beforeInteractive"
          {...(!isDev ? { nonce: headerNonce ?? undefined } : {})}
          dangerouslySetInnerHTML={{
            __html: `
              window.litDisableDevMode = true;
              window.litDisableBundleWarning = true;
            `,
          }}
        />
        {isLanding ? (
          <LandingProviders nonce={headerNonce}>
            <div className="relative flex min-h-screen flex-col bg-background antialiased">
              {children}
            </div>
          </LandingProviders>
        ) : (
          <Providers nonce={headerNonce}>
            <div className="relative flex min-h-screen flex-col bg-background antialiased">
              <TransactionContextProvider>{children}</TransactionContextProvider>
            </div>
          </Providers>
        )}
        {!isLanding && (
          <>
            <DeniedWalletModalHost />
            <RiskConsentModalHost />
            <AddMiniAppFab />
            <ClientHUD />
          </>
        )}
      </body>
    </html>
  );
}
