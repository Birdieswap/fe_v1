import { cn } from "@heroui/react";
import { Suspense } from "react";

import PayIndex from ".";
import { PayProvider } from "@/components/(main)/pay/PayProvider";

export default function PayPage() {
  return (
    <PayProvider>
      <div
        className={cn(
          "flex h-full grow flex-col items-center justify-start gap-4",
          "max-w-[464px] pb-4",
          "max-sm:max-w-full max-sm:px-4",
          "[@media(max-height:640px)]:pt-4",
          "[@media(min-height:640px)]:pt-16"
        )}
      >
        <Suspense fallback={null}>
          <PayIndex />
        </Suspense>
      </div>
    </PayProvider>
  );
}
