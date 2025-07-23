"use client";

import { ModalBody, ModalContent, useDisclosure } from "@heroui/react";
import Image from "next/image";

import ThemedButton from "@/components/atoms/ThemedButton";

import ModalBase from "../atoms/ModalBase";

export default function ConnectionFailedModal(
  props: ReturnType<typeof useDisclosure> & { onTryAgain?: () => void },
) {
  return (
    <ModalBase hideCloseButton isOpen={props.isOpen} onClose={props.onClose}>
      <ModalContent>
        <ModalBody className="flex flex-col gap-6 p-6">
          <div className="flex w-full flex-col items-center">
            <Image
              alt="error"
              className="pb-6"
              height={56}
              src="/images/error.svg"
              width={56}
            />
            <h1 className="pb-3 text-xl font-semibold text-foreground">
              Error connecting
            </h1>
            <p className="text-base font-normal text-foreground">
              The connection attempt failed. Please click try again and follow
              the steps to connect in your wallet.
            </p>
          </div>
          <div className="flex w-full flex-col">
            <ThemedButton
              variant="MINT"
              onClick={() => {
                props.onTryAgain?.();
              }}
            >
              Try again
            </ThemedButton>
            <ThemedButton
              variant="LIGHT"
              onClick={() => {
                props.onClose();
              }}
            >
              Close
            </ThemedButton>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
