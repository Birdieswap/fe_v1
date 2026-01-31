// components/(main)/pay/common/ActiveNetwork.tsx
"use client";

import { useContext } from "react";
import clsx from "clsx";

import Icons from "@/assets/icons/icons";
import { WalletContext } from "@/app/WalletContextProvider";

/**
 * 체인별로 "대체 로고"를 쓰고 싶은 경우 여기서 정의.
 * key 는 chainId 기준.
 *
 * NOTE:
 * - SVG를 "색상(테마)"에 따라 바꾸려면 <img src="...">가 아니라
 *   "인라인 SVG(= React 컴포넌트)"로 렌더링돼야 합니다.
 * - 그래서 override는 string(src)이 아니라 React SVG 컴포넌트를 맵핑합니다.
 */
type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const NETWORK_ICON_OVERRIDE_BY_CHAIN_ID: Record<number, SvgIcon> = {
  // Base ⇒ 특별 로고 사용 (Icons.BaseLogo 는 SVGR 컴포넌트여야 함)
  8453: Icons.BaseLogo as SvgIcon,
  // 필요하면 다른 체인도 추가
  // 42161: Icons.ArbSpecial as SvgIcon,
};

export default function ActiveNetwork() {
  const { selectedNetwork, chainId } = useContext(WalletContext);

  if (!selectedNetwork) return null;

  const activeName = selectedNetwork.name;

  const OverrideIcon =
    (chainId && NETWORK_ICON_OVERRIDE_BY_CHAIN_ID[chainId]) || null;

  const isOverride = !!OverrideIcon;
  const activeIconSrc = selectedNetwork.iconSrc; // override 없을 때만 사용

  return (
    <div className={clsx("mb-2 flex w-full items-baseline gap-2")}>
      {/* 왼쪽 라벨 */}
      <span className="text-base font-semibold text-default-700 dark:text-default-500">
        Active Network
      </span>

      {/* 오른쪽: 아이콘 + (텍스트) */}
      <div className="flex items-center gap-2">
        {/* 아이콘 (항상 표시) */}
        {OverrideIcon ? (
          <OverrideIcon
            aria-label={activeName}
            className={clsx(
              "h-5 w-auto", // override는 가로 자유
              "text-foreground " // 핵심: currentColor를 theme foreground로
            )}
          />
        ) : (
          activeIconSrc && (
            <img
              src={activeIconSrc}
              alt={activeName}
              className="h-5 w-5 object-contain" // 기본은 20x20
            />
          )
        )}

        {/* baseline 고정을 위한 텍스트 */}
        <span
          className={clsx(
            "text-lg font-semibold text-default-900",
            isOverride && "opacity-0"
          )}
        >
          {activeName}
        </span>
      </div>
    </div>
  );
}
