"use client";

import "./WalletTransactions.css";

import { cn, Link } from "@heroui/react";
import Image from "next/image";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { FaRegArrowAltCircleUp } from "react-icons/fa";
import { FaRegArrowAltCircleDown } from "react-icons/fa";
import { PiHandWithdraw } from "react-icons/pi";

export enum TransactionType {
  SWAP = "swap",
  START_FARM = "start_farm",
  STOP_FARM = "stop_farm",
  STAKING = "StakingDeposit",
  UNSTAKING = "StakingWithdraw",
  CLAIM = "StakingClaim",
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
  | {
      type: TransactionType.CLAIM;
      token: TransactionTokenInfo;
    }
  | {
      type: TransactionType.STAKING;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo;
    }
  | {
      type: TransactionType.UNSTAKING;
      from: TransactionTokenInfo;
      to: TransactionTokenInfo;
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
      {/* {props.token.usdAmount && (
        <span className="ml-0.5 text-[12px] font-normal leading-[15px] text-default-800 dark:text-default-700">
          (${" "}
          {setPrecisionString(parseFloat(props.token.usdAmount), 2, true, true)}
          )
        </span>
      )} */}
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
      case TransactionType.STAKING:
        return "Staking";
      case TransactionType.UNSTAKING:
        return "Unstaking";
      case TransactionType.CLAIM:
        return "Reward Claim";
    }
  }, [props.type]);

  const [sliceLength, setSliceLength] = useState(45);

  useEffect(() => {
    const updateSliceLength = () => {
      const width = window.innerWidth;
      if (width < 375) setSliceLength(30); // iPhone mini 이하
      else if (width < 440) setSliceLength(36); //iphone x 이하
      // else if (width >= 641) setSliceLength(45); // sm 이상 (tablet, desktop)
      else setSliceLength(45); // 일반
    };

    updateSliceLength();
    window.addEventListener("resize", updateSliceLength);
    return () => window.removeEventListener("resize", updateSliceLength);
  }, []);

  const hashDisplay = props.hash.slice(0, sliceLength);

  // console.log("Wallet Transactions, BaseTransactionItem Props", props);

  return (
    <Link
      className="block w-full"
      href={`${explorerURL}/tx/${props.hash}`}
      target="_blank"
    >
      <div
        className={cn(
          "group flex flex-col px-1 py-4 max-sm:px-2 gap-3 w-full",
          "hover:bg-default-200 dark:hover:bg-default-100 transition-background"
        )}
      >
        <div className={cn("flex flex-row items-center gap-1.5 w-full")}>
          <div className="flex grow flex-col items-start gap-1 px-1">
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
              {props.type === TransactionType.STAKING && (
                <FaRegArrowAltCircleUp />
              )}
              {props.type === TransactionType.UNSTAKING && (
                <FaRegArrowAltCircleDown />
              )}
              {props.type === TransactionType.CLAIM && <PiHandWithdraw />}
              {title}
            </h2>
            <span className="truncate text-[12px] leading-[15px] text-default-800 dark:text-default-700">
              {hashDisplay}...
            </span>
          </div>
          <div className="flex flex-row items-center gap-2">
            <span className="text-[14px] font-medium leading-[17px] pr-1 text-default-800 dark:text-default-700">
              {getTimeAgoLinux(props.timestamp)}
            </span>
            {/* {props.success ? (
            <Icons.WalletTxOk className="fill-primary text-background dark:fill-dark-green-key" />
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
        {props.type === TransactionType.STAKING && <StakingItem {...props} />}
        {props.type === TransactionType.UNSTAKING && (
          <UnStakingItem {...props} />
        )}
        {props.type === TransactionType.CLAIM && <ClaimItem {...props} />}
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
function StakingItem(
  props: TransactionProps & { type: TransactionType.STAKING }
) {
  return (
    <div className="wallet-tx-details-container">
      <SwapDisplay from={props.from} to={props.to} />
    </div>
  );
}
function UnStakingItem(
  props: TransactionProps & { type: TransactionType.UNSTAKING }
) {
  return (
    <div className="wallet-tx-details-container">
      <SwapDisplay from={props.from} to={props.to} />
    </div>
  );
}

function ClaimItem(props: TransactionProps & { type: TransactionType.CLAIM }) {
  return (
    <div className="wallet-tx-details-container">
      <TransactionTokenDisplay token={props.token} />
    </div>
  );
}

export default function WalletTransactions() {
  const chainId = useChainId();
  const { assetValues } = useContext(AssetsContext);
  const { walletData } = useContext(WalletContext);
  const TransactionInfo = walletData?.transactions;
  const loadMore = walletData?.loadMore;
  const endReached = walletData?.endReached;
  const isFetchingNextPage = walletData?.isFetchingNextPage;

  const transactions = useMemo(() => {
    try {
      // chainId 없거나 원본이 배열이 아니면 빈 배열
      if (!chainId || !Array.isArray(TransactionInfo)) return [];

      // priceMap 없어도 내부에서 가격만 빠지고 나머지는 만들 수 있다면 그대로 호출
      const priceMap = assetValues?.chainLinkPriceMap;
      const built = buildTransactions(TransactionInfo, chainId, priceMap);

      return Array.isArray(built) ? built : [];
    } catch (e) {
      console.error("[WalletTransactions] buildTransactions failed:", e);
      return [];
    }
  }, [chainId, TransactionInfo, assetValues?.chainLinkPriceMap]);

  const showEmpty = useMemo(() => {
    // 체인 정보가 없거나, 원본 데이터가 아직 도착 안 했거나, 결과가 비었으면 빈 상태
    if (!chainId) return true;
    if (!Array.isArray(TransactionInfo)) return true;
    if (!transactions.length) return true;
    return false;
  }, [chainId, TransactionInfo, transactions]);

  /** === 인피니트 스크롤: sentinel === */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      if (endReached) return;
      if (isFetchingNextPage) return;
      loadMore?.();
    },
    [loadMore, endReached, isFetchingNextPage]
  );

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(onIntersect, {
      root: null,
      threshold: 0.1,
    });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [onIntersect]);

  return (
    <div className="flex w-full grow flex-col gap-0 p-0">
      {showEmpty ? (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <Icons.WalletEmptyTx className="fill-light-mid-mint-2 stroke-light-mid-mint-2 dark:fill-dark-empty-state dark:stroke-dark-empty-state" />
          <span className="text-[14px] leading-[17px] text-default-700 max-sm:dark:text-default-600">
            No recent transactions
          </span>
        </div>
      ) : (
        <>
          <div className="w-full rounded-lg divide-y divide-default-100 px-6 sm:px-3">
            {transactions.map((tx) => (
              <BaseTransactionItem key={tx.hash} {...tx} />
            ))}
          </div>
          {/* sentinel: 화면에 보이면 loadMore 호출 */}
          <div ref={sentinelRef} className="h-[1px]" />
          {/* 상태 표시 */}
          {isFetchingNextPage && (
            <div className="pb-3 text-center text-default-700">Loading…</div>
          )}
          {endReached && (
            <div className="pb-3 text-center text-default-700">
              You’ve reached the end of the transaction list.
            </div>
          )}
        </>
      )}
    </div>
  );
}
