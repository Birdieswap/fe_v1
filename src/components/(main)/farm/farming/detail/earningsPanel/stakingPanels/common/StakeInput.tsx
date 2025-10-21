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

function StakeInputBase({ className, ...props }: Parameters<typeof Input>[0]) {
  return (
    <Input
      {...props}
      className={clsx("bg-transparent", className)}
      classNames={{
        inputWrapper: clsx(
          "h-5 min-h-5 bg-transparent p-1 shadow-none",
          "data-[hover=true]:bg-transparent group-data-[focus-visible=true]:bg-transparent group-data-[focus=true]:bg-transparent"
        ),
        input:
          "text-[18px] font-bold leading-[24px] placeholder:text-default-500 bg-transparent textfield focus:outline-none dark:caret-white",
      }}
      min={0}
      step="0.000000000000000001"
    />
  );
}

export default function StakeInput({
  amount,
  setAmount,
  setMaxAmount,
  isInsolvency,
  isDisabled,
  isApproved,
  isActive,
  token,
  panel,
}: {
  amount: BigDecimal | null;
  setAmount: (v: BigDecimal) => void;
  setMaxAmount: () => void;
  isInsolvency?: boolean;
  isDisabled?: boolean;
  isApproved: boolean;
  token?: IToken;
  isActive?: boolean;
  panel?: "stake" | "unstake";
}) {
  const { assetValues } = useContext(AssetsContext);
  const [amountStr, setAmountStr] = useState<string | undefined>(undefined);

  useEffect(() => {
    const amountStrToNumber = new BigDecimal(amountStr || 0);

    if (amount !== null) {
      if (!amountStrToNumber.eq(amount)) {
        setAmountStr(setPrecisionString(amount, token?.decimals || 18, true));
      }
    }
  }, [amount, amountStr, token?.decimals]);

  return (
    <AnimatePresence initial={false}>
      {token && isActive && (
        <motion.div
          layout
          className={clsx(
            "mb-2 flex max-h-32 w-full flex-col gap-4 rounded-lg px-2 py-1",
            "bg-default-100 dark:bg-dark_swap_bg",
            "focus-within:bg-default-500/5 hover:bg-default-500/10 group-hover:bg-default-500/10 group-focus:bg-default-500/5 group-focus-visible:bg-default-500/5",
            "dark:focus-within:bg-default-500/5 dark:hover:bg-default-500/10 dark:group-hover:bg-default-500/10 dark:group-focus:bg-default-500/5 dark:group-focus-visible:bg-default-500/5"
          )}
          {...presenceTransition}
        >
          <div className="flex grow flex-row gap-1">
            <div className="flex grow flex-row">
              <StakeInputBase
                isDisabled={isDisabled}
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
                <div className="size-4" />
              ) : (
                <Icons.Lock
                  className="fill-default-800 dark:fill-default-700"
                  fillRule="evenodd"
                />
              )}
              <Button
                className={clsx(
                  "h-[24px] min-w-fit rounded-md border-1 px-2.5 text-xs",
                  "border-default-600 bg-primary-200 font-semibold",
                  "dark:border-dark-mid-mint-4 dark:bg-dark-mid-mint-4 dark:text-background"
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
