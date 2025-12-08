"use client";

import { cn } from "@heroui/react";
import Image from "next/image";
import { Fragment, useCallback, useContext, useMemo } from "react";
import { useChainId } from "wagmi";

import Icons from "@/assets/icons/icons";
import { AssetsContext } from "@/app/AssetsContextProvider";
import tokensList from "@/const/contracts/tokens/tokens";
import externalTokensList from "@/const/contracts/tokens/externalTokens"; // ✅ 추가 (object map 형태)
import lpVaultsList from "@/const/contracts/tokens/lpVaults";
import {
  buildWalletTokens,
  type AssetsLike,
} from "@/utils/wallet/tokens/buildWalletTokens";
import type { BigDecimal } from "@/types/BigDecimal";
import { useRouter } from "next/navigation";
import { findSymbolByAddress } from "@/utils/assets/getTokenSymbol";
import { getAddress } from "viem";

export type WalletTokenType = "LP" | "staked" | "token" | "external";

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
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) {
    try {
      return getAddress(s);
    } catch {
      return s.toLowerCase();
    }
  }
  return s;
}

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
 */
function toAssetsLike(total: any): AssetsLike {
  const b = total?.balances ?? total;

  const farmPriceMap = (total?.farmValues?.priceMap ??
    total?.prices ??
    b?.prices) as Map<any, BigDecimal> | undefined;

  const stakedByInput = b?.stakedBalances?.byInputTokenAddress as
    | Map<any, any>
    | undefined;

  const stakedBalances: StakedBalancesShape = {
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
      stakedBalances,
    },
    farmValues: {
      priceMap: castMapToStringKey<BigDecimal | null>(farmPriceMap),
    },
  };

  return assetsLike;
}

/**
 * BigDecimal-ish -> number (best-effort)
 */
function toNumberSafe(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;

  if (typeof v.toNumber === "function") return Number(v.toNumber()) || 0;
  if (typeof v.toExact === "function") return Number(v.toExact()) || 0;
  if (typeof v.toString === "function") return Number(v.toString()) || 0;
  if (typeof v.formatted === "string") return Number(v.formatted) || 0;

  return 0;
}

/**
 * default formatter (fallback)
 */
function formatAmountLoose(v: any): string {
  const n = toNumberSafe(v);

  if (typeof v === "bigint") return v.toString();
  if (!isFinite(n)) return String(v?.toString?.() ?? "—");

  if (n <= 0) return "0";
  if (n < 0.0001) return "< 0.0001";
  if (n < 1) return n.toFixed(4);
  if (n < 1000) return n.toFixed(3).replace(/\.?0+$/, "");
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * BigDecimal ( { value: bigint, decimals: number } ) support
 */
function isPositiveBalance(v: any): boolean {
  if (v == null) return false;

  // ✅ 너희 BigDecimal shape: { value: bigint, decimals: number }
  if (typeof v?.value === "bigint") return (v.value as bigint) > 0n;

  const n = toNumberSafe(v);
  return Number.isFinite(n) && n > 0;
}

function formatBigDecimalLike(v: any): string {
  if (v == null) return "0";

  // ✅ BigDecimal shape: { value: bigint, decimals: number }
  if (typeof v?.value === "bigint") {
    const raw = v.value as bigint;
    const decimals = Number(v.decimals ?? 18);

    const sign = raw < 0n ? "-" : "";
    const abs = raw < 0n ? -raw : raw;

    const base = 10n ** BigInt(decimals);
    const intPart = abs / base;
    const fracPart = abs % base;

    // displayDecimals 있으면 그만큼만, 없으면 4자리
    const dp = Number(v.displayDecimals ?? 4);
    if (dp <= 0) return `${sign}${intPart.toString()}`;

    const fracStrFull = fracPart.toString().padStart(decimals, "0");
    const fracStr = fracStrFull
      .slice(0, Math.min(dp, fracStrFull.length))
      .replace(/0+$/, "");

    return fracStr.length > 0
      ? `${sign}${intPart.toString()}.${fracStr}`
      : `${sign}${intPart.toString()}`;
  }

  return formatAmountLoose(v);
}

/**
 * externalTokens.ts / tokens.ts 포맷이 조금 달라도 최대한 잘 읽기
 * - addresses[chainId] 지원
 * - iconSrc 지원
 */
function pickTokenMeta(t: any, chainId?: number) {
  const chainKey = chainId != null ? String(chainId) : undefined;

  const addressCandidate =
    t?.address ??
    t?.tokenAddress ??
    t?.contractAddress ??
    t?.addr ??
    (chainKey ? t?.addresses?.[chainKey] : undefined) ??
    (chainId != null ? t?.addresses?.[chainId] : undefined) ??
    (chainKey ? t?.contracts?.[chainKey]?.address : undefined) ??
    (chainId != null ? t?.contracts?.[chainId]?.address : undefined);

  const name =
    t?.symbol ?? t?.name ?? t?.ticker ?? t?.title ?? t?.fullName ?? "Unknown";

  const src =
    t?.src ??
    t?.iconSrc ?? // ✅ externalTokens의 iconSrc
    t?.logoURI ??
    t?.logoUrl ??
    t?.logo ??
    t?.image ??
    t?.icon;

  const chainIdFromItem =
    t?.chainId ?? t?.chainID ?? t?.networkId ?? t?.networkID;

  return {
    address: addressCandidate as string | undefined,
    name: name as string,
    src: src as string | undefined,
    chainId: chainIdFromItem as number | undefined,
  };
}

type ExternalTokenItem = Record<string, any>;

/**
 * External tokens builder:
 * - tokenBalances.balanceMap(주소 기반)에서 balance > 0 인 것만
 * - USD 환산값은 표시하지 않음
 */
function buildExternalWalletTokens(
  assetsLike: AssetsLike,
  chainId: number
): WalletTokenInfo[] {
  const balanceMap = assetsLike?.balances?.tokenBalances?.balanceMap;
  if (!balanceMap) return [];

  // externalTokensList는 object map 형태이므로 values로 배열화
  const externalTokenArray = Object.values(
    externalTokensList as unknown as Record<string, ExternalTokenItem>
  );

  // 체인 필드가 있으면 필터, 없으면 포함
  const candidates = externalTokenArray.filter((t) => {
    const meta = pickTokenMeta(t, chainId);
    return meta.chainId == null || meta.chainId === chainId;
  });

  const out: WalletTokenInfo[] = [];

  for (const t of candidates) {
    const meta = pickTokenMeta(t, chainId);
    if (!meta.address || !/^0x[0-9a-fA-F]{40}$/.test(String(meta.address)))
      continue;

    let addr: `0x${string}`;
    try {
      addr = getAddress(meta.address) as `0x${string}`;
    } catch {
      continue;
    }

    const bal =
      balanceMap.get(addr) ??
      balanceMap.get(addr.toLowerCase()) ??
      balanceMap.get(normalizeKey(addr));

    if (!bal) continue;
    if (!isPositiveBalance(bal)) continue;

    out.push({
      type: "external",
      address: addr,
      name: meta.name,
      src: meta.src,
      amount: formatBigDecimalLike(bal),
      usdAmount: "-", // ✅ external은 USD 미표시
    });
  }

  // 정렬: 수량 큰 순(가능하면)
  out.sort((a, b) => {
    // amount는 string이라 완벽 정렬은 아니지만, BigDecimal인 경우 isPositiveBalance는 이미 통과.
    // 여기선 name 정렬이 더 안전하면 아래로 교체해도 됨.
    if (a.name === b.name) return 0;
    return a.name.localeCompare(b.name);
  });

  return out;
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
        <span className="text-[14px] max-[375px]:text-[12px] font-bold leading-[15px] text-foreground text-left truncate">
          {props.name}
        </span>
      </div>

      <div className="flex grow flex-col items-end gap-0.5 pr-2">
        <span className="text-[14px] max-[375px]:text-[12px] font-semibold leading-[15px] text-foreground">
          {props.amount}
        </span>

        {/* ✅ external은 USD 라인 숨김 */}
        {props.type !== "external" && (
          <span className="text-[12px] max-[375px]:text-[11px] font-bold leading-[14px] text-default-700 dark:text-default-300">
            $ {props.usdAmount}
          </span>
        )}
      </div>
    </button>
  );
}

export default function WalletTokens({ onClose }: { onClose?: () => void }) {
  const chainId = useChainId();
  const total = useContext(AssetsContext);
  const router = useRouter();

  const { tokens, externalTokens } = useMemo(() => {
    const assetsLike = toAssetsLike(total);

    const tokens =
      ((buildWalletTokens(
        assetsLike,
        {
          tokens: tokensList as any,
          lpVaults: lpVaultsList as any,
        },
        chainId
      ) as WalletTokenInfo[]) ??
        []) ||
      [];

    const externalTokens = buildExternalWalletTokens(assetsLike, chainId);

    return { tokens, externalTokens };
  }, [total, chainId]);

  const handleClick = useCallback(
    (t: WalletTokenInfo) => {
      try {
        onClose?.();

        requestAnimationFrame(() => {
          setTimeout(() => {
            const href =
              t.type === "token" || t.type === "external"
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

  const hasAny = tokens.length > 0 || externalTokens.length > 0;

  return (
    <div
      className={cn(
        "flex w-full grow flex-col gap-1 px-4 pb-3",
        "max-sm:pt-3 max-sm:px-6 max-sm:gap-3 max-[375px]:gap-1.5"
      )}
    >
      {!hasAny ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyToken className="fill-light-mid-mint-2 dark:fill-dark-empty-state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            No tokens yet.
          </span>
        </div>
      ) : (
        <Fragment>
          {/* ✅ 기존 토큰 리스트 */}
          {tokens.length > 0 && (
            <>
              <h2 className="w-full text-right text-[14px] font-semibold mt-3 max-sm:mt-1 leading-[17px] text-primary pr-1">
                {tokens.length} {tokens.length === 1 ? "Token" : "Tokens"}
              </h2>

              {tokens.map((token) => (
                <WalletTokenItem
                  key={`${token.name}-${token.address ?? ""}-${token.type ?? ""}`}
                  amount={token.amount}
                  name={token.name}
                  src={token.src}
                  usdAmount={token.usdAmount}
                  type={token.type}
                  address={token.address}
                  onClick={() => handleClick(token)}
                />
              ))}
            </>
          )}

          {/* ✅ divider + external tokens */}
          {externalTokens.length > 0 && (
            <>
              <div className="my-2 w-full border-t border-default-200/70 dark:border-default-100/40" />

              <div className="flex items-center justify-between pr-1 mt-1">
                <span className="text-[13px] font-semibold text-default-700 dark:text-default-300">
                  Other Tokens
                </span>
                <span className="text-[12px] font-semibold text-default-500">
                  {externalTokens.length}{" "}
                  {externalTokens.length === 1 ? "Token" : "Tokens"}
                </span>
              </div>

              {externalTokens.map((token) => (
                <WalletTokenItem
                  key={`external-${token.name}-${token.address ?? ""}`}
                  amount={token.amount}
                  name={token.name}
                  src={token.src}
                  usdAmount={token.usdAmount}
                  type={token.type}
                  address={token.address}
                  onClick={() => handleClick(token)}
                />
              ))}
            </>
          )}
        </Fragment>
      )}
    </div>
  );
}

// "use client";
// import { cn } from "@heroui/react";
// import Image from "next/image";
// import { Fragment, useCallback, useContext, useMemo } from "react";
// import { useChainId } from "wagmi";

// import Icons from "@/assets/icons/icons";
// import { AssetsContext } from "@/app/AssetsContextProvider";
// import tokensList from "@/const/contracts/tokens/tokens";
// // import singleVaultsList from "@/const/contracts/tokens/singleVaults";
// import lpVaultsList from "@/const/contracts/tokens/lpVaults";
// import {
//   buildWalletTokens,
//   type AssetsLike,
// } from "@/utils/wallet/tokens/buildWalletTokens";
// import type { BigDecimal } from "@/types/BigDecimal";
// import { useRouter } from "next/navigation";
// import { findSymbolByAddress } from "@/utils/assets/getTokenSymbol";
// import { getAddress } from "viem";

// export type WalletTokenType = "LP" | "staked" | "token";

// export type WalletTokenInfo = {
//   type?: WalletTokenType;
//   address?: `0x${string}`;
//   name: string;
//   amount: string;
//   src?: string;
//   usdAmount: string;
// };

// type NonU<T> = NonNullable<T>;
// type StakedBalancesShape = NonU<NonU<AssetsLike["balances"]>["stakedBalances"]>;

// /**
//  * Utility: cast Map keys to string to satisfy AssetsLike
//  */
// function normalizeKey(k: any) {
//   const s = String(k);
//   // 0x40자 주소면 체크섬으로 통일. 주소가 아니면 그냥 문자열
//   if (/^0x[0-9a-fA-F]{40}$/.test(s)) {
//     try {
//       return getAddress(s);
//     } catch {
//       return s.toLowerCase();
//     }
//   }
//   return s;
// }

// // function castMapToStringKey<V>(
// //   m?: Map<any, V> | null
// // ): Map<string, V> | undefined {
// //   if (!m) return undefined;
// //   if (m instanceof Map) {
// //     const out = new Map<string, V>();
// //     for (const [k, v] of m.entries()) out.set(String(k), v);
// //     return out;
// //   }
// //   return undefined;
// // }
// function castMapToStringKey<V>(
//   m?: Map<any, V> | Record<string, V> | null
// ): Map<string, V> | undefined {
//   if (!m) return undefined;
//   const out = new Map<string, V>();

//   if (m instanceof Map) {
//     for (const [k, v] of m.entries()) out.set(normalizeKey(k), v);
//   } else if (typeof m === "object") {
//     for (const [k, v] of Object.entries(m)) out.set(normalizeKey(k), v as V);
//   } else {
//     return undefined;
//   }
//   return out;
// }
// /**
//  * Adapter: AssetsContext value -> AssetsLike expected by buildWalletTokens
//  * NOTE: We keep the structure minimal and cast where the upstream types diverge.
//  */
// function toAssetsLike(total: any): AssetsLike {
//   // Some codebases expose balances directly on context, others under .balances
//   const b = total?.balances ?? total;
//   // console.log("walletTokens", total);

//   // Try to discover farm price map if present somewhere else
//   const farmPriceMap = (total?.farmValues?.priceMap ??
//     total?.prices ??
//     b?.prices) as Map<any, BigDecimal> | undefined;

//   const stakedByInput = b?.stakedBalances?.byInputTokenAddress as
//     | Map<any, any>
//     | undefined;

//   const stakedBalances: StakedBalancesShape = {
//     // buildWalletTokens 내부는 Map 자체를 읽어들이므로 Map을 그대로 넣습니다.
//     // 타입 정의만 살짝 빗나가 있어 캐스팅으로 정리
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     byInputTokenAddress: stakedByInput
//       ? (new Map(
//           Array.from(stakedByInput.entries()).map(([k, v]) => [String(k), v])
//         ) as any)
//       : undefined,
//     byStakingPoolAddress: undefined,
//   };

//   const chainLinkPriceMapSrc =
//     total?.assetValues?.chainLinkPriceMap ??
//     total?.chainLinkPriceMap ??
//     b?.chainLinkPriceMap;

//   const chainLinkPriceMap =
//     castMapToStringKey<BigDecimal>(chainLinkPriceMapSrc);

//   const assetsLike: AssetsLike = {
//     assetValues: {
//       chainLinkPriceMap: chainLinkPriceMap as unknown as Map<
//         string,
//         { price: BigDecimal }
//       >,
//     },
//     balances: {
//       tokenBalances: {
//         balanceMap: castMapToStringKey<BigDecimal>(
//           b?.tokenBalances?.balanceMap
//         ),
//       },
//       singleVaultBalances: {
//         balanceMap: castMapToStringKey<BigDecimal>(
//           b?.singleVaultBalances?.balanceMap
//         ),
//       },
//       lpVaultBalances: {
//         balanceMap: castMapToStringKey<BigDecimal>(
//           b?.lpVaultBalances?.balanceMap
//         ),
//       },
//       // --- 여기도 StakedBalancesShape을 그대로 할당 ---
//       stakedBalances,
//     },
//     farmValues: {
//       priceMap: castMapToStringKey<BigDecimal | null>(farmPriceMap),
//     },
//   };

//   return assetsLike;
// }

// function WalletTokenItem(props: WalletTokenInfo & { onClick?: () => void }) {
//   return (
//     <button
//       type="button"
//       onClick={props.onClick}
//       className={cn(
//         "grid w-full grid-cols-[60%_40%] items-center gap-2 rounded-sm px-1 py-2",
//         "hover:bg-default-200 dark:hover:bg-default-100 transition-background cursor-pointer"
//       )}
//     >
//       <div className="flex items-center gap-2 min-w-0">
//         <div className="shrink-0 w-8 h-8 max-[375px]:w-6 max-[375px]:h-6">
//           {props.src && (
//             <Image
//               alt={props.name}
//               className="size-full rounded-full"
//               height={28}
//               src={props.src}
//               width={28}
//             />
//           )}
//         </div>
//         <span className="text-[14px] max-[375px]:text-[12px] font-bold leading-[15px] text-foreground text-left">
//           {props.name}
//         </span>
//       </div>
//       <div className="flex grow flex-col items-end gap-0.5 pr-2">
//         <span className="text-[14px] max-[375px]:text-[12px] font-semibold leading-[15px] text-foreground">
//           {props.amount}
//         </span>
//         <span className="text-[12px] max-[375px]:text-[11px] font-bold leading-[14px] text-default-700 dark:text-default-300">
//           $ {props.usdAmount}
//         </span>
//       </div>
//     </button>
//   );
// }

// export default function WalletTokens({ onClose }: { onClose?: () => void }) {
//   const chainId = useChainId();
//   const total = useContext(AssetsContext);
//   const router = useRouter();

//   const tokens = useMemo<WalletTokenInfo[]>(() => {
//     const assetsLike = toAssetsLike(total);
//     return (
//       (buildWalletTokens(
//         assetsLike,
//         {
//           tokens: tokensList as any,
//           lpVaults: lpVaultsList as any,
//           // singleVaults: singleVaultsList as any,
//         },
//         chainId
//       ) as WalletTokenInfo[]) ?? []
//     );
//   }, [total, chainId]);

//   const handleClick = useCallback(
//     (t: WalletTokenInfo) => {
//       try {
//         onClose?.();

//         requestAnimationFrame(() => {
//           setTimeout(() => {
//             const href =
//               t.type === "token"
//                 ? `/?from=${encodeURIComponent(
//                     findSymbolByAddress(t.address as string, chainId) as string
//                   )}`
//                 : t.type === "LP"
//                   ? `/farm?open=${t.address}&stakePanel=stake`
//                   : `/farm?open=${t.address}&stakePanel=unstake&unstakeAmount=max`;

//             const curr =
//               typeof window !== "undefined"
//                 ? new URL(window.location.href)
//                 : null;
//             const next = new URL(href, window.location.origin);

//             const isSamePath = !!curr && curr.pathname === next.pathname;

//             if (isSamePath && curr) {
//               // 같은 경로면 라우터 대신 URL만 교체 + 해당 페이지용 이벤트 발행
//               curr.search = next.search;
//               window.history.replaceState(
//                 window.history.state,
//                 "",
//                 curr.toString()
//               );

//               const evt =
//                 curr.pathname === "/farm"
//                   ? "farm:query-updated"
//                   : "swap:query-updated";
//               window.dispatchEvent(new CustomEvent(evt));
//             } else {
//               // 다른 경로면 라우터로 이동 (스크롤 금지)
//               router.push(href, { scroll: false });
//             }
//           }, 160);
//         });
//       } catch (e) {
//         console.error("WalletToken click failed:", e);
//       }
//     },
//     [router, chainId, onClose]
//   );

//   return (
//     <div
//       className={cn(
//         "flex w-full grow flex-col gap-1 px-4 pb-3",
//         "max-sm:pt-3 max-sm:px-6 max-sm:gap-3 max-[375px]:gap-1.5"
//       )}
//     >
//       {tokens.length === 0 ? (
//         <div className="flex grow flex-col items-center justify-center gap-4">
//           <Icons.WalletEmptyToken className="fill-light-mid-mint-2 dark:fill-dark-empty-state" />
//           <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
//             No tokens yet.
//           </span>
//         </div>
//       ) : (
//         <Fragment>
//           <h2 className="w-full text-right text-[14px] font-semibold mt-3 max-sm:mt-1 leading-[17px] text-primary pr-1">
//             {tokens.length} Tokens
//           </h2>
//           {tokens.map((token) => (
//             <WalletTokenItem
//               key={`${token.name}-${token.address ?? ""}`}
//               amount={token.amount}
//               name={token.name}
//               src={token.src}
//               usdAmount={token.usdAmount}
//               onClick={() => handleClick(token)}
//             />
//           ))}
//         </Fragment>
//       )}
//     </div>
//   );
// }
