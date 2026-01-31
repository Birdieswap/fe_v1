"use client";

import { Image, Skeleton } from "@heroui/react";
import {
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useChainId } from "wagmi";

import { Farm, FarmTag } from "@/types/FarmListTableRowProps";
import { FarmList } from "@/const/farmInfo";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { BigDecimal } from "@/types/BigDecimal";
import { IToken } from "@/const/contracts/types/tokenTypes";

import FarmListTableRow from "./farming/FarmListTableRow";
import { FarmListTableHeader } from "./farming/FarmListTableHeader";
import { Filter } from "./page/FilterButtons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FarmStatus = {
  apy: BigDecimal;
  tvl: BigDecimal | null;
  MyBalance: BigDecimal | null;
  price: BigDecimal | null; // 표시용으로 Row에 직접 넘길 때 사용
  lpBalance?: BigDecimal | null;
  stakedBalance?: BigDecimal | null;
  totalBalance?: BigDecimal | null;
};

export function CryptoTokenIcons({ profiles }: { profiles: IToken[] }) {
  return (
    <div className="flex -space-x-1 items-center shrink-0">
      {profiles.map((token) =>
        token.iconSrc ? (
          <Image
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

export default function FarmListTable({
  items: itemsProp, // ✅ 전달된 items를 받음
  sortColumn,
  sortDirection,
  filter,
  searchTerm,
  overrideQuery,
}: {
  items?: Farm[];
  filter?: Filter | null;
  sortColumn: keyof Farm | null;
  sortDirection: "asc" | "desc" | null;
  searchTerm?: string;
  overrideQuery?: string;
}) {
  const chainId = useChainId();

  const total = useContext(AssetsContext);
  const balances = total?.balances;

  const [farmStatusMap, setFarmStatusMap] = useState<
    Record<`0x${string}`, FarmStatus>
  >({});
  const [showUnderlying, setShowUnderlying] = useState(false);

  // ✅ props.items가 들어오면 그걸 쓰고, 없으면 기존 FarmList를 fallback
  const sourceItems = useMemo(() => {
    return itemsProp ?? FarmList;
  }, [itemsProp]);

  // 각 맵들: 없으면 undefined
  const apyMap = total?.farmValues?.apyMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;

  const tvlMap = total?.farmValues?.tvlMap as
    | Map<`0x${string}`, BigDecimal | null>
    | undefined;

  const priceMap = total?.farmValues?.priceMap as
    | Map<`0x${string}`, BigDecimal | null>
    | undefined;
  const underlyingMap = total?.farmValues?.underlyingMap as
    | Map<
        `0x${string}`,
        {
          token0: {
            address: `0x${string}` | null;
            balance: BigDecimal | null;
          };
          token1:
            | {
                address: `0x${string}` | null;
                balance: BigDecimal | null;
              }
            | null;
        }
      >
    | undefined;
  const totalSupplyMap = total?.farmValues?.totalSupplyMap as
    | Map<`0x${string}`, BigDecimal | null>
    | undefined;

  const singleBalanceMap = balances?.singleVaultBalances?.balanceMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;

  const lpBalanceMap = balances?.lpVaultBalances?.balanceMap as
    | Map<`0x${string}`, BigDecimal>
    | undefined;

  const stakedByInput = balances?.stakedBalances?.byInputTokenAddress as
    | Map<`0x${string}`, { token: any; value: BigDecimal }>
    | undefined;

  const getFarmBalances = useCallback(
    (address: `0x${string}`) => {
      if (!address) return { lp: null, staked: null, total: null };

      const lp =
        lpBalanceMap?.get(address) ?? singleBalanceMap?.get(address) ?? null;

      const staked =
        stakedByInput?.get(address.toLowerCase() as any)?.value ?? null;

      const total = lp && staked ? lp.add(staked) : (lp ?? staked ?? null);

      return { lp, staked, total };
    },
    [singleBalanceMap, lpBalanceMap, stakedByInput]
  );

  /**
   * ✅ (중요 수정 1)
   * 기존에는 FarmList를 직접 순회했는데,
   * 이제는 sourceItems(= props.items ?? FarmList)를 순회합니다.
   */
  useEffect(() => {
    if (!apyMap || !tvlMap || !priceMap) return;

    setFarmStatusMap((prev) => {
      let next = prev;

      for (const farm of sourceItems) {
        const address = farm.wip_stakeToken.addresses?.[chainId] as
          | `0x${string}`
          | undefined;

        if (!address) continue;

        const apy = apyMap.get(address) ?? BigDecimal.ZERO();
        const tvl = tvlMap.get(address) ?? null;
        const price = priceMap.get(address) ?? null;

        const { lp, staked, total } = getFarmBalances(address);
        const MyBalance = total && price ? total.mul(price) : null;

        next = {
          ...next,
          [address]: {
            apy,
            tvl,
            price,
            MyBalance,
            lpBalance: lp,
            stakedBalance: staked,
            totalBalance: total,
          },
        };
      }

      return next;
    });
  }, [chainId, apyMap, tvlMap, priceMap, getFarmBalances, sourceItems]);

  /**
   * ✅ (중요 수정 2)
   * updatedFarmList도 FarmList.map이 아니라 sourceItems.map을 사용해야
   * props.items로 전달된 목록만 정확히 렌더링됩니다.
   */
  const updatedFarmList = useMemo(() => {
    return sourceItems.map((farm) => {
      const address = farm.wip_stakeToken.addresses?.[chainId] as
        | `0x${string}`
        | undefined;

      const stat = address ? farmStatusMap[address] : undefined;

      const toNum = (v: BigDecimal | null | undefined): number => {
        if (!v) return 0;
        try {
          return parseFloat(v.toString());
        } catch {
          return 0;
        }
      };

      return {
        ...farm,
        apy: toNum(stat?.apy), // number
        tvl: toNum(stat?.tvl), // number
        MyBalance: toNum(stat?.MyBalance), // number
        lpBalance: stat?.lpBalance,
        stakedBalance: stat?.stakedBalance,
        totalBalance: stat?.totalBalance,
      };
    });
  }, [chainId, farmStatusMap, sourceItems]);

  const qSearchTerm = (searchTerm ?? "").trim().toLowerCase();
  const qOverride = (overrideQuery ?? "").trim().toLowerCase();
  const q =
    filter === Filter.ALL && overrideQuery !== undefined
      ? qOverride
      : qSearchTerm;

  const searchedItems = useMemo(() => {
    if (!q) return updatedFarmList;

    return updatedFarmList.filter((item) => {
      if (item.name && String(item.name).toLowerCase().includes(q)) return true;

      if (
        Array.isArray(item.tags) &&
        item.tags.some((t) => String(t).toLowerCase().includes(q))
      )
        return true;

      const providerName = item.wip_stakeToken?.provider?.name;
      if (providerName && String(providerName).toLowerCase().includes(q))
        return true;

      return false;
    });
  }, [updatedFarmList, q, filter, overrideQuery, searchTerm]);

  const items = searchedItems;

  const sortedItems = useMemo(() => {
    const col = sortColumn;

    const filteredItems = items.filter((item) => {
      switch (filter || Filter.ALL) {
        case Filter.ALL:
          return true;
        case Filter.SINGLE:
          return item.tags?.includes(FarmTag.SINGLE);
        case Filter.LP:
          return item.tags?.includes(FarmTag.LP);
        case Filter.STABLE:
          return item.tags?.includes(FarmTag.STABLE);
        case Filter.MY_FARM: {
          const addr = item.wip_stakeToken.addresses?.[chainId] as
            | `0x${string}`
            | undefined;
          if (!addr) return false;
          const { total } = getFarmBalances(addr);
          return total ? BigDecimal.ZERO().lt(total) : false;
        }
        default:
          return false;
      }
    });

    if (col === null) return filteredItems;

    return filteredItems.sort((a, b) => {
      if (a[col] === b[col]) return 0;

      const valA =
        typeof a[col] === "object" &&
        a[col] != null &&
        typeof (a[col] as any).toString === "function"
          ? Number((a[col] as any).toString())
          : Number(a[col]);

      const valB =
        typeof b[col] === "object" &&
        b[col] != null &&
        typeof (b[col] as any).toString === "function"
          ? Number((b[col] as any).toString())
          : Number(b[col]);

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    sortColumn,
    items,
    filter,
    chainId,
    balances?.singleVaultBalances.balanceMap,
    balances?.lpVaultBalances.balanceMap,
    sortDirection,
    getFarmBalances,
  ]);

  // ★ next/navigation 훅들
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isHexAddress = useCallback(
    (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
    []
  );

  // 주소/이름 → fullName 변환 (updatedFarmList를 사용)
  const resolveFullName = useCallback(
    (key: string | null): string | null => {
      if (!key) return null;

      if (isHexAddress(key)) {
        const lower = key.toLowerCase();
        const found = updatedFarmList.find((f) => {
          const addr = f.wip_stakeToken.addresses?.[chainId] as
            | `0x${string}`
            | undefined;
          return addr?.toLowerCase() === lower;
        });
        return found?.wip_stakeToken.fullName ?? null;
      }

      try {
        return decodeURIComponent(key);
      } catch {
        return key;
      }
    },
    [chainId, updatedFarmList, isHexAddress]
  );

  const [activeFullName, setActiveFullName] = useState<string | null>(null);

  const ANIM = {
    exitMs: 360,
    enterMs: 500,
    gapMs: 75,
  };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animatingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const rowRefs = useRef(new Map<string, HTMLElement>());
  const registerRowRef = useCallback(
    (fullName: string) => (el: HTMLElement | null) => {
      if (el) rowRefs.current.set(fullName, el);
      else rowRefs.current.delete(fullName);
    },
    []
  );

  const stabilizeAround = useCallback(
    (fullName: string | null) => {
      if (!fullName) return;
      const el = rowRefs.current.get(fullName);
      if (!el) return;

      const preTop = el.getBoundingClientRect().top;

      const fix = () => {
        const postTop = el.getBoundingClientRect().top;
        const diff = postTop - preTop;
        if (Math.abs(diff) > 0.5) {
          window.scrollBy({ top: diff, left: 0 });
        }
      };

      requestAnimationFrame(fix);
      setTimeout(fix, ANIM.exitMs);
    },
    [ANIM.exitMs]
  );

  const getOpenFromLocation = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("open");
    return resolveFullName(raw);
  }, [resolveFullName]);

  const syncUrlOpen = useCallback(
    (address: `0x${string}` | null) => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const curr = url.searchParams.get("open");
        const next = address ? address.toLowerCase() : null;
        if ((curr ?? null) === next) return;

        if (next) url.searchParams.set("open", next);
        else {
          url.searchParams.delete("open");
          url.searchParams.delete("stakePanel");
        }

        window.history.replaceState(null, "", url.toString());
        window.dispatchEvent(new CustomEvent("farm:query-updated"));
        return;
      }

      const sp = new URLSearchParams(searchParams.toString());
      if (address) sp.set("open", address.toLowerCase());
      else {
        sp.delete("open");
        sp.delete("stakePanel");
      }
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleRowToggle = useCallback(
    (clickedFullName: string, clickedAddress: `0x${string}`) => {
      if (animatingRef.current) return;
      const current = activeFullName;

      if (current === clickedFullName) {
        animatingRef.current = true;
        clearTimer();
        stabilizeAround(current);
        setActiveFullName(null);
        timerRef.current = setTimeout(() => {
          syncUrlOpen(null);
          animatingRef.current = false;
        }, ANIM.exitMs + ANIM.gapMs);
        return;
      }

      if (current && current !== clickedFullName) {
        animatingRef.current = true;
        clearTimer();
        stabilizeAround(current);
        setActiveFullName(null);
        timerRef.current = setTimeout(() => {
          setActiveFullName(clickedFullName);
          timerRef.current = setTimeout(() => {
            syncUrlOpen(clickedAddress);
            animatingRef.current = false;
          }, ANIM.enterMs);
        }, ANIM.exitMs + ANIM.gapMs);
        return;
      }

      animatingRef.current = true;
      clearTimer();
      setActiveFullName(clickedFullName);
      timerRef.current = setTimeout(() => {
        syncUrlOpen(clickedAddress);
        animatingRef.current = false;
      }, ANIM.enterMs);
    },
    [
      activeFullName,
      syncUrlOpen,
      ANIM.enterMs,
      ANIM.exitMs,
      ANIM.gapMs,
      stabilizeAround,
    ]
  );

  const FUSE_MS = 1200;

  useEffect(() => {
    const run = () => {
      const desiredFull = getOpenFromLocation();
      const currentFull = activeFullName;

      if (desiredFull === currentFull) return;

      if (animatingRef.current) {
        setTimeout(() => {
          // noop
        }, ANIM.enterMs + 30);
        return;
      }

      if (!desiredFull && currentFull) {
        animatingRef.current = true;
        stabilizeAround(currentFull);
        setActiveFullName(null);
        timerRef.current = setTimeout(() => {
          animatingRef.current = false;
        }, ANIM.exitMs + ANIM.gapMs);
        setTimeout(() => {
          animatingRef.current = false;
        }, FUSE_MS);
        return;
      }

      if (desiredFull && !currentFull) {
        animatingRef.current = true;
        setActiveFullName(desiredFull);
        timerRef.current = setTimeout(() => {
          animatingRef.current = false;
        }, ANIM.enterMs);
        setTimeout(() => {
          animatingRef.current = false;
        }, FUSE_MS);
        return;
      }

      if (desiredFull && currentFull && desiredFull !== currentFull) {
        animatingRef.current = true;
        stabilizeAround(currentFull);
        setActiveFullName(null);
        timerRef.current = setTimeout(() => {
          setActiveFullName(desiredFull);
          timerRef.current = setTimeout(() => {
            animatingRef.current = false;
          }, ANIM.enterMs);
        }, ANIM.exitMs + ANIM.gapMs);
        setTimeout(() => {
          animatingRef.current = false;
        }, FUSE_MS);
        return;
      }
    };

    run();
    window.addEventListener("popstate", run);
    window.addEventListener("farm:query-updated", run as EventListener);
    return () => {
      window.removeEventListener("popstate", run);
      window.removeEventListener("farm:query-updated", run as EventListener);
    };
  }, [
    activeFullName,
    ANIM.enterMs,
    ANIM.exitMs,
    ANIM.gapMs,
    stabilizeAround,
    getOpenFromLocation,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      const prev = (history as any).scrollRestoration;
      (history as any).scrollRestoration = "manual";
      return () => {
        (history as any).scrollRestoration = prev;
      };
    }
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const GRID_COLS =
    "md:grid-cols-[minmax(200px,1.5fr)_minmax(150px,1.2fr)_minmax(150px,1.7fr)_minmax(230px,2fr)_120px]";

  return (
    <motion.div
      className={clsx(
        "w-full max-w-none grid origin-top items-center gap-x-2",
        GRID_COLS,
        "text-foreground max-md:grid-cols-[minmax(15%,min-content)_1fr_48px]"
      )}
      layout={false}
    >
      <FarmListTableHeader
        gridCols={GRID_COLS}
        showUnderlying={showUnderlying}
        onToggleUnderlying={() => setShowUnderlying((v) => !v)}
      />

      {sortedItems.map((item) => {
        const address = item.wip_stakeToken.addresses?.[chainId] as
          | `0x${string}`
          | undefined;
        if (!address) return null;

        const apy = apyMap?.get(address)?.mul(100) ?? BigDecimal.ZERO();
        const tvl = tvlMap?.get(address) ?? null;
        const price = priceMap?.get(address) ?? null;
        const underlying = underlyingMap?.get(address) ?? null;
        const totalSupply = totalSupplyMap?.get(address) ?? null;

        const { lp, staked, total } = getFarmBalances(address);

        return (
          <FarmListTableRow
            key={address}
            item={item}
            apy={apy}
            tvl={tvl}
            price={price}
            balance={total ?? undefined}
            lpBalance={lp ?? undefined}
            stakedBalance={staked ?? undefined}
            underlying={underlying ?? undefined}
            totalSupply={totalSupply ?? undefined}
            showUnderlying={showUnderlying}
            gridCols={GRID_COLS}
            activeFullName={activeFullName}
            onRowClick={(full, addr) => handleRowToggle(full, addr)}
            attachRef={registerRowRef}
            chainId={chainId}
          />
        );
      })}
    </motion.div>
  );
}
