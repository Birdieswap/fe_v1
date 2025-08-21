
import { BigDecimal } from "@/types/BigDecimal";
import { bdToNumber, format2, isZeroBD } from "./calcBigdecimal";
import { buildAddressToMetaMap, AddressedMeta } from "./buildAddressMetaMaps";
import { getUsdPriceFromChainlink } from "./calcwithChainLink";

export type WalletTokenInfo = {
  name: string;
  amount: string;   // 2자리 반올림 문자열
  src?: string;
  usdAmount: string; // 2자리 반올림 문자열
};

type Registries = {
  tokens: Record<string, AddressedMeta & { symbol: string; fullName: string; iconSrc?: string }>;
  singleVaults: Record<string, AddressedMeta & { fullName: string; iconSrc?: string }>;
  lpVaults: Record<string, AddressedMeta & { fullName: string; iconSrc?: string }>;
};

type AssetsLike = {
  assetValues?: {
    chainLinkPriceMap?: Map<string, { price: BigDecimal }>;
  };
  balances?: {
    tokenBalances?: { balanceMap?: Map<string, BigDecimal> };
    singleVaultBalances?: { balanceMap?: Map<string, BigDecimal> };
    lpVaultBalances?: { balanceMap?: Map<string, BigDecimal> };
  };
  farmValues?: {
    priceMap?: Map<string, BigDecimal | null>;
  };
};

export function buildWalletTokens(
  assets: AssetsLike,
  registries: Registries,
  chainId: number
): WalletTokenInfo[] {
  const out: WalletTokenInfo[] = [];
  if (!assets) return out;

  const chainLinkPriceMap = assets.assetValues?.chainLinkPriceMap ?? new Map();

  // 주소 → 메타 맵 생성
  const tokenMetaByAddr = buildAddressToMetaMap(registries.tokens, chainId);
  const singleMetaByAddr = buildAddressToMetaMap(registries.singleVaults, chainId);
  const lpMetaByAddr = buildAddressToMetaMap(registries.lpVaults, chainId);

  // 1) 일반 토큰
  const tokenBalanceMap = assets.balances?.tokenBalances?.balanceMap;
  if (tokenBalanceMap) {
    tokenBalanceMap.forEach((balBD, addr) => {
      if (isZeroBD(balBD)) return;

      const meta = tokenMetaByAddr.get(addr.toLowerCase());
      if (!meta) return;

      const { fullName, iconSrc, symbol } = meta as any;
      if (!symbol) return;

      const priceBD = getUsdPriceFromChainlink(chainLinkPriceMap as any, symbol);
      const amountNum = bdToNumber(balBD);
      const priceNum = bdToNumber(priceBD);
      const usdNum = amountNum * priceNum;

      out.push({
        name: fullName ?? symbol,
        amount: format2(amountNum),
        src: iconSrc,
        usdAmount: format2(usdNum),
      });
    });
  }

  // 2) 싱글 볼트
  const singleBalanceMap = assets.balances?.singleVaultBalances?.balanceMap;
  const farmPriceMap = assets.farmValues?.priceMap;
  if (singleBalanceMap) {
    singleBalanceMap.forEach((balBD, addr) => {
      if (isZeroBD(balBD)) return;

      const meta = singleMetaByAddr.get(addr.toLowerCase());
      if (!meta) return;

      const { fullName, iconSrc } = meta as any;

      const priceBD = farmPriceMap?.get(addr) ?? null;
      const amountNum = bdToNumber(balBD);
      const priceNum = bdToNumber(priceBD);
      const usdNum = amountNum * priceNum;

      out.push({
        name: fullName ?? "Single Vault",
        amount: format2(amountNum),
        src: iconSrc,
        usdAmount: format2(usdNum),
      });
    });
  }

  // 3) LP 볼트
  const lpBalanceMap = assets.balances?.lpVaultBalances?.balanceMap;
  if (lpBalanceMap) {
    lpBalanceMap.forEach((balBD, addr) => {
      if (isZeroBD(balBD)) return;

      const meta = lpMetaByAddr.get(addr.toLowerCase());
      if (!meta) return;

      const { fullName, iconSrc } = meta as any;

      const priceBD = farmPriceMap?.get(addr) ?? null;
      const amountNum = bdToNumber(balBD);
      const priceNum = bdToNumber(priceBD);
      const usdNum = amountNum * priceNum;

      out.push({
        name: fullName ?? "LP Vault",
        amount: format2(amountNum),
        src: iconSrc,
        usdAmount: format2(usdNum),
      });
    });
  }

  return out;
}
