"use client";

import {
  Divider,
  Image,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import React, { PropsWithChildren, useContext, useMemo } from "react";
import clsx from "clsx";
import { useChainId } from "wagmi";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import { ICurrency, IToken } from "@/const/contracts/types/tokenTypes";
import { AssetsContext } from "@/app/AssetsContextProvider";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { BigDecimal } from "@/types/BigDecimal";

const Container = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex w-full flex-col gap-2">{children}</div>
);

const ListContainer = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex w-full flex-col gap-0 px-2">{children}</div>
);

const Header = ({ children }: PropsWithChildren<{}>) => (
  <h1 className="px-4 text-sm font-medium text-default-600">{children}</h1>
);

const TokenDisplay = ({
  token,
  balanceValue,
  setToken,
  isSelected,
}: {
  token: IToken;
  balanceValue: BigDecimal;
  setToken: () => void;
  isSelected: boolean;
}) => {
  return (
    <button
      key={token.symbol}
      className={clsx(
        "relative flex flex-row items-center gap-2 rounded-md px-2 py-2.5",
        "transition-background hover:bg-default/10 focus:bg-default/30 active:bg-default/30",
      )}
      onClick={setToken}
    >
      <Image
        alt={token.symbol}
        height={36}
        radius="full"
        src={token.iconSrc}
        width={36}
      />
      <div className="flex grow flex-col items-start gap-0.5">
        <span className="text-[15px] font-medium text-foreground">
          {token?.fullName}
        </span>
        <span className="text-xs font-medium text-default-700">
          {token?.symbol}
        </span>
      </div>
      {!!balanceValue && (
        <span className="text-right font-semibold text-foreground">
          {balanceValue
            .roundToDecimals(token?.displayDecimals ?? token?.decimals ?? 8)
            .toPrecisionString(false, true)}
        </span>
      )}
      {isSelected && (
        <div className="absolute inset-y-2 right-0 w-1 rounded-full bg-default-400" />
      )}
    </button>
  );
};

export default function SwapFormSelectTokenModal(props: {
  isOpen: boolean;
  onClose: () => void;
  tokens: ICurrency[];
  selectedToken?: ICurrency;
  setToken: (token: ICurrency) => void;
}) {
  // const {tokens} = props;
  const { balances } = useContext(AssetsContext);
  const chainId = useChainId();
  const balanceData = useMemo(
    () =>
      props.tokens.map((v) => {
        const address = getTokenAddress({
          token: v,
          chainId,
        });
        const balance = address
          ? balances?.tokenBalances?.balanceMap?.get(address)
          : undefined;

        return {
          token: v,
          address,
          balance: balance ?? BigDecimal.ZERO(),
        };
      }),
    [balances?.tokenBalances?.balanceMap, chainId, props.tokens],
  );
  const withBalance = useMemo(
    () => balanceData.filter((v) => v.balance.gt(BigDecimal.ZERO())),
    [balanceData],
  );
  const withoutBalance = useMemo(
    () => balanceData.filter((v) => v.balance.lte(BigDecimal.ZERO())),
    [balanceData],
  );

  return (
    <ModalBase
      closeButton={<ModalCloseButton />}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <ModalContent>
        <ModalHeader className="p-4 text-foreground">Select a Token</ModalHeader>
        <ModalBody className="px-0 pb-4 pt-0">
          <Container>
            <Header>Your Tokens</Header>
            <ListContainer>
              {withBalance.map((v) => (
                <TokenDisplay
                  key={v.token.symbol}
                  balanceValue={v.balance}
                  isSelected={v.token.symbol === props.selectedToken?.symbol}
                  setToken={() => {
                    props.setToken(v.token);
                    props.onClose();
                  }}
                  token={v.token as IToken}
                />
              ))}
            </ListContainer>
            <Divider className="my-2" />
            <Header>Other Tokens</Header>
            <ListContainer>
              {withoutBalance.map((v) => (
                <TokenDisplay
                  key={v.token.symbol}
                  balanceValue={v.balance}
                  isSelected={v.token.symbol === props.selectedToken?.symbol}
                  setToken={() => {
                    props.setToken(v.token);
                    props.onClose();
                  }}
                  token={v.token as IToken}
                />
              ))}
            </ListContainer>
          </Container>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}
