// components/(main)/pay/common/ActiveNetwork.tsx
"use client";

import { useContext } from "react";
import clsx from "clsx";

import { WalletContext } from "@/app/WalletContextProvider";

/**
 * 체인별로 "대체 로고"를 쓰고 싶은 경우 여기서 정의.
 * key 는 chainId 기준.
 */
const NETWORK_ICON_OVERRIDE_BY_CHAIN_ID: Record<number, string> = {
  // Base ⇒ 특별 로고 사용
  8453: "/networks/baselogo.svg",
  // 필요하면 다른 체인도 추가
  // 42161: "/networks/arbitrum-special.svg",
};

export default function ActiveNetwork() {
  const { selectedNetwork, chainId } = useContext(WalletContext);

  if (!selectedNetwork) {
    return null;
  }

  const activeName = selectedNetwork.name;

  // 1) chainId 기준 오버라이드 로고 우선
  const overrideIconSrc =
    (chainId && NETWORK_ICON_OVERRIDE_BY_CHAIN_ID[chainId]) || undefined;

  const isOverride = !!overrideIconSrc;
  // 2) 없으면 원래 iconSrc 사용
  const activeIconSrc = overrideIconSrc ?? selectedNetwork.iconSrc;

  return (
    <div
      className={clsx(
        // ★ 요청한 그대로: items-baseline 유지
        "mb-2 flex w-full items-baseline gap-2"
      )}
    >
      {/* 왼쪽 라벨 */}
      <span className="text-base font-semibold text-default-700 dark:text-default-500">
        Active Network
      </span>

      {/* 오른쪽: 아이콘 + (텍스트) */}
      <div className="flex items-center gap-2">
        {/* 아이콘 (항상 표시) */}
        {activeIconSrc && (
          <img
            src={activeIconSrc}
            alt={activeName}
            className={clsx(
              "h-5 object-contain", // 높이 20px, 비율 유지
              isOverride ? "w-auto" : "w-5" // override는 가로 자유, 기본은 20x20
            )}
          />
        )}

        {/* 
          baseline 고정을 위한 텍스트:
          - override 아닐 때: 실제로 보임 (네트워크 이름)
          - override 일 때: opacity-0 로 안 보이지만, 레이아웃에 남아서 베이스라인 유지
        */}
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
