"use client";

import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";

import BirdieLogoBeta from "@/assets/BirdieLogoBeta.svg";
import BirdieLogo from "@/assets/logo.svg";
import BirdieLogoMobile from "@/assets/logo-mobile.svg";
import Icons from "@/assets/icons/icons";

import { NavbarLink } from "./NavbarLink";
import NavMenu from "./NavMenu";
import NavbarConnect from "./NavbarConnect";
import NavPoints from "./NavPoints";

export default function NavbarImpl() {
  const menuDisclosure = useDisclosure();

  return (
    <Navbar
      className="gap-4 bg-background lg:gap-10"
      classNames={{
        wrapper: "justify-start gap-4 lg:gap-10 max-w-full py-3",
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
              window?.location.reload();
            }
          }}
        >
          {/* <BirdieLogo className="hidden text-foreground lg:block" /> */}
          <BirdieLogoBeta className="hidden text-foreground lg:block" />
          <BirdieLogoMobile className="block lg:hidden" />
        </Link>
      </NavbarBrand>

      <NavbarContent className="flex items-center sm:hidden" justify="start">
        <Button isIconOnly variant="light" onPress={menuDisclosure.onOpen}>
          <Icons.Menu className="stroke-foreground stroke-2" />
        </Button>
      </NavbarContent>

      <NavbarContent className="hidden grow sm:flex" justify="start">
        <NavbarLink />
      </NavbarContent>

      {/* 데스크탑 네트워크 지갑 연결 버튼 */}
      <NavbarContent className="max-sm:gap-2 gap-2" justify="end">
        {/* <NavbarItem>
          <ConnectButton />
        </NavbarItem> */}
        <NavPoints />
        <NavbarConnect />
      </NavbarContent>

      {/* 모바일 메뉴 모달 */}
      <NavMenu {...menuDisclosure} />
    </Navbar>
  );
}
