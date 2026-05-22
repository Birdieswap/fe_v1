import tokensDefault from "@/const/contracts/tokens/tokens";
import { BigDecimal } from "@/types/BigDecimal";

// 필요한 최소 타입만 남김
export type RewardRow = {
  name: string;      // 예: "WETH"
  amount: string;    // 예: "0.00678" (decimals 완전 반영 + 뒤 0 제거)
  iconSrc?: string;
  usdAmount: string; // 예: "31.012345678" (decimals 합 반영 + 뒤 0 제거)
};

export type RewardRaw = {
  address: string;
  symbol: string;
  decimals: number;
  iconSrc?: string;

  // 필요하면 원본 BD 유지(하위 로직에서 안 쓰면 제거 가능)
  amountBD?: BigDecimal;
  priceBD?: BigDecimal;

  // “정확 문자열”(라운딩 X, 뒤 0 제거)
  amountExact?: string;
  usdExact?: string;
};

// ---- 최소 헬퍼들만 유지 ----
const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const normalizeAddress = (addr?: string) =>
  (addr ? addr.toLowerCase() : "");

/** 정수(raw) + decimals → BigDecimal (이중 스케일링 금지) */
function bdFromRaw(raw: string | number | bigint, decimals: number): BigDecimal {
  return new BigDecimal(BigInt(Number(raw)), decimals);
}

/** tokens에서 체인ID/주소로 심볼/decimals/iconSrc/정규화주소 획득 */
function findTokenMeta(
  tokenAddress: string,
  chainId: number,
  tokensOverride?: any
): { symbol: string; decimals: number; iconSrc?: string; address: string } | null {
  const addrL = normalizeAddress(tokenAddress);
  const source = tokensOverride ?? tokensDefault;
  const list: any[] = Array.isArray(source) ? source : Object.values(source);

  for (const t of list) {
    const byChain =
      t?.addresses?.[chainId] ??
      t?.address?.[chainId] ??
      t?.chains?.[chainId] ??
      t?.address;

    const resolvedAddr = typeof byChain === "string" ? byChain : undefined;
    if (resolvedAddr && normalizeAddress(resolvedAddr) === addrL) {
      return {
        symbol: t.symbol ?? t.ticker ?? t.name ?? "UNKNOWN",
        decimals: t.decimals ?? t.tokenDecimals ?? 18,
        iconSrc: t.iconSrc ?? t.icon ?? t.logoURI,
        address: resolvedAddr,
      };
    }
  }
  return null;
}

/** Map | Record | Array 지원 → 배열로 정규화 */
function normalizeToArray(
  src:
    | Map<string, { base: { addresses: Record<number, string> }; price: any }>
    | Record<string, { base: { addresses: Record<number, string> }; price: any }>
    | Array<{ base: { addresses: Record<number, string> }; price: any }>
    | undefined
) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (src instanceof Map) return Array.from(src.values());
  if (typeof src === "object") return Object.values(src);
  return [];
}

/** 가격(meta) 추출 (BigDecimal 또는 {value,decimals} 형태) */
function extractPriceMetaFromItem(item: any): { value: string; decimals: number } | null {
  const p = item?.price;
  if (!isObj(p)) return null;

  if (p instanceof BigDecimal) {
    const { value, decimals } = p as unknown as { value: bigint; decimals: number };
    return { value: String(value), decimals };
  }

  if ("value" in p && "decimals" in p) {
    const val = (p as any).value;
    const dec = Number((p as any).decimals);
    if (val == null || Number.isNaN(dec)) return null;
    return { value: String(val), decimals: dec };
  }

  return null;
}

/** 가격 메타 조회: base.addresses[chainId]가 tokenAddress와 같은 항목 찾기 */
function findChainlinkPriceMetaFromMap(
  tokenAddress: string,
  chainId: number,
  chainLinkPriceMap:
    | Map<string, any>
    | Record<string, any>
    | Array<any>
    | undefined
): { value: string; decimals: number } | null {
  const items = normalizeToArray(chainLinkPriceMap);
  const addrL = normalizeAddress(tokenAddress);

  for (const raw of items) {
    const a = raw?.base?.addresses?.[chainId];
    if (typeof a !== "string" || normalizeAddress(a) !== addrL) continue;

    const meta = extractPriceMetaFromItem(raw);
    if (meta) return meta;
  }
  return null;
}

// ---- 메인 ----
export function getRewardsTotal(
  swapRewards: Record<string, string>,       // { [tokenAddr]: "amountRaw" }
  chainId: number,
  chainLinkPriceMap:
    | Map<string, any>
    | Record<string, any>
    | Array<any>
    | undefined,
  tokensOverride?: any
): { rows: RewardRow[]; raw: RewardRaw[] } {
  const rows: RewardRow[] = [];
  const raw: RewardRaw[] = [];

  for (const [addr, amountRaw] of Object.entries(swapRewards || {})) {
    const meta = findTokenMeta(addr, chainId, tokensOverride ?? tokensDefault);
    if (!meta) continue;

    // 입력 raw 그대로 + 토큰 decimals로 BigDecimal 생성 (이중 스케일 금지)
    const amountBD = bdFromRaw(amountRaw, meta.decimals);
    const amountExact = amountBD.toPrecisionString(true, false); // 예: "0.00678"
    console.log("getRewardsTotal", amountRaw, meta.decimals, amountBD)
    // 가격 BD도 raw/decimals 그대로
    const priceMeta = findChainlinkPriceMetaFromMap(addr, chainId, chainLinkPriceMap);
    const priceBD = priceMeta ? bdFromRaw(priceMeta.value, priceMeta.decimals) : undefined;

    // USD: amountBD * priceBD → decimals 합을 반영한 정확 문자열 + 뒤 0 제거
    const usdExact = priceBD ? (amountBD.mul(priceBD)).roundToDecimals(3).toPrecisionString(true, false)  : "0";

    raw.push({
      address: meta.address,
      symbol: meta.symbol,
      decimals: meta.decimals,
      iconSrc: meta.iconSrc,

      // 필요 시 유지, 안 쓰면 프로젝트에서 제거 가능
      amountBD,
      priceBD,

      amountExact,           // 예: "0.00678"
      usdExact: priceBD ? usdExact : undefined,
    });

    rows.push({
      name: meta.symbol,
      amount: amountExact,
      iconSrc: meta.iconSrc,
      usdAmount: usdExact,
    });
  }

  return { rows, raw };
}