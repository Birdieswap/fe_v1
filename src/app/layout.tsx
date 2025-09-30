import type { Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

import Providers from "./providers";
import TransactionContextProvider from "./TransactionContextProvider";
import DeniedWalletModalHost from "@/components/modals/DeniedWalletModalHost";
import RiskConsentModalHost from "@/components/modals/RiskConsentModalHost";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Birdieswap",
  description:
    "Birdieswap - Dual staking DeFi service with Uniswap LP and staking solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(inter.className)}>
        <Providers>
          <div className="relative flex min-h-screen flex-col bg-background antialiased">
            <TransactionContextProvider>{children}</TransactionContextProvider>
          </div>
        </Providers>
        <DeniedWalletModalHost />
        <RiskConsentModalHost />
      </body>
    </html>
  );
}
