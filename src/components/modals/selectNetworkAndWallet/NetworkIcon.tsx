"use client";
import Image from "next/image";
import { useTheme } from "next-themes";

import { NetworkInfo } from "@/types/NetworkInfo";

export function NetworkIcon({ network }: { network: NetworkInfo | null }) {
  const { resolvedTheme } = useTheme();
  const iconSrc =
    resolvedTheme === "dark" && network?.iconSrcDark
      ? network.iconSrcDark
      : network?.iconSrc;

  return (
    <div className="size-6 rounded-full bg-default-300 dark:bg-default-900">
      <Image
        alt={network?.name ?? "No Network"}
        className="size-full rounded-full"
        height={24}
        src={iconSrc ?? "/networks/placeholder.svg"}
        width={24}
      />
    </div>
  );
}
