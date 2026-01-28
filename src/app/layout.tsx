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

export const metadata: Metadata = {
  title: "Birdieswap",
  description: "Birdieswap - Interest-bearing liquidity routing software",
  other: {
    "theme-color": "#FFFFFF", // 초기값: 라이트 기준 하나만!
  },
};

// export const viewport: Viewport = {
//   themeColor: [
//     { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
//     { media: "(prefers-color-scheme: dark)", color: "#14192A" },
//   ],
//   // 선택: 시스템 color-scheme 힌트도 같이 줄 수 있어요
//   // colorScheme: "dark light",
// };

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
