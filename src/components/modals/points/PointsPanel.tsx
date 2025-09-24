"use client";

import { AssetsContext } from "@/app/AssetsContextProvider";
import { format2 } from "@/utils/wallet/tokens/calcBigdecimal";
import { useContext } from "react";

export default function PointsPanel({
  variant = "popover",
}: {
  variant?: "popover" | "modal";
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
    <div
      className={
        isPopover
          ? "px-4 py-4 w-[320px] sm:w-[360px]" // 팝오버: 고정 폭
          : "px-6 sm:px-8 py-4 w-full" // 모달: 가득, 반응형 패딩
      }
    >
      {/* 상단 요약 */}
      <div className="mb-3 px-1 text-left text-xl font-bold text-foreground">
        <h2>🎉 Earn Your Points</h2>
      </div>
      <div className="rounded-2xl border border-default-200/70 p-4 dark:border-default-100/60">
        <p className="mb-2 text-base font-medium text-primary">
          Your have earned
        </p>

        <div className="flex flex-col gap-2 text-[15px] text-foreground">
          <div className="flex items-center justify-between">
            <span>Farm</span>
            <span className="font-semibold tabular-nums">
              {stakingPoint} points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Swap</span>
            <span className="font-semibold tabular-nums">
              {swapPoint} points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Referral</span>
            <span className="font-semibold tabular-nums">
              {referralPoint} points
            </span>
          </div>
        </div>
      </div>

      {/* 카피 */}
      <div className="mt-6 space-y-1 text-center">
        <p className="text-[15px] text-default-700">
          Supply, swap, and invite friends
        </p>
        <p className="text-[15px] text-default-700">to get points.</p>
      </div>

      <div className="mt-5 text-center text-foreground">
        <p className="text-[15px]">The full details of our Points Program</p>
        <p className="text-[15px]">are coming soon. Stay tuned! 🚀</p>
      </div>
    </div>
  );
}
