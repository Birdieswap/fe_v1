"use client";

import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  select,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import BirdieLogo from "@/assets/logo.svg";
import BirdieLogoBetaMobile from "@/assets/BirdieLogoBetaMobile.svg";
import Icons from "@/assets/icons/icons";

import { NavbarLink } from "@/components/(main)/nav/NavbarLink";
import NavMenu from "@/components/(main)/nav/NavMenu";

// ✅ landing 전용 상태(열림/닫힘) 제어
import { useLandingNetwork } from "@/app/(landing)/LandingNetworkProvider";
import SelectNetworkMenuLand from "@/components/modals/landing/SelectNetworkMenuLand";
import SelectNetworkModalLand from "@/components/modals/landing/SelectNetworkModalLand";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return isMobile;
}

function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

export default function NavbarLanding() {
  const menuDisclosure = useDisclosure();
  const isMobile = useIsMobile();

  // ✅ landing 전용 네트워크 선택 open/close
  const { setIsOpen: setLandingNetworkOpen } = useLandingNetwork();

  useEffect(() => {
    // 뷰포트 전환 시 열려 있던 네트워크 선택 UI는 닫아서 중복 포털/상태 꼬임 방지
    setLandingNetworkOpen(false);
  }, [isMobile, setLandingNetworkOpen]);

  const appOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_APP_URL || "https://app.birdieswap.com"
  );

  return (
    <Navbar
      className="gap-4 bg-background lg:gap-10"
      classNames={{
        wrapper: "max-sm:px-4 justify-start gap-4 lg:gap-10 max-w-full py-3",
        content: "gap-1",
      }}
      position="sticky"
    >
      <NavbarBrand className="grow-0">
        <Link
          href="/"
          onClick={(e) => {
            if (window?.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <BirdieLogo className="hidden text-foreground lg:block" />
          <BirdieLogoBetaMobile className="block lg:hidden" />
        </Link>
      </NavbarBrand>

      {/* 모바일 햄버거 */}
      <NavbarContent className="flex items-center sm:hidden" justify="start">
        <Button isIconOnly variant="light" onPress={menuDisclosure.onOpen}>
          <Icons.Menu className="stroke-foreground stroke-2" />
        </Button>
      </NavbarContent>

      {/* 데스크탑 링크: landing에서는 app 도메인으로 보내기 */}
      <NavbarContent className="hidden grow sm:flex" justify="start">
        <NavbarLink appOrigin={appOrigin} />
      </NavbarContent>

      {/* 우측: landing 전용 네트워크 선택 + Open dApp */}
      <NavbarContent
        className="max-sm:gap-2 gap-2 flex items-center"
        justify="end"
      >
        {isMobile ? (
          <NavbarItem className="flex items-center">
            <SelectNetworkModalLand />
          </NavbarItem>
        ) : (
          <NavbarItem className="relative z-[50] pointer-events-auto">
            <SelectNetworkMenuLand />
          </NavbarItem>
        )}

        <NavbarItem className="sm:flex">
          <Button
            as={Link}
            href={`${appOrigin}/`}
            prefetch={false}
            color="primary"
            className="
              bg-primary text-background rounded-2xl min-w-[170px]
              dark:bg-dark-green-key dark:text-background
            "
          >
            <Icons.Power className="text-background stroke-background" />
            <span className="ml-0.5">Open dApp</span>
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* 모바일 메뉴: landing에서는 app 도메인으로 보내기 */}
      <NavMenu {...menuDisclosure} appOrigin={appOrigin} />
    </Navbar>
  );
}
