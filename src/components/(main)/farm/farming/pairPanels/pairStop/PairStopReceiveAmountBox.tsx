import { AnimatePresence, motion } from "framer-motion";

import { BigDecimal } from "@/types/BigDecimal";
import { IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";

import ReceiveAmountBox from "../../common/ReceiveAmountBox";

export default function PairStopReceiveAmountBox(props: {
  input: IBirdieSingleFarm[];
  receiveAmount: BigDecimal[];
  isActive: boolean[];
  displayTokens?: ReadonlyArray<any>;
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
        <motion.div className="mb-6 flex w-full flex-col gap-4">
          <ReceiveAmountBox amount={receiveAmount[0]} bToken={shown0} />
          <ReceiveAmountBox amount={receiveAmount[1]} bToken={shown1} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
