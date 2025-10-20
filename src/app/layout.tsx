import type { Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

import Providers from "./providers";
import TransactionContextProvider from "./TransactionContextProvider";
import DeniedWalletModalHost from "@/components/modals/DeniedWalletModalHost";
import RiskConsentModalHost from "@/components/modals/RiskConsentModalHost";
import Script from "next/script";
import ClientHUD from "./ClientHUD";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Birdieswap",
  description:
    "Birdieswap - Dual staking DeFi service with Uniswap LP and staking solutions",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ headers()는 반드시 await
  const reqHeaders = await headers();
  const nonce = reqHeaders.get("x-csp-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(inter.className)}>
        <Script id="env-init" nonce={nonce} strategy="beforeInteractive">
          {`window.__APP_ENV__ = "production"`}
        </Script>
        <Providers>
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
