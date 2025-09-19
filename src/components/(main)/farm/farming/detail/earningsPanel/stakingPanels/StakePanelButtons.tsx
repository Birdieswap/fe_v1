import { Dispatch, SetStateAction } from "react";

import Icons from "@/assets/icons/icons";
import StakePanelButtonBase from "./StakePanelButtonBase";

export function StakePanelButton({
  selectedPanel,
  setSelectedPanel,
}: {
  selectedPanel: "STAKE" | "UNSTAKE";
  setSelectedPanel: Dispatch<SetStateAction<"STAKE" | "UNSTAKE">>;
}) {
  return (
    <div className="flex grow basis-0 flex-row">
      <StakePanelButtonBase
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value={"STAKE"}
      >
        {/* <div className="relative size-6">
          <Icons.PiggyBankStartOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStartOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div> */}
        Stake
      </StakePanelButtonBase>
    </div>
  );
}

export function UnStakePanelButton({
  selectedPanel,
  setSelectedPanel,
}: {
  selectedPanel: "STAKE" | "UNSTAKE";
  setSelectedPanel: Dispatch<SetStateAction<"STAKE" | "UNSTAKE">>;
}) {
  return (
    <div className="flex grow basis-0 flex-row">
      <StakePanelButtonBase
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value={"UNSTAKE"}
      >
        {/* <div className="relative size-6">
          <Icons.PiggyBankStopOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStopOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div> */}
        Unstake
      </StakePanelButtonBase>
    </div>
  );
}

const StakePanelButtons = {
  Stake: StakePanelButton,
  Unstake: UnStakePanelButton,
};

export default StakePanelButtons;
