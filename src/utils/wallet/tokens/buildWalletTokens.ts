import { BigDecimal } from "@/types/BigDecimal";
import { bdToNumber, format2, isZeroBD } from "./calcBigdecimal";
import { buildAddressToMetaMap, AddressedMeta } from "./buildAddressMetaMaps";
import { getUsdPriceFromChainlink } from "./calcWithChainLink";

export type WalletTokenInfo = {
  type?: string;
  address?: string;
  name: string;
  amount: string;
  src?: string;
  usdAmount: string;
};

type Registries = {
  tokens: Record<
    string,
    AddressedMeta & { symbol: string; fullName: string; iconSrc?: string }
  >;
  //singleVaults: Record<string, AddressedMeta & { fullName: string; iconSrc?: string }>;
  lpVaults: Record<
    string,
    AddressedMeta & { fullName: string; iconSrc?: string }
  >;
};

export type AssetsLike = {
  assetValues?: {
    chainLinkPriceMap?: Map<string, { price: BigDecimal }>;
  };
  balances?: {
    tokenBalances?: { balanceMap?: Map<string, BigDecimal> };
    singleVaultBalances?: { balanceMap?: Map<string, BigDecimal> };
    lpVaultBalances?: { balanceMap?: Map<string, BigDecimal> };
    stakedBalances?: {
      byInputTokenAddress?: { balanceMap?: Map<string, BigDecimal> };
      byStakingPoolAddress?: { balanceMap?: Map<string, BigDecimal> };
    };
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
  //const singleMetaByAddr = buildAddressToMetaMap(registries.singleVaults, chainId);
  const lpMetaByAddr = buildAddressToMetaMap(registries.lpVaults, chainId);

  const farmPriceMap = assets.farmValues?.priceMap;
  const farmPriceMapLC = new Map<string, BigDecimal | null>();
  if (farmPriceMap instanceof Map) {
    farmPriceMap.forEach((v, k) => {
      farmPriceMapLC.set(String(k).toLowerCase(), v);
    });
  }
  // 1) LP 볼트
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
        type: "LP",
        address: addr,
        name: fullName ?? "LP Vault",
        amount: format2(amountNum, 5),
        src: iconSrc,
        usdAmount: format2(usdNum, 2),
      });
    });
  }

  // 2) stakedtoken
  const stakedMap = assets?.balances?.stakedBalances?.byInputTokenAddress as
    | Map<
        string,
        {
          token?: {
            fullName?: string;
            inputTokenAddress?: string;
            stakingPoolAddress?: string;
            decimals?: number;
            iconSrc?: string;
          };
          value?: BigDecimal;
        }
      >
    | undefined;
  if (stakedMap instanceof Map) {
    stakedMap.forEach((entry, addrRaw) => {
      const addr = String(addrRaw).toLowerCase();

      const tokenMeta = entry?.token ?? {};
      const balBD = entry?.value;

      if (!(balBD instanceof BigDecimal)) return; // 값 없음
      if (isZeroBD(balBD)) return;

      const displayName = tokenMeta.fullName;
      const iconSrc = tokenMeta.iconSrc;

      const priceBD = farmPriceMapLC?.get(addrRaw) ?? null;
      const amountNum = bdToNumber(balBD);
      const priceNum = bdToNumber(priceBD);
      const usdNum = amountNum * priceNum;
      // console.log("buildWalletTokens addr",addr,farmPriceMap, priceBD)

      out.push({
        type: "staked",
        address: addrRaw,
        name: displayName as string,
        amount: format2(amountNum, 5),
        src: iconSrc,
        usdAmount: format2(usdNum, 2),
      });
    });
  }

  // 3) 일반 토큰
  const tokenBalanceMap = assets.balances?.tokenBalances?.balanceMap;
  if (tokenBalanceMap) {
    tokenBalanceMap.forEach((balBD, addr) => {
      if (isZeroBD(balBD)) return;

      const meta = tokenMetaByAddr.get(addr.toLowerCase());
      if (!meta) return;

      const { fullName, iconSrc, symbol } = meta as any;
      if (!symbol) return;

      const priceBD = getUsdPriceFromChainlink(
        chainLinkPriceMap as any,
        symbol
      );
      const amountNum = bdToNumber(balBD);
      const priceNum = bdToNumber(priceBD);
      const usdNum = amountNum * priceNum;

      out.push({
        type: "token",
        address: addr,
        name: fullName ?? symbol,
        amount: format2(amountNum, 5),
        src: iconSrc,
        usdAmount: format2(usdNum, 2),
      });
    });
  }

  return out;
}
