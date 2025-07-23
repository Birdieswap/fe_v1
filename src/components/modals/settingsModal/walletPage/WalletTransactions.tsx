"use client";

import "./WalletTransactions.css";

import { cn } from "@heroui/react";
import Image from "next/image";
import { useMemo } from "react";

import Icons from "@/assets/icons/icons";
import { timeElapsed } from "@/utils/timeElapsed";
import { setPrecisionString } from "@/utils/setPrecision";

export enum TransactionType {
  SWAP = "swap",
  START_FARM = "start_farm",
  STOP_FARM = "stop_farm",
  START_FARM_SWAP = "start_farm_swap",
  STOP_FARM_SWAP = "stop_farm_swap",
  TRANSACTION = "transaction",
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
  timestamp: number;
  success: boolean;
} & (
  | {
      type: TransactionType.SWAP;
      success: true;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo;
      slippage: string;
    }
  | {
      type: TransactionType.START_FARM;
      success: true;
      from: TransactionTokenInfo[];
      to: TransactionTokenInfo;
    }
  | {
      type: TransactionType.STOP_FARM;
      success: true;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo[];
    }
  | {
      type: TransactionType.START_FARM_SWAP;
      success: true;
      from: TransactionTokenInfo;
      swapFrom: TransactionTokenInfo;
      swapTo: TransactionTokenInfo;
      afterSwap: [TransactionTokenInfo, TransactionTokenInfo];
      to: TransactionTokenInfo;
      slippage: string;
    }
  | {
      type: TransactionType.STOP_FARM_SWAP;
      success: true;
      from: TransactionTokenInfo;
      beforeSwap: [TransactionTokenInfo, TransactionTokenInfo];
      swapFrom: TransactionTokenInfo;
      swapTo: TransactionTokenInfo;
      to: TransactionTokenInfo;
      slippage: string;
    }
  | {
      type: TransactionType.TRANSACTION;
      success: true;
    }
  | {
      success: false;
    }
  | never
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
  slippage: string;
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
      <div
        className={cn(
          "flex flex-row gap-0.5 text-[11px] leading-[13px] px-3 py-1 text-foreground w-fit",
          "rounded-full border-1",
          "border-default-300 bg-background text-default-800",
          "dark:border-default-100 dark:bg-dark_popup_bg dark:text-default-300",
          "data-[inner=true]:border-0 dark:data-[inner=true]:bg-background dark:data-[inner=true]:text-default-200",
          "data-[inner=true]:text-default-800",
          "data-[inner=true]:bg-default-300",
        )}
        data-inner={props.isInnerDisplay}
      >
        <span className="font-medium">Slippage</span>
        <span className="font-normal">{props.slippage}%</span>
      </div>
    </div>
  );
}

function BaseTransactionItem(props: TransactionProps) {
  const title = useMemo(() => {
    switch (props.type) {
      case TransactionType.SWAP:
        return "Swap";
      case TransactionType.START_FARM:
        return "Start Farming";
      case TransactionType.STOP_FARM:
        return "Stop Farming";
      case TransactionType.START_FARM_SWAP:
        return "Start Farming";
      case TransactionType.STOP_FARM_SWAP:
        return "Stop Farming";
      default:
        return "Transaction";
    }
  }, [props.type]);

  return (
    <div
      className={cn(
        "group flex flex-col p-4 max-sm:px-6 gap-3 w-full",
        "hover:bg-default-200 dark:hover:bg-default-100 transition-background",
      )}
    >
      <div
        className={cn("flex flex-row items-center gap-1.5 w-full")}
        data-success={props.success}
      >
        <div className="flex grow flex-col items-start gap-1">
          <h2 className="flex flex-row items-center gap-1 text-[15px] font-medium leading-[18px]">
            {props.type === TransactionType.SWAP && (
              <Icons.WalletTitleSwap className="fill-foreground" />
            )}
            {(props.type === TransactionType.START_FARM ||
              props.type === TransactionType.START_FARM_SWAP) && (
              <Icons.WalletTitleStartFarm
                className="fill-foreground"
                fillRule="evenodd"
              />
            )}
            {(props.type === TransactionType.STOP_FARM ||
              props.type === TransactionType.STOP_FARM_SWAP) && (
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
            {timeElapsed(props.timestamp)}
          </span>
          {props.success ? (
            <Icons.WalletTxOk className="fill-primary text-background dark:fill-dark_green_key" />
          ) : (
            <Icons.WalletTxError className="text-default-800 dark:text-default-700" />
          )}
        </div>
      </div>
      {props.type === TransactionType.SWAP && props.success && (
        <SwapItem {...props} />
      )}
      {props.type === TransactionType.START_FARM && props.success && (
        <StartFarmItem {...props} />
      )}
      {props.type === TransactionType.STOP_FARM && props.success && (
        <StopFarmItem {...props} />
      )}
      {props.type === TransactionType.START_FARM_SWAP && props.success && (
        <StartFarmSwapItem {...props} />
      )}
      {props.type === TransactionType.STOP_FARM_SWAP && props.success && (
        <StopFarmSwapItem {...props} />
      )}
      {props.type === TransactionType.TRANSACTION && props.success && (
        <DefaultTransactionItem {...props} />
      )}
    </div>
  );
}

function DefaultTransactionItem(
  props: TransactionProps & {
    type: TransactionType.TRANSACTION;
  },
) {
  return (
    <div className="flex flex-row items-center gap-1.5 bg-default-200 p-4">
      <div className="flex grow flex-col items-start gap-1">
        <p>Transaction</p>
        <p>{props.hash}</p>
      </div>
      <div className="flex flex-row items-center gap-2">
        <p>{timeElapsed(props.timestamp)}</p>
        {props.success ? (
          <Icons.WalletTxOk className="fill-default-800" />
        ) : (
          <Icons.WalletTxError className="fill-default-800" />
        )}
      </div>
    </div>
  );
}

function SwapItem(
  props: TransactionProps & { type: TransactionType.SWAP; success: true },
) {
  return (
    <div className="wallet-tx-details-container">
      <SwapDisplay from={props.from} slippage={props.slippage} to={props.to} />
    </div>
  );
}
function StartFarmItem(
  props: TransactionProps & { type: TransactionType.START_FARM; success: true },
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
  props: TransactionProps & { type: TransactionType.STOP_FARM; success: true },
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
function StartFarmSwapItem(
  props: TransactionProps & {
    type: TransactionType.START_FARM_SWAP;
    success: true;
  },
) {
  return (
    <div className="wallet-tx-details-container">
      <TransactionTokenDisplay token={props.from} />
      <div className="wallet-tx-farm-swap-container">
        <div className="wallet-tx-farm-swap-item">
          <div className="wallet-tx-farm-swap-title">
            <Icons.WalletTxDetailsSwap
              className="fill-default-800 dark:fill-default-700"
              fillRule="evenodd"
            />
            <span>Swap</span>
          </div>
          <div className="flex flex-row gap-3 pl-2">
            <div className="wallet-tx-farm-swap-bar" />
            <SwapDisplay
              isInnerDisplay
              from={props.swapFrom}
              slippage={props.slippage}
              to={props.swapTo}
            />
          </div>
        </div>
        <div className="wallet-tx-farm-swap-item">
          <div className="wallet-tx-farm-swap-title">
            <Icons.WalletTxDetailsStart
              className="fill-default-800 dark:fill-default-700"
              fillRule="evenodd"
            />
            <span>Start Farming</span>
          </div>
          <div className="flex flex-row pl-5">
            <TokenListDisplay tokens={props.afterSwap} />
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-1.5">
        <Icons.WalletSwapArrow className="fill-foreground" />
        <TransactionTokenDisplay token={props.to} />
      </div>
    </div>
  );
}

function StopFarmSwapItem(
  props: TransactionProps & {
    type: TransactionType.STOP_FARM_SWAP;
    success: true;
  },
) {
  return (
    <div className="wallet-tx-details-container">
      <TransactionTokenDisplay token={props.from} />
      <div className="flex flex-row items-start gap-1.5">
        <Icons.WalletSwapArrow className="fill-foreground" />
        <TokenListDisplay tokens={props.beforeSwap} />
      </div>
      <div className="wallet-tx-farm-swap-container">
        <div className="wallet-tx-farm-swap-item">
          <div className="wallet-tx-farm-swap-title">
            <Icons.WalletTxDetailsSwap
              className="fill-default-800 dark:fill-default-700"
              fillRule="evenodd"
            />
            <span>Swap</span>
          </div>
          <div className="flex flex-row gap-3 pl-2">
            <div className="wallet-tx-farm-swap-bar" />
            <SwapDisplay
              isInnerDisplay
              from={props.swapFrom}
              slippage={props.slippage}
              to={props.swapTo}
            />
          </div>
        </div>
        <div className="wallet-tx-farm-swap-item">
          <div className="wallet-tx-farm-swap-title">
            <Icons.WalletTxDetailsStop
              className="fill-default-800 dark:fill-default-700"
              fillRule="evenodd"
            />
            <span>Stop Farming</span>
          </div>
          <div className="flex flex-row pl-5">
            <TransactionTokenDisplay token={props.to} />
          </div>
        </div>
      </div>
    </div>
  );
}

const transactions: TransactionProps[] = [
  {
    type: TransactionType.TRANSACTION,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    success: false,
  },
  {
    type: TransactionType.SWAP,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000,
    success: true,
    from: {
      symbol: "USDC.e",
      amount: "3603",
      src: "/tokens/USDC.svg",
      usdAmount: "3583",
    },
    to: {
      symbol: "WETH",
      amount: "1.02",
      src: "/tokens/WETH.svg",
      usdAmount: "3574",
    },
    slippage: "0.2511",
  },
  {
    type: TransactionType.SWAP,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    success: false,
  },
  {
    type: TransactionType.START_FARM,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    success: true,
    from: [
      {
        symbol: "USDC.e",
        amount: "3603",
        src: "/tokens/USDC.svg",
        usdAmount: "3583",
      },
    ],
    to: {
      symbol: "bUSDC.e_v1",
      amount: "5.532",
    },
  },
  {
    type: TransactionType.STOP_FARM,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    success: true,
    from: {
      symbol: "bUSDC.e_v1",
      amount: "5.532",
    },
    to: [
      {
        symbol: "USDC.e",
        amount: "3603",
        src: "/tokens/USDC.svg",
        usdAmount: "3583",
      },
    ],
  },
  {
    type: TransactionType.START_FARM,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    success: false,
  },
  {
    type: TransactionType.STOP_FARM,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 360,
    success: false,
  },
  {
    type: TransactionType.START_FARM,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    success: true,
    from: [
      {
        symbol: "USDC.e",
        amount: "3603",
        src: "/tokens/USDC.svg",
        usdAmount: "3583",
      },
      {
        symbol: "WETH",
        amount: "1.02",
        src: "/tokens/WETH.svg",
        usdAmount: "3583",
      },
    ],
    to: {
      symbol: "blpUSDC.e_WETH_v1",
      amount: "5.532",
    },
  },
  {
    type: TransactionType.STOP_FARM,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    success: true,
    from: {
      symbol: "blpUSDC.e_WETH_v1",
      amount: "5.532",
    },
    to: [
      {
        symbol: "USDC.e",
        amount: "3603",
        src: "/tokens/USDC.svg",
        usdAmount: "3583",
      },
      {
        symbol: "WETH",
        amount: "1.02",
        src: "/tokens/WETH.svg",
        usdAmount: "3583",
      },
    ],
  },
  {
    type: TransactionType.START_FARM_SWAP,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    success: true,
    from: {
      symbol: "USDC.e",
      amount: "7200",
      src: "/tokens/USDC.svg",
      usdAmount: "7168.51",
    },
    swapFrom: {
      symbol: "USDC.e",
      amount: "3603",
      src: "/tokens/USDC.svg",
      usdAmount: "3583",
    },
    swapTo: {
      symbol: "WETH",
      amount: "1.02",
      src: "/tokens/WETH.svg",
      usdAmount: "3574",
    },
    slippage: "0.2511",
    afterSwap: [
      {
        symbol: "USDC.e",
        amount: "3597",
        src: "/tokens/USDC.svg",
        usdAmount: "3574",
      },
      {
        symbol: "WETH",
        amount: "1.02",
        src: "/tokens/WETH.svg",
        usdAmount: "3574",
      },
    ],
    to: {
      symbol: "blpUSDC.e_WETH_v1",
      amount: "5.532",
    },
  },
  {
    type: TransactionType.STOP_FARM_SWAP,
    hash: "0x1234123412341234123412341234123412341234123412341234123412341234",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    success: true,
    from: {
      symbol: "blpUSDC.e_WETH_v1",
      amount: "5.532",
    },
    to: {
      symbol: "USDC.e",
      amount: "7200",
      src: "/tokens/USDC.svg",
      usdAmount: "7168.51",
    },
    beforeSwap: [
      {
        symbol: "USDC.e",
        amount: "3597",
        src: "/tokens/USDC.svg",
        usdAmount: "3574",
      },
      {
        symbol: "WETH",
        amount: "1.02",
        src: "/tokens/WETH.svg",
        usdAmount: "3574",
      },
    ],
    swapFrom: {
      symbol: "WETH",
      amount: "1.02",
      src: "/tokens/WETH.svg",
      usdAmount: "3574",
    },
    swapTo: {
      symbol: "USDC.e",
      amount: "3603",
      src: "/tokens/USDC.svg",
      usdAmount: "3583",
    },
    slippage: "0.2511",
  },
];

export default function WalletTransactions() {
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
