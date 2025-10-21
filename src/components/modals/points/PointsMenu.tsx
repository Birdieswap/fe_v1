"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useMemo } from "react";
import PointsPanel from "@/components/modals/points/PointsPanel";

export default function PointsMenu({
  isOpenGlobal,
  setOpenGlobal,
  trigger, // ⬅️ 데스크탑 트리거 버튼 자체를 받음
}: {
  isOpenGlobal: boolean;
  setOpenGlobal: (v: boolean) => void;
  trigger: React.ReactNode;
}) {
  const isOpen = useMemo(() => isOpenGlobal, [isOpenGlobal]);

  return (
    <Popover
      className="max-sm:hidden" // ⬅️ 데스크탑에서만 렌더
      isOpen={isOpen}
      placement="bottom-start"
      offset={16}
      onOpenChange={(v) => {
        if (!v && isOpen) setOpenGlobal(false);
        else if (v) setOpenGlobal(true);
      }}
    >
      <PopoverTrigger>
        {/* ⬇️ 여기서 실제 데스크탑 트리거를 렌더 */}
        <div>{trigger}</div>
      </PopoverTrigger>

      <PopoverContent className="gap-0 border-default-200 bg-background p-0 dark:border-1 dark:border-default-100 dark:bg-dark-popup-bg mt-2 -ml-3">
        <PointsPanel variant="popover" />
      </PopoverContent>
    </Popover>
  );
}
