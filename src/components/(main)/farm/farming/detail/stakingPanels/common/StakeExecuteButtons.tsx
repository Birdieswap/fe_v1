import { motion } from "framer-motion";

import { defaultTransition } from "@/const/presenceTransition";
import type { StakeTokenStatus } from "@/hooks/farm/StakeTokenStatus";
import { ThemedButtonVariant } from "@/components/atoms/ThemedButton";

import StakeApproveButtonsContainer from "./StakeApproveButtonsContainer";
import StakeApproveButton from "./StakeApproveButton";
import StakeConfirmButton from "./StakeConfirmButton";
import StakeErrorMessages from "./stakeErrorMessages";

export function StakeExecuteButtons({
  isConnected,
  isExecutable,
  isPending,
  isWrongNetwork,
  execute,
  executeText,
  tokenStatuses,
  variant,
}: {
  isConnected: boolean;
  isExecutable: boolean;
  isPending: boolean;
  isWrongNetwork: boolean;
  execute: () => void;
  executeText: string;
  tokenStatuses: StakeTokenStatus[];
  variant?: ThemedButtonVariant;
}) {
  console.log("tokenStatus", tokenStatuses);
  const isApproveVisible =
    isConnected && tokenStatuses.some((v) => v.isApproved == false);

  return (
    <motion.div layout {...defaultTransition} className="flex w-full flex-col">
      <StakeApproveButtonsContainer isVisible={isApproveVisible}>
        {isApproveVisible &&
          tokenStatuses
            .filter((v) => v.isApproved == false)
            .map((v) => (
              <StakeApproveButton
                key={v.input?.symbol}
                isActive={v.isActive}
                isApproved={v.isApproved as boolean}
                isPending={isPending}
                token={v.input}
                onClick={() => {
                  if (v.input) v.approve?.();
                }}
              />
            ))}
      </StakeApproveButtonsContainer>
      <StakeConfirmButton
        isConnected={isConnected}
        isDisabled={!isExecutable}
        isPending={isPending}
        isWrongNetwork={isWrongNetwork}
        text={executeText}
        variant={variant}
        onPress={execute}
      />
      <div className="min-h-[38px]">
        <StakeErrorMessages tokenStatuses={tokenStatuses} />
      </div>
    </motion.div>
  );
}
