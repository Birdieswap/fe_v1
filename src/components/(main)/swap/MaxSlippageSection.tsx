"use client";

import { Fragment } from "react";

import { useSwapContext } from "./SwapProvider";
import MaxSlippagePopover from "./MaxSlippagePopover";

export default function MaxSlippageSection() {
  const { maxSlippage, setMaxSlippage } = useSwapContext();

  return (
    <Fragment>
      <p className="text-[13px] font-medium text-light-primary dark:text-dark-primary">
        {maxSlippage !== "auto" && `${maxSlippage || ""}% slippage`}
      </p>
      <MaxSlippagePopover
        maxSlippage={maxSlippage}
        setMaxSlippage={setMaxSlippage}
      />
    </Fragment>
  );
}
