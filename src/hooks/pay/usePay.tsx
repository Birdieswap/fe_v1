"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { erc20Abi, parseUnits, getAddress } from "viem";

import { AssetsContext } from "@/app/AssetsContextProvider";
import { WalletContext } from "@/app/WalletContextProvider";
import { TransactionContext } from "@/app/TransactionContextProvider";

import TransactionStatus from "@/types/TransactionStatus";
import { TransactionType } from "@/types/TransactionTypes";
import type { TransactionStatusProps } from "@/app/TransactionContextProvider";

import tokens from "@/const/contracts/tokens/tokens";
import lpVaults from "@/const/contracts/tokens/lpVaults";
import { BigDecimal } from "@/types/BigDecimal";
import { ADDRESS } from "@/const/contracts/contractAddresses";
import { getFromContracts } from "@/utils/farm/getAddressHelpers";
import { FarmList } from "@/const/farmInfo";
import {
  isBirdieLPFarm,
  isBirdieSingleFarm,
} from "@/const/contracts/types/tokenTypes";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { normalizeCoingeckoAddress } from "@/utils/prices/coingeckoUsd";

import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import type { PoolLike } from "@/components/(main)/pay/common/PayPoolSelector";

import { approveErc20ForEnter, enter, pay as payAction } from "./actions";

// Blocks UI
import {
  PaySummaryNode as PaySummaryBlock,
  PayResultNode as PayResultBlock,
  EnterSummaryNode as EnterSummaryBlock,
  EnterResultNode as EnterResultBlock,
} from "@/components/(main)/pay/common/PayTxInfoBlocks";

// -------- helpers --------
type PayMode = "PAY" | "ENTER";
type EnterTokenSymbol = "ETH" | "USDC" | "WETH";

const isEmptyAmount = (s?: string) => !s || !s.trim() || Number(s) <= 0;
const safeLower = (s?: string) =>
  typeof s === "string" ? s.toLowerCase() : "";

function toleranceToPercent(v: "auto" | number) {
  if (v === "auto") return 5;
  const n = Number(v);
  return Number.isFinite(n) ? n : 5;
}

function fmtBd(v?: BigDecimal, decimals = 6) {
  if (!v) return "-";
  if (v.isZero()) return "0";
  return v.roundToDecimals(decimals).toPrecisionString(true, true);
}
function fmtUsd(v?: BigDecimal) {
  if (!v) return "-";
  if (v.isZero()) return "$0.00";
  return "$" + v.roundToDecimals(2).toPrecisionString(true, true);
}

// vault decimals 찾기
function findVaultDecimalsByPoolAddress(
  chainId: number,
  poolAddrLower?: string,
) {
  if (!poolAddrLower) return 18;
  const vaultList = Object.values(lpVaults) as any[];
  const hit = vaultList.find((v) => {
    const addr = v?.addresses?.[chainId];
    return typeof addr === "string" && addr.toLowerCase() === poolAddrLower;
  });
  return (hit?.decimals as number | undefined) ?? 18;
}

function getByLowerKey<T>(map: Map<string, T> | undefined, keyLower: string) {
  if (!map) return undefined;
  if (map.has(keyLower)) return map.get(keyLower);
  const found = [...map.keys()].find((k) => k.toLowerCase() === keyLower);
  return found ? map.get(found) : undefined;
}

/** tokens.ts에서 address로 토큰 찾기 (ETH는 제외) */
function findTokenByAddress(chainId: number, address?: string) {
  if (!address) return undefined;
  const addr = address.toLowerCase();
  const list = Object.values(tokens) as any[];
  return list.find((t) => {
    const a = t?.addresses?.[chainId];
    return typeof a === "string" && a.toLowerCase() === addr;
  });
}

// assets에서 token balance(BigDecimal) 꺼내기
function getTokenBalanceFromAssets(
  assets: any,
  tokenAddr?: string,
): BigDecimal | null {
  const addr = safeLower(tokenAddr);
  if (!assets?.balances?.tokenBalances?.balanceMap || !addr) return null;

  const m: Map<string, BigDecimal> = assets.balances.tokenBalances.balanceMap;

  for (const [k, v] of m.entries()) {
    if (safeLower(k) === addr) return v ?? null;
  }
  return null;
}

// assets에서 staked balance(BigDecimal) 꺼내기
function getStakedBalanceFromAssetsByInputToken(
  assets: any,
  inputTokenAddr?: string,
): BigDecimal | null {
  const addr = safeLower(inputTokenAddr);
  const m: Map<string, any> | undefined =
    assets?.balances?.stakedBalances?.byInputTokenAddress;
  if (!m || !addr) return null;

  for (const [k, v] of m.entries()) {
    if (safeLower(k) === addr) return (v?.value as BigDecimal) ?? null;
  }
  return null;
}

/**
 * balances 변경 감지용 “스냅샷 키”
 * - watch 주소들의 balance를 문자열로 합쳐 비교
 */
function makeBalancesSnapshotKey(args: {
  assets: any;
  watchTokenAddrs?: string[];
  watchStakedInputTokenAddrs?: string[];
}): string {
  const {
    assets,
    watchTokenAddrs = [],
    watchStakedInputTokenAddrs = [],
  } = args;
  const parts: string[] = [];

  for (const a of watchTokenAddrs) {
    const bd = getTokenBalanceFromAssets(assets, a);
    parts.push(`t:${safeLower(a)}:${bd ? bd.toString() : "null"}`);
  }
  for (const a of watchStakedInputTokenAddrs) {
    const bd = getStakedBalanceFromAssetsByInputToken(assets, a);
    parts.push(`s:${safeLower(a)}:${bd ? bd.toString() : "null"}`);
  }
  return parts.sort().join("|");
}

/**
 * forceRefresh 후, assetsRef.current의 값이 실제로 바뀔 때까지 폴링
 */
async function waitForAssetsBalanceChange(params: {
  assetsRef: React.MutableRefObject<any>;
  prevKey: string;
  watchTokenAddrs?: string[];
  watchStakedInputTokenAddrs?: string[];
  timeoutMs?: number;
  intervalMs?: number;
}) {
  const {
    assetsRef,
    prevKey,
    watchTokenAddrs = [],
    watchStakedInputTokenAddrs = [],
    timeoutMs = 12000,
    intervalMs = 200,
  } = params;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const curAssets = assetsRef.current;
    const key = makeBalancesSnapshotKey({
      assets: curAssets,
      watchTokenAddrs,
      watchStakedInputTokenAddrs,
    });
    if (key !== prevKey) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * ✅ tx.setTransactionProps 타입 안전 패치
 * - enum 사용
 * - 해당 transactionType일 때만 confirmed info 덮어쓰기
 */
function patchTxConfirmedInfo(
  setTx: (
    updater: (
      prev: TransactionStatusProps | null,
    ) => TransactionStatusProps | null,
  ) => void,
  nextNode: React.ReactNode,
  typeGuard: TransactionType.PAY | TransactionType.ENTER,
) {
  setTx((prev) => {
    if (!prev) return prev;
    if (prev.transactionType !== typeGuard) return prev;

    return {
      ...prev,
      transactionStatus: TransactionStatus.SUCCESS,
      onConfirmedInfo: nextNode,
    };
  });
}

export default function usePay() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract } = useWriteContract();
  const client = undefined;

  const { address: userAddress, isConnected } = useAccount();
  const wallet = useContext(WalletContext);
  const assets = useContext(AssetsContext);
  const tx = useContext(TransactionContext);

  // ✅ 최신 assets 참조용 ref
  const assetsRef = useRef<any>(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  // -------- UI state --------
  const [selectedPanel, setSelectedPanel] = useState<PayMode>("PAY");

  const [receiver, setReceiver] = useState("");
  const [payAmount, setPayAmount] = useState(""); // USDC
  const [enterAmount, setEnterAmount] = useState("");
  const [tolerance, setTolerance] = useState<"auto" | number>("auto");
  const [selectedPool, setSelectedPool] = useState<PoolLike | undefined>();
  const [nativeSymbol, setNativeSymbol] = useState<EnterTokenSymbol>("ETH");

  // ✨ PAY 폼 리셋
  const resetPayPanel = useCallback(() => {
    setReceiver("");
    setPayAmount("");
    setTolerance("auto");
    setSelectedPool(undefined);
  }, []);

  // ✨ ENTER 폼 리셋
  const resetEnterPanel = useCallback(() => {
    setEnterAmount("");
    setNativeSymbol("ETH");
    setSelectedPool(undefined);
  }, []);

  const USDC = tokens.USDC;
  const ETH = tokens.ETH;
  const WETH = tokens.WETH;
  const enterToken =
    nativeSymbol === "ETH"
      ? ETH
      : nativeSymbol === "USDC"
        ? USDC
        : WETH;

  // -------- network --------
  const isWrongNetwork = useMemo(() => {
    return chainId !== 11155111 && chainId !== 8453 && chainId !== 42161;
  }, [chainId]);

  // -------- addresses --------
  const ROUTER_ADDRESS = useMemo(() => {
    if (!chainId) return null;
    return getFromContracts(ADDRESS.ROUTER, chainId);
  }, [chainId]);

  const WRAPPER_ADDRESS = useMemo(() => {
    if (!chainId) return null;
    return getFromContracts(ADDRESS.WRAPPER, chainId);
  }, [chainId]);

  // staking pool address resolve
  const stakingPoolAddress = useMemo(() => {
    const lpAddr = safeLower(selectedPool?.address);
    const list: any[] = (assets as any)?.aprDataState?.apr ?? [];
    const hit = list.find((v) => safeLower(v?.contractAddress) === lpAddr);
    const stakingAddr = hit?.staking?.contractAddress;
    return stakingAddr ? (stakingAddr as `0x${string}`) : null;
  }, [assets, selectedPool?.address]);

  // PAY derived
  const tolPct = useMemo(() => toleranceToPercent(tolerance), [tolerance]);

  const payAmountUsdBd = useMemo(() => {
    const dec = USDC.decimals ?? 6;
    return new BigDecimal(payAmount || "0", dec);
  }, [payAmount, USDC.decimals]);

  const payRequiredUsd = useMemo(() => {
    const factor = new BigDecimal(String(1 + tolPct / 100), 18);
    return payAmountUsdBd.multiply(factor);
  }, [payAmountUsdBd, tolPct]);

  const poolPriceUsdPerToken = useMemo(() => {
    const pm: any = (assets as any)?.farmValues?.priceMap;
    const addr = selectedPool?.address;
    if (!pm || !addr) return null;

    const keyLower = addr.toLowerCase();
    const checksumKey = (() => {
      try {
        return getAddress(addr as `0x${string}`);
      } catch {
        return null;
      }
    })();

    const entry =
      typeof pm.get === "function"
        ? ((checksumKey ? pm.get(checksumKey) : undefined) ??
          getByLowerKey(pm, keyLower))
        : (pm[addr] ?? pm[keyLower]);
    if (!entry) return null;

    // ✅ 1) 진짜 BigDecimal 인스턴스(또는 BigDecimal-like)면 그대로 반환
    //    (instanceof 대신 메서드 존재 여부로 판별)
    if (
      typeof entry.divide === "function" &&
      typeof entry.multiply === "function"
    ) {
      return entry as BigDecimal;
    }

    // ✅ 2) 지금 로그처럼 { value, decimals } 형태면 BigDecimal로 재구성
    if (
      typeof entry === "object" &&
      entry &&
      "value" in entry &&
      "decimals" in entry
    ) {
      try {
        return new BigDecimal((entry as any).value, (entry as any).decimals);
      } catch {
        return null;
      }
    }

    // ✅ 3) 혹시 그냥 string/number로 들어오면 (보정)
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "bigint"
    ) {
      return new BigDecimal(String(entry), 18);
    }

    return null;
  }, [
    // assets 전체를 의존성으로 두면 in-place mutate 때문에 갱신이 안 잡힐 수 있어요.
    (assets as any)?.farmValues?.priceMap,
    selectedPool?.address,
  ]);

  const stakingSharesBd = useMemo(() => {
    if (!poolPriceUsdPerToken) return null;
    if (payAmountUsdBd.isZero()) return null;

    // 1) base shares = payAmount / price
    const baseShares = payAmountUsdBd.divide(poolPriceUsdPerToken);

    // 2) apply tolerance on shares (avoid compounding rounding issues)
    const factor = new BigDecimal(String(1 + tolPct / 100), 18);
    return baseShares.multiply(factor);
  }, [payAmountUsdBd, poolPriceUsdPerToken, tolPct]);

  const isPayInsufficientPoolBalance = useMemo(() => {
    if (!selectedPool?.stakedBalance) return false;
    if (!stakingSharesBd) return false;
    return stakingSharesBd.gt(selectedPool.stakedBalance);
  }, [stakingSharesBd, selectedPool?.stakedBalance]);

  // -------- ENTER: 체인링크 가격 기반 계산 --------

  // 1) 입력 토큰의 USD 가격 (BigDecimal)
  const enterTokenUsdPriceBd = useMemo(() => {
    const map: Map<string, any> | undefined = (assets as any)?.assetValues
      ?.chainLinkPriceMap;
    if (!map) return null;

    const symbol = enterToken.symbol.toUpperCase();
    const keys = [`LINK:${symbol}_USD`];
    if (symbol === "ETH") keys.push("LINK:WETH_USD");
    if (symbol === "WETH") keys.push("LINK:ETH_USD");

    for (const key of keys) {
      const entry = map.get(key);
      const price = entry?.price as BigDecimal | undefined;
      if (price) return price;
    }

    const cgMap = (assets as any)?.assetValues?.coingeckoPriceMap as
      | Map<string, BigDecimal | null>
      | undefined;
    const cgSymbolMap = (assets as any)?.assetValues
      ?.coingeckoSymbolPriceMap as Map<string, BigDecimal | null> | undefined;
    if (cgMap && chainId) {
      const normalized = normalizeCoingeckoAddress(
        (enterToken.addresses?.[chainId] as `0x${string}` | undefined) ?? null,
        chainId,
      );
      if (normalized) {
        const cgPrice = cgMap.get(normalized) ?? null;
        if (cgPrice && !cgPrice.isZero()) return cgPrice;
      }
    }
    if (cgSymbolMap) {
      const primary = enterToken.symbol.toLowerCase();
      const fallback =
        primary === "eth" ? "weth" : primary === "weth" ? "eth" : "";
      const price = cgSymbolMap.get(primary) ?? cgSymbolMap.get(fallback) ?? null;
      if (price && !price.isZero()) return price;
    }
    return null;
  }, [assets, chainId, enterToken]);

  useEffect(() => {
    if (!chainId) return;
    if (!selectedPool?.address) return;
    const refetchCg = (assets as any)?.assetValues?.refetchCoingeckoPrices as
      | ((addresses: Array<string | null | undefined>) => Promise<void>)
      | undefined;
    if (!refetchCg) return;
    const chainlinkData = (assets as any)?.assetValues?.chainLinkData;
    if (!chainlinkData?.data) return;
    if (chainlinkData?.isFetching) return;

    const poolAddr = selectedPool.address.toLowerCase();
    const farmEntry = FarmList.find((entry) => {
      const stakeToken = entry?.wip_stakeToken as any;
      const addr = getTokenAddress({ token: stakeToken, chainId });
      return addr && addr.toLowerCase() === poolAddr;
    });
    if (!farmEntry) return;

    const stakeToken = farmEntry.wip_stakeToken as any;
    const addrs: Array<string | null | undefined> = [];
    const symbols: Array<string | null | undefined> = [];
    const clMap = (assets as any)?.assetValues?.chainLinkPriceMap as
      | Map<string, any>
      | undefined;
    const cgMap = (assets as any)?.assetValues?.coingeckoPriceMap as
      | Map<string, BigDecimal | null>
      | undefined;
    const cgSymbolMap = (assets as any)?.assetValues
      ?.coingeckoSymbolPriceMap as Map<string, BigDecimal | null> | undefined;
    const hasChainlinkPrice = (symbol?: string) => {
      if (!symbol || !clMap) return false;
      const direct = clMap.get(`LINK:${symbol}_USD`)?.price as
        | BigDecimal
        | undefined;
      if (direct && !direct.isZero()) return true;
      if (symbol === "ETH") {
        const price = clMap.get("LINK:WETH_USD")?.price as
          | BigDecimal
          | undefined;
        return !!price && !price.isZero();
      }
      if (symbol === "WETH") {
        const price = clMap.get("LINK:ETH_USD")?.price as
          | BigDecimal
          | undefined;
        return !!price && !price.isZero();
      }
      return false;
    };

    if (isBirdieSingleFarm(stakeToken)) {
      const symbol = stakeToken.input?.symbol;
      if (!hasChainlinkPrice(symbol)) {
        const addr = getTokenAddress({ token: stakeToken.input, chainId });
        const normalized = normalizeCoingeckoAddress(addr ?? null, chainId);
        if (addr && normalized && !cgMap?.has(normalized)) addrs.push(addr);
        const symbolKey = String(symbol ?? "")
          .trim()
          .toLowerCase();
        if (symbolKey && !cgSymbolMap?.has(symbolKey)) symbols.push(symbolKey);
      }
    } else if (isBirdieLPFarm(stakeToken)) {
      const t0 = stakeToken.swap?.input?.[0]?.input;
      const t1 = stakeToken.swap?.input?.[1]?.input;
      if (!hasChainlinkPrice(t0?.symbol)) {
        const addr = getTokenAddress({ token: t0 as any, chainId });
        const normalized = normalizeCoingeckoAddress(addr ?? null, chainId);
        if (addr && normalized && !cgMap?.has(normalized)) addrs.push(addr);
        const symbolKey = String(t0?.symbol ?? "")
          .trim()
          .toLowerCase();
        if (symbolKey && !cgSymbolMap?.has(symbolKey)) symbols.push(symbolKey);
      }
      if (!hasChainlinkPrice(t1?.symbol)) {
        const addr = getTokenAddress({ token: t1 as any, chainId });
        const normalized = normalizeCoingeckoAddress(addr ?? null, chainId);
        if (addr && normalized && !cgMap?.has(normalized)) addrs.push(addr);
        const symbolKey = String(t1?.symbol ?? "")
          .trim()
          .toLowerCase();
        if (symbolKey && !cgSymbolMap?.has(symbolKey)) symbols.push(symbolKey);
      }
    }

    if (addrs.length > 0) refetchCg(addrs);
    const refetchSymbol = (assets as any)?.assetValues
      ?.refetchCoingeckoSymbolPrices as
      | ((symbols: Array<string | null | undefined>) => Promise<void>)
      | undefined;
    if (symbols.length > 0 && refetchSymbol) refetchSymbol(symbols);
  }, [assets, chainId, selectedPool?.address]);

  // 2) 입력한 토큰의 USD 가치
  const enterAmountUsdBd = useMemo(() => {
    if (isEmptyAmount(enterAmount)) return null;
    if (!enterTokenUsdPriceBd) return null;

    const dec = enterToken.decimals ?? 18;
    const amtToken = new BigDecimal(enterAmount || "0", dec);
    return amtToken.multiply(enterTokenUsdPriceBd);
  }, [enterAmount, enterToken.decimals, enterTokenUsdPriceBd]);

  // 3) 이론상 발행 BLP 수량 = (입력 USD) / (pool token USD 가격)
  const enterIdealStakeAmountBd = useMemo(() => {
    if (!enterAmountUsdBd) return null;
    if (!poolPriceUsdPerToken) return null;
    if (enterAmountUsdBd.isZero()) return null;

    return enterAmountUsdBd.divide(poolPriceUsdPerToken);
  }, [enterAmountUsdBd, poolPriceUsdPerToken]);

  // 4) tolerance 적용: minBLPMintAmount = ideal * (1 - tolPct/100)
  const enterMinStakeAmountBd = useMemo(() => {
    if (!enterIdealStakeAmountBd) return null;

    // 예: tolPct = 5 → factor = 0.95
    const factor = new BigDecimal(String(1 - tolPct / 100), 18);
    return enterIdealStakeAmountBd.multiply(factor);
  }, [enterIdealStakeAmountBd, tolPct]);

  // console.log("[ENTER CALC]", {
  //   enterTokenUsdPriceBd,
  //   enterAmountUsdBd,
  //   poolPriceUsdPerToken,
  //   enterIdealStakeAmountBd,
  //   enterMinStakeAmountBd,
  // });

  // ENTER balances (wagmi useBalance)
  const enterTokenAddress = useMemo(() => {
    if (!chainId) return undefined;
    if (nativeSymbol === "ETH") return undefined;
    return (
      (enterToken.addresses?.[chainId] as `0x${string}` | undefined) ?? undefined
    );
  }, [chainId, nativeSymbol, enterToken.addresses]);

  const enterBalQuery = useBalance({
    address: userAddress,
    token: enterTokenAddress,
    chainId,
    query: { enabled: !!chainId && !!userAddress },
  });

  const enterWalletBalanceBd = useMemo(() => {
    const raw = enterBalQuery.data?.value;
    const decimals = enterBalQuery.data?.decimals ?? enterToken.decimals ?? 18;
    if (raw == null) return null;
    return new BigDecimal(raw, decimals);
  }, [
    enterBalQuery.data?.value,
    enterBalQuery.data?.decimals,
    enterToken.decimals,
  ]);

  const isEnterInsufficientBalance = useMemo(() => {
    if (isEmptyAmount(enterAmount)) return false;
    if (!enterWalletBalanceBd) return false;
    const amt = new BigDecimal(enterAmount, enterToken.decimals ?? 18);
    return amt.gt(enterWalletBalanceBd);
  }, [enterAmount, enterWalletBalanceBd, enterToken.decimals]);

  // ===== ERC20 allowance (ENTER, non-ETH, + pool selected + staking addr ready) =====
  const enterErc20Addr = useMemo(() => {
    if (!chainId) return undefined;
    if (nativeSymbol === "ETH") return undefined;
    return enterToken.addresses?.[chainId] as `0x${string}` | undefined;
  }, [chainId, nativeSymbol, enterToken.addresses]);

  // ✅ ENTER 패널 여부는 여기서 보지 말고, "ERC20 + 필요한 주소들 다 있음"만 체크
  const shouldCheckAllowance = useMemo(() => {
    return (
      nativeSymbol !== "ETH" &&
      !!selectedPool &&
      !!stakingPoolAddress &&
      !!userAddress &&
      !!enterErc20Addr
    );
  }, [
    nativeSymbol,
    selectedPool,
    stakingPoolAddress,
    userAddress,
    enterErc20Addr,
  ]);

  const allowanceArgs = useMemo(() => {
    if (!userAddress || !stakingPoolAddress) return null;
    return [userAddress, stakingPoolAddress] as const;
  }, [userAddress, stakingPoolAddress]);

  const {
    data: allowanceWeth,
    isLoading: isAllowanceLoading,
    refetch: refetchAllowanceWeth,
  } = useReadContract({
    address: enterErc20Addr,
    abi: erc20Abi,
    functionName: "allowance",
    args: allowanceArgs ?? undefined,
    query: { enabled: shouldCheckAllowance && !!allowanceArgs },
  });

  // ✅ allowanceWeth가 아직 없으면 "모름"으로 두고,
  //    showApproveUI에서 로딩 중 숨기기 여부는 선택 가능
  const needsWethApprove = useMemo(() => {
    if (nativeSymbol === "ETH") return false;
    if (!shouldCheckAllowance) return false;
    if (allowanceWeth == null) return false; // 아직 모름(=로딩/미수신)

    try {
      const decimals = enterToken.decimals ?? 18;
      const needed = parseUnits(enterAmount || "0", decimals);
      return allowanceWeth < needed;
    } catch {
      return true;
    }
  }, [
    nativeSymbol,
    shouldCheckAllowance,
    allowanceWeth,
    enterAmount,
    enterToken.decimals,
  ]);

  // ✅ UI에서 Approve 버튼 노출 여부
  const showApproveUI = useMemo(() => {
    if (!shouldCheckAllowance) return false;

    // 옵션 A) 지금처럼 "로딩 중에는 숨김" 유지
    if (isAllowanceLoading) return false;

    return needsWethApprove;
  }, [shouldCheckAllowance, isAllowanceLoading, needsWethApprove]);

  // ---- debug logs ----
  // useEffect(() => {
  //   if (selectedPanel !== "ENTER") return;
  //   console.log("[ALLOWANCE DEBUG]", {
  //     shouldCheckAllowance,
  //     nativeSymbol,
  //     selectedPool: !!selectedPool,
  //     stakingPoolAddress,
  //     wethAddr,
  //     userAddress,
  //     enterAmount,
  //     allowanceWeth: allowanceWeth?.toString?.() ?? allowanceWeth,
  //     isAllowanceLoading,
  //     needsWethApprove,
  //     showApproveUI,
  //   });
  // }, [
  //   selectedPanel,
  //   shouldCheckAllowance,
  //   nativeSymbol,
  //   selectedPool,
  //   stakingPoolAddress,
  //   wethAddr,
  //   userAddress,
  //   enterAmount,
  //   allowanceWeth,
  //   isAllowanceLoading,
  //   needsWethApprove,
  //   showApproveUI,
  // ]);

  // -------- Buttons --------
  const payButton = useMemo(() => {
    if (!isConnected)
      return {
        text: "Connect Wallet",
        disabled: false,
        variant: "MINT" as const,
      };
    if (isWrongNetwork)
      return {
        text: "Wrong Network",
        disabled: false,
        variant: "PINK" as const,
      };

    if (!receiver?.trim())
      return {
        text: "Enter a Wallet address",
        disabled: true,
        variant: "MINT" as const,
      };
    if (isEmptyAmount(payAmount))
      return {
        text: "Enter USDC amount",
        disabled: true,
        variant: "MINT" as const,
      };
    if (!selectedPool)
      return {
        text: "Select a Pool",
        disabled: true,
        variant: "MINT" as const,
      };
    if (isPayInsufficientPoolBalance)
      return {
        text: `Insufficient ${selectedPool.symbol} balance`,
        disabled: true,
        variant: "MINT" as const,
      };

    return { text: "Pay", disabled: false, variant: "MINT" as const };
  }, [
    isConnected,
    isWrongNetwork,
    receiver,
    payAmount,
    selectedPool,
    isPayInsufficientPoolBalance,
  ]);

  const enterButton = useMemo(() => {
    if (!isConnected)
      return {
        text: "Connect Wallet",
        disabled: false,
        variant: "MINT" as const,
      };
    if (isWrongNetwork)
      return {
        text: "Wrong Network",
        disabled: false,
        variant: "PINK" as const,
      };

    if (isEmptyAmount(enterAmount))
      return {
        text: "Enter an amount",
        disabled: true,
        variant: "MINT" as const,
      };
    if (isEnterInsufficientBalance)
      return {
        text: `Insufficient ${enterToken.symbol} balance`,
        disabled: true,
        variant: "MINT" as const,
      };
    if (!selectedPool)
      return {
        text: "Select a Pool",
        disabled: true,
        variant: "MINT" as const,
      };

    if (showApproveUI)
      return {
        text: "Enter",
        disabled: true,
        variant: "MINT" as const,
      };

    return {
      text: "Enter",
      disabled: false,
      variant: "MINT" as const,
    };
  }, [
    isConnected,
    isWrongNetwork,
    enterAmount,
    isEnterInsufficientBalance,
    enterToken.symbol,
    selectedPool,
    showApproveUI,
  ]);

  // ===== Blocks (Summary/Result) =====

  const requiredUsdWithTolNum = useMemo(() => {
    // PayTxInfoBlocks는 number를 받는 형태라 변환
    try {
      return Number(
        payRequiredUsd.roundToDecimals(2).toPrecisionString(true, true),
      );
    } catch {
      return undefined;
    }
  }, [payRequiredUsd]);

  const PaySummaryNode = useMemo(() => {
    if (!selectedPool) return null;
    return (
      <PaySummaryBlock
        poolIcon={selectedPool.iconSrc}
        poolSymbol={selectedPool.symbol}
        receiver={receiver}
        stakedUsed={stakingSharesBd ?? undefined}
        requiredUsdWithTol={requiredUsdWithTolNum}
        payAmountUsdc={payAmount}
      />
    );
  }, [
    selectedPool,
    receiver,
    stakingSharesBd,
    requiredUsdWithTolNum,
    payAmount,
  ]);

  const EnterSummaryNode = useMemo(() => {
    return (
      <EnterSummaryBlock
        tokenIcon={enterToken.iconSrc}
        tokenSymbol={enterToken.symbol}
        amount={enterAmount}
        poolIcon={selectedPool?.iconSrc}
        poolSymbol={selectedPool?.symbol}
      />
    );
  }, [enterToken.iconSrc, enterToken.symbol, enterAmount, selectedPool]);

  // ===== execute: PAY =====
  const executePay = useCallback(async () => {
    let didSubmit = false; // 실제 pay tx 시도 여부

    try {
      if (!chainId || !publicClient) return;
      if (!isConnected || isWrongNetwork) return;
      if (!userAddress) return;
      if (!selectedPool || !stakingPoolAddress) return;
      if (!receiver?.trim()) return;
      if (isEmptyAmount(payAmount)) return;
      if (isPayInsufficientPoolBalance) return;

      const usdcAddr = USDC.addresses?.[chainId] as string | undefined;
      const poolInputTokenAddr = selectedPool.address;

      // BEFORE snapshot (assets-based)
      const stakedBeforeBd = getStakedBalanceFromAssetsByInputToken(
        assetsRef.current,
        poolInputTokenAddr,
      );
      const usdcBeforeBd = getTokenBalanceFromAssets(
        assetsRef.current,
        usdcAddr,
      );

      const prevKey = makeBalancesSnapshotKey({
        assets: assetsRef.current,
        watchTokenAddrs: [usdcAddr ?? ""],
        watchStakedInputTokenAddrs: [poolInputTokenAddr],
      });

      // console.log("[PAY][BEFORE]", {
      //   stakedBefore: stakedBeforeBd?.toPrecisionString(true, true),
      //   usdcBefore: usdcBeforeBd?.toPrecisionString(true, true),
      //   usdcAddr,
      //   poolInputTokenAddr,
      //   prevKey,
      //   balancesVersion: assetsRef.current?.balancesVersion,
      // });

      const sharesDecimals = findVaultDecimalsByPoolAddress(
        chainId,
        safeLower(selectedPool.address),
      );

      // viem parseUnits 가능한 형태로
      const sharesStr = (
        stakingSharesBd?.roundToDecimals(8) ?? new BigDecimal("0", 18)
      ).toPrecisionString(true, true);

      didSubmit = true;

      await payAction({
        chainId,
        userAddress: userAddress as `0x${string}`,
        stakingPoolAddress,
        receiver: receiver as `0x${string}`,
        payAmount,
        stakingSharesStr: sharesStr,
        sharesDecimals,
        paySummaryNode: PaySummaryNode,
        writeContract,
        publicClient,
        client,
        transactionContext: tx,

        onMinedSuccess: async () => {
          await assetsRef.current?.forceRefresh?.();

          await waitForAssetsBalanceChange({
            assetsRef,
            prevKey,
            watchTokenAddrs: [usdcAddr ?? ""],
            watchStakedInputTokenAddrs: [poolInputTokenAddr],
          });

          const stakedAfterBd = getStakedBalanceFromAssetsByInputToken(
            assetsRef.current,
            poolInputTokenAddr,
          );
          const usdcAfterBd = getTokenBalanceFromAssets(
            assetsRef.current,
            usdcAddr,
          );

          // ✅ PAY stakedDelta는 “after - (before - usedShares)”
          const usedSharesBd = stakingSharesBd ?? null;

          const reEnterSharesBd =
            stakedAfterBd && stakedBeforeBd && usedSharesBd
              ? stakedAfterBd.subtract(stakedBeforeBd.subtract(usedSharesBd))
              : null;

          const reEnterUsdNum =
            reEnterSharesBd && poolPriceUsdPerToken
              ? Number(
                  reEnterSharesBd
                    .multiply(poolPriceUsdPerToken)
                    .roundToDecimals(2)
                    .toPrecisionString(true, true),
                )
              : undefined;

          // refund = net USDC increase, but if receiver is self, subtract payAmount
          const refundBd = (() => {
            if (!usdcAfterBd || !usdcBeforeBd) return null;
            let delta = usdcAfterBd.subtract(usdcBeforeBd);
            if (
              receiver?.trim() &&
              userAddress &&
              receiver.toLowerCase() === userAddress.toLowerCase()
            ) {
              const payAmountBd = new BigDecimal(
                payAmount || "0",
                USDC.decimals ?? 6,
              );
              delta = delta.subtract(payAmountBd);
            }
            return delta.gt(new BigDecimal("0", USDC.decimals ?? 6))
              ? delta
              : null;
          })();

          // console.log("[PAY][AFTER]", {
          //   stakedAfter: stakedAfterBd?.toPrecisionString(true, true),
          //   usdcAfter: usdcAfterBd?.toPrecisionString(true, true),
          //   balancesVersion: assetsRef.current?.balancesVersion,
          // });

          // console.log("[PAY][DELTA]", {
          //   reEnterShares: reEnterSharesBd?.toPrecisionString(true, true),
          //   refundUsdc: refundBd?.toPrecisionString(true, true),
          // });

          const payResultNode = (
            <PayResultBlock
              poolIcon={selectedPool.iconSrc}
              poolSymbol={selectedPool.symbol}
              receiver={receiver}
              stakedUsed={stakingSharesBd ?? undefined}
              requiredUsdWithTol={requiredUsdWithTolNum}
              payAmountUsdc={payAmount}
              reEnter={reEnterSharesBd ?? undefined}
              reEnterUsd={reEnterUsdNum}
              refundUsdc={refundBd ?? undefined}
            />
          );

          patchTxConfirmedInfo(
            tx.setTransactionProps as any,
            payResultNode,
            TransactionType.PAY,
          );
          tx.onOpen();
        },
      });
    } catch (e) {
      console.warn("[PAY] executePay error", e);
    } finally {
      // mined 성공 / 실패 / 지갑 취소 모두 여기로 옴
      if (didSubmit) {
        resetPayPanel(); // ✨ PAY 폼 리셋
      }
    }
  }, [
    chainId,
    publicClient,
    isConnected,
    isWrongNetwork,
    userAddress,
    selectedPool,
    stakingPoolAddress,
    receiver,
    payAmount,
    isPayInsufficientPoolBalance,
    stakingSharesBd,
    poolPriceUsdPerToken,
    PaySummaryNode,
    writeContract,
    tx,
    USDC.addresses,
    requiredUsdWithTolNum,
    resetPayPanel,
  ]);

  // ===== approve ERC20 (ENTER) =====
  const executeApproveWeth = useCallback(async () => {
    if (!chainId || !publicClient) return;
    if (!isConnected || isWrongNetwork) return;
    if (!userAddress) return;
    if (!stakingPoolAddress) return;
    if (!enterErc20Addr) return;

    // console.log("[APPROVE][START]", {
    //   chainId,
    //   userAddress,
    //   stakingPoolAddress,
    //   wethAddr,
    //   enterAmount,
    // });

    await approveErc20ForEnter({
      chainId,
      userAddress: userAddress as `0x${string}`,
      stakingPoolAddress,
      tokenAddress: enterErc20Addr,
      writeContract,
      publicClient, // ✅ 추가
      client,
      transactionContext: tx,
      onAllowanceRefetch: async () => {
        await refetchAllowanceWeth();
      },
    });

    // console.log("[APPROVE][DONE]");
  }, [
    chainId,
    publicClient,
    isConnected,
    isWrongNetwork,
    userAddress,
    stakingPoolAddress,
    enterErc20Addr,
    writeContract,
    client,
    tx,
    enterAmount,
  ]);

  // ===== execute: ENTER =====
  const executeEnter = useCallback(async () => {
    let didSubmit = false; // 실제 enter tx 시도 여부

    try {
      if (!chainId || !publicClient) return;
      if (!isConnected || isWrongNetwork) return;
      if (!userAddress) return;
      if (!selectedPool || !stakingPoolAddress) return;
      if (!WRAPPER_ADDRESS) return;

      if (isEmptyAmount(enterAmount)) return;
      if (isEnterInsufficientBalance) return;

      // ERC20 선택 + approve 필요하면 enter 막기
      if (nativeSymbol !== "ETH" && showApproveUI) return;

      const poolInputTokenAddr = selectedPool.address;

      // underlying token addresses (pre-read)
      let token0Addr: `0x${string}` | undefined;
      let token1Addr: `0x${string}` | undefined;
      try {
        const [t0, t1] = await Promise.all([
          publicClient.readContract({
            address: stakingPoolAddress,
            abi: birdieswap_staking_abi,
            functionName: "i_underlying0",
            args: [],
          }),
          publicClient.readContract({
            address: stakingPoolAddress,
            abi: birdieswap_staking_abi,
            functionName: "i_underlying1",
            args: [],
          }),
        ]);
        token0Addr = t0 as `0x${string}`;
        token1Addr = t1 as `0x${string}`;
      } catch (e) {
        console.warn("[ENTER][UNDERLYING READ FAIL]", e);
      }

      // BEFORE snapshot (assets-based)
      const stakedBeforeBd = getStakedBalanceFromAssetsByInputToken(
        assetsRef.current,
        poolInputTokenAddr,
      );

      const token0BeforeBd = token0Addr
        ? getTokenBalanceFromAssets(assetsRef.current, token0Addr)
        : null;
      const token1BeforeBd = token1Addr
        ? getTokenBalanceFromAssets(assetsRef.current, token1Addr)
        : null;

      const prevKey = makeBalancesSnapshotKey({
        assets: assetsRef.current,
        watchTokenAddrs: [token0Addr ?? "", token1Addr ?? ""],
        watchStakedInputTokenAddrs: [poolInputTokenAddr],
      });

      const sharesDecimals = findVaultDecimalsByPoolAddress(
        chainId,
        safeLower(selectedPool.address),
      );

      // viem parseUnits 가능한 형태로
      const stakeAmountStr = (
        enterMinStakeAmountBd?.roundToDecimals(sharesDecimals) ??
        new BigDecimal("0", sharesDecimals)
      ).toPrecisionString(true, true);

      // console.log("[ENTER][BEFORE]", {
      //   nativeSymbol,
      //   enterAmount,
      //   poolInputTokenAddr,
      //   stakingPoolAddress,
      //   stakedBefore: stakedBeforeBd?.toPrecisionString(true, true),
      //   token0Addr,
      //   token1Addr,
      //   token0Before: token0BeforeBd?.toPrecisionString(true, true),
      //   token1Before: token1BeforeBd?.toPrecisionString(true, true),
      //   prevKey,
      //   balancesVersion: assetsRef.current?.balancesVersion,
      //   enterMinStakeAmountStr: stakeAmountStr,
      // });

      didSubmit = true;

      await enter({
        chainId,
        userAddress: userAddress as `0x${string}`,
        stakingPoolAddress,
        wrapperAddress: WRAPPER_ADDRESS as `0x${string}`,
        inputTokenSymbol: enterToken.symbol,
        inputTokenAddress:
          (enterToken.addresses?.[chainId] as `0x${string}` | undefined) ??
          undefined,
        inputTokenDecimals: enterToken.decimals ?? 18,
        amount: enterAmount,
        enterMinStakeAmountStr: stakeAmountStr,
        sharesDecimals,
        enterSummaryNode: EnterSummaryNode,
        writeContract,
        publicClient,
        client,
        transactionContext: tx,

        onMinedSuccess: async (m) => {
          // actions.ts에서 token0/1을 넘겨주고 있다면 그것도 사용
          const minedToken0 = m?.token0Addr;
          const minedToken1 = m?.token1Addr;

          const finalToken0 = token0Addr ?? minedToken0;
          const finalToken1 = token1Addr ?? minedToken1;

          // console.log("[ENTER][MINED CALLBACK]", {
          //   hash: m?.hash,
          //   token0Addr,
          //   token1Addr,
          //   minedToken0,
          //   minedToken1,
          //   finalToken0,
          //   finalToken1,
          // });

          await assetsRef.current?.forceRefresh?.();

          await waitForAssetsBalanceChange({
            assetsRef,
            prevKey,
            watchTokenAddrs: [finalToken0 ?? "", finalToken1 ?? ""],
            watchStakedInputTokenAddrs: [poolInputTokenAddr],
          });

          const stakedAfterBd = getStakedBalanceFromAssetsByInputToken(
            assetsRef.current,
            poolInputTokenAddr,
          );

          const token0AfterBd = finalToken0
            ? getTokenBalanceFromAssets(assetsRef.current, finalToken0)
            : null;
          const token1AfterBd = finalToken1
            ? getTokenBalanceFromAssets(assetsRef.current, finalToken1)
            : null;

          const inputTokenAddr =
            (enterToken.addresses?.[chainId] as `0x${string}` | undefined) ??
            undefined;
          const isInputTokenAddr = (addr?: `0x${string}`) =>
            !!addr && !!inputTokenAddr && safeLower(addr) === safeLower(inputTokenAddr);

          // ERC20 enter 시, 입력 토큰 amountIn 만큼 balance baseline 보정
          const amountInBd =
            nativeSymbol !== "ETH"
              ? new BigDecimal(enterAmount || "0", enterToken.decimals ?? 18)
              : null;

          const stakedDeltaBd =
            stakedAfterBd && stakedBeforeBd
              ? stakedAfterBd.subtract(stakedBeforeBd)
              : undefined;

          const token0BeforeAdj =
            finalToken0 && token0BeforeBd
              ? isInputTokenAddr(finalToken0) && amountInBd
                ? BigDecimal.max(
                    token0BeforeBd.subtract(amountInBd),
                    new BigDecimal("0", enterToken.decimals ?? 18),
                  )
                : token0BeforeBd
              : (token0BeforeBd ?? new BigDecimal("0", 18));

          const token1BeforeAdj =
            finalToken1 && token1BeforeBd
              ? isInputTokenAddr(finalToken1) && amountInBd
                ? BigDecimal.max(
                    token1BeforeBd.subtract(amountInBd),
                    new BigDecimal("0", enterToken.decimals ?? 18),
                  )
                : token1BeforeBd
              : (token1BeforeBd ?? new BigDecimal("0", 18));

          const token0DeltaRaw =
            finalToken0 && token0AfterBd
              ? token0AfterBd.subtract(token0BeforeAdj)
              : undefined;

          const token1DeltaRaw =
            finalToken1 && token1AfterBd
              ? token1AfterBd.subtract(token1BeforeAdj)
              : undefined;

          // ✅ refund는 "표시용": 0이어도 표시(섹션이 사라지지 않게), 음수는 0으로 clamp
          const token0RefundDisplay =
            token0DeltaRaw && token0DeltaRaw.gt(new BigDecimal("0", 0))
              ? token0DeltaRaw
              : finalToken0
                ? new BigDecimal("0", 18)
                : undefined;

          const token1RefundDisplay =
            token1DeltaRaw && token1DeltaRaw.gt(new BigDecimal("0", 0))
              ? token1DeltaRaw
              : finalToken1
                ? new BigDecimal("0", 18)
                : undefined;

          const token0Meta = finalToken0
            ? findTokenByAddress(chainId, finalToken0)
            : undefined;
          const token1Meta = finalToken1
            ? findTokenByAddress(chainId, finalToken1)
            : undefined;

          // console.log("[ENTER][AFTER]", {
          //   stakedAfter: stakedAfterBd?.toPrecisionString(true, true),
          //   stakedDelta: stakedDeltaBd?.toPrecisionString(true, true),
          //   token0Addr: finalToken0,
          //   token1Addr: finalToken1,
          //   token0After: token0AfterBd?.toPrecisionString(true, true),
          //   token1After: token1AfterBd?.toPrecisionString(true, true),
          //   token0DeltaRaw: token0DeltaRaw?.toPrecisionString(true, true),
          //   token1DeltaRaw: token1DeltaRaw?.toPrecisionString(true, true),
          //   balancesVersion: assetsRef.current?.balancesVersion,
          // });

          const resultNode = (
            <EnterResultBlock
              tokenIcon={enterToken.iconSrc}
              tokenSymbol={enterToken.symbol}
              amount={enterAmount}
              poolIcon={selectedPool.iconSrc}
              poolSymbol={selectedPool.symbol}
              stakedDelta={stakedDeltaBd}
              refund0={
                finalToken0
                  ? {
                      tokenIcon: token0Meta?.iconSrc,
                      symbol: token0Meta?.symbol ?? "Token0",
                      amount: token0RefundDisplay, // ✅ 0이어도 amount가 있으면 UI 뜸
                    }
                  : undefined
              }
              refund1={
                finalToken1
                  ? {
                      tokenIcon: token1Meta?.iconSrc,
                      symbol: token1Meta?.symbol ?? "Token1",
                      amount: token1RefundDisplay,
                    }
                  : undefined
              }
            />
          );

          patchTxConfirmedInfo(
            tx.setTransactionProps as any,
            resultNode,
            TransactionType.ENTER,
          );
          tx.onOpen();
        },
      });
    } catch (e) {
      console.warn("[ENTER] executeEnter error", e);
    } finally {
      if (didSubmit) {
        resetEnterPanel(); // ✨ ENTER 폼 리셋 (성공/실패/취소 모두)
      }
    }
  }, [
    chainId,
    publicClient,
    isConnected,
    isWrongNetwork,
    userAddress,
    selectedPool,
    stakingPoolAddress,
    WRAPPER_ADDRESS,
    nativeSymbol,
    enterAmount,
    isEnterInsufficientBalance,
    showApproveUI,
    EnterSummaryNode,
    writeContract,
    client,
    tx,
    enterToken.iconSrc,
    enterToken.symbol,
    enterToken.addresses,
    resetEnterPanel,
  ]);

  return {
    // mode
    selectedPanel,
    setSelectedPanel,

    // inputs
    receiver,
    setReceiver,
    payAmount,
    setPayAmount,
    enterAmount,
    setEnterAmount,
    tolerance,
    setTolerance,
    selectedPool,
    setSelectedPool,
    nativeSymbol,
    setNativeSymbol,

    // derived
    chainId,
    isConnected,
    isWrongNetwork,
    ROUTER_ADDRESS,
    WRAPPER_ADDRESS,
    stakingPoolAddress,
    enterToken,
    payRequiredUsd,
    stakingSharesBd,
    enterWalletBalanceBd,

    // approve flags
    shouldCheckAllowance,
    needsWethApprove,
    showApproveUI,

    // button states
    payButton,
    enterButton,

    // actions
    executePay,
    executeEnter,
    executeApproveWeth,
  };
}
