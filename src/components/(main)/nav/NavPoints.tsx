"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  NavbarItem,
  useDisclosure,
} from "@heroui/react";
import { useContext, useMemo } from "react";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { GiCosmicEgg } from "react-icons/gi";
import PointsMenu from "@/components/modals/points/PointsMenu";
import PointsPanel from "@/components/modals/points/PointsPanel";
import { LoadingPulse } from "../farm/farming/FarmListRowSummary";

export default function NavPoints() {
  const disclosure = useDisclosure(); // 공용 오픈 상태
  const { userPoints, isPointsLoading } = useContext(AssetsContext);
  const total = userPoints?.totalPoints;

  const totalFormatted = useMemo(() => {
    try {
      const n = typeof total === "string" ? Number(total) : total;
      return Number(n || 0).toLocaleString();
    } catch {
      return "0";
    }
  }, [total]);

  // ⬇️ 데스크탑 트리거 버튼 (PopoverTrigger 안에 들어갈 녀석)
  const desktopTrigger = (
    <Button
      variant="light"
      className="h-9 rounded-md px-2 gap-2"
      onPress={disclosure.onOpen} // Popover 열기
    >
      <GiCosmicEgg size="1.5em" />
      <div className="flex max-w-[148px] flex-col items-end">
        <span className="text-md font-semibold">
          {isPointsLoading || total == null ? (
            <LoadingPulse w="w-20" />
          ) : (
            <span>{totalFormatted}</span>
          )}
        </span>
      </div>
    </Button>
  );

  return (
    <>
      {/* 데스크탑: Popover + 트리거 (한 번만) */}
      <NavbarItem className="max-sm:hidden">
        <PointsMenu
          isOpenGlobal={disclosure.isOpen}
          setOpenGlobal={(v) =>
            v ? disclosure.onOpen() : disclosure.onClose()
          }
          trigger={desktopTrigger}
        />
      </NavbarItem>

      {/* 모바일: 아이콘 트리거 + 모달 */}
      <NavbarItem className="sm:hidden">
        <Button
          isIconOnly
          variant="light"
          radius="full"
          onPress={disclosure.onOpen} // 모달 열기
        >
          <GiCosmicEgg size="1.5em" />
        </Button>
      </NavbarItem>

      <Modal
        className="sm:hidden"
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
        placement="bottom"
        scrollBehavior="inside"
        size="md"
      >
        <ModalContent>
          <ModalHeader className="px-6 py-5">
            <div className="w-full">
              <p className="text-[14px] font-semibold leading-5 text-default-700">
                Birdieswap Point
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                {isPointsLoading || total == null ? "—" : totalFormatted}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="p-0">
            {/* 모달에선 가득/반응형으로 */}
            <PointsPanel variant="modal" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
