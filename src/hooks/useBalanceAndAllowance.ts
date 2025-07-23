import { erc20Abi } from "viem";
import { useReadContracts, UseReadContractsReturnType } from "wagmi";

export default function useBalanceAndAllowance(props: {
  tokenAddress: `0x${string}`;
  address: `0x${string}`;
}): UseReadContractsReturnType<
  [
    {
      address: `0x${string}`;
      abi: typeof erc20Abi;
      functionName: "balanceOf";
      args: [`0x${string}`];
    },
    {
      address: `0x${string}`;
      abi: typeof erc20Abi;
      functionName: "allowance";
      args: [`0x${string}`, `0x${string}`];
    },
  ]
> {
  return useReadContracts({
    contracts: [
      {
        address: props.tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [props.address],
      },
      {
        address: props.tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [props.address, props.tokenAddress],
      },
    ],
  });
}
