"use client";

import { useEffect, useState } from "react";
import { ModalContent, ModalBody, Link } from "@heroui/react";
import ModalBase from "../atoms/ModalBase";
import ThemedButton from "../atoms/ThemedButton";
import Image from "next/image";
import Icons from "@/assets/icons/icons";

export const OPEN_DENY_WALLET_EVENT = "app/denyWalletModal/open";
export const CLOSE_DENY_WALLET_EVENT = "app/denyWalletModal/close";

export default function DeniedWalletModalHost() {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent)?.detail as
        | { address?: string }
        | undefined;
      setAddress(detail?.address ?? null);
      setIsOpen(true);
    }
    function onClose() {
      setIsOpen(false);
      setAddress(null);
    }
    window.addEventListener(OPEN_DENY_WALLET_EVENT, onOpen as any);
    window.addEventListener(CLOSE_DENY_WALLET_EVENT, onClose);

    return () => {
      window.removeEventListener(OPEN_DENY_WALLET_EVENT, onOpen as any);
      window.removeEventListener(CLOSE_DENY_WALLET_EVENT, onClose);
    };
  }, []);

  return (
    <ModalBase
      hideCloseButton
      isOpen={isOpen}
      onOpenChange={(open) => !open && setIsOpen(false)}
    >
      <ModalContent>
        <ModalBody className="flex flex-col gap-6 p-6">
          <div className="flex w-full flex-col items-center">
            <div className="flex w-full flex-row mt-3 mb-5 justify-center items-center">
              <Image
                alt="error"
                className="pb-6"
                height={28}
                src="/images/error.svg"
                width={28}
              />
              <h1 className="pl-2 pb-5 text-xl font-semibold text-foreground">
                Not a Beta Tester Yet.
              </h1>
            </div>
            <p className="break text-base font-normal  p-5 text-sm text-foreground">
              We’re currently in a closed beta period. To participate, please
              visit the Birdieswap pre‑launch page and leave an email address
              under “Stay in the Loop.”
            </p>
            <div className="flex justify-center items-center gap-2 p-4">
              <Link
                className="w-full rounded-md hover:bg-default-200 dark:hover:bg-default-100 gap-2 p-3"
                href="https://www.birdieswap.com/"
                target="_blank"
              >
                Visit Birdieswap Pre-Launch Page
                <Icons.WalletArrowRU className="fill-primary-500 stroke-primary-500 stroke-[1px] dark:fill-primary-default dark:stroke-primary-default" />
              </Link>
            </div>
          </div>
          <div className="flex w-full flex-col">
            <ThemedButton variant="MINT" onPress={() => setIsOpen(false)}>
              Close
            </ThemedButton>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
