"use client";

import { cn, NavbarItem } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, ReactNode } from "react";

export function NavbarLinkItem({
  currentPage,
  href,
  children,
  target,
}: Readonly<{
  currentPage: string;
  href: string;
  children: ReactNode;
  target?: string;
}>) {
  //const isActive =
  //  currentPage.split("/")[1] === href.split("/")[1] &&
  //  href.includes("https") == false;

  // ⭐ 홈페이지("/") 특별 처리 로직 수정
  const isActive = (() => {
    // 홈페이지인 경우 정확히 "/" 경로일 때만 active
    if (href === "/") {
      return currentPage === "/";
    }
    // 외부 링크는 active 처리 안함
    if (href.includes("https")) {
      return false;
    }

    // 다른 내부 페이지는 기존 로직 사용
    return currentPage.split("/")[1] === href.split("/")[1];
  })();

  return (
    <NavbarItem
      className={cn(
        "px-0 text-foreground transition-colors",
        "hover:text-default-800",
        "max-md:py-4 sm:px-2 lg:px-4",
        "data-[active=true]:text-light-primary",
        "data-[active=true]:hover:text-light-primary-hover",
        "dark:data-[active=true]:text-dark-green-key",
        "dark:data-[active=true]:hover:text-dark-primary-hover"
      )}
      isActive={isActive}
    >
      <Link
        href={href}
        target={target}
        onClick={(e) => {
          if (isActive) {
            e.preventDefault();
            window?.location.reload();
          }
        }}
      >
        {children}
      </Link>
    </NavbarItem>
  );
}

export function NavbarLink() {
  const currentPage = usePathname();

  return (
    <Fragment>
      <NavbarLinkItem currentPage={currentPage} href="/">
        SWAP
      </NavbarLinkItem>
      <NavbarLinkItem currentPage={currentPage} href="/farm">
        FARM
      </NavbarLinkItem>
      <NavbarLinkItem
        currentPage={currentPage}
        href="https://docs.birdieswap.com"
        target="_blank"
      >
        DOCS
      </NavbarLinkItem>
      <NavbarLinkItem currentPage={currentPage} href="/faq">
        FAQ
      </NavbarLinkItem>
    </Fragment>
  );
}

// ⭐ 모바일 메뉴용 컴포넌트 - isActive 로직 수정
interface MobileNavLinkProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  target?: string;
  className?: string;
}

export function MobileNavLink({
  href,
  children,
  onClick,
  target,
  className,
}: MobileNavLinkProps) {
  const currentPage = usePathname();

  const isActive = (() => {
    // 홈페이지인 경우 정확히 "/" 경로일 때만 active
    if (href === "/") {
      return currentPage === "/";
    }
    // 외부 링크는 active 처리 안함
    if (href.includes("https")) {
      return false;
    }

    // 다른 내부 페이지는 기존 로직 사용
    return currentPage.split("/")[1] === href.split("/")[1];
  })();

  const handleClick = () => {
    if (onClick) {
      onClick(); // 모달 닫기
    }
  };

  return (
    <NavbarItem
      className={cn(
        "px-0 text-foreground transition-colors",
        "hover:text-default-800",
        "max-md:py-4 sm:px-2 lg:px-4",
        "data-[active=true]:text-light-primary",
        "data-[active=true]:hover:text-light-primary-hover",
        "dark:data-[active=true]:text-dark-primary",
        "dark:data-[active=true]:hover:text-dark-primary-hover"
      )}
      isActive={isActive}
    >
      <Link
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          //isActive
          //  ? "bg-primary-100 text-primary-600 font-medium"
          //  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
          className
        )}
        href={href}
        target={target}
        onClick={handleClick}
      >
        {children}
      </Link>
    </NavbarItem>
  );
}
