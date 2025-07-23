import { IContractBase } from "@/const/contracts/types/tokenTypes";

export default function getTokenAddress(props: {
  token?: IContractBase;
  chainId: number;
}): `0x${string}` | null {
  const { token, chainId } = props;

  if (!token || !chainId) return null;

  const address = token.addresses[chainId];

  if (!address) return null;

  return address;
}
