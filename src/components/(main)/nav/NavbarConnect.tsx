"use client";

import { NavbarItem } from "@heroui/react";
import { Fragment, useContext, useEffect, useState } from "react";

import { WalletContext } from "@/app/WalletContextProvider";
import SelectWalletMenu from "@/components/modals/selectNetworkAndWallet/SelectWalletMenu";
import SelectWalletModal from "@/components/modals/selectNetworkAndWallet/SelectWalletModal";
import SettingsModal from "@/components/modals/settingsModal/SettingsModal";
import SelectNetworkMenu from "@/components/modals/selectNetworkAndWallet/SelectNetworkMenu";
import SelectNetworkModal from "@/components/modals/selectNetworkAndWallet/SelectNetworkModal";

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

export default function NavbarConnect() {
  const { account } = useContext(WalletContext);
  const isAccountConnected = !!account?.address;

  const {
    isNetworkModalOpen,
    setIsNetworkModalOpen,
    isConnectModalOpen,
    setIsConnectModalOpen,
  } = useContext(WalletContext);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsNetworkModalOpen(false);
      setIsConnectModalOpen(false);
    }
  }, [isMobile, setIsNetworkModalOpen, setIsConnectModalOpen]);

  return (
    <Fragment>
      {/* 1) NavbarItem엔 트리거만 (모달은 아래 별도 마운트) */}
      {isMobile ? (
        <>
          <NavbarItem className="flex items-center h-8">
            {/* 이 컴포넌트가 버튼+모달을 둘 다 렌더한다면, 트리거만 렌더하는 경량버전으로 쪼개는 게 베스트.
               일단 지금 구조 유지하되, 모달 포털을 body로 강제하면 문제 완화됨. */}
            <SelectNetworkModal />
          </NavbarItem>

          <NavbarItem
            className="flex items-center"
            hidden={!isAccountConnected}
          >
            <SettingsModal />
          </NavbarItem>

          <NavbarItem
            className="flex items-center pl-1"
            hidden={isAccountConnected}
          >
            <SelectWalletModal />
          </NavbarItem>
        </>
      ) : (
        <>
          <NavbarItem>
            <SelectNetworkMenu />
          </NavbarItem>

          <NavbarItem hidden={!isAccountConnected}>
            <SettingsModal />
          </NavbarItem>

          <NavbarItem hidden={isAccountConnected}>
            <SelectWalletMenu />
          </NavbarItem>
        </>
      )}
    </Fragment>
  );
}
