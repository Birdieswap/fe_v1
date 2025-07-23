"use client";

import { NavbarItem } from "@heroui/react";
import { Fragment, useContext, useEffect } from "react";

import { WalletContext } from "@/app/WalletContextProvider";
import SelectWalletMenu from "@/components/modals/selectNetworkAndWallet/SelectWalletMenu";
import SelectWalletModal from "@/components/modals/selectNetworkAndWallet/SelectWalletModal";
import SettingsModal from "@/components/modals/settingsModal/SettingsModal";
import SelectNetworkMenu from "@/components/modals/selectNetworkAndWallet/SelectNetworkMenu";
import SelectNetworkModal from "@/components/modals/selectNetworkAndWallet/SelectNetworkModal";

export default function NavbarConnect() {
  const { account } = useContext(WalletContext);
  const isAccountConnected = !!account?.address;

  const {
    isNetworkModalOpen,
    setIsNetworkModalOpen,
    isConnectModalOpen,
    setIsConnectModalOpen,
  } = useContext(WalletContext);

  // ⭐ 핵심 추가: 화면 크기 변화 감지하여 모달 상태 동기화
  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 640; // sm 브레이크포인트

      if (isSmallScreen) {
        // 모바일로 전환 시: 데스크탑 전용 Popover들 닫기
        // (SelectNetworkMenu, SelectWalletMenu의 Popover)
        // 모달 상태는 유지하여 SelectNetworkModal, SelectWalletModal에서 처리
      } else {
        // 데스크탑으로 전환 시: 모바일 전용 Modal들 닫기
        if (isNetworkModalOpen) {
          setIsNetworkModalOpen(false);
        }
        if (isConnectModalOpen) {
          setIsConnectModalOpen(false);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [
    isNetworkModalOpen,
    setIsNetworkModalOpen,
    isConnectModalOpen,
    setIsConnectModalOpen,
  ]);

  return (
    <Fragment>
      <NavbarItem className="h-8 sm:hidden">
        <SelectNetworkModal />
      </NavbarItem>
      <NavbarItem className="max-sm:hidden">
        <SelectNetworkMenu />
      </NavbarItem>
      <NavbarItem hidden={!isAccountConnected}>
        <SettingsModal />
      </NavbarItem>
      <NavbarItem className="max-sm:hidden" hidden={isAccountConnected}>
        <SelectWalletMenu />
      </NavbarItem>
      <NavbarItem className="pl-1 sm:hidden" hidden={isAccountConnected}>
        <SelectWalletModal />
      </NavbarItem>
    </Fragment>
  );
}
