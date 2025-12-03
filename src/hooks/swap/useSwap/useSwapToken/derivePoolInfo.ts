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
    if (DEBUG_DERIVE_POOL_INFO) {
      console.log("[derivePoolInfo] missing input addr", {
        pool: swapPool?.symbol,
        chainId,
        in0Addr,
        in1Addr,
        raw0Symbol: raw0?.symbol,
        raw1Symbol: raw1?.symbol,
        raw0Addr: raw0?.addresses?.[chainId],
        raw1Addr: raw1?.addresses?.[chainId],
      });
    }
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

  if (DEBUG_DERIVE_POOL_INFO) {
    console.log("[derivePoolInfo]", {
      pool: swapPool?.symbol,
      isInternal: !!swapPool?.isInternal,
      chainId,
      poolAddress,
      token0Address,
      token1Address,
      token0Decimals,
      token1Decimals,
      underlying0,
      underlying1,
      fromTokenAddress,
      fromNorm,
      fromIsToken0,
      zeroForOne,
    });
  }

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

// import tokens from "@/const/contracts/tokens/tokens";
// import { PoolInfo, Addr } from "./types";

// function isEthLike(addr?: string) {
//   if (!addr) return false;
//   const a = addr.toLowerCase();
//   return a === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || /^0x0{40}$/.test(a);
// }

// export function derivePoolInfo(swapPool: any | null, chainId: number, fromTokenAddress?: `0x${string}` | null): PoolInfo {
//   if (!swapPool || !chainId) return { poolAddress: null, zeroForOne: false, outBToken: null, outBpool: null };

//   const poolAddress = (swapPool?.addresses?.[chainId] ?? null) as Addr;

//   const input0Address = swapPool?.input?.[0]?.addresses?.[chainId] as `0x${string}` | undefined;
//   const input1Address = swapPool?.input?.[1]?.addresses?.[chainId] as `0x${string}` | undefined;

//   if (!poolAddress || !input0Address || !input1Address) {
//     return { poolAddress: null, zeroForOne: false, outBToken: null, outBpool: null };
//   }

//   // PATCH: 주소 정렬 비교는 소문자로 통일 (체크섬 대소문자 섞임 방지)
//   const input0AddressLC = input0Address.toLowerCase();                 // PATCH
//   const input1AddressLC = input1Address.toLowerCase();                 // PATCH
//   const is0Lower = input0AddressLC < input1AddressLC;                  // PATCH

//   let token0Address: Addr = null;
//   let token1Address: Addr = null;
//   let token0Decimals: number | undefined = undefined;
//   let token1Decimals: number | undefined = undefined;

//   if (is0Lower /* PATCH: input0Address < input1Address -> is0Lower */) {
//     token0Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
//     token0Decimals = swapPool?.input?.[0]?.decimals ?? swapPool?.input?.[0]?.input?.decimals; // PATCH: fallback
//     token1Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
//     token1Decimals = swapPool?.input?.[1]?.decimals ?? swapPool?.input?.[1]?.input?.decimals; // PATCH: fallback
//   } else {
//     token0Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
//     token0Decimals = swapPool?.input?.[1]?.decimals ?? swapPool?.input?.[1]?.input?.decimals; // PATCH: fallback
//     token1Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
//     token1Decimals = swapPool?.input?.[0]?.decimals ?? swapPool?.input?.[0]?.input?.decimals; // PATCH: fallback
//   }

//   // PATCH: token0/token1 기준으로 underlying 주소를 같은 인덱스로 맞춰 잡기
//   const underlying0AddressRaw = is0Lower
//     ? swapPool?.input?.[0]?.input?.addresses?.[chainId]
//     : swapPool?.input?.[1]?.input?.addresses?.[chainId];                                                  // PATCH

//   const underlying1AddressRaw = is0Lower
//     ? swapPool?.input?.[1]?.input?.addresses?.[chainId]
//     : swapPool?.input?.[0]?.input?.addresses?.[chainId];                                                  // PATCH

//   // PATCH: ETH → WETH 정규화 (비교/방향 계산은 항상 ERC20 주소로)
//   const weth = tokens?.WETH?.addresses?.[chainId] as `0x${string}` | undefined;                            // PATCH
//   const underlying0AddressNorm = (isEthLike(underlying0AddressRaw) && weth) ? weth : underlying0AddressRaw as `0x${string}` | undefined; // PATCH
//   const underlying1AddressNorm = (isEthLike(underlying1AddressRaw) && weth) ? weth : underlying1AddressRaw as `0x${string}` | undefined; // PATCH
//   const fromAddrNorm = (isEthLike(fromTokenAddress as any) && weth) ? weth : (fromTokenAddress ?? null);   // PATCH

//   // if (input0Address < input1Address) {
//   //   token0Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
//   //   token0Decimals = swapPool?.input?.[0]?.decimals;
//   //   token1Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
//   //   token1Decimals = swapPool?.input?.[1]?.decimals;
//   // } else {
//   //   token0Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
//   //   token0Decimals = swapPool?.input?.[1]?.decimals;
//   //   token1Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
//   //   token1Decimals = swapPool?.input?.[0]?.decimals;
//   // }

//   // const check0Address = (input0Address < input1Address)
//   //   ? swapPool?.input?.[0]?.input?.addresses?.[chainId]
//   //   : swapPool?.input?.[1]?.input?.addresses?.[chainId];

//   // const zeroForOne = (check0Address?.toLowerCase?.() === (fromTokenAddress ?? "").toLowerCase());

//   // const underlying0Address = swapPool?.input?.[0]?.input?.addresses?.[chainId];
//   // let outBToken: Addr = null;
//   // let outBpool: any | null = null;

//   // if (underlying0Address?.toLowerCase?.() === (fromTokenAddress ?? "").toLowerCase()) {
//   //   outBToken = token1Address;
//   //   outBpool = swapPool?.input?.[1] ?? null;
//   // } else {
//   //   outBToken = token0Address;
//   //   outBpool = swapPool?.input?.[0] ?? null;
//   // }
//   const zeroForOne =
//     (underlying0AddressNorm?.toLowerCase?.() === (fromAddrNorm ?? "").toLowerCase());                     // PATCH (핵심)

//   // 기존: underlying0Address = swapPool.input[0]... (항상 input[0] 기준)  // <-- 사용 안 함
//   // PATCH: token0의 underlying 과 일치하면 out 은 token1, 아니면 token0
//   let outBToken: Addr = null;
//   let outBpool: any | null = null;

//   if (underlying0AddressNorm?.toLowerCase?.() === (fromAddrNorm ?? "").toLowerCase()) {                   // PATCH
//     outBToken = token1Address;
//     outBpool = is0Lower ? swapPool?.input?.[1] : swapPool?.input?.[0];                                     // PATCH: token1 인덱스
//   } else {
//     outBToken = token0Address;
//     outBpool = is0Lower ? swapPool?.input?.[0] : swapPool?.input?.[1];                                     // PATCH: token0 인덱스
//   }

//   return { poolAddress, zeroForOne, outBToken, outBpool, token0Decimals, token1Decimals };
// }
