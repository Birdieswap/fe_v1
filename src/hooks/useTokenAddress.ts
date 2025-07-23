import { useMemo } from "react";
import { useChainId } from "wagmi";

import { IContractBase } from "@/const/contracts/types/tokenTypes";
import getTokenAddress from "@/utils/assets/getTokenAddress";

export default function useTokenAddress(token?: IContractBase) {
  const chainId = useChainId();

  return useMemo(() => getTokenAddress({ token, chainId }), [token, chainId]);
}
