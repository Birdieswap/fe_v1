import Link from "next/link";
import { Button } from "@heroui/react";

import Icons from "@/assets/icons/icons";

export default function Footer() {
  return (
    <footer className="inset-x-0 bottom-0 z-30 hidden h-16 bg-background md:fixed md:block">
      <div className="flex size-full flex-row items-center justify-start gap-10 px-6 max-md:gap-4">
        <Link
          className="text-sm text-foreground"
          href="https://crypttempo.gitbook.io/birdie/legal/terms-of-service"
          target="_blank"
        >
          Terms of Service
        </Link>
        <Link
          className="text-sm text-foreground"
          href="https://crypttempo.gitbook.io/birdie/legal/privacy-policy"
          target="_blank"
        >
          Privacy Policy
        </Link>
        <div className="grow" />
        <div className="flex flex-row items-center justify-end gap-4">
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
    </footer>
  );
}
