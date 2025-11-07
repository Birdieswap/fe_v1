import { AnimatePresence, motion } from "framer-motion";

import { BigDecimal } from "@/types/BigDecimal";
import { IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";

import ReceiveAmountBox from "../../../common/ReceiveAmountBox";

export default function PairStopReceiveAmountBox(props: {
  input: IBirdieSingleFarm[];
  receiveAmount: BigDecimal[];
  isActive: boolean[];
  displayTokens?: ReadonlyArray<any>;
  nativeToggle?: { value: "ETH" | "WETH"; onToggle: () => void };
}) {
  const { receiveAmount, isActive, input, displayTokens } = props;

  const shown0 = displayTokens?.[0]
    ? ({ ...input[0], input: displayTokens[0] } as IBirdieSingleFarm)
    : input[0];
  const shown1 = displayTokens?.[1]
    ? ({ ...input[1], input: displayTokens[1] } as IBirdieSingleFarm)
    : input[1];

  return (
    <AnimatePresence initial={false}>
      {isActive[0] && isActive[1] && (
        <motion.div
          className={
            // AmountInput과 동일한 카드 스타일로 맞춤
            [
              "mb-6 flex w-full flex-col justify-around gap-4 rounded-2xl px-3 py-4",
              // "bg-default-100 dark:bg-dark-swap-bg",
              "focus-within:bg-default-500/5 hover:bg-default-500/10",
              "group-hover:bg-default-500/10 group-focus:bg-default-500/5 group-focus-visible:bg-default-500/5",
              "dark:focus-within:bg-default-500/5 dark:hover:bg-default-500/10",
              "dark:group-hover:bg-default-500/10 dark:group-focus:bg-default-500/5 dark:group-focus-visible:bg-default-500/5",
              // 필요 시 높이도 동일하게 제한
              "h-32 overflow-auto",
            ].join(" ")
          }
        >
          <ReceiveAmountBox
            amount={receiveAmount[0]}
            bToken={shown0}
            nativeToggle={props.nativeToggle}
          />
          <ReceiveAmountBox
            amount={receiveAmount[1]}
            bToken={shown1}
            nativeToggle={props.nativeToggle}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
