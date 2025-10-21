import { AnimatePresence, motion } from "framer-motion";
import React, { Fragment, PropsWithChildren } from "react";
import { Image } from "@heroui/react";

import {
  defaultTransition,
  presenceTransition,
} from "@/const/presenceTransition";
import Icons from "@/assets/icons/icons";
import { BigDecimal } from "@/types/BigDecimal";

export const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.div
    layout
    {...presenceTransition}
    className="mb-6 flex flex-col rounded-2xl border-1 border-default-200 dark:border-default-800"
  >
    {children}
  </motion.div>
);

export const Header = () => (
  <motion.div
    layout
    className="rounded-t-2xl bg-primary-100 px-6 py-4 dark:bg-dark-mid-mint-25"
  >
    <h2 className="text-lg font-semibold text-default-900 dark:text-default-400">
      Summary
    </h2>
  </motion.div>
);

export const InnerGrid: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.div
    layout
    {...defaultTransition}
    className="grid grid-cols-[28px_1fr] gap-x-2 gap-y-1 px-6 py-5"
  >
    {children}
  </motion.div>
);

export const SectionHeader: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.p
    layout
    className="self-center text-sm font-semibold text-default-800 dark:text-default-700"
  >
    {children}
  </motion.p>
);

export const VerticalDivider: React.FC = () => (
  <motion.div
    layout
    {...defaultTransition}
    className="h-full w-0.5 place-self-center bg-default-800 dark:bg-default-700"
  />
);

const AmountContainer: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.div layout className="flex flex-row items-center pt-px">
    {children}
  </motion.div>
);

const Amount: React.FC<{
  symbol?: string;
  amount?: string;
  dollarAmount?: string;
}> = (props) => (
  <p className="ml-2 text-[14px] font-medium leading-[16px] text-foreground">
    {props.amount || 0} {props.symbol}{" "}
    <span className="font-normal text-default-800 dark:text-default-700">
      ($ {props.dollarAmount || 0})
    </span>
  </p>
);

export type SwapAmountProps = {
  symbol?: string;
  iconSrc?: string;
  amount?: string;
  dollarAmount: string;
};

export type SwapProps = {
  priceImpact?: BigDecimal;
  swapFrom: SwapAmountProps;
  swapTo: SwapAmountProps;
};

export const Swap: React.FC<SwapProps> = ({
  priceImpact,
  swapFrom,
  swapTo,
}) => (
  <Fragment>
    <motion.div layout className="place-self-center">
      <Icons.SummarySwap
        className="place-self-center fill-default-800 dark:fill-default-700"
        fillRule="evenodd"
      />
    </motion.div>
    <SectionHeader>Swap</SectionHeader>
    <VerticalDivider />
    <motion.div layout className="flex flex-col gap-1 py-3">
      <AmountContainer>
        <Image
          alt={swapFrom.symbol}
          height={16}
          src={swapFrom.iconSrc}
          width={16}
        />
        <Amount {...swapFrom} />
      </AmountContainer>
      <motion.div layout className="flex flex-row items-start">
        <motion.div layout className="pr-1 pt-px">
          <Icons.SummaryArrows
            className="size-4 fill-foreground dark:fill-foreground"
            fillRule="evenodd"
          />
        </motion.div>
        <motion.div
          layout
          {...presenceTransition}
          className="flex w-full flex-col"
        >
          <AmountContainer>
            <Image
              alt={swapTo.symbol}
              height={16}
              src={swapTo.iconSrc}
              width={16}
            />
            <Amount {...swapTo} />
          </AmountContainer>
          <AnimatePresence>
            {priceImpact && priceImpact.abs().gt(0.05) && (
              <motion.div
                layout
                {...presenceTransition}
                className="flex flex-row items-center gap-2 pb-[3px] pt-1.5"
              >
                <Icons.Error className="size-5" />
                <p className="text-[14px] font-medium leading-[17px] text-danger">
                  Price impact {priceImpact.abs().mul(100).toFixed(2)}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  </Fragment>
);

export const StartOrStop: React.FC<{
  type: "Start" | "Stop";
  active: {
    symbol?: string;
    iconSrc?: string;
    amount?: string;
    dollarAmount: string;
  };
  other: {
    symbol?: string;
    iconSrc?: string;
    amount?: string;
    dollarAmount: string;
  };
}> = ({ type, active, other }) => (
  <Fragment>
    <motion.div layout className="place-self-center">
      {type === "Start" ? (
        <Icons.SummaryStart
          className="fill-default-800 dark:fill-default-700"
          fillRule="evenodd"
        />
      ) : (
        <Icons.SummaryStop
          className="fill-default-800 dark:fill-default-700"
          fillRule="evenodd"
        />
      )}
    </motion.div>
    <SectionHeader>{type} Farming</SectionHeader>
    <div />
    <div className="flex flex-col gap-1 py-3">
      <AmountContainer>
        <Image
          alt={active.symbol}
          height={16}
          src={active.iconSrc}
          width={16}
        />
        <Amount {...active} />
      </AmountContainer>
      <AmountContainer>
        <Icons.SummaryPlus
          className="mr-1 mt-px size-4 fill-foreground dark:fill-foreground"
          fillRule="evenodd"
        />
        <Image alt={other.symbol} height={16} src={other.iconSrc} width={16} />
        <Amount {...other} />
      </AmountContainer>
    </div>
  </Fragment>
);

export const SwapSummaryComponents = {
  Container,
  Header,
  InnerGrid,
  Swap,
  StartOrStop,
};
export default SwapSummaryComponents;
