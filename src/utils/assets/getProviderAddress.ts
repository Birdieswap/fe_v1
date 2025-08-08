import { IStakingProvider } from "@/const/contracts/types/tokenTypes";

export default function getProviderAddress(props: {
  provider?: IStakingProvider;
  chainId: number;
}): `0x${string}` | null {
  const { provider, chainId } = props;

  if (!provider || !chainId) return null;

  const address = provider.addresses[chainId];

  if (!address) return null;

  return address;
}
