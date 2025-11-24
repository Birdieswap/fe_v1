"use client";
import { cn } from "@heroui/react";
import Image from "next/image";
import { Fragment, useCallback, useContext, useMemo } from "react";
import { useChainId } from "wagmi";

import Icons from "@/assets/icons/icons";
import { AssetsContext } from "@/app/AssetsContextProvider";
import tokensList from "@/const/contracts/tokens/tokens";
// import singleVaultsList from "@/const/contracts/tokens/singleVaults";
import lpVaultsList from "@/const/contracts/tokens/lpVaults";
import {
  buildWalletTokens,
  type AssetsLike,
} from "@/utils/wallet/tokens/buildWalletTokens";
import type { BigDecimal } from "@/types/BigDecimal";
import { useRouter } from "next/navigation";
import { findSymbolByAddress } from "@/utils/assets/getTokenSymbol";
import { getAddress } from "viem";

export type WalletTokenType = "LP" | "staked" | "token";

export type WalletTokenInfo = {
  type?: WalletTokenType;
  address?: `0x${string}`;
  name: string;
  amount: string;
  src?: string;
  usdAmount: string;
};

type NonU<T> = NonNullable<T>;
type StakedBalancesShape = NonU<NonU<AssetsLike["balances"]>["stakedBalances"]>;

/**
 * Utility: cast Map keys to string to satisfy AssetsLike
 */
function normalizeKey(k: any) {
  const s = String(k);
  // 0x40자 주소면 체크섬으로 통일. 주소가 아니면 그냥 문자열
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) {
    try {
      return getAddress(s);
    } catch {
      return s.toLowerCase();
    }
  }
  return s;
}

// function castMapToStringKey<V>(
//   m?: Map<any, V> | null
// ): Map<string, V> | undefined {
//   if (!m) return undefined;
//   if (m instanceof Map) {
//     const out = new Map<string, V>();
//     for (const [k, v] of m.entries()) out.set(String(k), v);
//     return out;
//   }
//   return undefined;
// }
function castMapToStringKey<V>(
  m?: Map<any, V> | Record<string, V> | null
): Map<string, V> | undefined {
  if (!m) return undefined;
  const out = new Map<string, V>();

  if (m instanceof Map) {
    for (const [k, v] of m.entries()) out.set(normalizeKey(k), v);
  } else if (typeof m === "object") {
    for (const [k, v] of Object.entries(m)) out.set(normalizeKey(k), v as V);
  } else {
    return undefined;
  }
  return out;
}
/**
 * Adapter: AssetsContext value -> AssetsLike expected by buildWalletTokens
 * NOTE: We keep the structure minimal and cast where the upstream types diverge.
 */
function toAssetsLike(total: any): AssetsLike {
  // Some codebases expose balances directly on context, others under .balances
  const b = total?.balances ?? total;
  // console.log("walletTokens", total);

  // Try to discover farm price map if present somewhere else
  const farmPriceMap = (total?.farmValues?.priceMap ??
    total?.prices ??
    b?.prices) as Map<any, BigDecimal> | undefined;

  const stakedByInput = b?.stakedBalances?.byInputTokenAddress as
    | Map<any, any>
    | undefined;

  const stakedBalances: StakedBalancesShape = {
    // buildWalletTokens 내부는 Map 자체를 읽어들이므로 Map을 그대로 넣습니다.
    // 타입 정의만 살짝 빗나가 있어 캐스팅으로 정리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byInputTokenAddress: stakedByInput
      ? (new Map(
          Array.from(stakedByInput.entries()).map(([k, v]) => [String(k), v])
        ) as any)
      : undefined,
    byStakingPoolAddress: undefined,
  };

  const chainLinkPriceMapSrc =
    total?.assetValues?.chainLinkPriceMap ??
    total?.chainLinkPriceMap ??
    b?.chainLinkPriceMap;

  const chainLinkPriceMap =
    castMapToStringKey<BigDecimal>(chainLinkPriceMapSrc);

  const assetsLike: AssetsLike = {
    assetValues: {
      chainLinkPriceMap: chainLinkPriceMap as unknown as Map<
        string,
        { price: BigDecimal }
      >,
    },
    balances: {
      tokenBalances: {
        balanceMap: castMapToStringKey<BigDecimal>(
          b?.tokenBalances?.balanceMap
        ),
      },
      singleVaultBalances: {
        balanceMap: castMapToStringKey<BigDecimal>(
          b?.singleVaultBalances?.balanceMap
        ),
      },
      lpVaultBalances: {
        balanceMap: castMapToStringKey<BigDecimal>(
          b?.lpVaultBalances?.balanceMap
        ),
      },
      // --- 여기도 StakedBalancesShape을 그대로 할당 ---
      stakedBalances,
    },
    farmValues: {
      priceMap: castMapToStringKey<BigDecimal | null>(farmPriceMap),
    },
  };

  return assetsLike;
}

function WalletTokenItem(props: WalletTokenInfo & { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "grid w-full grid-cols-[60%_40%] items-center gap-2 rounded-sm px-1 py-2",
        "hover:bg-default-200 dark:hover:bg-default-100 transition-background cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="shrink-0 w-8 h-8 max-[375px]:w-6 max-[375px]:h-6">
          {props.src && (
            <Image
              alt={props.name}
              className="size-full rounded-full"
              height={28}
              src={props.src}
              width={28}
            />
          )}
        </div>
        <span className="text-[14px] max-[375px]:text-[12px] font-bold leading-[15px] text-foreground text-left">
          {props.name}
        </span>
      </div>
      <div className="flex grow flex-col items-end gap-0.5 pr-2">
        <span className="text-[14px] max-[375px]:text-[12px] font-semibold leading-[15px] text-foreground">
          {props.amount}
        </span>
        <span className="text-[12px] max-[375px]:text-[11px] font-bold leading-[14px] text-default-700 dark:text-default-300">
          $ {props.usdAmount}
        </span>
      </div>
    </button>
  );
}

export default function WalletTokens({ onClose }: { onClose?: () => void }) {
  const chainId = useChainId();
  const total = useContext(AssetsContext);
  const router = useRouter();

  const tokens = useMemo<WalletTokenInfo[]>(() => {
    const assetsLike = toAssetsLike(total);
    return (
      (buildWalletTokens(
        assetsLike,
        {
          tokens: tokensList as any,
          lpVaults: lpVaultsList as any,
          // singleVaults: singleVaultsList as any,
        },
        chainId
      ) as WalletTokenInfo[]) ?? []
    );
  }, [total, chainId]);

  const handleClick = useCallback(
    (t: WalletTokenInfo) => {
      try {
        onClose?.();

        requestAnimationFrame(() => {
          setTimeout(() => {
            const href =
              t.type === "token"
                ? `/?from=${encodeURIComponent(
                    findSymbolByAddress(t.address as string, chainId) as string
                  )}`
                : t.type === "LP"
                  ? `/farm?open=${t.address}&stakePanel=stake`
                  : `/farm?open=${t.address}&stakePanel=unstake&unstakeAmount=max`;

            const curr =
              typeof window !== "undefined"
                ? new URL(window.location.href)
                : null;
            const next = new URL(href, window.location.origin);

            const isSamePath = !!curr && curr.pathname === next.pathname;

            if (isSamePath && curr) {
              // 같은 경로면 라우터 대신 URL만 교체 + 해당 페이지용 이벤트 발행
              curr.search = next.search;
              window.history.replaceState(
                window.history.state,
                "",
                curr.toString()
              );

              const evt =
                curr.pathname === "/farm"
                  ? "farm:query-updated"
                  : "swap:query-updated";
              window.dispatchEvent(new CustomEvent(evt));
            } else {
              // 다른 경로면 라우터로 이동 (스크롤 금지)
              router.push(href, { scroll: false });
            }
          }, 160);
        });
      } catch (e) {
        console.error("WalletToken click failed:", e);
      }
    },
    [router, chainId, onClose]
  );

  return (
    <div
      className={cn(
        "flex w-full grow flex-col gap-1 px-4 pb-3",
        "max-sm:pt-3 max-sm:px-6 max-sm:gap-3 max-[375px]:gap-1.5"
      )}
    >
      {tokens.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyToken className="fill-light-mid-mint-2 dark:fill-dark-empty-state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            No tokens yet.
          </span>
        </div>
      ) : (
        <Fragment>
          <h2 className="w-full text-right text-[14px] font-semibold mt-3 max-sm:mt-1 leading-[17px] text-primary pr-1">
            {tokens.length} Tokens
          </h2>
          {tokens.map((token) => (
            <WalletTokenItem
              key={`${token.name}-${token.address ?? ""}`}
              amount={token.amount}
              name={token.name}
              src={token.src}
              usdAmount={token.usdAmount}
              onClick={() => handleClick(token)}
            />
          ))}
        </Fragment>
      )}
    </div>
  );
}
