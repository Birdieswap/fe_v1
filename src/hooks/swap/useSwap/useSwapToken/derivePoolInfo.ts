
import tokens from "@/const/contracts/tokens/tokens";
import { PoolInfo, Addr } from "./types";

function isEthLike(addr?: string) {
  if (!addr) return false;
  const a = addr.toLowerCase();
  return a === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || /^0x0{40}$/.test(a);
}

export function derivePoolInfo(swapPool: any | null, chainId: number, fromTokenAddress?: `0x${string}` | null): PoolInfo {
  if (!swapPool || !chainId) return { poolAddress: null, zeroForOne: false, outBToken: null, outBpool: null };

  const poolAddress = (swapPool?.addresses?.[chainId] ?? null) as Addr;
  
  
  const input0Address = swapPool?.input?.[0]?.addresses?.[chainId] as `0x${string}` | undefined;
  const input1Address = swapPool?.input?.[1]?.addresses?.[chainId] as `0x${string}` | undefined;

  if (!poolAddress || !input0Address || !input1Address) {
    return { poolAddress: null, zeroForOne: false, outBToken: null, outBpool: null };
  }

  // PATCH: 주소 정렬 비교는 소문자로 통일 (체크섬 대소문자 섞임 방지)
  const input0AddressLC = input0Address.toLowerCase();                 // PATCH
  const input1AddressLC = input1Address.toLowerCase();                 // PATCH
  const is0Lower = input0AddressLC < input1AddressLC;                  // PATCH

  let token0Address: Addr = null;
  let token1Address: Addr = null;
  let token0Decimals: number | undefined = undefined;
  let token1Decimals: number | undefined = undefined;

  if (is0Lower /* PATCH: input0Address < input1Address -> is0Lower */) {
    token0Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
    token0Decimals = swapPool?.input?.[0]?.decimals ?? swapPool?.input?.[0]?.input?.decimals; // PATCH: fallback
    token1Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
    token1Decimals = swapPool?.input?.[1]?.decimals ?? swapPool?.input?.[1]?.input?.decimals; // PATCH: fallback
  } else {
    token0Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
    token0Decimals = swapPool?.input?.[1]?.decimals ?? swapPool?.input?.[1]?.input?.decimals; // PATCH: fallback
    token1Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
    token1Decimals = swapPool?.input?.[0]?.decimals ?? swapPool?.input?.[0]?.input?.decimals; // PATCH: fallback
  }

  // PATCH: token0/token1 기준으로 underlying 주소를 같은 인덱스로 맞춰 잡기
  const underlying0AddressRaw = is0Lower
    ? swapPool?.input?.[0]?.input?.addresses?.[chainId]
    : swapPool?.input?.[1]?.input?.addresses?.[chainId];                                                  // PATCH

  const underlying1AddressRaw = is0Lower
    ? swapPool?.input?.[1]?.input?.addresses?.[chainId]
    : swapPool?.input?.[0]?.input?.addresses?.[chainId];                                                  // PATCH

  // PATCH: ETH → WETH 정규화 (비교/방향 계산은 항상 ERC20 주소로)
  const weth = tokens?.WETH?.addresses?.[chainId] as `0x${string}` | undefined;                            // PATCH
  const underlying0AddressNorm = (isEthLike(underlying0AddressRaw) && weth) ? weth : underlying0AddressRaw as `0x${string}` | undefined; // PATCH
  const underlying1AddressNorm = (isEthLike(underlying1AddressRaw) && weth) ? weth : underlying1AddressRaw as `0x${string}` | undefined; // PATCH
  const fromAddrNorm = (isEthLike(fromTokenAddress as any) && weth) ? weth : (fromTokenAddress ?? null);   // PATCH

  
  // if (input0Address < input1Address) {
  //   token0Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
  //   token0Decimals = swapPool?.input?.[0]?.decimals;
  //   token1Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
  //   token1Decimals = swapPool?.input?.[1]?.decimals;
  // } else {
  //   token0Address = swapPool?.input?.[1]?.addresses?.[chainId] ?? null;
  //   token0Decimals = swapPool?.input?.[1]?.decimals;
  //   token1Address = swapPool?.input?.[0]?.addresses?.[chainId] ?? null;
  //   token1Decimals = swapPool?.input?.[0]?.decimals;
  // }

  // const check0Address = (input0Address < input1Address)
  //   ? swapPool?.input?.[0]?.input?.addresses?.[chainId]
  //   : swapPool?.input?.[1]?.input?.addresses?.[chainId];

  // const zeroForOne = (check0Address?.toLowerCase?.() === (fromTokenAddress ?? "").toLowerCase());

  // const underlying0Address = swapPool?.input?.[0]?.input?.addresses?.[chainId];
  // let outBToken: Addr = null;
  // let outBpool: any | null = null;

  // if (underlying0Address?.toLowerCase?.() === (fromTokenAddress ?? "").toLowerCase()) {
  //   outBToken = token1Address;
  //   outBpool = swapPool?.input?.[1] ?? null;
  // } else {
  //   outBToken = token0Address;
  //   outBpool = swapPool?.input?.[0] ?? null;
  // }
  const zeroForOne =
    (underlying0AddressNorm?.toLowerCase?.() === (fromAddrNorm ?? "").toLowerCase());                     // PATCH (핵심)

  // 기존: underlying0Address = swapPool.input[0]... (항상 input[0] 기준)  // <-- 사용 안 함
  // PATCH: token0의 underlying 과 일치하면 out 은 token1, 아니면 token0
  let outBToken: Addr = null;
  let outBpool: any | null = null;

  if (underlying0AddressNorm?.toLowerCase?.() === (fromAddrNorm ?? "").toLowerCase()) {                   // PATCH
    outBToken = token1Address;
    outBpool = is0Lower ? swapPool?.input?.[1] : swapPool?.input?.[0];                                     // PATCH: token1 인덱스
  } else {
    outBToken = token0Address;
    outBpool = is0Lower ? swapPool?.input?.[0] : swapPool?.input?.[1];                                     // PATCH: token0 인덱스
  }

  return { poolAddress, zeroForOne, outBToken, outBpool, token0Decimals, token1Decimals };
}
