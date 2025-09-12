"use client";

import { PropsWithChildren, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { cn } from "@heroui/react";

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
        "data-[col=1]:col-start-1 data-[col=2]:col-start-2",
        "data-[row=1]:row-start-1 data-[row=2]:row-start-2"
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

// ✅ 글자도 클릭 가능하도록 button으로 변경 (키보드 접근성 포함)
function TokenName(
  props: PropsWithChildren<{
    isActive: boolean;
    onClick?: () => void;
    isDisabled?: boolean;
  }>
) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.isDisabled}
      className={clsx(
        "px-1 py-0.5 rounded-md",
        "text-default-500 transition-colors",
        "group-hover:text-default-700",
        "data-[selected=true]:text-primary data-[selected=true]:group-hover:text-light_primary_hover",
        "dark:text-default-700 dark:group-hover:text-default-300",
        "data-[selected=true]:dark:text-dark_primary data-[selected=true]:dark:group-hover:text-dark_primary_hover",
        "disabled:opacity-60 disabled:pointer-events-none",
        "cursor-pointer"
      )}
      data-selected={props.isActive}
    >
      {props.children}
    </button>
  );
}

function SliderButton(props: { onClick: () => void; isDisabled?: boolean }) {
  return (
    <button
      className="box-border size-3 place-self-center rounded-full border-1 border-default-400 bg-background transition-colors group-hover:border-default-700 dark:border-default-700 dark:group-hover:border-default-300"
      disabled={props.isDisabled}
      onClick={props.onClick}
      type="button"
    />
  );
}

/**
 * PairSlider 룩앤필의 2-스텝 슬라이더 (ETH/WETH).
 * - 폭을 3/5 수준(6.6rem)으로 축소, 트랙은 60%로 촘촘
 * - 오른쪽 정렬은 부모에서 ml-auto로 처리
 */
export default function ETHSlider({
  value,
  onChange,
  isDisabled,
}: {
  value: "ETH" | "WETH";
  onChange: (v: "ETH" | "WETH") => void;
  isDisabled?: boolean;
}) {
  const pos = value === "WETH" ? 1 : 0; // 0=ETH, 1=WETH
  const [hover, setHover] = useState<[boolean, boolean]>([false, false]);

  return (
    <div
      className="grid w-[6.6rem] grid-cols-2 grid-rows-2 text-sm font-semibold opacity-100 transition-opacity data-[disabled=true]:opacity-50"
      data-disabled={isDisabled}
    >
      {/* 상단 트랙 (50% → 60%) */}
      <div className="col-span-2 col-start-1 row-span-1 row-start-1 h-1 w-[60%] place-self-center bg-default-400 dark:bg-default-700" />

      {/* 좌측: ETH */}
      <Container
        col={1}
        row={1}
        setHover={(val) =>
          setHover((prev) => {
            return [val, prev[1]];
          })
        }
      >
        <SliderButton isDisabled={isDisabled} onClick={() => onChange("ETH")} />
        <TokenName
          isActive={value === "ETH"}
          isDisabled={isDisabled}
          onClick={() => onChange("ETH")} // ✅ 글자 클릭도 토글
        >
          <span className="text-[10px]">ETH</span>
        </TokenName>
      </Container>

      {/* 우측: WETH */}
      <Container
        col={2}
        row={1}
        setHover={(val) =>
          setHover((prev) => {
            return [prev[0], val];
          })
        }
      >
        <SliderButton
          isDisabled={isDisabled}
          onClick={() => onChange("WETH")}
        />
        <TokenName
          isActive={value === "WETH"}
          isDisabled={isDisabled}
          onClick={() => onChange("WETH")} // ✅ 글자 클릭도 토글
        >
          <span className="text-[10px]">WETH</span>
        </TokenName>
      </Container>

      {/* 이동하는 노브 */}
      <motion.div
        layout
        className={cn(
          "group pointer-events-none relative z-10 col-span-1 row-span-1 row-start-1 flex size-4 items-center",
          "justify-center place-self-center rounded-full bg-primary shadow-[0_2px_2px] shadow-black/25",
          "data-[pos=0]:col-start-1 data-[pos=1]:col-start-2 data-[pos=0]:col-end-1 data-[pos=1]:col-end-2"
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
