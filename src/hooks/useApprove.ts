import { Client } from "viem";
import { useCallback } from "react";
import { WriteContractMutate } from "wagmi/query";
import { Config, useChainId } from "wagmi";

import {
  ApproveTransactionProps,
  TransactionContextType,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { getWriteTransactionHandlers } from "@/utils/handleWriteTransaction";
import { TransactionType } from "@/types/TransactionTypes";
import { IContractBase, IToken } from "@/const/contracts/types/tokenTypes";
import getTokenAddress from "@/utils/assets/getTokenAddress";

export default function useApprove(props: {
  pool: IContractBase;
  poolAddress: `0x${string}`;
  routerAddress: `0x${string}`;
  client?: Client;
  transactionContext: TransactionContextType;
  writeContract: WriteContractMutate<Config, unknown>;
  refetch?: () => Promise<unknown>;
}) {

  const chainId = useChainId();
  const approve = useCallback(
    (token: IToken) => {
      if (!token || !chainId) {
        return;
      }
      const tokenAddress = getTokenAddress({
        token: token,
        chainId,
      });
      console.log("tokenAddress",tokenAddress);
      const transactionProps: TransactionStatusProps & ApproveTransactionProps =
        {
          transactionType: TransactionType.APPROVE,
          chainId,
          input: token,
        };
      const handler = getWriteTransactionHandlers({
        client: props.client,
        transactionContext: props.transactionContext,
        transactionProps: transactionProps,
        refetch: props.refetch,
      });

      props.writeContract(
        {
          address: tokenAddress as `0x${string}`,
          abi: token.abi,
          functionName: "approve",
          args: [
            props.routerAddress as `0x${string}`,
            BigInt(
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            ),
          ],
        },
        handler,
      );
    },
    [chainId, props],
  );

  return approve;
}
