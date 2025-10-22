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

const inter = Inter({ subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Birdieswap",
  description:
    "Birdieswap - Dual staking DeFi service with Uniswap LP and staking solutions",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isDev = process.env.NODE_ENV !== "production";
  const reqHeaders = await headers();
  const nonce = isDev
    ? undefined
    : (reqHeaders.get("x-csp-nonce") ?? undefined);

  const APP_ENV =
    process.env.NEXT_PUBLIC_APP_ENV ??
    (process.env.NODE_ENV === "production" ? "production" : "development");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(inter.className)}>
        <script
          {...(!isDev ? { nonce } : {})}
          dangerouslySetInnerHTML={{
            __html: `
              // Lit dev-mode 경고 비활성화
              window.litDisableDevMode = true;
              // (옵션) 번들 경고도 숨김
              window.litDisableBundleWarning = true;
            `,
          }}
        />
        <Providers nonce={nonce}>
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
