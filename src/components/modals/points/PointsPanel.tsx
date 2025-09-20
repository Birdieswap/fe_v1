"use client";

export default function PointsPanel({
  variant = "popover",
}: {
  variant?: "popover" | "modal";
}) {
  const isPopover = variant === "popover";

  return (
    <div
      className={
        isPopover
          ? "px-4 py-4 w-[320px] sm:w-[360px]" // 팝오버: 고정 폭
          : "px-6 sm:px-8 py-4 w-full" // 모달: 가득, 반응형 패딩
      }
    >
      {/* 상단 요약 */}
      <div className="rounded-2xl border border-default-200/70 p-4 dark:border-default-100/60">
        <p className="mb-2 text-sm font-medium text-default-500">Your</p>

        <div className="flex flex-col gap-2 text-[15px] text-foreground">
          <div className="flex items-center justify-between">
            <span>Swap</span>
            <span className="font-semibold tabular-nums">1,000,000 point</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Referral</span>
            <span className="font-semibold tabular-nums">340,000 point</span>
          </div>
          <div className="flex items-center justify-between">
            <span>LP</span>
            <span className="font-semibold tabular-nums">6,987 point</span>
          </div>
        </div>
      </div>

      {/* 카피 */}
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
        <p className="text-[32px] font-bold text-light_primary dark:text-dark_primary">
          “Coming Soon”
        </p>
      </div>
    </div>
  );
}
