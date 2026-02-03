import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

import Providers from "./providers";
import TransactionContextProvider from "./TransactionContextProvider";
import DeniedWalletModalHost from "@/components/modals/DeniedWalletModalHost";
import RiskConsentModalHost from "@/components/modals/RiskConsentModalHost";
import ClientHUD from "./ClientHUD";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS 변수로 노출
  display: "swap",
  preload: false,
});

const appUrl = "https://birdieswap-dev.vercel.app";
const frameMetadata = JSON.stringify({
  version: "next",
  imageUrl: `${appUrl}/og-image.png`, // 피드에 보일 이미지 (1.91:1 비율 추천)
  button: {
    title: "Launch App", // 버튼에 적힐 글자
    action: {
      type: "launch_frame", // ★ 중요: 앱을 실행하라는 명령
      name: "Birdieswap",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash-logo.png`,
      splashBackgroundColor: "#14192A",
    },
  },
});

const miniappMetadata = JSON.stringify({
  version: "next",
  imageUrl: `${appUrl}/og-image.png`, // 피드에 보일 이미지 (1.91:1 비율 추천)
  button: {
    title: "Launch App", // 버튼에 적힐 글자
    action: {
      type: "launch_miniapp", // ★ 중요: 앱을 실행하라는 명령
      name: "Birdieswap",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash-logo.png`,
      splashBackgroundColor: "#14192A",
    },
  },
});

export const metadata: Metadata = {
  title: "Birdieswap",
  description: "Birdieswap - Interest-bearing liquidity routing software",
  manifest: "/manifest.json",
  other: {
    "theme-color": "#FFFFFF", // 초기값: 라이트 기준 하나만!
    "base:app_id": "697c60d477db5d481cffc815",
    "fc:frame": frameMetadata,
    "fc:miniapp": miniappMetadata,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isDev = process.env.NODE_ENV !== "production";
  const reqHeaders = await headers();
  const headerNonce = reqHeaders.get("x-csp-nonce") ?? undefined;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={clsx(inter.className)}>
        <script
          {...(!isDev ? { nonce: headerNonce ?? undefined } : {})}
          dangerouslySetInnerHTML={{
            __html: `
              window.litDisableDevMode = true;
              window.litDisableBundleWarning = true;
            `,
          }}
        />
        <Providers nonce={headerNonce}>
          <div className="relative flex min-h-screen flex-col bg-background antialiased">
            <TransactionContextProvider>{children}</TransactionContextProvider>
          </div>
        </Providers>
        <DeniedWalletModalHost />
        <RiskConsentModalHost />
        <ClientHUD />
      </body>
    </html>
  );
}
