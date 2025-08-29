"use client";

import "./WalletTransactions.css";

import { cn, Link } from "@heroui/react";
import Image from "next/image";
import { useContext, useMemo } from "react";

import Icons from "@/assets/icons/icons";
import { timeElapsed } from "@/utils/timeElapsed";
import { setPrecisionString } from "@/utils/setPrecision";
import type { TransactionEvent } from "@/utils/wallet/getMyTransactionData";
import { useChainId } from "wagmi";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { buildTransactions } from "@/utils/wallet/transactions/buildTransactions";
import { getTimeAgoLinux } from "@/utils/farm/getTimeAgoLinux";
import { getBlockExplorerUrl } from "@/utils/farm/getBlockExplorerURL";
import { WalletContext } from "@/app/WalletContextProvider";

export enum TransactionType {
  SWAP = "swap",
  START_FARM = "start_farm",
  STOP_FARM = "stop_farm",
}

export type TransactionTokenInfo = {
  symbol: string;
  amount: string;
  src?: string;
  usdAmount?: string;
};

export type TransactionProps = {
  type: TransactionType;
  hash: string;
  timestamp: string;
} & (
  | {
      type: TransactionType.SWAP;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo;
    }
  | {
      type: TransactionType.START_FARM;
      from: TransactionTokenInfo[];
      to: TransactionTokenInfo;
    }
  | {
      type: TransactionType.STOP_FARM;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo[];
    }
);

function TransactionTokenDisplay(props: { token: TransactionTokenInfo }) {
  return (
    <div className="flex flex-row items-center gap-0">
      {props.token.src && (
        <Image
          alt={props.token.symbol}
          className="mr-1.5 size-4"
          height={16}
          src={props.token.src}
          width={16}
        />
      )}
      <span className="text-[12px] font-medium leading-[15px] text-foreground">
        {props.token.amount} {props.token.symbol}
      </span>
      {props.token.usdAmount && (
        <span className="ml-0.5 text-[12px] font-normal leading-[15px] text-default-800 dark:text-default-700">
          (${" "}
          {setPrecisionString(parseFloat(props.token.usdAmount), 2, true, true)}
          )
        </span>
      )}
    </div>
  );
}

function TokenListDisplay(props: { tokens: TransactionTokenInfo[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {props.tokens.map((token, idx) => (
        <div key={token.symbol} className="flex flex-row items-center gap-1">
          {idx > 0 && <Icons.WalletFarmPlus className="fill-foreground" />}
          <TransactionTokenDisplay token={token} />
        </div>
      ))}
    </div>
  );
}

function SwapDisplay(props: {
  from: TransactionTokenInfo;
  to: TransactionTokenInfo;
  isInnerDisplay?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <TransactionTokenDisplay token={props.from} />
      <div className="mb-0.5 flex flex-row items-center gap-1.5">
        {props.isInnerDisplay ? (
          <Icons.WalletSwapArrowSmall className="fill-foreground" />
        ) : (
          <Icons.WalletSwapArrow className="fill-foreground" />
        )}
        <TransactionTokenDisplay token={props.to} />
      </div>
    </div>
  );
}

function BaseTransactionItem(props: TransactionProps) {
  const chainId = useChainId();
  const explorerURL = getBlockExplorerUrl(chainId);
  const title = useMemo(() => {
    switch (props.type) {
      case TransactionType.SWAP:
        return "Swap";
      case TransactionType.START_FARM:
        return "Start Farming";
      case TransactionType.STOP_FARM:
        return "Stop Farming";
    }
  }, [props.type]);

  return (
    <Link href={`${explorerURL}/tx/${props.hash}`} target="_blank">
      <div
        className={cn(
          "group flex flex-col p-4 max-sm:px-6 gap-3 w-full",
          "hover:bg-default-200 dark:hover:bg-default-100 transition-background"
        )}
      >
        <div className={cn("flex flex-row items-center gap-1.5 w-full")}>
          <div className="flex grow flex-col items-start gap-1">
            <h2 className="flex flex-row items-center gap-1 text-[15px] font-medium leading-[18px]">
              {props.type === TransactionType.SWAP && (
                <Icons.WalletTitleSwap className="fill-foreground" />
              )}
              {props.type === TransactionType.START_FARM && (
                <Icons.WalletTitleStartFarm
                  className="fill-foreground"
                  fillRule="evenodd"
                />
              )}
              {props.type === TransactionType.STOP_FARM && (
                <Icons.WalletTitleStopFarm className="fill-foreground stroke-foreground stroke-[0.3px]" />
              )}
              {title}
            </h2>
            <span className="text-[12px] leading-[15px] text-default-800 dark:text-default-700">
              {props.hash.slice(0, 42)}...
            </span>
          </div>
          <div className="flex flex-row items-center gap-2">
            <span className="text-[14px] font-medium leading-[17px] text-default-800 dark:text-default-700">
              {getTimeAgoLinux(props.timestamp)}
            </span>
            {/* {props.success ? (
            <Icons.WalletTxOk className="fill-primary text-background dark:fill-dark_green_key" />
          ) : (
            <Icons.WalletTxError className="text-default-800 dark:text-default-700" />
          )} */}
          </div>
        </div>
        {props.type === TransactionType.SWAP && <SwapItem {...props} />}
        {props.type === TransactionType.START_FARM && (
          <StartFarmItem {...props} />
        )}
        {props.type === TransactionType.STOP_FARM && (
          <StopFarmItem {...props} />
        )}
      </div>
    </Link>
  );
}

function SwapItem(props: TransactionProps & { type: TransactionType.SWAP }) {
  return (
    <div className="wallet-tx-details-container">
      <SwapDisplay from={props.from} to={props.to} />
    </div>
  );
}
function StartFarmItem(
  props: TransactionProps & { type: TransactionType.START_FARM }
) {
  const listLength = props.from.length;
  const isSingleToken = listLength === 1;

  return (
    <div className="wallet-tx-details-container">
      <TokenListDisplay tokens={props.from} />
      <div
        className="flex flex-row items-center gap-1.5 data-[single=false]:pt-1 data-[single=true]:pt-0"
        data-single={isSingleToken}
      >
        <Icons.WalletSwapArrow className="fill-foreground" />
        <TransactionTokenDisplay token={props.to} />
      </div>
    </div>
  );
}
function StopFarmItem(
  props: TransactionProps & { type: TransactionType.STOP_FARM }
) {
  const listLength = props.to.length;
  const isSingleToken = listLength === 1;

  return (
    <div className="wallet-tx-details-container">
      <TransactionTokenDisplay token={props.from} />
      <div
        className="flex flex-row items-start gap-1.5 data-[single=false]:pt-1 data-[single=true]:pt-0"
        data-single={isSingleToken}
      >
        <Icons.WalletSwapArrow className="fill-foreground" />
        <div className="my-0.5">
          <TokenListDisplay tokens={props.to} />
        </div>
      </div>
    </div>
  );
}

// const transactions: TransactionProps[] = [
//   {
//     type: TransactionType.SWAP,
//     hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
//     timestamp: Date.now() - 1000,
//     from: {
//       symbol: "USDC.e",
//       amount: "3603",
//       src: "/tokens/USDC.svg",
//       usdAmount: "3583",
//     },
//     to: {
//       symbol: "WETH",
//       amount: "1.02",
//       src: "/tokens/WETH.svg",
//       usdAmount: "3574",
//     },
//   },
//   {
//     type: TransactionType.START_FARM,
//     hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
//     timestamp: Date.now() - 1000 * 60 * 60 * 2,
//     from: [
//       {
//         symbol: "USDC.e",
//         amount: "3603",
//         src: "/tokens/USDC.svg",
//         usdAmount: "3583",
//       },
//       {
//         symbol: "WETH",
//         amount: "1.02",
//         src: "/tokens/WETH.svg",
//         usdAmount: "3583",
//       },
//     ],
//     to: {
//       symbol: "blpUSDC.e_WETH_v1",
//       amount: "5.532",
//     },
//   },
//   {
//     type: TransactionType.STOP_FARM,
//     hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
//     timestamp: Date.now() - 1000 * 60 * 60 * 24,
//     from: {
//       symbol: "blpUSDC.e_WETH_v1",
//       amount: "5.532",
//     },
//     to: [
//       {
//         symbol: "USDC.e",
//         amount: "3603",
//         src: "/tokens/USDC.svg",
//         usdAmount: "3583",
//       },
//       {
//         symbol: "WETH",
//         amount: "1.02",
//         src: "/tokens/WETH.svg",
//         usdAmount: "3583",
//       },
//     ],
//   },
// ];

// const TransactionInfo: TransactionEvent[] = [
//   {
//     type: "Swap",
//     blockNumber: "9078230",
//     blockTimestamp: "1756337268",
//     transactionHash:
//       "0x524c943abc0a3509f91f99aaf89fe437c9d419744e813f366b789658b2d2af33",
//     transactionIndex: "3",
//     data: {
//       tokenIn: "0x5b1B56533128A23b8908d58f32Ee05b65ecF9FFF",
//       feeTier: "3000",
//       tokenOut: "0x25554f552a72d1263a868d8be2bc50096b2953eb",
//       amountIn: "40000000000",
//       amountOut: "42734412",
//       refereeAddress: "0xd91cd0ca18a6eca59ee52adb98fb90833bea6da5",
//     },
//   },
//   {
//     type: "DualDeposit",
//     chainId: "11155111",
//     blockNumber: "9078213",
//     blockTimestamp: "1756337052",
//     transactionHash:
//       "0x98af063f628622aa211034575e4942aea94e0d2b9893ec5ef16fbdd85974c7c4",
//     transactionIndex: "18",
//     vaultName: "bcbBTCUSDC",
//     data: {
//       owner: "0xd91cd0ca18a6eca59ee52adb98fb90833bea6da5",
//       Token0Address: "0x5b1B56533128A23b8908d58f32Ee05b65ecF9FFF",
//       Token0Amount: "90026322550",
//       Token1Address: "0x25554f552a72D1263a868D8BE2BC50096b2953Eb",
//       Token1Amount: "99804269",
//       blpTokenAddress: "0x2d6de1c6ccc4fa91188773df66c357b5b2bb407c",
//       blpTokenAmount: "2997144541",
//     },
//   },
//   {
//     type: "DualWithdraw",
//     chainId: "11155111",
//     blockNumber: "9036326",
//     blockTimestamp: "1755825624",
//     transactionHash:
//       "0x9c9410b3254a696fe2a4f4779022a5cf15d2996672efef8d0bc183623d5c4fae",
//     transactionIndex: "17",
//     vaultName: "bcbBTCUSDC",
//     data: {
//       receiver: "0xd91cd0ca18a6eca59ee52adb98fb90833bea6da5",
//       blpTokenAddress: "0x2d6de1c6ccc4fa91188773df66c357b5b2bb407c",
//       blpTokenAmount: "6869989812",
//       Token0Address: "0x5b1B56533128A23b8908d58f32Ee05b65ecF9FFF",
//       Token0Amount: "231957553055",
//       Token1Address: "0x25554f552a72D1263a868D8BE2BC50096b2953Eb",
//       Token1Amount: "203471537",
//     },
//   },
// ];

export default function WalletTransactions() {
  const chainId = useChainId();
  const { assetValues } = useContext(AssetsContext);
  const { walletData } = useContext(WalletContext);
  const TransactionInfo = walletData?.transactions;

  if (!TransactionInfo) return;

  const transactions: TransactionProps[] = useMemo(
    () =>
      buildTransactions(
        TransactionInfo,
        chainId,
        assetValues?.chainLinkPriceMap
      ),
    [TransactionInfo, chainId, assetValues?.chainLinkPriceMap]
  );
  console.log("WalletTransactions", transactions);
  return (
    <div className="flex w-full grow flex-col gap-0 p-0">
      {transactions.length === 0 ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyTx className="fill-light_mid_mint_2 stroke-light_mid_mint_2 dark:fill-dark_empty_state dark:stroke-dark_empty_state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            No recent transactions
          </span>
        </div>
      ) : (
        transactions.map((tx, i) => <BaseTransactionItem key={i} {...tx} />)
      )}
    </div>
  );
}
