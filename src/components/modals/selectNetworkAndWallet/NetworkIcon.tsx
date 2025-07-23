"use client";
import Image from "next/image";

import { NetworkInfo } from "@/types/NetworkInfo";

export function NetworkIcon({ network }: { network: NetworkInfo | null }) {
  return (
    <div className="size-6 rounded-full bg-default-300 dark:bg-default-900">
      <Image
        alt={network?.name ?? "No Network"}
        className="size-full rounded-full"
        height={24}
        src={network?.iconSrc ?? "/networks/placeholder.svg"}
        width={24}
      />
    </div>
  );
}
