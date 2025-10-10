"use client";

import { Button, Image } from "@heroui/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@heroui/react";
import { useContext, useEffect, useState } from "react";

import { setPrecisionString } from "@/utils/setPrecision";
import Icons from "@/assets/icons/icons";
import { BigDecimal } from "@/types/BigDecimal";
import { presenceTransition } from "@/const/presenceTransition";
import { onAmountValueChange } from "@/utils/onAmountValueChange";
import { AssetsContext } from "@/app/AssetsContextProvider";
import { IToken } from "@/const/contracts/types/tokenTypes";
import suffixNumbers from "@/utils/suffixNumbers";

function AmountInputBase({ className, ...props }: Parameters<typeof Input>[0]) {
  return (
    <Input
      {...props}
      className={clsx("bg-transparent", className)}
      classNames={{
        inputWrapper: clsx(
          "h-11 min-h-11 bg-transparent p-1 shadow-none",
          "data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent"
        ),
        input:
          "text-[30px] font-bold leading-[36px] placeholder:text-default-500 bg-transparent textfield focus:outline-none dark:caret-white",
      }}
      min={0}
      step="0.000000000000000001"
    />
  );
}

export default function AmountInput({
  amount,
  balance,
  setAmount,
  setMaxAmount,
  isInsolvency,
  isDisabled,
  isApproved,
  isActive,
  token,
  tokenPrice: tokenPriceProp,
  price: price,
  panel,
}: {
  amount: BigDecimal | null;
  balance: BigDecimal | null;
  setAmount: (v: BigDecimal) => void;
  setMaxAmount: () => void;
  isInsolvency?: boolean;
  isDisabled?: boolean;
  isApproved: boolean;
  token?: IToken;
  isActive?: boolean;
  layoutId?: string;
  tokenPrice?: BigDecimal | null;
  price: BigDecimal | null;
  panel?: "start" | "stop";
}) {
  const { assetValues } = useContext(AssetsContext);
  const [amountStr, setAmountStr] = useState<string | undefined>(undefined);

  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsSmall(window.innerWidth < 440);
    checkWidth(); // 초기 실행
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    const amountStrToNumber = new BigDecimal(amountStr || 0);

    if (amount !== null) {
      if (!amountStrToNumber.eq(amount)) {
        setAmountStr(setPrecisionString(amount, token?.decimals || 18, true));
      }
    }
  }, [amount, amountStr, token?.decimals]);

  const balanceStr = balance && suffixNumbers(balance, 100_000, 2, true, true);

  const tokenPrice =
    tokenPriceProp ??
    (assetValues &&
      token &&
      assetValues.chainLinkPriceMap.get(`LINK:${token.symbol}_USD`)?.price);

  const chosenPrice = panel === "stop" ? price : tokenPrice;

  const dollarAmount =
    amount &&
    chosenPrice &&
    suffixNumbers(amount.mul(chosenPrice), 100_000, 2, true, true);
  const dollarBalance =
    balance &&
    chosenPrice &&
    suffixNumbers(balance.mul(chosenPrice), 100_000, 2, true, true);

  return (
    <AnimatePresence initial={false}>
      {token && isActive && (
        <motion.div
          layout
          className={clsx(
            "mb-6 flex max-h-32 w-full flex-col gap-4 rounded-2xl px-3 py-4",
            "bg-default-100 dark:bg-dark_swap_bg",
            "focus-within:bg-default-500/5 hover:bg-default-500/10 group-hover:bg-default-500/10 group-focus:bg-default-500/5 group-focus-visible:bg-default-500/5",
            "dark:focus-within:bg-default-500/5 dark:hover:bg-default-500/10 dark:group-hover:bg-default-500/10 dark:group-focus:bg-default-500/5 dark:group-focus-visible:bg-default-500/5"
          )}
          {...presenceTransition}
        >
          <div className="flex grow flex-row gap-1">
            <div className="flex grow flex-row">
              <AmountInputBase
                isDisabled={isDisabled}
                classNames={{
                  input:
                    "text-[30px] max-[375px]:text-[22px] font-bold leading-[36px] max-[375px]:leading-[28px] placeholder:text-default-500 bg-transparent textfield focus:outline-none dark:caret-white",
                  inputWrapper:
                    "h-11 min-h-11 bg-transparent p-1 shadow-none data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent",
                }}
                maxLength={64}
                placeholder="0"
                type="number"
                value={amount === null ? undefined : amountStr}
                onBlur={() => {
                  const newAmountStr =
                    amount !== null
                      ? setPrecisionString(amount, token?.decimals || 18, true)
                      : undefined;

                  setAmountStr(newAmountStr);
                }}
                onKeyDown={(e) => {
                  if (e.key === "-") {
                    e.preventDefault();
                  }
                }}
                onValueChange={(v) => {
                  onAmountValueChange(v, token, setAmountStr, setAmount);
                }}
              />
            </div>
            <div className="flex shrink-0 flex-row items-center gap-2 px-1">
              {isApproved ? (
                <div className="size-6 max-[375px]:size-5" />
              ) : (
                <Icons.Lock
                  className="fill-default-800 dark:fill-default-700"
                  fillRule="evenodd"
                />
              )}
              {token.iconSrc && (
                <Image
                  alt={token.symbol}
                  className="rounded-full"
                  height={36}
                  src={token.iconSrc}
                  width={36}
                  classNames={{
                    img: "max-[375px]:h-6 max-[375px]:w-6",
                  }}
                />
              )}
              <p className="text-xl max-[375px]:text-base font-semibold">
                {token.symbol}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-row items-center gap-2 px-1 text-sm max-[375px]:text-[10px]">
            <div className="grow text-default-800">
              <p>${dollarAmount ?? "0"}</p>
            </div>
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col items-end">
                <div className="flex flex-row justify-end gap-1.5 self-start">
                  <span className="text-right max-[375px]:text-[10px] font-semibold text-default-900 dark:text-default-800">
                    {isSmall ? "BAL" : "Balance"}
                  </span>
                  <span className="max-[375px]:text-[10px] text-default-800 dark:text-default-700">
                    {balanceStr ?? "..."}
                  </span>
                </div>
                <p className="max-[375px]:text-[10px] self-end text-default-800 dark:text-default-700">
                  ${dollarBalance ?? "0"}
                </p>
              </div>
              <Button
                className={clsx(
                  "h-[30px] min-w-fit rounded-xl border-1 px-2.5 text-sm max-[375px]:rounded-lg max-[375px]:h-[24px] max-[375px]:px-1.5 max-[375px]:text-[10px]",
                  "border-default-600 bg-primary-200 font-semibold",
                  "dark:border-dark_mid_mint_4 dark:bg-dark_mid_mint_4 dark:text-background"
                )}
                isDisabled={isDisabled}
                onPress={() => {
                  setMaxAmount();
                }}
              >
                MAX
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
