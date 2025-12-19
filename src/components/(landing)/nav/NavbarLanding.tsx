"use client";

import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

import BirdieLogo from "@/assets/logo.svg";
import BirdieLogoBetaMobile from "@/assets/BirdieLogoBetaMobile.svg";
import Icons from "@/assets/icons/icons";

import { NavbarLink } from "@/components/(main)/nav/NavbarLink";
import NavMenu from "@/components/(main)/nav/NavMenu";

import SelectNetworkMenu from "@/components/modals/selectNetworkAndWallet/SelectNetworkMenu";
import SelectNetworkModal from "@/components/modals/selectNetworkAndWallet/SelectNetworkModal";
import { WalletContext } from "@/app/WalletContextProvider";

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
  const { setIsNetworkModalOpen } = useContext(WalletContext);
  const isMobile = useIsMobile();

  useEffect(() => {
    // 뷰포트 전환 시 열려 있던 네트워크 선택 UI는 닫아서 중복 포털을 방지
    setIsNetworkModalOpen(false);
  }, [isMobile, setIsNetworkModalOpen]);

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
          {/* <BirdieLogoBeta className="hidden text-foreground lg:block" /> */}
          {/* <BirdieLogoMobile className="block lg:hidden" /> */}
          <BirdieLogoBetaMobile className="block lg:hidden" />
        </Link>
      </NavbarBrand>

      {/* 모바일 햄버거 */}
      <NavbarContent className="flex items-center sm:hidden" justify="start">
        <Button isIconOnly variant="light" onPress={menuDisclosure.onOpen}>
          <Icons.Menu className="stroke-foreground stroke-2" />
        </Button>
      </NavbarContent>

      {/* 데스크탑 링크: ✅ landing에서는 app 도메인으로 보내기 */}
      <NavbarContent className="hidden grow sm:flex" justify="start">
        <NavbarLink appOrigin={appOrigin} />
      </NavbarContent>

      {/* 우측: 네트워크 선택 + Open dApp */}
      <NavbarContent className="max-sm:gap-2 gap-2 flex items-center" justify="end">
        {isMobile ? (
          <NavbarItem className="flex items-center">
            <SelectNetworkModal />
          </NavbarItem>
        ) : (
          <NavbarItem className="relative z-[50] pointer-events-auto">
            <SelectNetworkMenu />
          </NavbarItem>
        )}

        {/* ✅ 데스크탑: 아이콘 + 텍스트 */}
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

        {/* ✅ 모바일: 아이콘만
        <NavbarItem className="flex sm:hidden">
          <Button
            isIconOnly
            as={Link}
            href={`${appOrigin}/swap`}
            color="primary"
            prefetch={false}
            aria-label="Open dApp"
          >
            <Icons.Power className="fill-Background" />
            <span className="ml-1">Open dApp</span>
          </Button>
        </NavbarItem> */}
      </NavbarContent>

      {/* ✅ 모바일 메뉴: landing에서는 app 도메인으로 보내기 */}
      <NavMenu {...menuDisclosure} appOrigin={appOrigin} />
    </Navbar>
  );
}
