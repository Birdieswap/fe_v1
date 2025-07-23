import "./TransactionProgressInfo.css";
import Image from "next/image";
import { Fragment } from "react";

import Icons from "@/assets/icons/icons";
import {
  ApproveTransactionProps,
  StartFarmingTransactionProps,
  StopFarmingTransactionProps,
  SwapTransactionProps,
  TransactionStatusProps,
} from "@/app/TransactionContextProvider";
import { TransactionType } from "@/types/TransactionTypes";
import { BigDecimal } from "@/types/BigDecimal";
import TransactionStatus from "@/types/TransactionStatus";
import { IToken } from "@/const/contracts/types/tokenTypes";

function TokenIcon(props: { token?: IToken }) {
  return (
    <Fragment>
      {props.token?.iconSrc && (
        <Image
          alt={props.token.symbol}
          className="size-4 rounded-full"
          height={16}
          src={props.token.iconSrc}
          width={16}
        />
      )}
    </Fragment>
  );
}

function getDisplayType(
  props: Pick<TransactionStatusProps, "transactionStatus">,
) {
  const isDisplayInput =
    props.transactionStatus === TransactionStatus.CONFIRM_NEEDED ||
    props.transactionStatus === TransactionStatus.PENDING;
  const isDisplayOutput = props.transactionStatus === TransactionStatus.SUCCESS;

  return { isDisplayInput, isDisplayOutput };
}

function ApproveTransactionInfoDisplay(
  props: TransactionStatusProps & ApproveTransactionProps,
) {
  return (
    <div className="progress-info-container">
      <span className="info-text-normal">Approve</span>
      <span className="info-text-light">{props.input?.symbol}</span>
    </div>
  );
}

function AmountAndSymbol({
  amount,
  token,
}: {
  amount?: BigDecimal;
  token?: IToken;
}) {
  const amountString = amount
    ?.roundToDecimals(token?.displayDecimals ?? token?.decimals ?? 8)
    .toPrecisionString(false, true);

  return (
    <Fragment>
      <TokenIcon token={token} />
      <span className="token-text">
        {amountString ? amountString + "\u00A0" : ""}
        {token?.symbol}
      </span>
    </Fragment>
  );
}

function SwapTransactionInfoDisplay(
  props: TransactionStatusProps & SwapTransactionProps,
) {
  return (
    <div className="progress-info-container progress-swap">
      <AmountAndSymbol {...props.input} token={props.input.token} />
      <Icons.WalletSwapArrowSmall className="fill-foreground" />
      <AmountAndSymbol {...props.output} token={props.output.token} />
    </div>
  );
}

function TokenList(props: {
  tokens: {
    amount?: BigDecimal;
    token?: IToken;
  }[];
}) {
  return (
    <Fragment>
      {props.tokens.map(({ token, amount }, index) => (
        <Fragment key={index}>
          <AmountAndSymbol amount={amount} token={token} />
          {index < props.tokens.length - 1 && (
            <Icons.WalletFarmPlus className="fill-foreground" />
          )}
        </Fragment>
      ))}
    </Fragment>
  );
}

function StartFarmingTransactionInfoDisplay(
  props: TransactionStatusProps & StartFarmingTransactionProps,
) {
  const { isDisplayInput, isDisplayOutput } = getDisplayType(props);

  return (
    <div className="progress-info-container progress-farm">
      <Icons.WalletTitleStartFarm className="fill-foreground" />
      <span className="info-text-normal">Start Farming</span>
      {isDisplayInput && (
        <TokenList
          tokens={props.input.filter((v) => v?.amount !== undefined)}
        />
      )}
      {isDisplayOutput && <TokenList tokens={[props.output]} />}
    </div>
  );
}

function StopFarmingTransactionInfoDisplay(
  props: TransactionStatusProps & StopFarmingTransactionProps,
) {
  const { isDisplayInput, isDisplayOutput } = getDisplayType(props);

  return (
    <div className="progress-info-container progress-farm">
      <Icons.WalletTitleStartFarm className="fill-foreground" />
      <span className="info-text-normal">Stop Farming</span>
      {isDisplayInput && <TokenList tokens={[props.input]} />}
      {isDisplayOutput && (
        <TokenList
          tokens={props.output.filter((v) => v.amount !== undefined)}
        />
      )}
    </div>
  );
}

export default function TransactionProgressInfo(props: TransactionStatusProps) {
  switch (props.transactionType) {
    case TransactionType.APPROVE:
      return (
        <ApproveTransactionInfoDisplay
          {...(props as ApproveTransactionProps)}
        />
      );
    case TransactionType.SWAP:
      return (
        <SwapTransactionInfoDisplay {...(props as SwapTransactionProps)} />
      );
    case TransactionType.START_FARMING:
      return (
        <StartFarmingTransactionInfoDisplay
          {...(props as StartFarmingTransactionProps)}
        />
      );
    case TransactionType.STOP_FARMING:
      return (
        <StopFarmingTransactionInfoDisplay
          {...(props as StopFarmingTransactionProps)}
        />
      );
    default:
      return null;
  }
}
