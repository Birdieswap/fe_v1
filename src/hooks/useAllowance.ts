import { useAccount, useReadContract, UseReadContractReturnType } from "wagmi";
import { erc20Abi } from "viem";
import { useMemo } from "react";

import { IContractBase, IToken } from "@/const/contracts/types/tokenTypes";
import { BigDecimal } from "@/types/BigDecimal";

import useTokenAddress from "./useTokenAddress";

export default function useAllowance(props: {
  token: IToken;
  spender: IContractBase;
}) {
  const { address } = useAccount();
  const tokenAddress = useTokenAddress(props.token);
  const spenderAddress = useTokenAddress(props.spender);

  const query: UseReadContractReturnType<typeof erc20Abi, "allowance"> =
    useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address as `0x${string}`, spenderAddress as `0x${string}`],
    });

  const allowance = useMemo(() => {
    return new BigDecimal(query.data || 0, props.token.decimals);
  }, [query.data, props.token.decimals]);

  return {
    query,
    allowance,
  };
}
