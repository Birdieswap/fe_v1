import {
  Button,
  Divider,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useEffect } from "react";

import Icons from "@/assets/icons/icons";
import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";

import { MobileNavLink } from "./NavbarLink";

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function toAppHref(appOrigin: string, path: string) {
  const base = appOrigin.endsWith("/") ? appOrigin : `${appOrigin}/`;
  return new URL(path, base).toString();
}

export default function NavMenu(
  props: ReturnType<typeof useDisclosure> & { appOrigin?: string },
) {
  const { isOpen, onClose, appOrigin } = props;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && isOpen) onClose();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, onClose]);

  const resolveHref = (href: string) => {
    if (!appOrigin) return href; // app에서는 기존 그대로
    if (isExternalHref(href)) return href;
    if (href.startsWith("/")) return toAppHref(appOrigin, href);
    return href;
  };

  return (
    <ModalBase
      className="mt-2 pt-6 sm:hidden"
      classNames={{
        backdrop: "bg-black/60 supports-[backdrop-filter]:backdrop-blur-none",
        wrapper: "items-end justify-center",
        base: "m-0 max-h-[75vh] overflow-hidden",
        body: "p-0 h-full flex flex-col",
        closeButton: "absolute top-3 right-4",
      }}
      closeButton={<ModalCloseButton onClose={onClose} />}
      isDismissable={true}
      scrollBehavior="inside"
      isKeyboardDismissDisabled={false}
      isOpen={isOpen}
      placement="bottom"
      size="lg"
      onClose={onClose}
    >
      <ModalContent className="h-full">
        <ModalBody className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col space-y-2 px-6 py-4 text-foreground transition-colors ">
              <MobileNavLink href={resolveHref("/")} onClick={onClose}>
                <span>SWAP</span>
              </MobileNavLink>

              <MobileNavLink href={resolveHref("/farm")} onClick={onClose}>
                <span>FARM</span>
              </MobileNavLink>
              <MobileNavLink href={resolveHref("/easy")} onClick={onClose}>
                <span>EASY</span>
              </MobileNavLink>

              <MobileNavLink
                href="https://docs.birdieswap.com"
                target="_blank"
                onClick={onClose}
              >
                <span>DOCS</span>
              </MobileNavLink>

              <MobileNavLink href={resolveHref("/faq")} onClick={onClose}>
                <span>FAQ</span>
              </MobileNavLink>
            </div>

            <Divider className="bg-default-300 dark:bg-default-100" />

            {/* 아래는 기존 그대로 */}
            <div className="flex flex-col gap-5 py-4">
              <div className="flex flex-row gap-4 px-10">
                <Link
                  className="text-sm text-foreground transition-colors hover:text-default-800"
                  href="https://https://docs.birdieswap.com/legal/terms-of-service"
                  target="_blank"
                  onClick={onClose}
                >
                  Terms of Service
                </Link>
                <Link
                  className="text-sm text-foreground transition-colors hover:text-default-800"
                  href="https://docs.birdieswap.com/legal/privacy-policy"
                  target="_blank"
                  onClick={onClose}
                >
                  Privacy Policy
                </Link>
              </div>

              <div className="flex flex-row gap-4 px-8">
                <a
                  className="text-sm text-default-900 dark:text-default-600"
                  href="https://discord.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button isIconOnly size="sm" variant="light">
                    <Icons.SocialDiscord />
                  </Button>
                </a>
                <a
                  className="text-sm text-default-900 dark:text-default-600"
                  href="https://twitter.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button isIconOnly size="sm" variant="light">
                    <Icons.SocialTwitter />
                  </Button>
                </a>
                <a
                  className="text-sm text-default-900 dark:text-default-600"
                  href="https://medium.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button isIconOnly size="sm" variant="light">
                    <Icons.SocialMedium />
                  </Button>
                </a>
              </div>
            </div>

            {/* ⭐ 하단 safe area */}
            <div className="h-4" />
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
