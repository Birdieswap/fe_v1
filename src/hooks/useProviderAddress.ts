import { useMemo } from "react";
import { useChainId } from "wagmi";

import { IStakingProvider } from "@/const/contracts/types/tokenTypes";
import getProviderAddress from "@/utils/assets/getProviderAddress";


export default function useProviderAddress(provider?: IStakingProvider) {
  const chainId = useChainId();

  return useMemo(() => getProviderAddress({ provider, chainId }), [provider, chainId]);
}
