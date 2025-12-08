"use client";

import {
  Divider,
  Image,
  ModalBody,
  ModalContent,
  ModalHeader,
  Input,
} from "@heroui/react";
import React, { PropsWithChildren, useContext, useMemo, useState } from "react";
import clsx from "clsx";
import { useChainId } from "wagmi";

import ModalBase from "@/components/atoms/ModalBase";
import ModalCloseButton from "@/components/atoms/ModalCloseButton";
import { ICurrency, IToken } from "@/const/contracts/types/tokenTypes";
import { AssetsContext } from "@/app/AssetsContextProvider";
import getTokenAddress from "@/utils/assets/getTokenAddress";
import { BigDecimal } from "@/types/BigDecimal";

import { INTERNAL_TOKEN_SYMBOLS } from "@/const/tokenInfo";

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
      className={clsx(
        "relative flex flex-row items-center gap-2 rounded-md px-2 py-2.5",
        "transition-background hover:bg-default/10 focus:bg-default/30 active:bg-default/30"
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
        <span className="text-[15px] font-medium text-left text-foreground">
          {token?.fullName}
        </span>
        <span className="text-xs font-medium text-left text-default-700">
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
  const { balances } = useContext(AssetsContext);
  const chainId = useChainId();

  const [search, setSearch] = useState("");

  // 검색 + 현재 network 주소 있는 토큰만 필터
  const filteredTokens = useMemo(
    () =>
      (props.tokens ?? []).filter((t): t is ICurrency => {
        if (!t || typeof (t as any).symbol !== "string") return false;

        // 1) 현재 chainId에 주소가 있는 토큰만
        const addr = getTokenAddress({ token: t, chainId });
        if (!addr) return false;

        // 2) 검색어 필터: symbol + address (대소문자 구분 X)
        const q = search.trim().toLowerCase();
        if (!q) return true;

        const sym = t.symbol?.toLowerCase?.() ?? "";
        const fullName = String((t as any).fullName ?? "").toLowerCase();
        const addrLower = addr.toLowerCase();

        return sym.includes(q) || fullName.includes(q) || addrLower.includes(q);
      }),
    [props.tokens, chainId, search]
  );

  // 잔고 정보 붙이기
  const balanceData = useMemo(
    () =>
      filteredTokens.map((v) => {
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
    [balances?.tokenBalances?.balanceMap, chainId, filteredTokens]
  );

  // 잔고 있는 토큰
  const withBalance = useMemo(
    () => balanceData.filter((v) => v.balance.gt(BigDecimal.ZERO())),
    [balanceData]
  );

  // 잔고 없는 토큰
  const withoutBalance = useMemo(
    () => balanceData.filter((v) => v.balance.lte(BigDecimal.ZERO())),
    [balanceData]
  );

  // 잔고 없는 것들 중 내부 토큰 (Inner Tokens)
  const innerTokens = useMemo(
    () =>
      withoutBalance.filter((v) => {
        const sym = v.token?.symbol;
        if (!sym) return false;
        return INTERNAL_TOKEN_SYMBOLS.has(sym);
      }),
    [withoutBalance]
  );

  // 잔고 없는 것들 중 외부 토큰 (Other Tokens)
  const otherTokens = useMemo(
    () =>
      withoutBalance.filter((v) => {
        const sym = v.token?.symbol;
        if (!sym) return false;
        return !INTERNAL_TOKEN_SYMBOLS.has(sym);
      }),
    [withoutBalance]
  );

  const hasAnyResult =
    withBalance.length > 0 || innerTokens.length > 0 || otherTokens.length > 0;

  return (
    <ModalBase
      closeButton={<ModalCloseButton />}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <ModalContent>
        <ModalHeader className="p-4 text-foreground">
          Select a Token
        </ModalHeader>

        {/* 전체 Body 높이를 55vh로 고정 */}
        <ModalBody className="px-0 pb-4 pt-0">
          <div className="flex h-[55vh] flex-col">
            {/* 검색창 (고정 영역) */}
            <div className="px-4 pb-2">
              <Input
                size="sm"
                radius="full"
                placeholder="Search by name, symbol or address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* 결과 영역: 남은 공간을 모두 쓰고, 내부 스크롤 */}
            <div className="flex-1 overflow-y-auto">
              {hasAnyResult ? (
                <Container>
                  {/* 1) 잔고 있는 토큰: Your Tokens */}
                  <Header>Your Tokens</Header>
                  <ListContainer>
                    {withBalance.map((v, idx) => (
                      <TokenDisplay
                        key={v.address ?? v.token.symbol ?? String(idx)}
                        balanceValue={v.balance}
                        isSelected={
                          !!v.token?.symbol && !!props.selectedToken?.symbol
                            ? v.token.symbol === props.selectedToken.symbol
                            : false
                        }
                        setToken={() => {
                          props.setToken(v.token);
                          props.onClose();
                        }}
                        token={v.token as IToken}
                      />
                    ))}
                  </ListContainer>

                  {/* 2) 잔고 없는 내부 토큰: Inner Tokens */}
                  {innerTokens.length > 0 && (
                    <>
                      <Divider className="my-2" />
                      <Header>Inner Tokens</Header>
                      <ListContainer>
                        {innerTokens.map((v, idx) => (
                          <TokenDisplay
                            key={v.address ?? v.token.symbol ?? String(idx)}
                            balanceValue={v.balance}
                            isSelected={
                              !!v.token?.symbol && !!props.selectedToken?.symbol
                                ? v.token.symbol === props.selectedToken.symbol
                                : false
                            }
                            setToken={() => {
                              props.setToken(v.token);
                              props.onClose();
                            }}
                            token={v.token as IToken}
                          />
                        ))}
                      </ListContainer>
                    </>
                  )}

                  {/* 3) 잔고 없는 외부 토큰: Other Tokens */}
                  {otherTokens.length > 0 && (
                    <>
                      <Divider className="my-2" />
                      <Header>Other Tokens</Header>
                      <ListContainer>
                        {otherTokens.map((v, idx) => (
                          <TokenDisplay
                            key={v.address ?? v.token.symbol ?? String(idx)}
                            balanceValue={v.balance}
                            isSelected={
                              !!v.token?.symbol && !!props.selectedToken?.symbol
                                ? v.token.symbol === props.selectedToken.symbol
                                : false
                            }
                            setToken={() => {
                              props.setToken(v.token);
                              props.onClose();
                            }}
                            token={v.token as IToken}
                          />
                        ))}
                      </ListContainer>
                    </>
                  )}
                </Container>
              ) : (
                // 검색 결과 없을 때 메시지
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-default-500">
                  No tokens found for your search.
                </div>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalBase>
  );
}

// "use client";

// import {
//   Divider,
//   Image,
//   ModalBody,
//   ModalContent,
//   ModalHeader,
// } from "@heroui/react";
// import React, { PropsWithChildren, useContext, useMemo } from "react";
// import clsx from "clsx";
// import { useChainId } from "wagmi";

// import ModalBase from "@/components/atoms/ModalBase";
// import ModalCloseButton from "@/components/atoms/ModalCloseButton";
// import { ICurrency, IToken } from "@/const/contracts/types/tokenTypes";
// import { AssetsContext } from "@/app/AssetsContextProvider";
// import getTokenAddress from "@/utils/assets/getTokenAddress";
// import { BigDecimal } from "@/types/BigDecimal";

// const Container = ({ children }: PropsWithChildren<{}>) => (
//   <div className="flex w-full flex-col gap-2">{children}</div>
// );

// const ListContainer = ({ children }: PropsWithChildren<{}>) => (
//   <div className="flex w-full flex-col gap-0 px-2">{children}</div>
// );

// const Header = ({ children }: PropsWithChildren<{}>) => (
//   <h1 className="px-4 text-sm font-medium text-default-600">{children}</h1>
// );

// const TokenDisplay = ({
//   token,
//   balanceValue,
//   setToken,
//   isSelected,
// }: {
//   token: IToken;
//   balanceValue: BigDecimal;
//   setToken: () => void;
//   isSelected: boolean;
// }) => {
//   return (
//     <button
//       className={clsx(
//         "relative flex flex-row items-center gap-2 rounded-md px-2 py-2.5",
//         "transition-background hover:bg-default/10 focus:bg-default/30 active:bg-default/30"
//       )}
//       onClick={setToken}
//     >
//       <Image
//         alt={token.symbol}
//         height={36}
//         radius="full"
//         src={token.iconSrc}
//         width={36}
//       />
//       <div className="flex grow flex-col items-start gap-0.5">
//         <span className="text-[15px] font-medium text-foreground">
//           {token?.fullName}
//         </span>
//         <span className="text-xs font-medium text-default-700">
//           {token?.symbol}
//         </span>
//       </div>
//       {!!balanceValue && (
//         <span className="text-right font-semibold text-foreground">
//           {balanceValue
//             .roundToDecimals(token?.displayDecimals ?? token?.decimals ?? 8)
//             .toPrecisionString(false, true)}
//         </span>
//       )}
//       {isSelected && (
//         <div className="absolute inset-y-2 right-0 w-1 rounded-full bg-default-400" />
//       )}
//     </button>
//   );
// };

// export default function SwapFormSelectTokenModal(props: {
//   isOpen: boolean;
//   onClose: () => void;
//   tokens: ICurrency[];
//   selectedToken?: ICurrency;
//   setToken: (token: ICurrency) => void;
// }) {
//   // const {tokens} = props;
//   const { balances } = useContext(AssetsContext);
//   const chainId = useChainId();

//   const safeTokens = useMemo(
//     () =>
//       (props.tokens ?? []).filter(
//         (t): t is ICurrency => !!t && typeof (t as any).symbol === "string"
//       ),
//     [props.tokens]
//   );

//   const balanceData = useMemo(
//     () =>
//       safeTokens.map((v) => {
//         const address = getTokenAddress({
//           token: v,
//           chainId,
//         });
//         const balance = address
//           ? balances?.tokenBalances?.balanceMap?.get(address)
//           : undefined;

//         return {
//           token: v,
//           address,
//           balance: balance ?? BigDecimal.ZERO(),
//         };
//       }),
//     [balances?.tokenBalances?.balanceMap, chainId, safeTokens]
//   );
//   const withBalance = useMemo(
//     () => balanceData.filter((v) => v.balance.gt(BigDecimal.ZERO())),
//     [balanceData]
//   );
//   const withoutBalance = useMemo(
//     () => balanceData.filter((v) => v.balance.lte(BigDecimal.ZERO())),
//     [balanceData]
//   );

//   return (
//     <ModalBase
//       closeButton={<ModalCloseButton />}
//       isOpen={props.isOpen}
//       onClose={props.onClose}
//     >
//       <ModalContent>
//         <ModalHeader className="p-4 text-foreground">
//           Select a Token
//         </ModalHeader>
//         <ModalBody className="px-0 pb-4 pt-0">
//           <Container>
//             <Header>Your Tokens</Header>
//             <ListContainer>
//               {withBalance.map((v, idx) => (
//                 <TokenDisplay
//                   key={v.address ?? v.token.symbol ?? String(idx)}
//                   balanceValue={v.balance}
//                   isSelected={
//                     !!v.token?.symbol && !!props.selectedToken?.symbol
//                       ? v.token.symbol === props.selectedToken.symbol
//                       : false
//                   }
//                   setToken={() => {
//                     props.setToken(v.token);
//                     props.onClose();
//                   }}
//                   token={v.token as IToken}
//                 />
//               ))}
//             </ListContainer>
//             <Divider className="my-2" />
//             <Header>Other Tokens</Header>
//             <ListContainer>
//               {withoutBalance.map((v, idx) => (
//                 <TokenDisplay
//                   key={v.address ?? v.token.symbol ?? String(idx)}
//                   balanceValue={v.balance}
//                   isSelected={
//                     !!v.token?.symbol && !!props.selectedToken?.symbol
//                       ? v.token.symbol === props.selectedToken.symbol
//                       : false
//                   }
//                   setToken={() => {
//                     props.setToken(v.token);
//                     props.onClose();
//                   }}
//                   token={v.token as IToken}
//                 />
//               ))}
//             </ListContainer>
//           </Container>
//         </ModalBody>
//       </ModalContent>
//     </ModalBase>
//   );
// }
