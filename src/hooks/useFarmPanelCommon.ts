import { useContext } from "react";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";

import { TransactionContext } from "@/app/TransactionContextProvider";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { Farm } from "@/types/FarmListTableRowProps";

import useTokenAddress from "./useTokenAddress";
import useProviderAddress from "./useProviderAddress";
import useIsWrongNetwork from "./useIsWrongNetwork";

export default function useFarmPanelCommon<T extends Farm>(item: T) {
  const client = usePublicClient();
  const transactionContext = useContext(TransactionContext);
  const assetsContext = useContext(AssetsContext);
  const { writeContract, isPending: isPendingWriteContract } =
    useWriteContract();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isWrongNetwork = useIsWrongNetwork(chainId); // TODO: allow mainnet and other networks
  //sepolia chainId = 11155111, BaseFork = 9998453
  const stakeToken = item.wip_stakeToken;
  const stakeTokenAddress = useTokenAddress(stakeToken);
  const routerAddress = useProviderAddress(stakeToken.provider);

  return {
    client,
    transactionContext,
    writeContract,
    isPendingWriteContract,
    address,
    isConnected,
    chainId,
    isWrongNetwork,
    assetsContext,
    stakeToken: stakeToken as T["wip_stakeToken"],
    stakeTokenAddress,
    routerAddress,
  };
}
