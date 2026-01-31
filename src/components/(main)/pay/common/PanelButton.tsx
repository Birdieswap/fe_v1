// PanelButtons.tsx
import { Dispatch, SetStateAction } from "react";
import Icons from "@/assets/icons/icons";
import PanelButtonBase from "../../farm/farming/detail/panelButtons/PanelButtonBase";

type Mode = "PAY" | "ENTER";

type Props = {
  selectedPanel: Mode;
  setSelectedPanel: Dispatch<SetStateAction<Mode>>;
};

/** PAY */
export function PanelButtonPay({ selectedPanel, setSelectedPanel }: Props) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase<Mode>
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value="PAY"
      >
        <div className="relative size-6">
          <Icons.PiggyBankStopOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStopOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStopOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        easy Pay
      </PanelButtonBase>
    </div>
  );
}

/** ENTER */
export function PanelButtonEnter({ selectedPanel, setSelectedPanel }: Props) {
  return (
    <div className="flex grow basis-0 flex-row">
      <PanelButtonBase<Mode>
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        value="ENTER"
      >
        <div className="relative size-6">
          <Icons.PiggyBankStartOn className="absolute inset-0 block transition-opacity group-data-[selected=false]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOnDark className="absolute inset-0 hidden transition-opacity group-data-[selected=false]:opacity-0 dark:block" />
          <Icons.PiggyBankStartOff className="absolute inset-0 block transition-opacity group-data-[selected=true]:opacity-0 dark:hidden" />
          <Icons.PiggyBankStartOffDark className="absolute inset-0 hidden transition-opacity group-data-[selected=true]:opacity-0 dark:block" />
        </div>
        easy Enter
      </PanelButtonBase>
    </div>
  );
}

const PanelButtons = {
  Pay: PanelButtonPay,
  Enter: PanelButtonEnter,
};

export type { Mode };
export default PanelButtons;
