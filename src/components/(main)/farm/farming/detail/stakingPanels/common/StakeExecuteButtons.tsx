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
  showErrorMessages,
}: {
  isConnected: boolean;
  isExecutable: boolean;
  isPending: boolean;
  isWrongNetwork: boolean;
  execute: () => void;
  executeText: string;
  tokenStatuses: StakeTokenStatus[];
  variant?: ThemedButtonVariant;
  showErrorMessages?: boolean;
  hasRewards: boolean;
}) {
  // console.log("tokenStatus", tokenStatuses);
  const isApproveVisible =
    isConnected &&
    tokenStatuses.some(
      (v) => v.isApproved == false && (v.isApprovable ?? true)
    );

  const isApprovePending = isPending && isApproveVisible;
  const isExecutePending = isPending && !isApproveVisible;

  return (
    <motion.div layout {...defaultTransition} className="flex w-full flex-col">
      <StakeApproveButtonsContainer isVisible={isApproveVisible}>
        {isApproveVisible &&
          tokenStatuses
            .filter(
              (v) => v.isApproved == false && (v.isApprovable ?? true)
            )
            .map((v) => (
              <StakeApproveButton
                key={v.input?.symbol}
                isActive={v.isActive}
                isApproved={v.isApproved as boolean}
                isPending={isApprovePending}
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
        isPending={isExecutePending}
        isWrongNetwork={isWrongNetwork}
        text={executeText}
        variant={variant}
        onPress={execute}
      />
      {showErrorMessages && (
        <div className="min-h-[38px]">
          <StakeErrorMessages tokenStatuses={tokenStatuses} />
        </div>
      )}
    </motion.div>
  );
}
