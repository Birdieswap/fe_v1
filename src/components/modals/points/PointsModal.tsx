"use client";

import { ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import ModalBase from "@/components/atoms/ModalBase";

export default function PointsModal({
  isOpen,
  onClose,
  totalFormatted,
}: {
  isOpen: boolean;
  onClose: () => void;
  totalFormatted: string;
}) {
  return (
    <ModalBase
      hideCloseButton
      isOpen={isOpen}
      onClose={onClose}
      // 모바일은 바텀시트, 데스크탑은 중앙에 가깝게 보이도록
      classNames={{
        wrapper: "items-end justify-center sm:items-center sm:justify-center",
        base: "m-0 sm:m-6 max-h-[86vh] sm:max-h-[80vh]",
        body: "p-0",
      }}
      placement="bottom"
      scrollBehavior="inside"
      size="lg"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.28, ease: "easeOut" },
          },
          exit: {
            y: "100%",
            opacity: 0,
            transition: { duration: 0.28, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-5">
          <div className="w-full">
            <p className="text-[14px] font-semibold leading-5 text-default-500">
              Birdieswap Point
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {totalFormatted}
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="px-3 pb-6">
          {/* 상단 요약 (하드코딩 값은 이후 userPoints로 바꿀 예정) */}
          <div className="rounded-2xl border border-default-200/70 p-4 dark:border-default-100/60">
            <p className="mb-2 text-sm font-medium text-default-500">Your</p>
            <div className="grid grid-cols-[1fr_auto] gap-y-2 text-[15px] text-foreground">
              <span>Swap</span>{" "}
              <span className="font-semibold">1,000,000 point</span>
              <span>Referral</span>{" "}
              <span className="font-semibold">340,000 point</span>
              <span>LP</span> <span className="font-semibold">6,987 point</span>
            </div>
          </div>

          {/* 카피 영역 */}
          <div className="mt-6 space-y-1 text-center">
            <p className="text-[15px] text-default-700">
              Provide liquidity. Stake. Swap. Refer.
            </p>
            <p className="text-[15px] text-default-700">
              Earn <b>Birdieswap Points</b> with every action.
            </p>
            <p className="pt-1 text-[22px] font-bold tracking-tight text-light_pink dark:text-dark_pink">
              Start earning now.
            </p>
          </div>

          <div className="mt-3 text-center text-foreground">
            <p className="text-[15px]">More points, more power.</p>
          </div>

          <div className="mt-2 text-center">
            <p className="text-[32px] font-bold  text-light_primary dark:text-dark_primary">
              “Coming Soon”
            </p>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
