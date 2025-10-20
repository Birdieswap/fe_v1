import { cn } from "@heroui/react";

import MaxSlippageSection from "@/components/(main)/swap/MaxSlippageSection";
import SwapFeeInfo from "@/components/(main)/swap/SwapFeeInfo";
import { SwapProvider } from "@/components/(main)/swap/SwapProvider";

import SwapIndex from ".";
import { Suspense } from "react";

export default function SwapPage() {
  return (
    <SwapProvider>
      <div
        className={cn(
          "flex h-full grow flex-col items-center justify-start gap-4",
          "max-w-[464px] pb-4",
          "max-sm:max-w-full max-sm:px-4",
          "[@media(max-height:640px)]:pt-4",
          // "[@media(min-height:240px)]:pt-16",
          "[@media(min-height:640px)]:pt-16"
        )}
      >
        <section className="flex w-full flex-row items-center gap-1">
          <h1 className="grow text-base font-semibold text-default-800 dark:text-default-400">
            SWAP
          </h1>
          <MaxSlippageSection />
        </section>

        <Suspense fallback={null}>
          <SwapIndex />
        </Suspense>
        <SwapFeeInfo />
        <div className="p-4 bg-light-primary text-primary-foreground rounded-lg">
          Tailwind v4 token test
        </div>
      </div>
    </SwapProvider>
  );
}
