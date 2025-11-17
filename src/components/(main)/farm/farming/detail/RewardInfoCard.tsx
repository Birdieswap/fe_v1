"use client";

import type { Farm } from "@/types/FarmListTableRowProps";
import type { BigDecimal } from "@/types/BigDecimal";
import RewardInfoPanel from "./RewardInfo/RewardInfoPanel";
import RewardInfoPanelMobile from "./RewardInfo/RewardInfoPanelMobile";
import { useContext } from "react";
import { AssetsContext } from "@/app/AssetsContextProvider";

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
  const { userPoints } = useContext(AssetsContext);
  const symbol = item?.wip_stakeToken?.symbol;
  const points = userPoints?.staking?.[symbol] ?? null;

  console.log("RewardInfoCard render item:", item, userPoints);
  return (
    <>
      {/* ✅ 데스크톱 전용 뷰: sm 이상에서만 렌더 */}
      <div className="hidden sm:block">
        <RewardInfoPanel
          item={item}
          price={price}
          points={points}
          onOpenStakingModal={onOpenStakingModal}
          className={className}
        />
      </div>

      {/* ✅ 모바일 전용 뷰: sm 미만에서만 렌더 */}
      <div className="block sm:hidden">
        <RewardInfoPanelMobile
          item={item}
          price={price}
          points={points}
          onOpenStakingModal={onOpenStakingModal}
          className={className}
        />
      </div>
    </>
  );
}
