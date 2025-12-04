import tokens from "@/const/contracts/tokens/tokens";
import { PoolInfo, Addr } from "./types";

const DEBUG_DERIVE_POOL_INFO = true; // ✅ 필요할 때만 true

function isEthLike(addr?: string) {
  if (!addr) return false;
  const a = addr.toLowerCase();
  return (
    a === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || /^0x0{40}$/.test(a)
  );
}

function isNativeEthTokenEntry(entry: any) {
  return String(entry?.symbol ?? "").toUpperCase() === "ETH";
}

function normalizeToErc20Address(params: {
  addr?: string;
  entry?: any;
  chainId: number;
}) {
  const { addr, entry, chainId } = params;
  const weth = tokens?.WETH?.addresses?.[chainId] as `0x${string}` | undefined;

  // ✅ 1) addr 자체가 ETH-like면 WETH로
  if (addr && weth && isEthLike(addr)) return weth;

  // ✅ 2) addr가 없는데 entry가 ETH(네이티브)면 WETH로
  if (!addr && weth && isNativeEthTokenEntry(entry)) return weth;

  return (addr ?? undefined) as `0x${string}` | undefined;
}

export function derivePoolInfo(
  swapPool: any | null,
  chainId: number,
  fromTokenAddress?: `0x${string}` | null
): PoolInfo {
  const empty: PoolInfo = {
    poolAddress: null,
    zeroForOne: false,
    outBToken: null,
    outBpool: null,
    token0Decimals: undefined,
    token1Decimals: undefined,
    token0Address: null,
    token1Address: null,
    fromIsToken0: false,
  };

  if (!swapPool || !chainId) return empty;

  const poolAddress = (swapPool?.addresses?.[chainId] ?? null) as Addr;

  const raw0 = swapPool?.input?.[0];
  const raw1 = swapPool?.input?.[1];

  if (!poolAddress || !raw0 || !raw1) return empty;

  // external/internal 모두 token "erc20 주소"를 확보 (ETH면 WETH)
  const in0Addr = normalizeToErc20Address({
    addr: raw0?.addresses?.[chainId],
    entry: raw0,
    chainId,
  });
  const in1Addr = normalizeToErc20Address({
    addr: raw1?.addresses?.[chainId],
    entry: raw1,
    chainId,
  });

  if (!in0Addr || !in1Addr) {
    // if (DEBUG_DERIVE_POOL_INFO) {
    //   console.log("[derivePoolInfo] missing input addr", {
    //     pool: swapPool?.symbol,
    //     chainId,
    //     in0Addr,
    //     in1Addr,
    //     raw0Symbol: raw0?.symbol,
    //     raw1Symbol: raw1?.symbol,
    //     raw0Addr: raw0?.addresses?.[chainId],
    //     raw1Addr: raw1?.addresses?.[chainId],
    //   });
    // }
    return { ...empty, poolAddress };
  }

  // 정렬 기준(체크섬/대소문자 방지)
  const is0Lower = in0Addr.toLowerCase() < in1Addr.toLowerCase();
  const t0Entry = is0Lower ? raw0 : raw1;
  const t1Entry = is0Lower ? raw1 : raw0;

  const token0Address: Addr = (is0Lower ? in0Addr : in1Addr) ?? null;
  const token1Address: Addr = (is0Lower ? in1Addr : in0Addr) ?? null;

  // ✅ decimals: internal은 entry.decimals or entry.input.decimals, external은 entry.decimals
  const token0Decimals = (t0Entry?.decimals ?? t0Entry?.input?.decimals) as
    | number
    | undefined;
  const token1Decimals = (t1Entry?.decimals ?? t1Entry?.input?.decimals) as
    | number
    | undefined;

  // ✅ underlying 주소: internal이면 input.addresses, external이면 addresses
  const u0Raw = (t0Entry?.input?.addresses?.[chainId] ??
    t0Entry?.addresses?.[chainId]) as string | undefined;
  const u1Raw = (t1Entry?.input?.addresses?.[chainId] ??
    t1Entry?.addresses?.[chainId]) as string | undefined;

  const underlying0 = normalizeToErc20Address({
    addr: u0Raw,
    entry: t0Entry,
    chainId,
  });
  const underlying1 = normalizeToErc20Address({
    addr: u1Raw,
    entry: t1Entry,
    chainId,
  });

  // fromTokenAddress도 ETH-like면 WETH 치환
  const fromNorm = normalizeToErc20Address({
    addr: fromTokenAddress ?? undefined,
    entry: null,
    chainId,
  });

  const fromIsToken0 =
    !!underlying0 &&
    !!fromNorm &&
    underlying0.toLowerCase() === fromNorm.toLowerCase();

  const zeroForOne = fromIsToken0;

  // internal 전용 (external은 null 유지)
  let outBToken: Addr = null;
  let outBpool: any | null = null;
  if (swapPool?.isInternal) {
    outBToken = zeroForOne ? token1Address : token0Address;
    outBpool = zeroForOne ? t1Entry : t0Entry;
  }

  // if (DEBUG_DERIVE_POOL_INFO) {
  //   console.log("[derivePoolInfo]", {
  //     pool: swapPool?.symbol,
  //     isInternal: !!swapPool?.isInternal,
  //     chainId,
  //     poolAddress,
  //     token0Address,
  //     token1Address,
  //     token0Decimals,
  //     token1Decimals,
  //     underlying0,
  //     underlying1,
  //     fromTokenAddress,
  //     fromNorm,
  //     fromIsToken0,
  //     zeroForOne,
  //   });
  // }

  return {
    poolAddress,
    zeroForOne,
    outBToken,
    outBpool,
    token0Decimals,
    token1Decimals,
    token0Address,
    token1Address,
    fromIsToken0,
  };
}
