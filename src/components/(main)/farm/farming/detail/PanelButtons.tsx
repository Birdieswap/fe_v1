// PanelButtons.tsx
import { Dispatch, SetStateAction } from "react";
import Icons from "@/assets/icons/icons";
import PanelButtonBase from "./panelButtons/PanelButtonBase";
import type { PanelMode } from "@/types/panels";

type Props = {
  selectedPanel: PanelMode;
  setSelectedPanel: Dispatch<SetStateAction<PanelMode>>;
};

/** START */
export function PanelButtonStart({ selectedPanel, setSelectedPanel }: Props) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase<PanelMode>
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value="START"
      >
        <div className="relative size-6">
          <Icons.PiggyBankStartOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStartOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        Start
      </PanelButtonBase>
    </div>
  );
}

/** STOP */
export function PanelButtonStop({ selectedPanel, setSelectedPanel }: Props) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase<PanelMode>
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value="STOP"
      >
        <div className="relative size-6">
          <Icons.PiggyBankStopOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStopOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        Stop
      </PanelButtonBase>
    </div>
  );
}

/** STAKE — 지금은 Start 아이콘 그대로 사용 */
export function PanelButtonStake({ selectedPanel, setSelectedPanel }: Props) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase<PanelMode>
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value="STAKE"
      >
        <div className="relative size-6">
          <Icons.PiggyBankStartOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStartOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        Stake
      </PanelButtonBase>
    </div>
  );
}

/** UNSTAKE — 지금은 Stop 아이콘 그대로 사용 */
export function PanelButtonUnstake({ selectedPanel, setSelectedPanel }: Props) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase<PanelMode>
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value="UNSTAKE"
      >
        <div className="relative size-6">
          <Icons.PiggyBankStopOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStopOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        Unstake
      </PanelButtonBase>
    </div>
  );
}

const PanelButtons = {
  Start: PanelButtonStart,
  Stop: PanelButtonStop,
  Stake: PanelButtonStake,
  Unstake: PanelButtonUnstake,
};

export type { PanelMode };
export default PanelButtons;
