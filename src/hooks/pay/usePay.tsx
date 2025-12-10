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
import { erc20Abi, parseUnits } from "viem";

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

import { birdieswap_staking_abi } from "@/const/contracts/abis/birdieswap_staking_abi";
import type { PoolLike } from "@/components/(main)/pay/common/PayPoolSelector";

import { approveWethForEnter, enter, pay as payAction } from "./actions";

// ✅ Blocks UI
import {
  PaySummaryNode as PaySummaryBlock,
  PayResultNode as PayResultBlock,
  EnterSummaryNode as EnterSummaryBlock,
  EnterResultNode as EnterResultBlock,
} from "@/components/(main)/pay/common/PayTxInfoBlocks";

// -------- helpers --------
type PayMode = "PAY" | "ENTER";
type NativeSymbol = "ETH" | "WETH";

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
  poolAddrLower?: string
) {
  if (!poolAddrLower) return 18;
  const vaultList = Object.values(lpVaults) as any[];
  const hit = vaultList.find((v) => {
    const addr = v?.addresses?.[chainId];
    return typeof addr === "string" && addr.toLowerCase() === poolAddrLower;
  });
  return (hit?.decimals as number | undefined) ?? 18;
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
  tokenAddr?: string
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
  inputTokenAddr?: string
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
      prev: TransactionStatusProps | null
    ) => TransactionStatusProps | null
  ) => void,
  nextNode: React.ReactNode,
  typeGuard: TransactionType.PAY | TransactionType.ENTER
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
  const [enterAmount, setEnterAmount] = useState(""); // ETH/WETH
  const [tolerance, setTolerance] = useState<"auto" | number>("auto");
  const [selectedPool, setSelectedPool] = useState<PoolLike | undefined>();
  const [nativeSymbol, setNativeSymbol] = useState<NativeSymbol>("ETH");

  const USDC = tokens.USDC;
  const ETH = tokens.ETH;
  const WETH = tokens.WETH;
  const enterToken = nativeSymbol === "ETH" ? ETH : WETH;

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

  const payRequiredUsd = useMemo(() => {
    const dec = USDC.decimals ?? 6;
    const amt = new BigDecimal(payAmount || "0", dec);
    const factor = new BigDecimal(String(1 + tolPct / 100), 18);
    return amt.multiply(factor);
  }, [payAmount, tolPct, USDC.decimals]);

  const poolPriceUsdPerToken = useMemo(() => {
    const bal = selectedPool?.stakedBalance;
    const usd = selectedPool?.usdValue;
    if (!bal || !usd || bal.isZero()) return null;
    return usd.divide(bal);
  }, [selectedPool?.stakedBalance, selectedPool?.usdValue]);

  const stakingSharesBd = useMemo(() => {
    if (!poolPriceUsdPerToken) return null;
    if (payRequiredUsd.isZero()) return null;
    return payRequiredUsd.divide(poolPriceUsdPerToken);
  }, [payRequiredUsd, poolPriceUsdPerToken]);

  const isPayInsufficientPoolBalance = useMemo(() => {
    if (!selectedPool?.stakedBalance) return false;
    if (!stakingSharesBd) return false;
    return stakingSharesBd.gt(selectedPool.stakedBalance);
  }, [stakingSharesBd, selectedPool?.stakedBalance]);

  // ENTER balances (wagmi useBalance)
  const enterTokenAddress = useMemo(() => {
    if (!chainId) return undefined;
    if (nativeSymbol === "ETH") return undefined;
    return (
      (WETH.addresses?.[chainId] as `0x${string}` | undefined) ?? undefined
    );
  }, [chainId, nativeSymbol, WETH.addresses]);

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

  // ===== WETH allowance (ENTER, WETH, + pool selected + staking addr ready) =====
  const wethAddr = useMemo(() => {
    if (!chainId) return undefined;
    return WETH.addresses?.[chainId] as `0x${string}` | undefined;
  }, [chainId, WETH.addresses]);

  // ✅ ENTER 패널 여부는 여기서 보지 말고, "WETH + 필요한 주소들 다 있음"만 체크
  const shouldCheckAllowance = useMemo(() => {
    return (
      nativeSymbol === "WETH" &&
      !!selectedPool &&
      !!stakingPoolAddress &&
      !!userAddress &&
      !!wethAddr
    );
  }, [nativeSymbol, selectedPool, stakingPoolAddress, userAddress, wethAddr]);

  const allowanceArgs = useMemo(() => {
    if (!userAddress || !stakingPoolAddress) return null;
    return [userAddress, stakingPoolAddress] as const;
  }, [userAddress, stakingPoolAddress]);

  const { data: allowanceWeth, isLoading: isAllowanceLoading } =
    useReadContract({
      address: wethAddr,
      abi: erc20Abi,
      functionName: "allowance",
      args: allowanceArgs ?? undefined,
      query: { enabled: shouldCheckAllowance && !!allowanceArgs },
    });

  // ✅ allowanceWeth가 아직 없으면 "모름"으로 두고,
  //    showApproveUI에서 로딩 중 숨기기 여부는 선택 가능
  const needsWethApprove = useMemo(() => {
    if (nativeSymbol !== "WETH") return false;
    if (!shouldCheckAllowance) return false;
    if (allowanceWeth == null) return false; // 아직 모름(=로딩/미수신)

    try {
      const decimals = WETH.decimals ?? 18;
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
    WETH.decimals,
  ]);

  // ✅ UI에서 Approve 버튼 노출 여부
  const showApproveUI = useMemo(() => {
    if (!shouldCheckAllowance) return false;

    // 옵션 A) 지금처럼 "로딩 중에는 숨김" 유지
    if (isAllowanceLoading) return false;

    return needsWethApprove;
  }, [shouldCheckAllowance, /*isAllowanceLoading,*/ needsWethApprove]);

  // ---- debug logs ----
  useEffect(() => {
    if (selectedPanel !== "ENTER") return;
    console.log("[ALLOWANCE DEBUG]", {
      shouldCheckAllowance,
      nativeSymbol,
      selectedPool: !!selectedPool,
      stakingPoolAddress,
      wethAddr,
      userAddress,
      enterAmount,
      allowanceWeth: allowanceWeth?.toString?.() ?? allowanceWeth,
      isAllowanceLoading,
      needsWethApprove,
      showApproveUI,
    });
  }, [
    selectedPanel,
    shouldCheckAllowance,
    nativeSymbol,
    selectedPool,
    stakingPoolAddress,
    wethAddr,
    userAddress,
    enterAmount,
    allowanceWeth,
    isAllowanceLoading,
    needsWethApprove,
    showApproveUI,
  ]);

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

    return { text: "Start Paying", disabled: false, variant: "MINT" as const };
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
        text: "Start Entering",
        disabled: true,
        variant: "MINT" as const,
      };

    return {
      text: "Start Entering",
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
        payRequiredUsd.roundToDecimals(2).toPrecisionString(true, true)
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
      poolInputTokenAddr
    );
    const usdcBeforeBd = getTokenBalanceFromAssets(assetsRef.current, usdcAddr);

    const prevKey = makeBalancesSnapshotKey({
      assets: assetsRef.current,
      watchTokenAddrs: [usdcAddr ?? ""],
      watchStakedInputTokenAddrs: [poolInputTokenAddr],
    });

    console.log("[PAY][BEFORE]", {
      stakedBefore: stakedBeforeBd?.toPrecisionString(true, true),
      usdcBefore: usdcBeforeBd?.toPrecisionString(true, true),
      usdcAddr,
      poolInputTokenAddr,
      prevKey,
      balancesVersion: assetsRef.current?.balancesVersion,
    });

    const sharesDecimals = findVaultDecimalsByPoolAddress(
      chainId,
      safeLower(selectedPool.address)
    );

    // viem parseUnits 가능한 형태로
    const sharesStr = (
      stakingSharesBd?.roundToDecimals(8) ?? new BigDecimal("0", 18)
    ).toPrecisionString(true, true);

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
          poolInputTokenAddr
        );
        const usdcAfterBd = getTokenBalanceFromAssets(
          assetsRef.current,
          usdcAddr
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
                  .toPrecisionString(true, true)
              )
            : undefined;

        const refundBd =
          usdcAfterBd && usdcBeforeBd
            ? usdcAfterBd.subtract(usdcBeforeBd)
            : null;

        console.log("[PAY][AFTER]", {
          stakedAfter: stakedAfterBd?.toPrecisionString(true, true),
          usdcAfter: usdcAfterBd?.toPrecisionString(true, true),
          balancesVersion: assetsRef.current?.balancesVersion,
        });

        console.log("[PAY][DELTA]", {
          reEnterShares: reEnterSharesBd?.toPrecisionString(true, true),
          refundUsdc: refundBd?.toPrecisionString(true, true),
        });

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
          TransactionType.PAY
        );
        tx.onOpen();
      },
    });
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
  ]);

  // ===== approve WETH (ENTER) =====
  const executeApproveWeth = useCallback(async () => {
    if (!chainId || !publicClient) return;
    if (!isConnected || isWrongNetwork) return;
    if (!userAddress) return;
    if (!stakingPoolAddress) return;
    if (!wethAddr) return;

    console.log("[APPROVE][START]", {
      chainId,
      userAddress,
      stakingPoolAddress,
      wethAddr,
      enterAmount,
    });

    await approveWethForEnter({
      chainId,
      userAddress: userAddress as `0x${string}`,
      stakingPoolAddress,
      writeContract,
      publicClient, // ✅ 추가
      client,
      transactionContext: tx,
    });

    console.log("[APPROVE][DONE]");
  }, [
    chainId,
    publicClient,
    isConnected,
    isWrongNetwork,
    userAddress,
    stakingPoolAddress,
    wethAddr,
    writeContract,
    client,
    tx,
    enterAmount,
  ]);

  // ===== execute: ENTER =====
  const executeEnter = useCallback(async () => {
    if (!chainId || !publicClient) return;
    if (!isConnected || isWrongNetwork) return;
    if (!userAddress) return;
    if (!selectedPool || !stakingPoolAddress) return;
    if (!WRAPPER_ADDRESS) return;

    if (isEmptyAmount(enterAmount)) return;
    if (isEnterInsufficientBalance) return;

    // WETH 선택 + approve 필요하면 enter 막기
    if (nativeSymbol === "WETH" && showApproveUI) return;

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
      poolInputTokenAddr
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

    console.log("[ENTER][BEFORE]", {
      nativeSymbol,
      enterAmount,
      poolInputTokenAddr,
      stakingPoolAddress,
      stakedBefore: stakedBeforeBd?.toPrecisionString(true, true),
      token0Addr,
      token1Addr,
      token0Before: token0BeforeBd?.toPrecisionString(true, true),
      token1Before: token1BeforeBd?.toPrecisionString(true, true),
      prevKey,
      balancesVersion: assetsRef.current?.balancesVersion,
    });

    await enter({
      chainId,
      userAddress: userAddress as `0x${string}`,
      stakingPoolAddress,
      wrapperAddress: WRAPPER_ADDRESS as `0x${string}`,
      nativeSymbol,
      amount: enterAmount,
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

        console.log("[ENTER][MINED CALLBACK]", {
          hash: m?.hash,
          token0Addr,
          token1Addr,
          minedToken0,
          minedToken1,
          finalToken0,
          finalToken1,
        });

        await assetsRef.current?.forceRefresh?.();

        await waitForAssetsBalanceChange({
          assetsRef,
          prevKey,
          watchTokenAddrs: [finalToken0 ?? "", finalToken1 ?? ""],
          watchStakedInputTokenAddrs: [poolInputTokenAddr],
        });

        const stakedAfterBd = getStakedBalanceFromAssetsByInputToken(
          assetsRef.current,
          poolInputTokenAddr
        );

        const token0AfterBd = finalToken0
          ? getTokenBalanceFromAssets(assetsRef.current, finalToken0)
          : null;
        const token1AfterBd = finalToken1
          ? getTokenBalanceFromAssets(assetsRef.current, finalToken1)
          : null;

        const stakedDeltaBd =
          stakedAfterBd && stakedBeforeBd
            ? stakedAfterBd.subtract(stakedBeforeBd)
            : undefined;

        const token0DeltaRaw =
          finalToken0 && token0AfterBd
            ? token0AfterBd.subtract(token0BeforeBd ?? new BigDecimal("0", 18))
            : undefined;

        const token1DeltaRaw =
          finalToken1 && token1AfterBd
            ? token1AfterBd.subtract(token1BeforeBd ?? new BigDecimal("0", 18))
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

        console.log("[ENTER][AFTER]", {
          stakedAfter: stakedAfterBd?.toPrecisionString(true, true),
          stakedDelta: stakedDeltaBd?.toPrecisionString(true, true),
          token0Addr: finalToken0,
          token1Addr: finalToken1,
          token0After: token0AfterBd?.toPrecisionString(true, true),
          token1After: token1AfterBd?.toPrecisionString(true, true),
          token0DeltaRaw: token0DeltaRaw?.toPrecisionString(true, true),
          token1DeltaRaw: token1DeltaRaw?.toPrecisionString(true, true),
          balancesVersion: assetsRef.current?.balancesVersion,
        });

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
          TransactionType.ENTER
        );
        tx.onOpen();
      },
    });
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
