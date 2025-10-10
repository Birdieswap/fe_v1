"use client";

import { Button, Image, useDisclosure } from "@heroui/react";
import {
  Dispatch,
  Fragment,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

import { BigDecimal } from "@/types/BigDecimal";
import Icons from "@/assets/icons/icons";
import { SwapTokens } from "@/const/tokenInfo";
import { onAmountValueChange } from "@/utils/onAmountValueChange";
import { ICurrency, IToken } from "@/const/contracts/types/tokenTypes";
import suffixNumbers from "@/utils/suffixNumbers";

import {
  SwapFormContainer,
  SwapFormHeader,
  SwapFormNumberInput,
} from "./SwapFormComponents";
import SwapFormSelectTokenModal from "./SwapFormSelectTokenModal";
import BalanceDisplay from "./swapFormAmount/BalanceDisplay";
import { useSwapContext } from "./SwapProvider";
import { useChainId } from "wagmi";
import getAvailableTokens from "@/utils/assets/getAvailableTokens";

export default function SwapFormAmount({
  type,
  isPending,
  amount,
  balance,
  price,
  setAmount,
  token,
  setToken,
  isDisabled,
  isApproved,
}: {
  type: "buy" | "sell";
  isPending?: boolean;
  amount: string;
  balance: BigDecimal;
  price?: BigDecimal;
  setAmount: Dispatch<SetStateAction<string>>;
  token?: ICurrency;
  setToken: (token: ICurrency) => void;
  isDisabled?: boolean;
  isApproved?: boolean;
}) {
  const chainId = useChainId();
  const { setIsTyping, fromToken, toToken } = useSwapContext();
  const isEthToken = token?.symbol?.toUpperCase() === "ETH";
  const approved = isApproved || isEthToken; // ETH는 승인 면제

  const disclosure = useDisclosure();
  const inputRef = useRef<HTMLInputElement>(null);
  const step = token?.decimals ? `0.${"0".repeat(token.decimals - 1)}1` : "1";
  const [availableTokens, setAvailableTokens] =
    useState<ICurrency[]>(SwapTokens);

  const dollarAmount = useMemo(() => {
    if (!price) return "";
    const amountValue = new BigDecimal(amount || "0", token?.decimals ?? 18);

    if (amountValue.isZero()) return "0.00";

    return suffixNumbers(amountValue.mul(price), 100_000, 2, true, true);
  }, [amount, price, token?.decimals]);

  //입력 자리수 검사 진행
  function isValidAmount(value: string) {
    if (value === "") return true; // 빈 값 허용
    const [integerPart, decimalPart] = value.split(".");
    if (integerPart.length > 18) return false;
    if (decimalPart && decimalPart.length > 18) return false;
    return true;
  }

  function openSelectTokenModal() {
    const baseToken = type === "sell" ? toToken : fromToken;
    if (!baseToken) {
      setAvailableTokens(SwapTokens);
    } else {
      const list = getAvailableTokens(baseToken);
      setAvailableTokens(list && list.length ? list : SwapTokens);
    }
    disclosure.onOpen();
  }

  // useEffect(() => {
  //   if (chainId) prebuildAvailableTokens(chainId); // ← 체인별 예열
  // }, [chainId]);

  return (
    <Fragment>
      <SwapFormContainer
        className={clsx(
          "transition-colors duration-200",
          !token
            ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-dark_popup_bg"
            : "cursor-text" // 토큰이 있을 때는 텍스트 커서, // 토큰이 없을 때만 클릭 가능한 스타일
        )}
        onClick={() => {
          if (!token) {
            openSelectTokenModal();
            //disclosure.onOpen();
          } else {
            inputRef.current?.focus();
          }
        }}
      >
        <SwapFormHeader>{type === "buy" ? "Buy" : "Sell"}</SwapFormHeader>
        <div className="mb-2 flex w-full flex-row items-center justify-between">
          <SwapFormNumberInput
            ref={inputRef}
            classNames={{
              input:
                "text-[30px] max-[375px]:text-[22px] font-bold leading-[36px] max-[375px]:leading-[28px] placeholder:text-default-500 bg-transparent textfield focus:outline-none dark:caret-white",
              inputWrapper:
                "h-11 min-h-11 bg-transparent p-1 shadow-none data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent",
            }}
            disabled={isPending || isDisabled || !token}
            isDisabled={isPending || isDisabled || !token}
            min={0}
            placeholder="0"
            inputMode="decimal" // CHANGE
            step={step}
            type="number"
            value={amount}
            onWheel={(e) => e.stopPropagation()}
            onChange={(e) => {
              const v = e.currentTarget.value;

              // 자리수/길이 검증
              if (!isValidAmount(v)) return;

              // 타이핑 시작 신호 → 디바운스 완료 시까지 exchangeRate/PI 보류
              setIsTyping(true);

              // 포맷/유효성 적용 (내부에서 setAmount 호출됨)
              onAmountValueChange(v, token as IToken, setAmount);
            }}
            onKeyDown={(e) => {
              if (e.key === "-") e.preventDefault();
            }}
          />
          {type === "sell" && token && !approved ? (
            <Icons.Lock
              className="fill-default-800 dark:fill-default-700 w-12"
              fillRule="evenodd"
            />
          ) : (
            <div className="size-6 max-[375px]:size-5" />
          )}
          <Button
            className={clsx(
              "flex h-10 max-[375px]:h-8 w-fit max-w-fit shrink-0 flex-row gap-1 px-1 py-0.5 text-xl",
              "bg-background font-semibold text-foreground shadow-[0px_2px_rgba(0,0,0,0.25)]",
              "!data-[hover=true]:opacity-100 data-[hover=true]:bg-default-200 dark:data-[hover=true]:bg-default-100"
            )}
            isDisabled={isPending}
            radius="full"
            size="lg"
            onPress={openSelectTokenModal}
          >
            {token?.iconSrc && (
              <Image
                alt={token?.symbol || ""}
                className="size-9 max-w-9"
                height={36}
                radius="full"
                src={token?.iconSrc}
                width={36}
                classNames={{
                  img: "max-[375px]:h-7 max-[375px]:w-7",
                }}
              />
            )}
            {token?.symbol ? (
              <span className="pl-1.5 text-xl max-[375px]:text-base">
                {token.symbol}
              </span>
            ) : (
              <span className="pl-1.5 text-xl max-[375px]:text-base">
                Select Token
              </span>
            )}
            <Icons.SwapTokenArrow />
          </Button>
        </div>
        <div className="flex w-full flex-row items-center gap-3 pl-1 text-sm max-[375px]:text-[10px] text-default-800">
          <span className="grow">{token ? `$${dollarAmount}` : ""}</span>
          <BalanceDisplay balance={balance} token={token} />
          {type === "sell" && (
            <Button
              className="h-[30px] min-w-fit rounded-xl border-1 border-default-600 bg-primary-200 text-sm font-semibold dark:border-dark_mid_mint dark:bg-dark_mid_mint max-[375px]:rounded-lg max-[375px]:h-[24px] max-[375px]:px-1.5 max-[375px]:text-[10px]"
              size="sm"
              onPress={() => setAmount(balance.toPrecisionString(true, false))}
            >
              Max
            </Button>
          )}
        </div>
      </SwapFormContainer>
      <SwapFormSelectTokenModal
        isOpen={disclosure.isOpen}
        selectedToken={token}
        setToken={setToken}
        tokens={availableTokens}
        onClose={disclosure.onClose}
      />
    </Fragment>
  );
}
