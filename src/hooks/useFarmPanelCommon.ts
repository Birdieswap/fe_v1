import { useContext } from "react";
import { useAccount, useChainId, useClient, useWriteContract } from "wagmi";

import { TransactionContext } from "@/app/TransactionContextProvider";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { Farm } from "@/types/FarmListTableRowProps";

import useTokenAddress from "./useTokenAddress";

export default function useFarmPanelCommon<T extends Farm>(item: T) {
  const client = useClient();
  const transactionContext = useContext(TransactionContext);
  const assetsContext = useContext(AssetsContext);
  const { writeContract, isPending: isPendingWriteContract } =
    useWriteContract();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isWrongNetwork = chainId !== 11155111 && chainId !== 9998453; // TODO: allow mainnet and other networks

  const stakeToken = item.wip_stakeToken;
  const stakeTokenAddress = useTokenAddress(stakeToken);

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
  };
}
