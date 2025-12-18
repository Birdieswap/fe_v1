"use client";

import { useContext, useMemo } from "react";
import Link from "next/link";

import { Image as HeroImage, Skeleton } from "@heroui/react";

import Container from "@/app/(landing)/landing/Container";
import { AssetsContext } from "@/app/AssetsContextProvider";

import { Farm } from "@/types/FarmListTableRowProps";
import { FarmList } from "@/const/farmInfo";
import { BigDecimal } from "@/types/BigDecimal";
import suffixNumbers from "@/utils/suffixNumbers";
import { isBirdieLPFarm, IToken } from "@/const/contracts/types/tokenTypes";
import { useNetworkSelection } from "@/app/NetworkSelectionProvider";

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://app.birdieswap.com"
).replace(/\/$/, "");

function LoadingPulse({ w = "w-16" }: { w?: string }) {
  return (
    <span className="inline-flex items-center" aria-busy="true">
      <span
        className={`h-[14px] ${w} rounded-md bg-default-200 dark:bg-default-700 animate-pulse`}
      />
    </span>
  );
}

function CryptoTokenIcons({ profiles }: { profiles: IToken[] }) {
  return (
    <div className="flex -space-x-1 items-center shrink-0">
      {profiles.map((token) =>
        token.iconSrc ? (
          <HeroImage
            key={token.symbol}
            alt={token.symbol}
            className="size-9 rounded-full"
            classNames={{ wrapper: "" }}
            src={token.iconSrc}
          />
        ) : (
          <Skeleton key={token.symbol} className="size-9 rounded-full" />
        )
      )}
    </div>
  );
}

function getTokenProfiles(stakeToken: any): IToken[] {
  return isBirdieLPFarm(stakeToken)
    ? stakeToken.swap.input.map((v: any) => v.input)
    : [stakeToken.input];
}

function getDisplayName(stakeToken: any) {
  return isBirdieLPFarm(stakeToken)
    ? stakeToken.swap.input.map((t: any) => t.input.symbol).join(" - ")
    : stakeToken.input.symbol;
}

function formatApyPct(apyPct: BigDecimal | null | undefined) {
  if (!apyPct) return null;
  try {
    const txt = apyPct.roundToDecimals(2).toPrecisionString(true, true);
    return `${txt}%`;
  } catch {
    return null;
  }
}

function formatTvlUSD(tvl: BigDecimal | null | undefined) {
  if (!tvl) return null;
  try {
    return "$" + suffixNumbers(tvl.roundToDecimals(2), 0, 2, false, false);
  } catch {
    return null;
  }
}

/**
 * ✅ aprDataState.apr[i]에서 address로 찾아서 { index, item } 반환
 * - route.ts가 realkimp.com/...json을 가져오므로, data.apr는 보통 "배열" 구조일 확률이 높음
 */
function findAprByAddress(aprDataState: any, address?: `0x${string}`) {
  if (!aprDataState || !address) return null;

  const list: any[] = Array.isArray(aprDataState?.apr)
    ? aprDataState.apr
    : Array.isArray(aprDataState?.aprs)
      ? aprDataState.aprs
      : Array.isArray(aprDataState?.data)
        ? aprDataState.data
        : Array.isArray(aprDataState)
          ? aprDataState
          : [];

  const target = address.toLowerCase();
  const idx = list.findIndex((x) => {
    const a = (x?.contractAddress ?? x?.apr?.contractAddress ?? "").toString();
    return a.toLowerCase() === target;
  });

  if (idx < 0) return null;

  // 보통 entry 자체가 {contractAddress, description, vaults...} 형태인데,
  // 간혹 {apr:{...}}로 들어오면 apr를 펼쳐서 쓰도록 처리
  const raw = list[idx];
  const item = raw?.apr ?? raw;

  return { index: idx, item };
}

type Row = {
  key: string;
  address: `0x${string}`;
  name: string;
  desc: string; // ✅ apr[i].description
  aprIndex: number | null; // ✅ i(배열 인덱스)
  profiles: IToken[];
  apyPct: BigDecimal | null;
  tvl: BigDecimal | null;
  href: string;

  apyIsLoading: boolean;
  tvlIsLoading: boolean;
};

export default function StartInOneClickSection({ items }: { items?: Farm[] }) {
  const { selectedChainId: chainId } = useNetworkSelection();
  const total = useContext(AssetsContext);

  const apyMap = total?.farmValues?.apyMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;

  const tvlMap = total?.farmValues?.tvlMap as
    | Map<`0x${string}`, BigDecimal | null>
    | undefined;

  const aprDataState = total?.aprDataState;

  const rows = useMemo<Row[]>(() => {
    const source = (items ?? FarmList) as Farm[];

    return source
      .map((farm) => {
        const stakeToken = farm?.wip_stakeToken as any;
        const address = stakeToken?.addresses?.[chainId] as
          | `0x${string}`
          | undefined;

        if (!stakeToken || !address) return null;

        // ✅ APY/TVL는 AssetsContext map에서 조회 (key는 vault address)
        const apyRaw = apyMap?.get(address); // BigDecimal (0~1) or undefined
        const apyPct = apyRaw ? apyRaw.mul(100) : null;

        const tvlRaw = tvlMap?.get(address); // BigDecimal | null | undefined
        const tvl = tvlRaw ?? null;

        // ✅ desc는 aprDataState.apr[i].description
        const aprHit = findAprByAddress(aprDataState, address);
        const desc = (aprHit?.item?.description ?? "").toString();
        const aprIndex =
          typeof aprHit?.index === "number" ? aprHit.index : null;

        // ✅ 무한 로딩 방지:
        // - "값이 0"이어도 로딩 취급하지 말고
        // - map 자체가 아직 없거나, address 키가 아직 없을 때만 로딩
        const apyIsLoading = !apyMap || !apyMap.has(address);
        const tvlIsLoading = !tvlMap || !tvlMap.has(address);

        const name = getDisplayName(stakeToken);
        const profiles = getTokenProfiles(stakeToken);

        const href = `${appUrl}/farm?open=${address.toLowerCase()}`;

        return {
          key: address,
          address,
          name,
          desc,
          aprIndex,
          profiles,
          apyPct,
          tvl,
          href,
          apyIsLoading,
          tvlIsLoading,
        } as Row;
      })
      .filter(Boolean) as Row[];
  }, [items, chainId, apyMap, tvlMap, aprDataState]);

  console.log("[NS] startIN selectedChainId", chainId);

  return (
    <section className="w-full bg-background py-14 sm:py-20">
      <Container>
        <div className="text-center">
          <h2 className="text-[20px] font-semibold text-foreground sm:text-[28px]">
            Start Birdieswap in One Click
          </h2>
          <p className="mt-2 text-[14px] text-default-800 dark:text-default-700 sm:text-[16px]">
            Click Start button and join in as a liquidity provider with
            Birdieswap
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-default-400 bg-background dark:border-default-100 dark:bg-dark-popup-bg">
          {/* ================= Desktop (>=960) ================= */}
          <div className="hidden min-[960px]:block">
            <div
              className="
                grid grid-cols-[minmax(260px,1.6fr)_minmax(140px,1fr)_minmax(140px,1fr)_180px]
                items-center px-6 py-4
                border-b border-default-400 dark:border-default-100
                text-[12px] font-medium text-default-800 dark:text-default-700
              "
            >
              <div>Crypto</div>
              <div className="text-right">APY(%)</div>
              <div className="text-right">TVL($)</div>
              <div className="text-right" />
            </div>

            {rows.map((r) => (
              <div
                key={r.key}
                className="
                  grid grid-cols-[minmax(260px,1.6fr)_minmax(140px,1fr)_minmax(140px,1fr)_180px]
                  items-center px-6 py-5 min-h-[72px]
                  border-b border-default-300 last:border-b-0 dark:border-default-100
                "
              >
                {/* Crypto */}
                <div className="flex items-center gap-3 min-w-0">
                  <CryptoTokenIcons profiles={r.profiles} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">
                      {r.name}
                    </div>
                    <div className="truncate text-xs font-medium text-default-600 dark:text-default-300">
                      {/* ✅ aprDataState.apr[i].description */}
                      {r.desc ? r.desc : <LoadingPulse w="w-40" />}
                      {/* 필요하면 index도 디버그로 확인 가능:
                          <span className="ml-2 opacity-50">#{r.aprIndex}</span>
                      */}
                    </div>
                  </div>
                </div>

                {/* APY */}
                <div className="text-right font-semibold text-foreground">
                  {r.apyIsLoading ? (
                    <LoadingPulse w="w-14" />
                  ) : (
                    (formatApyPct(r.apyPct) ?? "—")
                  )}
                </div>

                {/* TVL */}
                <div className="text-right font-semibold text-foreground">
                  {r.tvlIsLoading ? (
                    <LoadingPulse w="w-16" />
                  ) : (
                    (formatTvlUSD(r.tvl) ?? "—")
                  )}
                </div>

                {/* Start */}
                <div className="flex justify-end">
                  <Link
                    href={r.href}
                    prefetch={false}
                    className="
                      inline-flex items-center justify-center rounded-full
                      px-6 py-2 text-[13px] font-medium
                      bg-light-primary text-white hover:bg-light-primary-hover
                      dark:bg-dark-green-key dark:text-foreground dark:hover:bg-dark-primary-hover
                    "
                  >
                    Start
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ================= Mobile (<960) ================= */}
          <div className="min-[960px]:hidden divide-y divide-default-300 dark:divide-default-100">
            {rows.map((r) => (
              <div key={r.key} className="px-4 py-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-3 min-w-0">
                    <CryptoTokenIcons profiles={r.profiles} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">
                        {r.name}
                      </div>
                      <div className="truncate text-xs font-medium text-default-600 dark:text-default-300">
                        {r.desc ? r.desc : <LoadingPulse w="w-36" />}
                      </div>
                    </div>
                  </div>

                  {/* Right: APY / TVL */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-default-600 dark:text-default-400">
                        7d APY(%)
                      </span>
                      <span className="text-[14px] font-semibold text-foreground">
                        {r.apyIsLoading ? (
                          <LoadingPulse w="w-12" />
                        ) : (
                          (formatApyPct(r.apyPct) ?? "0")
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-default-600 dark:text-default-400">
                        TVL($)
                      </span>
                      <span className="text-[14px] font-semibold text-foreground">
                        {r.tvlIsLoading ? (
                          <LoadingPulse w="w-14" />
                        ) : (
                          (formatTvlUSD(r.tvl) ?? "0")
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Start full width */}
                <Link
                  href={r.href}
                  prefetch={false}
                  className="
                    mt-4 inline-flex w-full items-center justify-center
                    rounded-full py-3 text-[14px] font-semibold
                    bg-light-primary text-white hover:bg-light-primary-hover
                    dark:bg-dark-green-key dark:text-foreground dark:hover:bg-dark-primary-hover
                  "
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
