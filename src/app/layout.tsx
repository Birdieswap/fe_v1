import type { Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

import Providers from "./providers";
import TransactionContextProvider from "./TransactionContextProvider";
import DeniedWalletModalHost from "@/components/modals/DeniedWalletModalHost";
import RiskConsentModalHost from "@/components/modals/RiskConsentModalHost";
import Script from "next/script";

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
      <head>
        {/* MetaMask 인앱/소프트블록일 때 자동 재연결 캐시를 앱 부팅 '이전'에 제거 */}
        <Script id="pre-wagmi-clean" strategy="beforeInteractive">{`
          try {
            var ua = navigator.userAgent || "";
            var softBlocked = false;
            try { softBlocked = sessionStorage.getItem("__CONSENT_BLOCKED_UNTIL_SIGN__") === "1"; } catch(e) {}

            if (softBlocked) {
              var KEYS = [
                "wagmi.store","wagmi.connected","wagmi.cache",
                "rainbowkit.connectedWallets","rainbowkit:connectedWallets","rk-last-connector",
                "walletconnect","walletconnectv2","wc@2:client","WALLETCONNECT_DEEPLINK_CHOICE",
                "coinbaseWalletSDK","walletlink","walletlink:https://www.walletlink.org:session"
              ];
              for (var i=0;i<KEYS.length;i++) { try { localStorage.removeItem(KEYS[i]); } catch(e) {} }
              var PREF = ["wagmi.","rainbowkit.","wc@","walletconnect","coinbaseWallet:","walletlink:"];
              try {
                for (var k in localStorage) {
                  if (PREF.some(function(p){ return k && typeof k === "string" && k.indexOf(p) === 0; })) {
                    localStorage.removeItem(k);
                  }
                }
              } catch(e) {}
            }
          } catch(e) {}
        `}</Script>
      </head>
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
