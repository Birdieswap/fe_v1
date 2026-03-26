"use client";

import {
  Button,
  ModalBody,
  ModalContent,
  NavbarItem,
  useDisclosure,
} from "@heroui/react";
import { useContext, useMemo, useState } from "react";
import { AssetsContext } from "@/app/AssetsContextProvider";
import PointsMenu from "@/components/modals/points/PointsMenu";
import PointsPanel from "@/components/modals/points/PointsPanel";
import { LoadingPulse } from "../farm/farming/FarmListRowSummary";
import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import Icons from "@/assets/icons/icons";

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
      className="h-9 rounded-lg min-w-0 p-1 gap-2 [&_[data-slot=content]]:px-0"
      onPress={disclosure.onOpen} // Popover 열기
    >
      <Icons.PointIcon className="h-6 w-6" />
      <div className="flex max-w-[148px] flex-col items-center mx-0 px-0">
        <span className="text-md font-semibold">
          {isPointsLoading ? <LoadingPulse w="w-10" /> : <span>{totalFormatted}</span>}
        </span>
      </div>
    </Button>
  );

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 데스크탑: Popover + 트리거 (한 번만) */}
      <NavbarItem className="max-sm:hidden px-0 mx-0">
        <PointsMenu
          isOpenGlobal={disclosure.isOpen}
          setOpenGlobal={(v) =>
            v ? disclosure.onOpen() : disclosure.onClose()
          }
          trigger={desktopTrigger}
        />
      </NavbarItem>

      {/* 모바일: 아이콘 트리거 + 모달 */}
      <NavbarItem className="sm:hidden px-0 mx-0">
        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="h-9 px-0 [&_[data-slot=content]]:px-0"
          onPress={disclosure.onOpen} // 모달 열기
        >
          <Icons.PointIcon className="h-6 w-6" />
        </Button>
      </NavbarItem>

      <ModalBase
        className="mt-2 pt-14 sm:hidden"
        classNames={{
          wrapper: "items-end justify-center",
          base: "m-0 max-h-[75vh] overflow-hidden",
          body: "p-0 h-full flex flex-col",
          closeButton: "absolute top-3 right-4",
        }}
        closeButton={<ModalCloseButton onClose={disclosure.onClose} />}
        isDismissable
        isKeyboardDismissDisabled={false}
        isOpen={disclosure.isOpen}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: { duration: 0.3, ease: "easeOut" },
            },
            exit: {
              y: "100%",
              opacity: 0,
              transition: { duration: 0.3, ease: "easeIn" },
            },
          },
        }}
        placement="bottom"
        size="lg"
        onClose={disclosure.onClose}
      >
        <ModalContent className="h-full">
          <ModalBody className="p-0 h-full flex flex-col">
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              {/* 본문 패널: 모달에서는 가득/반응형 */}
              <PointsPanel variant="modal" />

              {/* 하단 안전 영역 */}
              <div className="h-4" />
            </div>
          </ModalBody>
        </ModalContent>
      </ModalBase>
    </>
  );
}
