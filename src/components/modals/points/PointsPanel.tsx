"use client";

import { AssetsContext } from "@/app/AssetsContextProvider";
import Icons from "@/assets/icons/icons";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";
import clsx from "clsx";
import { useContext } from "react";
ModalCloseButton;

export default function PointsPanel({
  variant = "popover",
  className,
  showClose = false, // 상단 우측 X 표시 여부
  onClose,
}: {
  variant?: "popover" | "modal";
  className?: string;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const isPopover = variant === "popover";
  const { userPoints } = useContext(AssetsContext);
  const totalSwapPoint: number =
    Number(userPoints?.totalPointsDetail?.swapWithReferrals as string) +
    Number(userPoints?.totalPointsDetail?.swapWithoutReferrals as string);

  const swapPoint = format2(totalSwapPoint, 2);
  const referralPoint = format2(
    Number(userPoints?.totalPointsDetail?.referrals),
    2
  );
  const stakingPoint = format2(
    Number(userPoints?.totalPointsDetail?.staking),
    2
  );

  return (
    <div className={clsx("relative", className)}>
      {/* 필요할 때만 X 버튼(24×24) 표시 */}
      {showClose && (
        <ModalCloseButton
          onPress={onClose}
          className="absolute left-[324px] top-[-40px]"
        />
      )}

      {/* 본문: 패딩/폭 없음 → 래퍼에서 제어 */}
      <div className="flex flex-col mt-6 space-y-6">
        {/* 헤더: 아이콘(48) + 타이틀 */}
        <div className="flex items-center gap-4">
          <Icons.PointIcon className="w-12 h-12" /> {/* 48×48 */}
          <h2 className="font-sans text-[20px] font-semibold leading-[28px] text-foreground">
            Earn Your Points
          </h2>
        </div>

        {/* 서브 타이틀 */}
        <p className="text-base font-semibold text-foreground">
          You have earned
        </p>

        {/* 획득 내역 카드 */}
        <div className="rounded-[12px] bg-default-100 px-4 py-3 dark:bg-background">
          <div className="flex flex-col gap-2 text-[16px] font-sans text-foreground">
            {/* <Row label="Farm" value={stakingPoint} /> */}
            <Row label="Swap" value={swapPoint} />
            <Row label="Referral" value={referralPoint} />
          </div>
        </div>

        {/* 청록 카피 */}
        <p className="font-sans text-[16px] font-regular text-center text-primary dark:text-dark-green-key">
          {/* Supply,*/} Swap, and invite friends to get points.
        </p>

        {/* 구분선 */}
        <div className="h-px bg-default-500 dark:bg-default-200" />

        {/* 하단 안내 + 로켓(20×20) */}
        <div className="text-left text-foreground">
          <p className="font-sans font-regular text-[16px] leading-[24px] px-4 max-sm:px-0">
            The full details of our Points Program are coming soon.
            {/* ↓ 여기부터는 절대 줄바꿈 금지 */}
            <span className="whitespace-nowrap inline-flex items-center">
              Stay tuned!
              <Icons.Rocket className="w-5 h-5 ml-2 translate-y-[1px]" />
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground font-regular">{label}</span>
      <span className="tabular-nums">
        <span className="font-medium">{value ?? 0}</span>
        <span className="text-foreground font-regular">points</span>
      </span>
    </div>
  );
}
