"use client";

import { PropsWithChildren, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { cn } from "@heroui/react";

import { UsePairStartPanelReturn } from "@/hooks/usePairStartPanel";
import { Farm, FarmType } from "@/types/FarmListTableRowProps";

function Container({
  children,
  col,
  row,
  setHover,
}: PropsWithChildren<{
  col: number;
  row: number;
  setHover: (val: boolean) => void;
}>) {
  return (
    <div
      className={clsx(
        "group relative col-span-1 row-span-2 grid grid-rows-subgrid items-center justify-center place-self-stretch",
        "data-[col=1]:col-start-1 data-[col=2]:col-start-2 data-[col=3]:col-start-3",
        "data-[row=1]:row-start-1 data-[row=2]:row-start-2",
      )}
      data-col={col}
      data-row={row}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </div>
  );
}

function TokenName(props: PropsWithChildren<{ isActive: boolean }>) {
  return (
    <p
      className="text-default-500 transition-colors group-hover:text-default-700 data-[selected=true]:text-primary data-[selected=true]:group-hover:text-light_primary_hover dark:text-default-700 dark:group-hover:text-default-300 data-[selected=true]:dark:text-dark_primary data-[selected=true]:dark:group-hover:text-dark_primary_hover"
      data-selected={props.isActive}
    >
      {props.children}
    </p>
  );
}

function SliderButon(props: { onClick: () => void; isDisabled?: boolean }) {
  return (
    <button
      className="box-border size-3 place-self-center rounded-full border-1 border-default-400 bg-background transition-colors group-hover:border-default-700 dark:border-default-700 dark:group-hover:border-default-300"
      disabled={props.isDisabled}
      onClick={props.onClick}
    />
  );
}

export default function PairSlider({
  item,
  state,
  isDisabled,
}: {
  item: Farm & { type: FarmType.PAIR };
  state: Pick<UsePairStartPanelReturn, "isActive" | "setIsActive">;
  isDisabled?: boolean;
}) {
  const { isActive, setIsActive } = state;
  const token0 = item.wip_stakeToken.swap.input[0].input;
  const token1 = item.wip_stakeToken.swap.input[1].input;
  const [hover, setHover] = useState<[boolean, boolean, boolean]>([
    false,
    false,
    false,
  ]);
  const pos = isActive[0] ? (isActive[1] ? 1 : 0) : 2;

  return (
    <div
      className="grid w-60 grid-cols-3 grid-rows-2 text-sm font-semibold opacity-100 transition-opacity data-[disabled=true]:opacity-50 max-lg:grow"
      data-disabled={isDisabled}
    >
      <div className="col-span-3 col-start-1 row-span-1 row-start-1 h-1 w-[67%] place-self-center bg-default-400 dark:bg-default-700" />
      <Container
        col={1}
        row={1}
        setHover={(val) =>
          setHover((prev) => {
            return [val, prev[1], prev[2]];
          })
        }
      >
        <SliderButon
          isDisabled={isDisabled}
          onClick={() => setIsActive([true, false])}
        />
        <TokenName isActive={isActive[0] && !isActive[1]}>
          {token0.symbol}
        </TokenName>
      </Container>
      <Container
        col={2}
        row={1}
        setHover={(val) =>
          setHover((prev) => {
            return [prev[0], val, prev[2]];
          })
        }
      >
        <SliderButon
          isDisabled={isDisabled}
          onClick={() => setIsActive([true, true])}
        />
        <TokenName isActive={isActive[0] && isActive[1]}>
          {token0.symbol}+{token1.symbol}
        </TokenName>
      </Container>
      <Container
        col={3}
        row={1}
        setHover={(val) =>
          setHover((prev) => {
            return [prev[0], prev[1], val];
          })
        }
      >
        <SliderButon
          isDisabled={isDisabled}
          onClick={() => setIsActive([false, true])}
        />
        <TokenName isActive={!isActive[0] && isActive[1]}>
          {token1.symbol || "UNKNOWN"}
        </TokenName>
      </Container>
      {/* <Container col={1} row={2}>
      </Container>
      <Container col={2} row={2}>
      </Container>
      <Container col={3} row={2}>
      </Container> */}
      <motion.div
        layout
        className={cn(
          "group pointer-events-none relative z-10 col-span-1 row-span-1 row-start-1 flex size-4 items-center",
          "justify-center place-self-center rounded-full bg-primary shadow-[0_2px_2px] shadow-black/25",
          "data-[pos=0]:col-start-1 data-[pos=1]:col-start-2 data-[pos=2]:col-start-3 data-[pos=0]:col-end-1 data-[pos=1]:col-end-2 data-[pos=2]:col-end-3",
        )}
        data-hover={hover[pos]}
        data-pos={pos}
      >
        <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
          <circle
            className="fill-primary transition-[fill] group-data-[hover=true]:fill-light_primary_hover dark:fill-dark_primary group-data-[hover=true]:dark:fill-dark_primary_hover"
            cx="8"
            cy="8"
            r="8"
          />
          <circle className="fill-background" cx="8" cy="8" r="6" />
          <circle
            className="fill-primary transition-[fill] group-data-[hover=true]:fill-light_primary_hover dark:fill-dark_primary group-data-[hover=true]:dark:fill-dark_primary_hover"
            cx="8"
            cy="8"
            r="3"
          />
        </svg>
      </motion.div>
    </div>
  );
}
