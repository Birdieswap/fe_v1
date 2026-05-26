"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Image, Input, useDisclosure } from "@heroui/react";
import { useChainId } from "wagmi";
import { useSearchParams } from "next/navigation";

import tokens from "@/const/contracts/tokens/tokens";
import externalTokens from "@/const/contracts/tokens/externalTokens";
import type { ICurrency } from "@/const/contracts/types/tokenTypes";
import lpVaults from "@/const/contracts/tokens/lpVaults";
import Icons from "@/assets/icons/icons";
import { BigDecimal } from "@/types/BigDecimal";

import PayToleranceSection from "./PayToleranceSection";
import { getPayTolerancePercent } from "./PayToleranceSection";
import PayPoolSelector, { PoolLike } from "./PayPoolSelector";
import { ENTER_INPUT_TOKENS, PAY_INPUT_TOKENS } from "./payInputTokens";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { usePayContext } from "@/components/(main)/pay/PayProvider";
import SwapFormSelectTokenModal from "@/components/(main)/swap/SwapFormSelectTokenModal";
import { getAdaptiveAmountFontVars } from "@/utils/ui/getAdaptiveAmountFontVars";
import suffixNumbers from "@/utils/suffixNumbers";

export type PayMode = "PAY" | "ENTER";
type LpVault = (typeof lpVaults)[keyof typeof lpVaults];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// 지갑 미연결에서 chainId가 undefined일 수 있으면 프로젝트 기본 체인으로 바꿔주세요.
const DEFAULT_CHAIN_ID = 8453;

function fmtBd(v?: BigDecimal, decimals = 6) {
  if (!v) return "0";
  if (v.isZero()) return "0";
  return v.roundToDecimals(decimals).toPrecisionString(true, true);
}

function fmtUsd(v?: BigDecimal) {
  if (!v) return "0";
  if (v.isZero()) return "$0.00";
  return "$" + v.roundToDecimals(2).toPrecisionString(true, true);
}

function fmtUsdCompact(v?: BigDecimal) {
  if (!v) return "$0.00";
  if (v.isZero()) return "$0.00";
  return `$${suffixNumbers(v, 100_000, 2, true, true)}`;
}

function safeLower(s?: string) {
  return typeof s === "string" ? s.toLowerCase() : "";
}

function getByLowerKey<T>(map: Map<string, T> | undefined, keyLower: string) {
  if (!map) return undefined;
  const matchedKey = [...map.keys()].find(
    (k) => String(k).toLowerCase() === keyLower,
  );
  return matchedKey ? map.get(matchedKey) : undefined;
}

// ---- dedupe: address(1차) + symbol(2차) ----
function mergePool(prev: PoolLike, next: PoolLike) {
  // 정보가 더 많이 채워져있는 쪽 우선
  const score = (p: PoolLike) =>
    (p.apy7d ? 4 : 0) + (p.stakedBalance ? 2 : 0) + (p.usdValue ? 1 : 0);

  const keep = score(next) > score(prev) ? next : prev;
  const other = keep === prev ? next : prev;

  return {
    ...keep,
    address: safeLower(keep.address),
    stakedBalance: keep.stakedBalance ?? other.stakedBalance,
    usdValue: keep.usdValue ?? other.usdValue,
    apy7d: keep.apy7d ?? other.apy7d,
  };
}

function dedupePools(list: PoolLike[]) {
  // 1) address 기준
  const byAddr = new Map<string, PoolLike>();
  for (const p of list) {
    const addr = safeLower(p.address);
    const prev = byAddr.get(addr);
    if (!prev) byAddr.set(addr, { ...p, address: addr });
    else byAddr.set(addr, mergePool(prev, { ...p, address: addr }));
  }

  // 2) symbol 기준 (요구사항: symbol 같은 풀은 하나만 표시)
  const bySym = new Map<string, PoolLike>();
  for (const p of byAddr.values()) {
    const symKey = (p.symbol ?? "").trim().toUpperCase();
    const key = symKey || `__ADDR__:${p.address}`;

    const prev = bySym.get(key);
    if (!prev) bySym.set(key, p);
    else bySym.set(key, mergePool(prev, p));
  }

  return [...bySym.values()];
}

export default function PayAmountInput({ mode }: { mode: PayMode }) {
  const pay = usePayContext();
  const wagmiChainId = useChainId();
  const assets = useContext(AssetsContext);
  const searchParams = useSearchParams();
  const tokenDisclosure = useDisclosure();
  const [isSmall, setIsSmall] = useState(false);

  const chainId = wagmiChainId ?? DEFAULT_CHAIN_ID;

  useEffect(() => {
    const checkWidth = () => setIsSmall(window.innerWidth < 440);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const amount = mode === "PAY" ? pay.payAmount : pay.enterAmount;
  const setAmount = mode === "PAY" ? pay.setPayAmount : pay.setEnterAmount;

  const token =
    mode === "PAY"
      ? pay.payToken
      : pay.nativeSymbol === "ETH"
        ? externalTokens.ETH
        : pay.nativeSymbol === "EURC"
          ? tokens.EURC
          : pay.nativeSymbol === "CBBTC"
            ? externalTokens.CBBTC
            : tokens.USDC;

  const showLock =
    mode === "ENTER" && pay.nativeSymbol !== "ETH" && !!pay.showApproveUI;

  const selectableTokens =
    mode === "ENTER" ? ENTER_INPUT_TOKENS : PAY_INPUT_TOKENS;

  const vaultList = useMemo(() => Object.values(lpVaults) as LpVault[], []);

  // ===== ENTER: balance & USD conversion =====
  const enterTokenAddressLower = useMemo(() => {
    if (mode !== "ENTER") return null;
    if (pay.nativeSymbol === "ETH") return ZERO_ADDRESS;
    const addr = token.addresses?.[chainId] as string | undefined;
    return addr ? addr.toLowerCase() : null;
  }, [mode, pay.nativeSymbol, token.addresses, chainId]);

  const enterWalletBalanceBd = useMemo(() => {
    if (mode !== "ENTER") return null;
    const balMap = (assets as any)?.balances?.tokenBalances?.balanceMap as
      | Map<string, BigDecimal>
      | undefined;

    if (!balMap || !enterTokenAddressLower) return null;

    const matchedKey = [...balMap.keys()].find(
      (k) => k?.toLowerCase?.() === enterTokenAddressLower,
    );
    return matchedKey ? (balMap.get(matchedKey) ?? null) : null;
  }, [assets, enterTokenAddressLower, mode]);

  const enterTokenPriceUsd = useMemo(() => {
    if (mode !== "ENTER") return null;

    const clMap = (assets as any)?.assetValues?.chainLinkPriceMap as
      | Map<string, any>
      | undefined;

    if (!clMap) return null;

    const wantedKey = `LINK:${token.symbol}_USD`.toUpperCase();
    const matchedKey = [...clMap.keys()].find(
      (k) => String(k).toUpperCase() === wantedKey,
    );
    if (!matchedKey) return null;

    const v = clMap.get(matchedKey);
    const priceBd = v?.price as BigDecimal | undefined;
    return priceBd ?? null;
  }, [assets, mode, token.symbol]);

  const enterAmountUsd = useMemo(() => {
    if (mode !== "ENTER") return null;
    if (!enterTokenPriceUsd) return null;
    if (!amount || !amount.trim()) return new BigDecimal("0", 2);

    const amtBd = new BigDecimal(amount, token.decimals ?? 18);
    return amtBd.multiply(enterTokenPriceUsd);
  }, [mode, amount, token.decimals, enterTokenPriceUsd]);

  const payTokenPriceUsd = useMemo(() => {
    if (mode !== "PAY") return null;

    const clMap = (assets as any)?.assetValues?.chainLinkPriceMap as
      | Map<string, any>
      | undefined;
    if (!clMap) return null;

    const wantedKey = `LINK:${token.symbol}_USD`.toUpperCase();
    const matchedKey = [...clMap.keys()].find(
      (k) => String(k).toUpperCase() === wantedKey,
    );
    if (!matchedKey) return null;

    const v = clMap.get(matchedKey);
    const priceBd = v?.price as BigDecimal | undefined;
    return priceBd ?? null;
  }, [assets, mode, token.symbol]);

  const payAmountUsd = useMemo(() => {
    if (mode !== "PAY") return null;
    if (!payTokenPriceUsd) return null;
    if (!amount || !amount.trim()) return new BigDecimal("0", 2);

    const amtBd = new BigDecimal(amount, token.decimals ?? 6);
    return amtBd.multiply(payTokenPriceUsd);
  }, [mode, amount, token.decimals, payTokenPriceUsd]);

  // ===== pools =====
  const pools: PoolLike[] = useMemo(() => {
    const stakedMap = (assets as any)?.balances?.stakedBalances
      ?.byInputTokenAddress as
      | Map<string, { token?: any; value: BigDecimal }>
      | undefined;

    const priceMap = (assets as any)?.farmValues?.priceMap as
      | Map<string, BigDecimal>
      | undefined;

    const apyMap =
      ((assets as any)?.farmValues?.apyMap as
        | Map<string, BigDecimal>
        | undefined) ?? undefined;

    if (mode === "ENTER") {
      // ✅ ENTER: 지갑 없이도 lpVaults 기반으로 리스트 생성
      const raw = vaultList
        .map((v) => {
          const addr = v.addresses?.[chainId as keyof typeof v.addresses] as
            | string
            | undefined;
          if (!addr) return null;

          const addrLower = addr.toLowerCase();

          const pool: PoolLike = {
            address: addrLower,
            symbol: v.symbol ?? "Unknown",
            fullName: v.fullName ?? "Unknown",
            iconSrc: "/tokens/sblp-token.svg",
          };

          const apy = getByLowerKey(apyMap, addrLower);
          if (apy) pool.apy7d = apy;

          return pool;
        })
        .filter((x): x is PoolLike => !!x);

      return dedupePools(raw);
    }

    // ✅ PAY: 지갑 기반(stakedMap) 유지
    if (!stakedMap) return [];

    const raw = Array.from(stakedMap.entries())
      .map(([address, { token: stakedToken, value }]) => {
        const addrLower = address.toLowerCase();

        const vault = vaultList.find((v) => {
          const vaultAddr = v.addresses[chainId as keyof typeof v.addresses];
          return vaultAddr && vaultAddr.toLowerCase() === addrLower;
        });

        const symbol = vault?.symbol ?? stakedToken?.symbol ?? "Unknown";
        const fullName = vault?.fullName ?? stakedToken?.fullName ?? symbol;

        const pool: PoolLike = {
          address: addrLower,
          symbol,
          fullName,
          iconSrc: "/tokens/sblp-token.svg",
        };

        if (value) {
          pool.stakedBalance = value;

          const price = getByLowerKey(priceMap, addrLower);
          if (price) pool.usdValue = value.multiply(price);
        }

        return pool;
      })
      .filter((p) => p.stakedBalance && !p.stakedBalance.isZero());

    return dedupePools(raw);
  }, [assets, chainId, mode, vaultList]);

  // ✅ ENTER 딥링크: pool=...
  const poolParamLower = useMemo(() => {
    if (mode !== "ENTER") return "";
    return safeLower(searchParams.get("pool") ?? "");
  }, [mode, searchParams]);

  // -----------------------------
  // ✅ 딥링크 pool 값은 "최초 1회만" 적용
  // ✅ 유저가 한번이라도 풀을 직접 선택하면 이후 URL pool로 덮어쓰기 금지
  // -----------------------------
  const appliedPoolFromUrlRef = useRef<string | null>(null);
  const userPickedPoolRef = useRef(false);

  const handleSelectPool = useCallback(
    (pool: PoolLike) => {
      // 사용자가 직접 선택하면 이후 URL pool로 덮어쓰기 방지
      userPickedPoolRef.current = true;
      appliedPoolFromUrlRef.current = safeLower(pool.address);
      const prevPoolAddr = safeLower(pay.selectedPool?.address);
      const nextPoolAddr = safeLower(pool.address);
      pay.setSelectedPool(pool);
      if (mode === "PAY" && !!prevPoolAddr && prevPoolAddr !== nextPoolAddr) {
        pay.setPayAmount("");
      }
    },
    [pay, mode],
  );

  useEffect(() => {
    if (mode !== "ENTER") return;
    if (!poolParamLower) return;

    // 사용자가 이미 직접 선택했으면 URL 값을 다시 적용하지 않음
    if (userPickedPoolRef.current) return;

    // 같은 URL pool은 최초 1회만 적용
    if (appliedPoolFromUrlRef.current === poolParamLower) return;

    // URL address가 목록에 없을 수도 있으니(중복 제거 등) 한번 resolve
    let wanted = pools.find((p) => safeLower(p.address) === poolParamLower);

    if (!wanted) {
      // address로 vault 찾고 symbol로 매칭 (주소가 dedupe로 빠진 케이스)
      const vault = vaultList.find((v) => {
        const a = v.addresses?.[chainId as keyof typeof v.addresses] as
          | string
          | undefined;
        return a && a.toLowerCase() === poolParamLower;
      });

      const sym = (vault?.symbol ?? "").trim().toUpperCase();
      if (sym) {
        wanted = pools.find(
          (p) => (p.symbol ?? "").trim().toUpperCase() === sym,
        );
      }
    }

    if (!wanted) return;

    appliedPoolFromUrlRef.current = poolParamLower;
    pay.setSelectedPool(wanted);
  }, [mode, poolParamLower, pools, pay, chainId, vaultList]);

  const handleAmountChange = (v: string) => {
    if (v === "") {
      setAmount(v);
      return;
    }
    if (!/^\d*\.?\d*$/.test(v)) return;

    const [integerPart = "", decimalPart = ""] = v.split(".");
    if (integerPart.length > 18) return;
    if (decimalPart.length > (token.decimals ?? 18)) return;

    if (v.startsWith(".")) {
      setAmount(`0${v}`);
      return;
    }

    setAmount(v);
  };

  const handleSelectToken = useCallback(
    (nextToken: ICurrency) => {
      if (mode === "ENTER") {
        setAmount("");
        if (nextToken.symbol === "ETH") pay.setNativeSymbol("ETH");
        if (nextToken.symbol === "USDC") pay.setNativeSymbol("USDC");
        if (nextToken.symbol === "EURC") pay.setNativeSymbol("EURC");
        if (nextToken.symbol === "cbBTC") pay.setNativeSymbol("CBBTC");
        return;
      }
      if (mode === "PAY") {
        if (nextToken.symbol === "USDC") pay.setPaySymbol("USDC");
        if (nextToken.symbol === "EURC") pay.setPaySymbol("EURC");
        if (nextToken.symbol === "cbBTC") pay.setPaySymbol("CBBTC");
        pay.setPayAmount("");
      }
    },
    [mode, pay],
  );

  const handleSetMax = useCallback(() => {
    if (mode === "ENTER") {
      if (!enterWalletBalanceBd) return;
      setAmount(
        enterWalletBalanceBd
          .roundToDecimals(token.decimals ?? 18)
          .toPrecisionString(true, false),
      );
      return;
    }

    if (!pay.selectedPool?.usdValue) return;
    if (!payTokenPriceUsd || payTokenPriceUsd.isZero()) return;

    const tolPct = getPayTolerancePercent(pay.tolerance);
    const toleranceFactor = new BigDecimal(String(1 + tolPct / 100), 18);

    const tokenAmountFromPoolUsd =
      pay.selectedPool.usdValue.divide(payTokenPriceUsd);
    const tokenAmountWithTolerance =
      tokenAmountFromPoolUsd.divide(toleranceFactor);
    const oneToken = new BigDecimal("1", token.decimals ?? 6);
    const inputAmount = tokenAmountWithTolerance.subtract(oneToken);

    setAmount(
      (inputAmount.gt(new BigDecimal("0", token.decimals ?? 6))
        ? inputAmount
        : new BigDecimal("0", token.decimals ?? 6)
      )
        .roundToDecimals(token.decimals ?? 6)
        .toPrecisionString(true, false),
    );
  }, [
    mode,
    enterWalletBalanceBd,
    setAmount,
    pay.selectedPool,
    payTokenPriceUsd,
    pay.tolerance,
    token.decimals,
  ]);

  const isMaxDisabled =
    mode === "PAY" ? !pay.selectedPool?.usdValue : !enterWalletBalanceBd;

  return (
    <div className="mb-5 flex w-full flex-col gap-4 rounded-2xl bg-default-100 px-4 py-4 dark:bg-dark-swap-bg">
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-semibold tracking-wide text-default-600">
          {mode}
        </span>
        {mode === "PAY" && (
          <span className="text-[11px] text-default-500">
            (Exact amount the recipient receives)
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Input
          style={getAdaptiveAmountFontVars(amount)}
          type="number"
          step="any"
          min="0"
          variant="bordered"
          radius="none"
          className="flex-1 bg-transparent"
          classNames={{
            inputWrapper:
              "h-11 min-h-11 border-none bg-transparent px-0 py-0 shadow-none",
            input:
              "textfield [font-size:var(--amount-font-desktop-size)] max-[375px]:[font-size:var(--amount-font-mobile-size)] leading-[44px] font-semibold text-foreground placeholder:text-default-400 focus:outline-none",
          }}
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onValueChange={handleAmountChange}
          onKeyDown={(e) => {
            if (e.key === "-") e.preventDefault();
            if (e.key === "Enter") e.preventDefault();
          }}
          onWheel={(e) => e.currentTarget.blur()}
        />

        <div className="flex flex-col items-end gap-2">
          <Button
            className="flex h-10 w-fit max-w-fit shrink-0 flex-row gap-1 bg-background px-1 py-0.5 text-xl font-semibold text-foreground shadow-[0px_2px_rgba(0,0,0,0.25)] !data-[hover=true]:opacity-100 data-[hover=true]:bg-default-200 dark:data-[hover=true]:bg-default-100"
            radius="full"
            size="lg"
            onPress={tokenDisclosure.onOpen}
          >
            {showLock && (
              <Icons.Lock
                className="fill-default-800 dark:fill-default-300 max-[376px]:h-4 max-[376px]:w-4"
                fillRule="evenodd"
              />
            )}
            {token.iconSrc && (
              <Image
                src={token.iconSrc}
                alt={token.symbol}
                width={32}
                height={32}
                classNames={{ img: "object-contain" }}
              />
            )}
            <span className="pl-1.5 text-xl max-[375px]:text-lg">
              {token.symbol}
            </span>
            <Icons.SwapTokenArrow />
          </Button>
        </div>
      </div>

      {mode === "ENTER" && (
        <div className="mt-[-6px] flex items-center justify-between text-[13px]">
          <div className="min-h-[18px] text-default-500">
            {fmtUsdCompact(enterAmountUsd ?? undefined)}
          </div>
          <div className="flex items-center gap-2">
            <div className="min-h-[18px] text-default-500">
              <span className="max-[439px]:hidden">Balance</span>
              <span className="hidden max-[439px]:inline">BAL</span>
              &nbsp;
              <span className="font-medium text-default-600">
                {isSmall
                  ? suffixNumbers(
                      enterWalletBalanceBd ?? new BigDecimal("0"),
                      999,
                      2,
                      true,
                      true,
                    )
                  : fmtBd(enterWalletBalanceBd ?? undefined, 2)}
              </span>
            </div>
            <Button
              className="h-[30px] min-w-fit rounded-xl border-1 border-default-600 bg-primary-200 text-sm font-sans font-semibold dark:border-dark-mid-mint dark:bg-dark-mid-mint dark:text-background"
              isDisabled={isMaxDisabled}
              size="sm"
              onPress={handleSetMax}
            >
              Max
            </Button>
          </div>
        </div>
      )}

      {mode === "PAY" && (
        <div className="mt-[-6px] flex items-center justify-between text-[13px]">
          <div className="min-h-[18px] text-default-500">
            {fmtUsdCompact(payAmountUsd ?? undefined)}
          </div>
          <Button
            className="h-[30px] min-w-fit rounded-xl border-1 border-default-600 bg-primary-200 text-sm font-sans font-semibold dark:border-dark-mid-mint dark:bg-dark-mid-mint dark:text-background"
            isDisabled={isMaxDisabled}
            size="sm"
            onPress={handleSetMax}
          >
            Max
          </Button>
        </div>
      )}

      <PayToleranceSection
        mode={mode}
        value={pay.tolerance}
        onChange={pay.setTolerance}
      />

      <PayPoolSelector
        mode={mode}
        pools={pools}
        selected={pay.selectedPool}
        onSelect={handleSelectPool} // ✅ 유저 선택 감지 래퍼
      />

      <SwapFormSelectTokenModal
        isOpen={tokenDisclosure.isOpen}
        selectedToken={token}
        setToken={handleSelectToken}
        tokens={selectableTokens}
        flatList={mode === "PAY"}
        showBalance={mode !== "PAY"}
        withBalanceTitle={mode === "PAY" ? "Pay Tokens" : "Your Tokens"}
        onClose={tokenDisclosure.onClose}
      />
    </div>
  );
}

// "use client";

// import { useContext, useMemo } from "react";
// import { Button, Image, Input } from "@heroui/react";
// import { useChainId } from "wagmi";

// import tokens from "@/const/contracts/tokens/tokens";
// import externalTokens from "@/const/contracts/tokens/externalTokens";
// import lpVaults from "@/const/contracts/tokens/lpVaults";
// import Icons from "@/assets/icons/icons";
// import { BigDecimal } from "@/types/BigDecimal";

// import PayToleranceSection from "./PayToleranceSection";
// import PayPoolSelector, { PoolLike } from "./PayPoolSelector";
// import { AssetsContext } from "@/app/AssetsContextProvider";
// import { usePayContext } from "@/components/(main)/pay/PayProvider";

// export type PayMode = "PAY" | "ENTER";
// type LpVault = (typeof lpVaults)[keyof typeof lpVaults];

// const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// function fmtBd(v?: BigDecimal, decimals = 6) {
//   if (!v) return "0";
//   if (v.isZero()) return "0";
//   return v.roundToDecimals(decimals).toPrecisionString(true, true);
// }

// function fmtUsd(v?: BigDecimal) {
//   if (!v) return "0";
//   if (v.isZero()) return "$0.00";
//   return "$" + v.roundToDecimals(2).toPrecisionString(true, true);
// }

// function safeLower(s?: string) {
//   return typeof s === "string" ? s.toLowerCase() : "";
// }

// export default function PayAmountInput({ mode }: { mode: PayMode }) {
//   const pay = usePayContext();
//   const chainId = useChainId();
//   const assets = useContext(AssetsContext);

//   const amount = mode === "PAY" ? pay.payAmount : pay.enterAmount;
//   const setAmount = mode === "PAY" ? pay.setPayAmount : pay.setEnterAmount;

//   const token =
//     mode === "PAY"
//       ? tokens.USDC
//       : pay.nativeSymbol === "ETH"
//         ? externalTokens.ETH
//         : externalTokens.WETH;

//   // ---- Approve UI 조건 (usePay에서 계산된 값 사용) ----
//   // showApproveUI: "WETH 선택 + pool 선택 + allowance 확인 끝 + needsApprove true" 같은 조건을 usePay에서 만들어 둔 값
//   const showLock =
//     mode === "ENTER" && pay.nativeSymbol === "WETH" && !!pay.showApproveUI;

//   // ===== ENTER: balance & USD conversion =====
//   const enterTokenAddressLower = useMemo(() => {
//     if (mode !== "ENTER") return null;
//     if (pay.nativeSymbol === "ETH") return ZERO_ADDRESS;
//     const addr = token.addresses?.[chainId] as string | undefined;
//     return addr ? addr.toLowerCase() : null;
//   }, [mode, pay.nativeSymbol, token.addresses, chainId]);

//   const enterWalletBalanceBd = useMemo(() => {
//     if (mode !== "ENTER") return null;
//     const balMap = (assets as any)?.balances?.tokenBalances?.balanceMap as
//       | Map<string, BigDecimal>
//       | undefined;

//     if (!balMap || !enterTokenAddressLower) return null;

//     const matchedKey = [...balMap.keys()].find(
//       (k) => k?.toLowerCase?.() === enterTokenAddressLower
//     );
//     return matchedKey ? (balMap.get(matchedKey) ?? null) : null;
//   }, [assets, enterTokenAddressLower, mode]);

//   const enterTokenPriceUsd = useMemo(() => {
//     if (mode !== "ENTER") return null;

//     const clMap = (assets as any)?.assetValues?.chainLinkPriceMap as
//       | Map<string, any>
//       | undefined;

//     if (!clMap) return null;

//     const wantedKey = `LINK:${token.symbol}_USD`.toUpperCase();
//     const matchedKey = [...clMap.keys()].find(
//       (k) => String(k).toUpperCase() === wantedKey
//     );
//     if (!matchedKey) return null;

//     const v = clMap.get(matchedKey);
//     const priceBd = v?.price as BigDecimal | undefined;
//     return priceBd ?? null;
//   }, [assets, mode, token.symbol]);

//   const enterAmountUsd = useMemo(() => {
//     if (mode !== "ENTER") return null;
//     if (!enterTokenPriceUsd) return null;
//     if (!amount || !amount.trim()) return new BigDecimal("0", 2);

//     const amtBd = new BigDecimal(amount, token.decimals ?? 18);
//     return amtBd.multiply(enterTokenPriceUsd);
//   }, [mode, amount, token.decimals, enterTokenPriceUsd]);

//   // ===== pools =====
//   const pools: PoolLike[] = useMemo(() => {
//     if (!assets || !chainId) return [];

//     const stakedMap = assets.balances?.stakedBalances?.byInputTokenAddress as
//       | Map<string, { token?: any; value: BigDecimal }>
//       | undefined;

//     if (!stakedMap) return [];

//     const priceMap = assets.farmValues?.priceMap as
//       | Map<string, BigDecimal>
//       | undefined;

//     const apyMap =
//       (assets.farmValues?.apyMap as Map<string, BigDecimal> | undefined) ??
//       undefined;

//     const vaultList = Object.values(lpVaults) as LpVault[];

//     return Array.from(stakedMap.entries())
//       .filter(([, { value }]) =>
//         mode === "PAY" ? value && !value.isZero() : true
//       )
//       .map(([address, { token, value }]) => {
//         const addrLower = address.toLowerCase();

//         const vault = vaultList.find((v) => {
//           const vaultAddr = v.addresses[chainId as keyof typeof v.addresses];
//           return vaultAddr && vaultAddr.toLowerCase() === addrLower;
//         });

//         const symbol = vault?.symbol ?? token?.symbol ?? "Unknown";
//         const fullName = vault?.fullName ?? token?.fullName ?? symbol;

//         const pool: PoolLike = {
//           address: addrLower,
//           symbol,
//           fullName,
//           iconSrc: "/tokens/sblp-token.svg",
//         };

//         if (value) {
//           pool.stakedBalance = value;

//           if (priceMap) {
//             const matchedKey = [...priceMap.keys()].find(
//               (k) => k.toLowerCase() === addrLower
//             );
//             const price = matchedKey ? priceMap.get(matchedKey) : undefined;
//             if (price) pool.usdValue = value.multiply(price);
//           }
//         }

//         if (apyMap) {
//           const matchedKey = [...apyMap.keys()].find(
//             (k) => k.toLowerCase() === addrLower
//           );
//           const apy = matchedKey ? apyMap.get(matchedKey) : undefined;
//           if (apy) pool.apy7d = apy;
//         }

//         return pool;
//       });
//   }, [assets, chainId, mode]);

//   const handleAmountChange = (v: string) => {
//     // 숫자/소수만 허용 (빈 문자열 허용)
//     if (v === "" || /^(\d+(\.\d*)?)?$/.test(v)) setAmount(v);
//   };

//   return (
//     <div className="mb-5 flex w-full flex-col gap-4 rounded-2xl bg-default-100 px-4 py-4 dark:bg-dark-swap-bg">
//       <div className="flex items-baseline gap-1">
//         <span className="text-xs font-semibold tracking-wide text-default-600">
//           {mode}
//         </span>
//         {mode === "PAY" && (
//           <span className="text-[11px] text-default-500">
//             (Exact amount the recipient receives)
//           </span>
//         )}
//       </div>

//       <div className="flex items-center justify-between gap-3">
//         <Input
//           // ✅ 브라우저 step validation 경고 방지
//           type="number"
//           step="any"
//           min="0"
//           variant="bordered"
//           radius="none"
//           className="flex-1 bg-transparent"
//           classNames={{
//             inputWrapper:
//               "h-auto min-h-0 border-none bg-transparent px-0 py-0 shadow-none",
//             input:
//               "textfield text-[40px] leading-[44px] font-semibold text-foreground placeholder:text-default-400 focus:outline-none",
//           }}
//           inputMode="decimal"
//           placeholder="0"
//           value={amount}
//           onValueChange={handleAmountChange}
//           onKeyDown={(e) => {
//             if (e.key === "-") e.preventDefault();
//             // Enter 입력 시 native validation/submit 트리거를 막고 싶으면:
//             if (e.key === "Enter") e.preventDefault();
//           }}
//           onWheel={(e) => e.currentTarget.blur()}
//         />

//         <div className="flex items-center gap-2">
//           {/* ✅ approve 필요할 때만 lock */}
//           {showLock && (
//             <Icons.Lock
//               className="fill-default-800 dark:fill-default-300 max-[376px]:h-4 max-[376px]:w-4"
//               fillRule="evenodd"
//             />
//           )}

//           {token.iconSrc && (
//             <Image
//               src={token.iconSrc}
//               alt={token.symbol}
//               width={32}
//               height={32}
//               classNames={{ img: "object-contain" }}
//             />
//           )}

//           <span className="text-base font-semibold text-default-900">
//             {token.symbol}
//           </span>

//           {mode === "ENTER" && (
//             <Button
//               isIconOnly
//               radius="full"
//               variant="light"
//               onPress={() =>
//                 pay.setNativeSymbol((p) => (p === "ETH" ? "WETH" : "ETH"))
//               }
//               aria-label="Switch ETH/WETH"
//               className="size-8 min-w-0 bg-transparent shadow-none"
//             >
//               <Icons.Change className="h-6 w-6" />
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* ENTER: USD + Balance */}
//       {mode === "ENTER" && (
//         <div className="mt-[-6px] flex items-center justify-between text-[13px]">
//           <div className="min-h-[18px] text-default-500">
//             {fmtUsd(enterAmountUsd ?? undefined)}
//           </div>
//           <div className="min-h-[18px] text-default-500">
//             Balance&nbsp;
//             <span className="font-medium text-default-600">
//               {fmtBd(enterWalletBalanceBd ?? undefined, 8)}
//             </span>
//           </div>
//         </div>
//       )}

//       <PayToleranceSection
//         mode={mode}
//         value={pay.tolerance}
//         onChange={pay.setTolerance}
//       />

//       <PayPoolSelector
//         mode={mode}
//         pools={pools}
//         selected={pay.selectedPool}
//         onSelect={pay.setSelectedPool}
//       />
//     </div>
//   );
// }
