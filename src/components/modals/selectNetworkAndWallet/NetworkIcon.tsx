"use client";
import Image from "next/image";

import { NetworkInfo } from "@/types/NetworkInfo";

export function NetworkIcon({ network }: { network: NetworkInfo | null }) {
  const iconSrc = network?.iconSrc ?? "/networks/placeholder.svg";
  const iconSrcDark = network?.iconSrcDark;

  return (
    <div className="size-6 rounded-full bg-default-300 dark:bg-default-900">
      {iconSrcDark ? (
        <>
          <Image
            alt={network?.name ?? "No Network"}
            className="size-full rounded-full dark:hidden"
            height={24}
            src={iconSrc}
            width={24}
          />
          <Image
            alt={network?.name ?? "No Network"}
            className="hidden size-full rounded-full dark:block"
            height={24}
            src={iconSrcDark}
            width={24}
          />
        </>
      ) : (
        <Image
          alt={network?.name ?? "No Network"}
          className="size-full rounded-full"
          height={24}
          src={iconSrc}
          width={24}
        />
      )}
    </div>
  );
}
