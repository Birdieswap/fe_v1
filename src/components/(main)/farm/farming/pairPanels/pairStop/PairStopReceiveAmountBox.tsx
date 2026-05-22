import { AnimatePresence, motion } from "framer-motion";

import { BigDecimal } from "@/types/BigDecimal";
import { IBirdieSingleFarm } from "@/const/contracts/types/tokenTypes";

import ReceiveAmountBox from "../../common/ReceiveAmountBox";

export default function PairStopReceiveAmountBox(props: {
  input: IBirdieSingleFarm[];
  receiveAmount: BigDecimal[];
  isActive: boolean[];
}) {
  const { receiveAmount, isActive, input } = props;

  return (
    <AnimatePresence initial={false}>
      {isActive[0] && isActive[1] && (
        <motion.div className="mb-6 flex w-full flex-col gap-4">
          <ReceiveAmountBox amount={receiveAmount[0]} bToken={input[0]} />
          <ReceiveAmountBox amount={receiveAmount[1]} bToken={input[1]} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
