
export type AddressedMeta = {
  addresses: Record<number, `0x${string}`>;
  fullName?: string;
  iconSrc?: string;
  symbol?: string;
};

export function buildAddressToMetaMap<T extends AddressedMeta>(
  registry: Record<string, T>,
  chainId: number
): Map<string, T> {
  const out = new Map<string, T>();
  Object.values(registry).forEach((item) => {
    const addr = item?.addresses?.[chainId];
    if (addr) out.set(addr.toLowerCase(), item);
  });
  return out;
}
