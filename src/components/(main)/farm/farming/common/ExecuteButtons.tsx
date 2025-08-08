import { motion } from "framer-motion";

import { defaultTransition } from "@/const/presenceTransition";
import { FarmTokenStatus } from "@/hooks/FarmTokenStatus";
import { ThemedButtonVariant } from "@/components/atoms/ThemedButton";

import ApproveButtonsContainer from "./ApproveButtonsContainer";
import ApproveButton from "./ApproveButton";
import FarmStartErrorMessages from "./FarmStartErrorMessages";
import FarmConfirmButton from "./FarmConfirmButton";

export function ExecuteButtons({
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
  tokenStatuses: FarmTokenStatus[];
  variant?: ThemedButtonVariant;
}) {

  console.log("tokenStatus",tokenStatuses);
  const isApproveVisible =
    isConnected && tokenStatuses.some((v) => v.isApproved == false);

  return (
    <motion.div layout {...defaultTransition} className="flex w-full flex-col">
      <ApproveButtonsContainer isVisible={isApproveVisible}>
        {isApproveVisible &&
          tokenStatuses
            .filter((v) => v.isApproved == false)
            .map((v) => (
              <ApproveButton
                key={v.input?.symbol}
                isActive={v.isActive}
                isApproved={v.isApproved}
                isPending={isPending}
                token={v.input}
                onClick={() => {
                  if (v.input) v.approve?.();
                }}
              />
            ))}
      </ApproveButtonsContainer>
      <FarmConfirmButton
        isConnected={isConnected}
        isDisabled={!isExecutable}
        isPending={isPending}
        isWrongNetwork={isWrongNetwork}
        text={executeText}
        variant={variant}
        onPress={execute}
      />
      <FarmStartErrorMessages tokenStatuses={tokenStatuses} />
    </motion.div>
  );
}
