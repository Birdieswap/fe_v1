"use client";

import type { Farm } from "@/types/FarmListTableRowProps";
import type { BigDecimal } from "@/types/BigDecimal";
import RewardInfoPanel from "./RewardInfo/RewardInfoPanel";
import RewardInfoPanelMobile from "./RewardInfo/RewardInfoPanelMobile";

// 외부에서 모달 열기 콜백 시그니처에 쓰이는 타입(기존과 동일)
type VaultRowItem = {
  kind: "vault" | "staking";
  name: string;
  rawName: string;
  apy: number;
  aprSource: any;
};

export default function RewardInfoCard({
  item,
  price,
  onOpenStakingModal,
  className,
}: {
  item: Farm;
  price?: BigDecimal | null;
  onOpenStakingModal?: (row: VaultRowItem) => void;
  className?: string;
}) {
  return (
    <>
      {/* ✅ 데스크톱 전용 뷰: sm 이상에서만 렌더 */}
      <div className="hidden sm:block">
        <RewardInfoPanel
          item={item}
          price={price}
          onOpenStakingModal={onOpenStakingModal}
          className={className}
        />
      </div>

      {/* ✅ 모바일 전용 뷰: sm 미만에서만 렌더 */}
      <div className="block sm:hidden">
        <RewardInfoPanelMobile
          item={item}
          price={price}
          onOpenStakingModal={onOpenStakingModal}
          className={className}
        />
      </div>
    </>
  );
}
